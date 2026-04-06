const homeEventName = document.getElementById("home-event-name");
const homeCourseName = document.getElementById("home-course-name");
const homeDescription = document.getElementById("home-description");
const homeAboutCopy = document.getElementById("home-about-copy");
const homeLiveStatus = document.getElementById("home-live-status");
const homeLiveMeta = document.getElementById("home-live-meta");
const homeGroups = document.getElementById("home-groups");

function homeScoreLabel(value) {
  if (value === null || value === undefined) {
    return "-";
  }
  if (value === 0) {
    return "E";
  }
  return value > 0 ? `+${value}` : `${value}`;
}

function teeTimeMinutes(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3].toUpperCase() === "PM") {
    hours += 12;
  }
  return hours * 60 + minutes;
}

function groupTeeTime(group, tournament) {
  const players = group.playerIds
    .map((playerId) => tournament.players.find((player) => player.id === playerId))
    .filter(Boolean)
    .sort((left, right) => teeTimeMinutes(left.teeTime) - teeTimeMinutes(right.teeTime));

  return players[0]?.teeTime || "-";
}

async function renderHomePage() {
  const state = window.AppData?.enabled() ? await window.AppData.bootstrap() : TournamentStore.loadState();
  const tournament = TournamentStore.getLiveTournament(state);

  if (!tournament) {
    homeEventName.textContent = "No live tournament";
    homeCourseName.textContent = "Choose one in admin";
    homeDescription.textContent = "Open scoring, follow the live leaderboard, and keep tournament day moving from one simple home page.";
    homeAboutCopy.textContent = "Add tournament details in Admin Settings when you're ready.";
    homeLiveStatus.textContent = "Waiting";
    homeLiveMeta.textContent = "No tournament selected";
    homeGroups.innerHTML = `<div class="empty-state">No groups available.</div>`;
    return;
  }

  const ranked = TournamentStore.rankedPlayers(tournament);
  const postedScores = tournament.players.reduce(
    (sum, player) => sum + player.scores.filter((score) => score !== null && score !== "").length,
    0,
  );

  homeEventName.textContent = tournament.tournamentName;
  homeCourseName.textContent = tournament.courseName;
  homeDescription.textContent = "Open scoring, follow the live leaderboard, and keep tournament day moving from one simple home page.";
  homeAboutCopy.textContent = tournament.homeDescription;
  homeLiveStatus.textContent = tournament.status === "completed" ? "Final" : tournament.status === "upcoming" ? "Upcoming" : "Live";
  homeLiveMeta.textContent = `${tournament.players.length} players · ${tournament.groups.length} groups · ${postedScores} scores posted`;

  const groups = tournament.groups
    .slice()
    .sort((left, right) => teeTimeMinutes(groupTeeTime(left, tournament)) - teeTimeMinutes(groupTeeTime(right, tournament)));

  homeGroups.innerHTML = groups
    .map((group) => {
      const players = group.playerIds
        .map((playerId) => tournament.players.find((player) => player.id === playerId))
        .filter(Boolean);

      return `
        <article class="home-group-card">
          <div class="home-group-head">
            <div>
              <div class="home-action-title">${group.name}</div>
              <div class="feed-meta">Scorer code ${group.scorerCode} · Tee ${groupTeeTime(group, tournament)}</div>
            </div>
          </div>
          <div class="home-group-players">
            ${players.map((player) => `<span class="home-group-player">${player.name}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

window.addEventListener("storage", renderHomePage);
window.AppData?.subscribe(renderHomePage);

renderHomePage();
