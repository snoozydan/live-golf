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
const playerStrokesInput = document.getElementById("player-strokes-input");
const playerScoreForm = document.getElementById("player-score-form");
const playerSignoutButton = document.getElementById("player-signout-button");
const strokeHoleGrid = document.getElementById("stroke-hole-grid");
const playerScorecard = document.getElementById("player-scorecard");
const updatesFeed = document.getElementById("updates-feed");

const eventName = document.getElementById("event-name");
const courseName = document.getElementById("course-name");
const snapshotLeaders = document.getElementById("snapshot-leaders");

let state = TournamentStore.loadState();
let activePlayerId = null;

function sessionKey(tournamentId) {
  return `fairway-live-active-player-${tournamentId}`;
}

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

function currentTournament() {
  return TournamentStore.getLiveTournament(state);
}

function nextOpenHole(player) {
  const index = player.scores.findIndex((score) => score === null || score === "");
  return index === -1 ? 18 : index + 1;
}

function timeAgo(timestamp) {
  const minutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  return `${Math.floor(minutes / 60)} hr ago`;
}

function saveActivePlayerSession(playerId) {
  const tournament = currentTournament();
  if (!tournament) {
    return;
  }

  const key = sessionKey(tournament.id);
  if (!playerId) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, playerId);
}

function restoreActivePlayerSession() {
  const tournament = currentTournament();
  if (!tournament) {
    return;
  }

  const savedPlayerId = window.localStorage.getItem(sessionKey(tournament.id));
  if (!savedPlayerId) {
    return;
  }

  const player = tournament.players.find((entry) => entry.id === savedPlayerId);
  if (!player) {
    saveActivePlayerSession(null);
    return;
  }

  activePlayerId = player.id;
  loginMessage.textContent = `${player.name} is still signed in on this device.`;
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
          <div class="snapshot-score ${scoreTone(player.netToPar)}">${scoreLabel(player.netToPar)}</div>
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

function renderActivePlayer() {
  const tournament = currentTournament();
  if (!tournament) {
    playerPanel.classList.add("hidden");
    playerPanelEmpty.classList.remove("hidden");
    playerPanelEmpty.textContent = "No live tournament is currently selected in admin.";
    loginForm.classList.add("hidden");
    return;
  }

  if (!activePlayerId) {
    playerPanel.classList.add("hidden");
    playerPanelEmpty.classList.remove("hidden");
    playerPanelEmpty.textContent = "Choose a player code to see that player’s card, scoring form, and stroke holes.";
    playerPanelTitle.textContent = "No player selected";
    loginForm.classList.remove("hidden");
    playerSignoutButton.classList.add("hidden");
    return;
  }

  const player = tournament.players.find((entry) => entry.id === activePlayerId);
  if (!player) {
    activePlayerId = null;
    saveActivePlayerSession(null);
    renderActivePlayer();
    return;
  }

  const computed = TournamentStore.computePlayer(player, tournament.course);
  playerPanel.classList.remove("hidden");
  playerPanelEmpty.classList.add("hidden");
  loginForm.classList.add("hidden");
  playerSignoutButton.classList.remove("hidden");
  playerPanelTitle.textContent = `${player.name}'s scoring`;
  selectedPlayerName.textContent = player.name;
  selectedPlayerMeta.textContent = `${player.hometown} · Code ${player.accessCode} · Thru ${computed.thru}`;
  selectedPlayerHandicap.textContent = `${player.handicap}`;
  selectedPlayerNet.textContent = scoreLabel(computed.netToPar);
  selectedPlayerNet.className = `badge-value ${scoreTone(computed.netToPar)}`;

  playerHoleSelect.innerHTML = tournament.course
    .map((hole) => `<option value="${hole.hole}">Hole ${hole.hole} · Par ${hole.par}</option>`)
    .join("");

  const suggestedHole = nextOpenHole(player);
  playerHoleSelect.value = `${suggestedHole}`;
  playerStrokesInput.value = `${tournament.course[suggestedHole - 1].par}`;

  strokeHoleGrid.innerHTML = computed.allocation
    .map(
      (item) => `
        <article class="score-hole-card ${item.strokes > 0 ? "stroke-hole" : "non-stroke-hole"}">
          <div class="hole-card-title">Hole ${item.hole}</div>
          <div class="hole-card-line">Par ${item.par} · ${tournament.course[item.hole - 1].yardage} yds · SI ${item.strokeIndex}</div>
          <div class="hole-card-value">${item.strokes > 0 ? "Stroke hole" : "No stroke"}</div>
        </article>
      `,
    )
    .join("");

  playerScorecard.innerHTML = tournament.course
    .map((hole, index) => {
      const score = player.scores[index];
      const statusClass = score === null ? "score-missing" : "score-entered";
      const netHoleScore =
        score === null ? null : Math.max(1, Number(score) - computed.allocation[index].strokes);
      return `
        <article class="score-hole-card ${statusClass}">
          <div class="hole-card-title">Hole ${hole.hole}</div>
          <div class="hole-card-line">Par ${hole.par} · ${hole.yardage} yds · SI ${hole.strokeIndex}</div>
          <div class="hole-card-value">${score === null ? "Not posted" : `${score} gross`}</div>
          <div class="hole-card-line">${score === null ? "Waiting for score" : `Net ${netHoleScore}`}</div>
        </article>
      `;
    })
    .join("");
}

function rerender(reload) {
  if (reload) {
    state = TournamentStore.loadState();
  }
  renderHeaderMetrics();
  renderUpdates();
  renderActivePlayer();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state = TournamentStore.loadState();
  const tournament = currentTournament();
  if (!tournament) {
    return;
  }

  const player = TournamentStore.findPlayerByCode(tournament, playerCodeInput.value);
  if (!player) {
    activePlayerId = null;
    saveActivePlayerSession(null);
    loginMessage.textContent = "That player code was not found for the live tournament.";
    rerender(false);
    return;
  }

  activePlayerId = player.id;
  saveActivePlayerSession(player.id);
  loginMessage.textContent = `${player.name} is now unlocked for score entry.`;
  rerender(false);
});

playerScoreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const tournament = currentTournament();
  if (!activePlayerId || !tournament) {
    return;
  }

  state = TournamentStore.updatePlayerScore(
    state,
    tournament.id,
    activePlayerId,
    Number(playerHoleSelect.value),
    Number(playerStrokesInput.value),
  );
  loginMessage.textContent = "Score posted successfully.";
  rerender(true);
});

playerHoleSelect.addEventListener("change", () => {
  const tournament = currentTournament();
  if (!tournament) {
    return;
  }
  const hole = tournament.course[Number(playerHoleSelect.value) - 1];
  playerStrokesInput.value = `${hole.par}`;
});

playerSignoutButton.addEventListener("click", () => {
  activePlayerId = null;
  saveActivePlayerSession(null);
  playerCodeInput.value = "";
  loginMessage.textContent = "Player signed out on this device.";
  rerender(false);
});

window.addEventListener("storage", () => {
  const previousTournamentId = currentTournament()?.id;
  state = TournamentStore.loadState();
  const nextTournamentId = currentTournament()?.id;

  if (previousTournamentId !== nextTournamentId) {
    activePlayerId = null;
    restoreActivePlayerSession();
  }

  rerender(false);
});

restoreActivePlayerSession();
rerender(false);
