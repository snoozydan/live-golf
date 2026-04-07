const resultsCount = document.getElementById("results-count");
const resultsLiveName = document.getElementById("results-live-name");
const resultsLiveCourse = document.getElementById("results-live-course");
const resultsList = document.getElementById("results-list");

function moneyLabel(value) {
  const amount = Number(value) || 0;
  return amount > 0 ? `$${amount.toFixed(2).replace(/\.00$/, "")}` : "-";
}

function scoreLabel(value) {
  if (value === 0) {
    return "E";
  }
  return value > 0 ? `+${value}` : `${value}`;
}

async function renderResultsPage() {
  const state = window.AppData?.enabled() ? await window.AppData.bootstrap() : TournamentStore.loadState();
  const liveTournament = TournamentStore.getLiveTournament(state);
  const completed = TournamentStore.resultsTournaments(state);

  resultsCount.textContent = `${completed.length}`;
  resultsLiveName.textContent = liveTournament ? liveTournament.tournamentName : "-";
  resultsLiveCourse.textContent = liveTournament ? liveTournament.courseName : "-";

  if (!completed.length) {
    resultsList.innerHTML = `<div class="empty-state">No completed tournaments yet. Mark a tournament as completed in admin to show it here.</div>`;
    return;
  }

  resultsList.innerHTML = completed
    .map((tournament) => {
      const ranked = TournamentStore.rankedPlayers(tournament);
      return `
        <article class="result-card">
          <div class="result-card-header">
            <div>
              <div class="player-name">${tournament.tournamentName}</div>
              <div class="card-subline">${tournament.courseName} · ${tournament.status}</div>
            </div>
            <div class="score-badge">Final</div>
          </div>
          <div class="result-table">
            <div class="result-row result-row-head">
              <span>Pos</span>
              <span>Player</span>
              <span>Tot</span>
              <span>Gross</span>
              <span>Won</span>
            </div>
            ${ranked
              .map(
                (player) => `
                  <div class="result-row">
                    <span>${player.rank}</span>
                    <span>${player.name}</span>
                    <span>${scoreLabel(player.netToPar)}</span>
                    <span>${player.gross}</span>
                    <span>${moneyLabel(player.winnings)}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

window.addEventListener("storage", renderResultsPage);
window.AppData?.subscribe(renderResultsPage);
renderResultsPage();
