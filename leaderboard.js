const leaderboardEventName = document.getElementById("leaderboard-event-name");
const leaderboardCourseName = document.getElementById("leaderboard-course-name");
const leaderboardDescription = document.getElementById("leaderboard-description");
const leaderboardPlayersCount = document.getElementById("leaderboard-players-count");
const leaderboardTotalPosted = document.getElementById("leaderboard-total-posted");
const leaderboardTopScore = document.getElementById("leaderboard-top-score");
const leaderboardList = document.getElementById("leaderboard-list");
const leaderboardPlayerCards = document.getElementById("leaderboard-player-cards");
const expandedPlayers = new Set();

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
        <article class="leaderboard-entry">
          <div class="leaderboard-row">
            <div><span class="rank-pill">${player.rank}</span></div>
            <div>
              <button class="player-toggle" type="button" data-player-toggle="${player.id}">
                <span class="player-name">${player.name}</span>
              </button>
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
          </div>
          ${
            expandedPlayers.has(player.id)
              ? `
            <div class="leaderboard-detail">
              <div class="leaderboard-detail-summary">
                <div class="detail-pill">Gross ${scoreLabel(player.grossToPar)}</div>
                <div class="detail-pill">Net ${scoreLabel(player.netToPar)}</div>
                <div class="detail-pill">Total Gross ${player.gross || "-"}</div>
                <div class="detail-pill">Total Net ${player.net || "-"}</div>
              </div>
              <div class="leaderboard-hole-grid">
                ${player.scores
                  .map((score, index) => {
                    const hole = tournament.course[index];
                    const strokes = player.allocation[index].strokes;
                    const netScore = score === null ? null : Math.max(1, Number(score) - strokes);
                    return `
                      <div class="leaderboard-hole-card ${score === null ? "score-missing" : "score-entered"}">
                        <div class="hole-card-title">Hole ${hole.hole}</div>
                        <div class="hole-card-line">Par ${hole.par} · SI ${hole.strokeIndex}</div>
                        <div class="hole-card-value">${score === null ? "-" : `${score} gross`}</div>
                        <div class="hole-card-line">${score === null ? "No score yet" : `Net ${netScore}`}</div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
        </article>
      `,
    )
    .join("");

  leaderboardList.querySelectorAll("[data-player-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const playerId = button.getAttribute("data-player-toggle");
      if (expandedPlayers.has(playerId)) {
        expandedPlayers.delete(playerId);
      } else {
        expandedPlayers.add(playerId);
      }
      renderLeaderboardPage();
    });
  });

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
