const loginForm = document.getElementById("login-form");
const playerCodeInput = document.getElementById("player-code-input");
const loginMessage = document.getElementById("login-message");
const playerPanel = document.getElementById("player-panel");
const playerPanelEmpty = document.getElementById("player-panel-empty");
const playerPanelTitle = document.getElementById("player-panel-title");
const selectedPlayerName = document.getElementById("selected-player-name");
const selectedPlayerMeta = document.getElementById("selected-player-meta");
const selectedPlayerHandicap = document.getElementById("selected-player-handicap");
const selectedPlayerNet = document.getElementById("selected-player-net");
const playerHoleSelect = document.getElementById("player-hole-select");
const playerScoreForm = document.getElementById("player-score-form");
const playerSignoutButton = document.getElementById("player-signout-button");
const strokeHoleGrid = document.getElementById("stroke-hole-grid");
const playerScorecard = document.getElementById("player-scorecard");
const groupScoreRows = document.getElementById("group-score-rows");
const updatesFeed = document.getElementById("updates-feed");

const eventName = document.getElementById("event-name");
const courseName = document.getElementById("course-name");
const snapshotLeaders = document.getElementById("snapshot-leaders");

let state = TournamentStore.loadState();
let activeGroupId = null;

function sessionKey(tournamentId) {
  return `fairway-live-active-group-${tournamentId}`;
}

function scoreLabel(value) {
  if (value === 0) {
    return "E";
  }
  return value > 0 ? `+${value}` : `${value}`;
}

function scoreTone(value) {
  if (value < 0) return "score-under";
  if (value > 0) return "score-over";
  return "score-even";
}

function currentTournament() {
  return TournamentStore.getLiveTournament(state);
}

