const homeEventName = document.getElementById("home-event-name");
const homeCourseName = document.getElementById("home-course-name");
const homeDescription = document.getElementById("home-description");
const homeLiveStatus = document.getElementById("home-live-status");
const homeLiveMeta = document.getElementById("home-live-meta");
const homeLeaders = document.getElementById("home-leaders");
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
    homeDescription.textContent = "Set a live tournament in admin to show your event on the home page.";
    homeLiveStatus.textContent = "Waiting";
    homeLiveMeta.textContent = "No tournament selected";
    homeLeaders.innerHTML = `<div class="empty-state">No leaderboard data yet.</div>`;
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
  homeDescription.textContent = tournament.leaderboardDescription;
  homeLiveStatus.textContent = tournament.status === "completed" ? "Final" : tournament.status === "upcoming" ? "Upcoming" : "Live";
  homeLiveMeta.textContent = `${tournament.players.length} players · ${tournament.groups.length} groups · ${postedScores} scores posted`;

  homeLeaders.innerHTML = ranked
    .slice(0, 3)
    .map(
      (player) => `
        <div class="snapshot-row">
          <div>
            <div class="snapshot-name">
              <span class="snapshot-place">T${String(player.rank).replace(/^T/, "")}</span>
              <span>${player.name}</span>
            </div>
            <div class="snapshot-meta">${player.completed === 0 ? `Tee ${player.teeTime || "-"}` : `Thru ${player.thru}`}</div>
          </div>
          <div class="snapshot-score">${player.completed === 0 ? "-" : homeScoreLabel(player.netToPar)}</div>
        </div>
      `,
    )
    .join("");

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
