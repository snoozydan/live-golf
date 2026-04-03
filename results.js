const resultsCount = document.getElementById("results-count");
const resultsLiveName = document.getElementById("results-live-name");
const resultsLiveCourse = document.getElementById("results-live-course");
const resultsList = document.getElementById("results-list");

function scoreLabel(value) {
  if (value === 0) {
    return "E";
  }
  return value > 0 ? `+${value}` : `${value}`;
}

function renderResultsPage() {
  const state = TournamentStore.loadState();
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
      const ranked = TournamentStore.rankedPlayers(tournament).slice(0, 8);
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
            ${ranked
              .map(
                (player) => `
                  <div class="result-row">
                    <span>${player.rank}</span>
                    <span>${player.name}</span>
                    <span>${scoreLabel(player.netToPar)}</span>
                    <span>${player.gross}</span>
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
renderResultsPage();