function timeAgo(timestamp) {
  const minutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  return minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)} hr ago`;
}

function saveActiveGroupSession(groupId) {
  const tournament = currentTournament();
  if (!tournament) return;
  const key = sessionKey(tournament.id);
  if (!groupId) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, groupId);
}

function restoreActiveGroupSession() {
  const tournament = currentTournament();
  if (!tournament) return;
  const savedGroupId = window.localStorage.getItem(sessionKey(tournament.id));
  if (!savedGroupId) return;
  const group = tournament.groups.find((entry) => entry.id === savedGroupId);
  if (!group) {
    saveActiveGroupSession(null);
    return;
  }
  activeGroupId = group.id;
  loginMessage.textContent = `${group.name} is still signed in on this device.`;
}

function renderHeaderMetrics() {
  const tournament = currentTournament();
  const ranked = TournamentStore.rankedPlayers(tournament);

  if (!tournament) {
    eventName.textContent = "No live tournament";
    courseName.textContent = "Set one in the admin console";
    snapshotLeaders.innerHTML = `<div class="empty-state">No live tournament selected.</div>`;
    return;
  }

  eventName.textContent = tournament.tournamentName;
  courseName.textContent = tournament.courseName;
  snapshotLeaders.innerHTML = ranked
    .slice(0, 3)
    .map(
      (player) => `
        <div class="snapshot-row">
          <div>
            <div class="snapshot-name">
              <span class="snapshot-place">T${String(player.rank).replace(/^T/, "")}</span>
              <span>${player.name}</span>
            </div>
            <div class="snapshot-meta">Thru ${player.thru}</div>
          </div>
          <div class="snapshot-score">${scoreLabel(player.netToPar)}</div>
        </div>
      `,
    )
    .join("");
}

function renderUpdates() {
  const tournament = currentTournament();
  if (!tournament) {
    updatesFeed.innerHTML = `<div class="empty-state">No live tournament is selected.</div>`;
    return;
  }

  const playerLookup = new Map(tournament.players.map((player) => [player.id, player]));
  updatesFeed.innerHTML = tournament.updates
    .slice()
    .sort((left, right) => right.timestamp - left.timestamp)
    .map((update) => {
      const player = playerLookup.get(update.playerId);
      const hole = tournament.course[update.hole - 1];
      const delta = Number(update.strokes) - hole.par;
      const deltaText = delta === 0 ? "par" : delta < 0 ? `${Math.abs(delta)} under` : `${delta} over`;
      return `
        <article class="feed-item">
          <strong>${player.name} posted ${update.strokes} on hole ${update.hole}</strong>
          <div class="feed-meta">Par ${hole.par} · ${deltaText} · ${timeAgo(update.timestamp)}</div>
        </article>
      `;
    })
    .join("");
}

function renderGroupInputs(group, tournament) {
  const holeNumber = Number(playerHoleSelect.value);
  const players = group.playerIds
    .map((id) => tournament.players.find((player) => player.id === id))
    .filter(Boolean);

  groupScoreRows.innerHTML = players
    .map((player) => {
      const currentScore = player.scores[holeNumber - 1];
      return `
        <label class="group-score-row">
          <span class="group-score-name">${player.name}</span>
          <input type="number" min="1" max="15" name="score-${player.id}" value="${currentScore ?? tournament.course[holeNumber - 1].par}" />
        </label>
      `;
    })
    .join("");
}

function renderGroupCards(group, tournament) {
  const players = group.playerIds
    .map((id) => tournament.players.find((player) => player.id === id))
    .filter(Boolean)
    .map((player) => TournamentStore.computePlayer(player, tournament.course));

  strokeHoleGrid.innerHTML = players
    .map(
      (player) => `
        <article class="score-hole-card score-entered">
          <div class="hole-card-title">${player.name}</div>
          <div class="hole-card-line">${player.division} · HCP ${player.handicap}</div>
          <div class="hole-card-value">Gross ${scoreLabel(player.grossToPar)}</div>
          <div class="hole-card-line">Net ${scoreLabel(player.netToPar)}</div>
        </article>
      `,
    )
    .join("");

  const playerRows = players
    .map((player) => {
      const frontNine = tournament.course.slice(0, 9);
      const backNine = tournament.course.slice(9, 18);
      const frontScores = player.scores.slice(0, 9);
      const backScores = player.scores.slice(9, 18);
      const frontTotal = frontScores.reduce((sum, score) => sum + (score ?? 0), 0);
      const backTotal = backScores.reduce((sum, score) => sum + (score ?? 0), 0);

      const renderNine = (holes, scores) => `
        <div class="group-scorecard-grid">
          ${holes
            .map((hole, index) => {
              const score = scores[index];
              return `
                <article class="group-hole-tile ${score === null ? "missing" : "entered"}">
                  <div class="group-hole-top">
                    <span class="group-hole-number">H${hole.hole}</span>
                    <span class="group-hole-par">Par ${hole.par}</span>
                  </div>
                  <div class="group-hole-score">${score ?? "-"}</div>
                </article>
              `;
            })
            .join("")}
        </div>
      `;

      return `
        <article class="group-scorecard-player">
          <div class="group-scorecard-playerhead">
            <div class="player-name">${player.name}</div>
            <div class="card-subline">Gross ${scoreLabel(player.grossToPar)} · Net ${scoreLabel(player.netToPar)} · Total ${player.gross || "-"}</div>
          </div>
          <div class="group-scorecard-halves">
            <div>
              <div class="group-scorecard-half-title">Front 9 · ${frontTotal}</div>
              ${renderNine(frontNine, frontScores)}
            </div>
            <div>
              <div class="group-scorecard-half-title">Back 9 · ${backTotal}</div>
              ${renderNine(backNine, backScores)}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  playerScorecard.innerHTML = `<div class="group-scorecard-list">${playerRows}</div>`;
}

