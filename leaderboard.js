const leaderboardEventName = document.getElementById("leaderboard-event-name");
const leaderboardCourseName = document.getElementById("leaderboard-course-name");
const leaderboardDescription = document.getElementById("leaderboard-description");
const leaderboardPlayersCount = document.getElementById("leaderboard-players-count");
const leaderboardTotalPosted = document.getElementById("leaderboard-total-posted");
const leaderboardTopScore = document.getElementById("leaderboard-top-score");
const leaderboardList = document.getElementById("leaderboard-list");
const leaderboardPlayerCards = document.getElementById("leaderboard-player-cards");

function scoreLabel(value) {
  if (value === 0) {
    return "E";
  }
  return value > 0 ? `+${value}` : `${value}`;
}

function scoreTone(value) {
  if (value < 0) {
    return "score-under";
  }
  if (value > 0) {
    return "score-over";
  }
  return "score-even";
}

function renderLeaderboardPage() {
  const state = TournamentStore.loadState();
  const tournament = TournamentStore.getLiveTournament(state);
  const ranked = TournamentStore.rankedPlayers(tournament);

  if (!tournament) {
    leaderboardEventName.textContent = "No live tournament";
    leaderboardCourseName.textContent = "Choose one in admin";
    leaderboardDescription.textContent = "The admin console controls which tournament appears on the public leaderboard.";
    leaderboardPlayersCount.textContent = "0";
    leaderboardTotalPosted.textContent = "0";
    leaderboardTopScore.textContent = "E";
    leaderboardList.innerHTML = `<div class="empty-state">No live tournament is currently selected.</div>`;
    leaderboardPlayerCards.innerHTML = "";
    return;
  }

  leaderboardEventName.textContent = tournament.tournamentName;
  leaderboardCourseName.textContent = tournament.courseName;
  leaderboardDescription.textContent = tournament.leaderboardDescription;
  leaderboardPlayersCount.textContent = `${tournament.players.length}`;
  leaderboardTotalPosted.textContent = `${TournamentStore.totalPostedScores(tournament)}`;
  leaderboardTopScore.textContent = ranked[0] ? scoreLabel(ranked[0].netToPar) : "E";

  leaderboardList.innerHTML = ranked
    .map(
      (player) => `
        <article class="leaderboard-row">
          <div><span class="rank-pill">${player.rank}</span></div>
          <div>
            <div class="player-name">${player.name}</div>
            <div class="player-meta">${player.division} · HCP ${player.handicap} · Thru ${player.thru}</div>
          </div>
          <div class="leaderboard-metric">
            <span class="metric-label">Net</span>
            <span class="metric-value ${scoreTone(player.netToPar)}">${scoreLabel(player.netToPar)}</span>
          </div>
          <div class="leaderboard-metric">
            <span class="metric-label">Gross</span>
            <span class="metric-value ${scoreTone(player.grossToPar)}">${scoreLabel(player.grossToPar)}</span>
          </div>
          <div class="leaderboard-metric">
            <span class="metric-label">Strokes</span>
            <span class="metric-value">${player.gross || "-"}</span>
          </div>
          <div class="leaderboard-metric">
            <span class="metric-label">Net Total</span>
            <span class="metric-value">${player.net || "-"}</span>
          </div>
          <div class="leaderboard-metric">
            <span class="metric-label">Tee Time</span>
            <span class="metric-value">${player.teeTime}</span>
          </div>
        </article>
      `,
    )
    .join("");

  leaderboardPlayerCards.innerHTML = ranked
    .map(
      (player) => `
        <article class="player-card">
          <div class="player-card-header">
            <div>
              <h3>${player.name}</h3>
              <div class="card-subline">Net ${scoreLabel(player.netToPar)} · Handicap ${player.handicap}</div>
            </div>
            <div class="score-badge ${scoreTone(player.netToPar)}">${scoreLabel(player.netToPar)}</div>
          </div>
          <div class="mini-hole-grid">
            ${player.allocation
              .map((item, index) => {
                const classes = ["mini-hole", item.strokes > 0 ? "stroke-hole" : "non-stroke-hole"]
                  .filter(Boolean)
                  .join(" ");
                const label = item.strokes > 0 ? `+${item.strokes}` : "0";
                return `<div class="${classes}" title="Hole ${item.hole} · ${tournament.course[index].yardage} yds · SI ${item.strokeIndex}"><span class="mini-hole-number">${item.hole}</span>:<span class="mini-hole-value">${label}</span></div>`;
              })
              .join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

window.addEventListener("storage", renderLeaderboardPage);
window.setInterval(renderLeaderboardPage, 5000);

renderLeaderboardPage();
