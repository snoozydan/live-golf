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
const previousHoleButton = document.getElementById("previous-hole-button");
const nextHoleButton = document.getElementById("next-hole-button");
const strokeHoleGrid = document.getElementById("stroke-hole-grid");
const playerScorecard = document.getElementById("player-scorecard");
const groupScoreRows = document.getElementById("group-score-rows");
const updatesFeed = document.getElementById("updates-feed");
const scoreSaveMessage = document.getElementById("score-save-message");
const postGroupScoresButton = document.getElementById("post-group-scores-button");
const currentHoleLabel = document.getElementById("current-hole-label");
const scoreDraftStatus = document.getElementById("score-draft-status");

const eventName = document.getElementById("event-name");
const courseName = document.getElementById("course-name");
const snapshotLeaders = document.getElementById("snapshot-leaders");

let state = TournamentStore.loadState();
let activeGroupId = null;
let selectedHoleNumber = 1;
let isPostingScores = false;
const scoreDrafts = new Map();

function setPostingState(isPosting) {
  isPostingScores = isPosting;
  postGroupScoresButton.disabled = isPosting;
  postGroupScoresButton.textContent = isPosting ? "Saving..." : "Post group scores";
  playerHoleSelect.disabled = isPosting;
  previousHoleButton.disabled = isPosting || Number(playerHoleSelect.value || selectedHoleNumber) <= 1;
  nextHoleButton.disabled = isPosting || Number(playerHoleSelect.value || selectedHoleNumber) >= 18;
  groupScoreRows.querySelectorAll("input").forEach((input) => {
    input.disabled = isPosting;
  });
}

function sessionKey(tournamentId) {
  return `fairway-live-active-group-${tournamentId}`;
}

function holeSessionKey(tournamentId, groupId) {
  return `fairway-live-active-hole-${tournamentId}-${groupId}`;
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
  if (value < 0) return "score-under";
  if (value > 0) return "score-over";
  return "score-even";
}

function progressScoreLabel(player, value) {
  return player.completed === 0 ? "-" : scoreLabel(value);
}

function currentTournament() {
  return TournamentStore.getLiveTournament(state);
}

function scoreDraftKey(groupId, holeNumber) {
  return `${groupId || "none"}-${holeNumber}`;
}

function captureCurrentDraft() {
  if (!activeGroupId) return;
  const holeNumber = Number(playerHoleSelect.value || selectedHoleNumber);
  const draft = {};
  let hasValue = false;

  groupScoreRows.querySelectorAll("input[name^='score-']").forEach((input) => {
    const playerId = input.name.replace("score-", "");
    draft[playerId] = input.value;
    if (input.value !== "") {
      hasValue = true;
    }
  });

  const key = scoreDraftKey(activeGroupId, holeNumber);
  if (hasValue) {
    scoreDrafts.set(key, draft);
  } else {
    scoreDrafts.delete(key);
  }
}

function clearDraft(groupId, holeNumber) {
  scoreDrafts.delete(scoreDraftKey(groupId, holeNumber));
}

function clearGroupDrafts(groupId) {
  Array.from(scoreDrafts.keys()).forEach((key) => {
    if (key.startsWith(`${groupId}-`)) {
      scoreDrafts.delete(key);
    }
  });
}

function resetActiveGroupToHoleOneIfScoresCleared() {
  const tournament = currentTournament();
  if (!tournament || !activeGroupId) {
    return;
  }

  if (TournamentStore.totalPostedScores(tournament) !== 0) {
    return;
  }

  clearGroupDrafts(activeGroupId);
  clearSelectedHoleSession(activeGroupId);
  selectedHoleNumber = 1;
  scoreSaveMessage.classList.add("hidden");
}