function renderActiveGroup() {
  const tournament = currentTournament();
  if (!tournament) {
    playerPanel.classList.add("hidden");
    playerPanelEmpty.classList.remove("hidden");
    playerPanelEmpty.textContent = "No live tournament is currently selected in admin.";
    loginForm.classList.add("hidden");
    return;
  }

  if (!activeGroupId) {
    playerPanel.classList.add("hidden");
    playerPanelEmpty.classList.remove("hidden");
    playerPanelEmpty.textContent = "Choose a group scorer code to enter scores for that group.";
    playerPanelTitle.textContent = "No group selected";
    loginForm.classList.remove("hidden");
    playerSignoutButton.classList.add("hidden");
    return;
  }

  const group = tournament.groups.find((entry) => entry.id === activeGroupId);
  if (!group) {
    activeGroupId = null;
    saveActiveGroupSession(null);
    renderActiveGroup();
    return;
  }

  const players = group.playerIds
    .map((id) => tournament.players.find((player) => player.id === id))
    .filter(Boolean);

  playerPanel.classList.remove("hidden");
  playerPanelEmpty.classList.add("hidden");
  loginForm.classList.add("hidden");
  playerSignoutButton.classList.remove("hidden");
  playerPanelTitle.textContent = `${group.name} scoring`;
  selectedPlayerName.textContent = group.name;
  selectedPlayerMeta.textContent = `${players.map((player) => player.name).join(", ")}`;
  selectedPlayerHandicap.textContent = `${players.length}`;
  selectedPlayerNet.textContent = group.scorerCode;
  selectedPlayerNet.className = "badge-value";

  playerHoleSelect.innerHTML = tournament.course
    .map((hole) => `<option value="${hole.hole}">Hole ${hole.hole} · Par ${hole.par}</option>`)
    .join("");

  if (!playerHoleSelect.value) {
    playerHoleSelect.value = "1";
  }

  renderGroupInputs(group, tournament);
  renderGroupCards(group, tournament);
}

function rerender(reload) {
  if (reload) state = TournamentStore.loadState();
  renderHeaderMetrics();
  renderUpdates();
  renderActiveGroup();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state = TournamentStore.loadState();
  const tournament = currentTournament();
  if (!tournament) return;

  const group = TournamentStore.findGroupByCode(tournament, playerCodeInput.value);
  if (!group) {
    activeGroupId = null;
    saveActiveGroupSession(null);
    loginMessage.textContent = "That group scorer code was not found for the live tournament.";
    rerender(false);
    return;
  }

  activeGroupId = group.id;
  saveActiveGroupSession(group.id);
  loginMessage.textContent = `${group.name} is now unlocked for score entry.`;
  rerender(false);
});

playerScoreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const tournament = currentTournament();
  const group = tournament?.groups.find((entry) => entry.id === activeGroupId);
  if (!group || !tournament) return;

  let nextState = state;
  group.playerIds.forEach((playerId) => {
    const input = groupScoreRows.querySelector(`input[name="score-${playerId}"]`);
    if (!input) return;
    nextState = TournamentStore.updatePlayerScore(
      nextState,
      tournament.id,
      playerId,
      Number(playerHoleSelect.value),
      Number(input.value),
    );
  });

  state = nextState;
  loginMessage.textContent = "Group scores posted successfully.";
  rerender(true);
});

playerHoleSelect.addEventListener("change", () => {
  const tournament = currentTournament();
  const group = tournament?.groups.find((entry) => entry.id === activeGroupId);
  if (!group || !tournament) return;
  renderGroupInputs(group, tournament);
});

playerSignoutButton.addEventListener("click", () => {
  activeGroupId = null;
  saveActiveGroupSession(null);
  playerCodeInput.value = "";
  loginMessage.textContent = "Group signed out on this device.";
  rerender(false);
});

window.addEventListener("storage", () => {
  const previousTournamentId = currentTournament()?.id;
  state = TournamentStore.loadState();
  const nextTournamentId = currentTournament()?.id;
  if (previousTournamentId !== nextTournamentId) {
    activeGroupId = null;
    restoreActiveGroupSession();
  }
  rerender(false);
});

restoreActiveGroupSession();
rerender(false);
