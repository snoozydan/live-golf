const leaderboardEventName = document.getElementById("leaderboard-event-name");
const leaderboardCourseName = document.getElementById("leaderboard-course-name");
const leaderboardDescription = document.getElementById("leaderboard-description");
const leaderboardList = document.getElementById("leaderboard-list");
const leaderboardPlayerCards = document.getElementById("leaderboard-player-cards");
const expandedPlayers = new Set();

function movementStorageKey(tournamentId) {
  return `fairway-live-leaderboard-movement-${tournamentId}`;
}

function scoreLabel(value) {
  if (value === null || value === undefined) {
    return "-";
  }
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

function playerStatus(player) {
  if (player.completed === 0) {
    return "Not started";
  }
  if (player.completed === 18) {
    return "F";
  }
  return `On ${Math.min(18, player.completed + 1)}`;
}

function playerMetaText(player, groupLabel) {
  const statusText = playerStatus(player);
  const teeOrStatus = player.completed === 0 ? `Tee ${player.teeTime || "-"}` : statusText;
  return `${groupLabel || "No group"} · HCP ${player.handicap} · ${teeOrStatus}`;
}

function grossResultLabel(delta) {
  if (delta <= -2) return "Eagle";
  if (delta === -1) return "Birdie";
  if (delta === 0) return "Par";
  if (delta === 1) return "Bogey";
  if (delta === 2) return "Double";
  return `+${delta}`;
}

function grossResultClass(delta) {
  if (delta <= -1) return "result-birdie";
  if (delta === 0) return "result-par";
  return "result-bogey";
}

function loadPreviousPositions(tournamentId) {
  try {
    return JSON.parse(window.localStorage.getItem(movementStorageKey(tournamentId)) || "{}");
  } catch (error) {
    return {};
  }
}

function saveCurrentPositions(tournamentId, ranked) {
  const positions = Object.fromEntries(ranked.map((player, index) => [player.id, index + 1]));
  window.localStorage.setItem(movementStorageKey(tournamentId), JSON.stringify(positions));
}

function movementMarkup(player, index, previousPositions) {
  const previous = previousPositions[player.id];
  if (!previous || player.completed === 0) {
    return `<span class="movement-pill neutral">-</span>`;
  }

  const current = index + 1;
  if (current < previous) {
    return `<span class="movement-pill up">Up ${previous - current}</span>`;
  }
  if (current > previous) {
    return `<span class="movement-pill down">Down ${current - previous}</span>`;
  }
  return `<span class="movement-pill neutral">Even</span>`;
}

async function renderLeaderboardPage() {
  const state = window.AppData?.enabled() ? await window.AppData.bootstrap() : TournamentStore.loadState();
  const tournament = TournamentStore.getLiveTournament(state);
  const ranked = TournamentStore.rankedPlayers(tournament);

  if (!tournament) {
    leaderboardEventName.textContent = "No live tournament";
    leaderboardCourseName.textContent = "Choose one in admin";
    leaderboardDescription.textContent = "The admin console controls which tournament appears on the public leaderboard.";
    leaderboardList.innerHTML = `<div class="empty-state">No live tournament is currently selected.</div>`;
    leaderboardPlayerCards.innerHTML = "";
    return;
  }

  leaderboardEventName.textContent = tournament.tournamentName;
  leaderboardCourseName.textContent = tournament.courseName;
  leaderboardDescription.textContent = tournament.leaderboardDescription;
  const previousPositions = loadPreviousPositions(tournament.id);

  const playerGroupMap = new Map();
  tournament.groups.forEach((group, index) => {
    group.playerIds.forEach((playerId) => {
      playerGroupMap.set(playerId, group.name || `Group ${index + 1}`);
    });
  });

  leaderboardList.innerHTML = ranked
    .map(
      (player, index) => {
        const netDisplay = player.completed === 0 ? "-" : scoreLabel(player.netToPar);
        const grossDisplay = player.completed === 0 ? "-" : scoreLabel(player.grossToPar);
        const statusText = playerStatus(player);
        const movement = movementMarkup(player, index, previousPositions);
        const metaText = playerMetaText(player, playerGroupMap.get(player.id));
        return `
        <article class="leaderboard-entry">
          <div class="leaderboard-row">
            <div><span class="rank-pill">T${String(player.rank).replace(/^T/, "")}</span></div>
            <div>
              <button class="player-toggle" type="button" data-player-toggle="${player.id}">
                <span class="player-name">${player.name}</span>
              </button>
              <div class="player-meta-row">
                <div class="player-meta">${metaText}</div>
                ${movement}
              </div>
            </div>
            <div class="leaderboard-metric">
              <span class="metric-label">Net</span>
              <span class="metric-value ${player.completed === 0 ? "" : scoreTone(player.netToPar)}">${netDisplay}</span>
            </div>
            <div class="leaderboard-metric">
              <span class="metric-label">Gross</span>
              <span class="metric-value ${player.completed === 0 ? "" : scoreTone(player.grossToPar)}">${grossDisplay}</span>
            </div>
            <div class="leaderboard-metric">
              <span class="metric-label">Status</span>
              <span class="metric-value">${player.completed === 18 ? "F" : player.completed === 0 ? "-" : player.completed}</span>
            </div>
            <div class="leaderboard-metric">
              <span class="metric-label">Gross</span>
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
                <div class="detail-pill">Status ${statusText}</div>
                ${player.completed === 0 ? `<div class="detail-pill">Tee ${player.teeTime || "-"}</div>` : ""}
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
                    const delta = score === null ? null : Number(score) - hole.par;
                    return `
                      <div class="leaderboard-hole-card ${score === null ? "score-missing" : `score-entered ${grossResultClass(delta)}`}">
                        <div class="hole-card-title">Hole ${hole.hole}</div>
                        <div class="hole-card-line">Par ${hole.par} · SI ${hole.strokeIndex}</div>
                        <div class="hole-card-value">${score === null ? "-" : `${score} gross`}</div>
                        <div class="hole-card-line">${score === null ? "No score yet" : `${grossResultLabel(delta)} · Net ${netScore}`}</div>
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
      `;
      },
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
              <div class="card-subline">${player.completed === 0 ? `${playerGroupMap.get(player.id) || "No group"} · Tee ${player.teeTime || "-"}` : `${playerGroupMap.get(player.id) || "No group"} · ${playerStatus(player)}`}</div>
            </div>
            <div class="score-badge ${player.completed === 0 ? "" : scoreTone(player.netToPar)}">${player.completed === 0 ? "-" : scoreLabel(player.netToPar)}</div>
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

  saveCurrentPositions(tournament.id, ranked);
}

window.addEventListener("storage", renderLeaderboardPage);
window.setInterval(renderLeaderboardPage, 5000);
window.AppData?.subscribe(renderLeaderboardPage);

renderLeaderboardPage();