function draftStatusText(groupId, holeNumber) {
  const draft = scoreDrafts.get(scoreDraftKey(groupId, holeNumber));
  if (!draft) {
    return "No scores entered yet";
  }

  const readyCount = Object.values(draft).filter((value) => value !== "").length;
  if (!readyCount) {
    return "No scores entered yet";
  }

  return readyCount === 1 ? "1 score ready to save" : `${readyCount} scores ready to save`;
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

function saveSelectedHoleSession(holeNumber) {
  const tournament = currentTournament();
  if (!tournament || !activeGroupId) return;
  window.localStorage.setItem(holeSessionKey(tournament.id, activeGroupId), String(holeNumber));
}

function clearSelectedHoleSession(groupId) {
  const tournament = currentTournament();
  if (!tournament || !groupId) return;
  window.localStorage.removeItem(holeSessionKey(tournament.id, groupId));
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
  const savedHole = Number(window.localStorage.getItem(holeSessionKey(tournament.id, group.id)));
  selectedHoleNumber = savedHole >= 1 && savedHole <= 18 ? savedHole : 1;
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
          <div class="snapshot-score">${player.completed === 0 ? "-" : scoreLabel(player.netToPar)}</div>
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
  const draft = scoreDrafts.get(scoreDraftKey(group.id, holeNumber)) || {};
  const players = group.playerIds
    .map((id) => tournament.players.find((player) => player.id === id))
    .filter(Boolean);

  groupScoreRows.innerHTML = players
    .map((player) => {
      const currentScore = player.scores[holeNumber - 1];
      const inputValue = Object.prototype.hasOwnProperty.call(draft, player.id) ? draft[player.id] : (currentScore ?? "");
      return `
        <label class="group-score-row">
          <span class="group-score-name">${player.name}</span>
          <input
            type="number"
            inputmode="numeric"
            pattern="[0-9]*"
            min="1"
            max="15"
            step="1"
            name="score-${player.id}"
            value="${inputValue}"
            placeholder="-"
          />
        </label>
      `;
    })
    .join("");

  groupScoreRows.querySelectorAll("input[name^='score-']").forEach((input) => {
    input.addEventListener("input", () => {
      captureCurrentDraft();
      scoreDraftStatus.textContent = draftStatusText(group.id, holeNumber);
      scoreSaveMessage.classList.add("hidden");
    });
  });
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
          <div class="hole-card-value">Gross ${progressScoreLabel(player, player.grossToPar)}</div>
          <div class="hole-card-line">Net ${progressScoreLabel(player, player.netToPar)}</div>
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
            <div class="card-subline">Gross ${progressScoreLabel(player, player.grossToPar)} · Net ${progressScoreLabel(player, player.netToPar)} · Total ${player.completed === 0 ? "-" : player.gross}</div>
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
    scoreSaveMessage.classList.add("hidden");
    return;
  }

  if (!activeGroupId) {
    playerPanel.classList.add("hidden");
    playerPanelEmpty.classList.remove("hidden");
    playerPanelEmpty.textContent = "Choose a group scorer code to enter scores for that group.";
    playerPanelTitle.textContent = "No group selected";
    loginForm.classList.remove("hidden");
    playerSignoutButton.classList.add("hidden");
    scoreSaveMessage.classList.add("hidden");
    currentHoleLabel.textContent = "Hole 1";
    scoreDraftStatus.textContent = "No scores entered yet";
    return;
  }

  const group = tournament.groups.find((entry) => entry.id === activeGroupId);
  if (!group) {
    clearSelectedHoleSession(activeGroupId);
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

  if (selectedHoleNumber < 1 || selectedHoleNumber > 18) {
    selectedHoleNumber = 1;
  }

  playerHoleSelect.value = `${selectedHoleNumber}`;
  currentHoleLabel.textContent = `Hole ${selectedHoleNumber}`;
  scoreDraftStatus.textContent = draftStatusText(group.id, selectedHoleNumber);

  const holeNumber = selectedHoleNumber;
  previousHoleButton.disabled = holeNumber <= 1;
  nextHoleButton.disabled = holeNumber >= 18;

  renderGroupInputs(group, tournament);
  renderGroupCards(group, tournament);
  setPostingState(isPostingScores);
}

async function rerender(reload) {
  if (reload) {
    state = window.AppData?.enabled() ? await window.AppData.bootstrap() : TournamentStore.loadState();
  }
  renderHeaderMetrics();
  renderUpdates();
  renderActiveGroup();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state = window.AppData?.enabled() ? await window.AppData.bootstrap() : TournamentStore.loadState();
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
  const savedHole = Number(window.localStorage.getItem(holeSessionKey(tournament.id, group.id)));
  selectedHoleNumber = savedHole >= 1 && savedHole <= 18 ? savedHole : 1;
  saveActiveGroupSession(group.id);
  loginMessage.textContent = `${group.name} is now unlocked for score entry.`;
  await rerender(false);
});

playerScoreForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isPostingScores) {
    return;
  }

  captureCurrentDraft();

  const tournament = currentTournament();
  const group = tournament?.groups.find((entry) => entry.id === activeGroupId);
  if (!group || !tournament) return;
  const savedHoleNumber = Number(playerHoleSelect.value);

  const filledInputs = group.playerIds
    .map((playerId) => groupScoreRows.querySelector(`input[name="score-${playerId}"]`))
    .filter((input) => input && input.value !== "");

  if (!filledInputs.length) {
    scoreSaveMessage.textContent = `Enter at least one score before saving hole ${savedHoleNumber}.`;
    scoreSaveMessage.classList.remove("hidden");
    scoreDraftStatus.textContent = draftStatusText(group.id, savedHoleNumber);
    return;
  }

  setPostingState(true);

  let nextState = state;
  try {
    const entries = [];
    group.playerIds.forEach((playerId) => {
      const input = groupScoreRows.querySelector(`input[name="score-${playerId}"]`);
      if (!input || input.value === "") return;
      entries.push({
        playerId,
        holeNumber: Number(playerHoleSelect.value),
        strokes: Number(input.value),
      });
      nextState = TournamentStore.updatePlayerScore(nextState, tournament.id, playerId, Number(playerHoleSelect.value), Number(input.value));
    });

    state = nextState;
    if (window.AppData?.enabled()) {
      state = await window.AppData.postScores(tournament.id, entries);
    }

    clearDraft(group.id, savedHoleNumber);

    if (savedHoleNumber < 18) {
      selectedHoleNumber = savedHoleNumber + 1;
    } else {
      selectedHoleNumber = 18;
    }
    saveSelectedHoleSession(selectedHoleNumber);

    scoreSaveMessage.textContent = `Scores for hole ${savedHoleNumber} have been saved.`;
    scoreSaveMessage.classList.remove("hidden");
    loginMessage.textContent = "Group scores posted successfully.";
    await rerender(true);
  } catch (error) {
    console.error("Posting group scores failed", error);
    scoreSaveMessage.textContent = `Could not save hole ${savedHoleNumber}. Please try again.`;
    scoreSaveMessage.classList.remove("hidden");
  } finally {
    setPostingState(false);
  }
});

playerHoleSelect.addEventListener("change", async () => {
  captureCurrentDraft();
  selectedHoleNumber = Number(playerHoleSelect.value);
  saveSelectedHoleSession(selectedHoleNumber);
  scoreSaveMessage.classList.add("hidden");
  const tournament = currentTournament();
  const group = tournament?.groups.find((entry) => entry.id === activeGroupId);
  if (!group || !tournament) return;
  await rerender(false);
});

previousHoleButton.addEventListener("click", async () => {
  const current = selectedHoleNumber;
  if (current <= 1) return;
  captureCurrentDraft();
  selectedHoleNumber = current - 1;
  saveSelectedHoleSession(selectedHoleNumber);
  scoreSaveMessage.classList.add("hidden");
  const tournament = currentTournament();
  const group = tournament?.groups.find((entry) => entry.id === activeGroupId);
  if (!group || !tournament) return;
  await rerender(false);
});

nextHoleButton.addEventListener("click", async () => {
  const current = selectedHoleNumber;
  if (current >= 18) return;
  captureCurrentDraft();
  selectedHoleNumber = current + 1;
  saveSelectedHoleSession(selectedHoleNumber);
  scoreSaveMessage.classList.add("hidden");
  const tournament = currentTournament();
  const group = tournament?.groups.find((entry) => entry.id === activeGroupId);
  if (!group || !tournament) return;
  await rerender(false);
});

playerSignoutButton.addEventListener("click", async () => {
  captureCurrentDraft();
  clearGroupDrafts(activeGroupId);
  clearSelectedHoleSession(activeGroupId);
  activeGroupId = null;
  selectedHoleNumber = 1;
  saveActiveGroupSession(null);
  playerCodeInput.value = "";
  loginMessage.textContent = "Group signed out on this device.";
  scoreSaveMessage.classList.add("hidden");
  currentHoleLabel.textContent = "Hole 1";
  scoreDraftStatus.textContent = "No scores entered yet";
  await rerender(false);
});

window.addEventListener("storage", () => {
  const previousTournamentId = currentTournament()?.id;
  state = TournamentStore.loadState();
  const nextTournamentId = currentTournament()?.id;
  if (previousTournamentId !== nextTournamentId) {
    activeGroupId = null;
    restoreActiveGroupSession();
  }
  resetActiveGroupToHoleOneIfScoresCleared();
  rerender(false);
});

window.AppData?.subscribe(async () => {
  const previousTournamentId = currentTournament()?.id;
  state = await window.AppData.bootstrap();
  const nextTournamentId = currentTournament()?.id;
  if (previousTournamentId !== nextTournamentId) {
    activeGroupId = null;
    restoreActiveGroupSession();
  }
  resetActiveGroupToHoleOneIfScoresCleared();
  await rerender(false);
});

(async () => {
  if (window.AppData?.enabled()) {
    state = await window.AppData.bootstrap();
  }
  restoreActiveGroupSession();
  await rerender(false);
})();
