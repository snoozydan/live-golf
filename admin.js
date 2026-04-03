const adminLoginForm = document.getElementById("admin-login-form");
const adminCodeInput = document.getElementById("admin-code-input");
const adminLoginMessage = document.getElementById("admin-login-message");
const adminSignoutButton = document.getElementById("admin-signout-button");
const adminManagerPanel = document.getElementById("admin-manager-panel");
const adminControlsPanel = document.getElementById("admin-controls-panel");
const adminPlayerList = document.getElementById("admin-player-list");
const adminCourseList = document.getElementById("admin-course-list");
const resetButton = document.getElementById("reset-button");
const saveButton = document.getElementById("save-button");
const tournamentNameInput = document.getElementById("tournament-name-input");
const courseNameInput = document.getElementById("course-name-input");
const tournamentStatusInput = document.getElementById("tournament-status-input");
const leaderboardDescriptionInput = document.getElementById("leaderboard-description-input");
const adminTournamentSelect = document.getElementById("admin-tournament-select");
const liveTournamentDisplay = document.getElementById("live-tournament-display");
const setLiveButton = document.getElementById("set-live-button");
const newTournamentNameInput = document.getElementById("new-tournament-name-input");
const newCourseNameInput = document.getElementById("new-course-name-input");
const createTournamentButton = document.getElementById("create-tournament-button");
const duplicateTournamentButton = document.getElementById("duplicate-tournament-button");
const clearScoresButton = document.getElementById("clear-scores-button");
const deleteTournamentButton = document.getElementById("delete-tournament-button");
const workspaceTitle = document.getElementById("workspace-title");
const workspaceMeta = document.getElementById("workspace-meta");
const workspacePlayerCount = document.getElementById("workspace-player-count");
const workspacePostedCount = document.getElementById("workspace-posted-count");
const newPlayerNameInput = document.getElementById("new-player-name-input");
const newPlayerCodeInput = document.getElementById("new-player-code-input");
const newPlayerFlightInput = document.getElementById("new-player-flight-input");
const addPlayerButton = document.getElementById("add-player-button");
const playersSectionLabel = document.getElementById("players-section-label");
const courseSectionLabel = document.getElementById("course-section-label");

const adminEventName = document.getElementById("admin-event-name");
const adminCourseName = document.getElementById("admin-course-name");
const adminPlayersCount = document.getElementById("admin-players-count");
const adminHolesLogged = document.getElementById("admin-holes-logged");
const adminLeaderNet = document.getElementById("admin-leader-net");

let state = TournamentStore.loadState();
let adminUnlocked = false;
const ADMIN_SESSION_KEY = "fairway-live-admin-session-v1";
let selectedTournamentId = TournamentStore.getLiveTournament(state)?.id || TournamentStore.listTournaments(state)[0]?.id || null;
let draftPlayers = [];
let draftCourse = [];
let draftSettings = {
  tournamentName: "",
  courseName: "",
  leaderboardDescription: "",
  status: "live",
};

function scoreLabel(value) {
  if (value === 0) {
    return "E";
  }
  return value > 0 ? `+${value}` : `${value}`;
}

function selectedTournament() {
  return TournamentStore.getTournament(state, selectedTournamentId);
}

function refreshState() {
  state = TournamentStore.loadState();
  if (!TournamentStore.getTournament(state, selectedTournamentId)) {
    selectedTournamentId = TournamentStore.getLiveTournament(state)?.id || TournamentStore.listTournaments(state)[0]?.id || null;
  }
}

function saveAdminSession(unlocked) {
  if (unlocked) {
    window.localStorage.setItem(ADMIN_SESSION_KEY, "unlocked");
    return;
  }

  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}

function restoreAdminSession() {
  adminUnlocked = window.localStorage.getItem(ADMIN_SESSION_KEY) === "unlocked";
}

function syncDraftsFromState() {
  const tournament = selectedTournament();
  if (!tournament) {
    draftPlayers = [];
    draftCourse = [];
    draftSettings = {
      tournamentName: "",
      courseName: "",
      leaderboardDescription: "",
      status: "upcoming",
    };
    return;
  }

  draftPlayers = tournament.players.map((player) => ({ ...player, scores: [...player.scores] }));
  draftCourse = tournament.course.map((hole) => ({ ...hole }));
  draftSettings = {
    tournamentName: tournament.tournamentName,
    courseName: tournament.courseName,
    leaderboardDescription: tournament.leaderboardDescription,
    status: tournament.status,
  };
}

function renderHeader() {
  const tournament = selectedTournament();
  const ranked = TournamentStore.rankedPlayers(tournament);
  adminEventName.textContent = tournament ? tournament.tournamentName : "No tournament selected";
  adminCourseName.textContent = tournament ? tournament.courseName : "Choose a tournament below";
  adminPlayersCount.textContent = tournament ? `${tournament.players.length}` : "0";
  adminHolesLogged.textContent = tournament ? `${TournamentStore.totalPostedScores(tournament)}` : "0";
  adminLeaderNet.textContent = ranked[0] ? scoreLabel(ranked[0].netToPar) : "E";
}

function renderWorkspaceHeader() {
  const tournament = selectedTournament();
  if (!tournament) {
    workspaceTitle.textContent = "No tournament selected";
    workspaceMeta.textContent = "Choose a tournament in Tournament Manager";
    workspacePlayerCount.textContent = "0";
    workspacePostedCount.textContent = "0";
    return;
  }

  const title = adminUnlocked ? draftSettings.tournamentName || tournament.tournamentName : tournament.tournamentName;
  const course = adminUnlocked ? draftSettings.courseName || tournament.courseName : tournament.courseName;
  const status = adminUnlocked ? draftSettings.status || tournament.status : tournament.status;
  const playerCount = adminUnlocked ? draftPlayers.length : tournament.players.length;

  workspaceTitle.textContent = title;
  workspaceMeta.textContent = `${course} · ${status}`;
  workspacePlayerCount.textContent = `${playerCount}`;
  workspacePostedCount.textContent = `${TournamentStore.totalPostedScores(tournament)}`;
}

function renderScopedSectionLabels() {
  const tournament = selectedTournament();
  if (!tournament) {
    playersSectionLabel.textContent = "Players";
    courseSectionLabel.textContent = "Course holes";
    return;
  }

  playersSectionLabel.textContent = `Players for ${tournament.tournamentName}`;
  courseSectionLabel.textContent = `Course holes for ${tournament.courseName}`;
}

function renderTournamentManager() {
  const tournaments = TournamentStore.listTournaments(state);
  const liveTournament = TournamentStore.getLiveTournament(state);
  adminTournamentSelect.innerHTML = tournaments
    .map(
      (tournament) =>
        `<option value="${tournament.id}">${tournament.tournamentName} · ${tournament.courseName} · ${tournament.status}</option>`,
    )
    .join("");
  adminTournamentSelect.value = selectedTournamentId || "";
  liveTournamentDisplay.value = liveTournament
    ? `${liveTournament.tournamentName} · ${liveTournament.courseName}`
    : "No live tournament selected";
}

function renderSettings() {
  tournamentNameInput.value = draftSettings.tournamentName;
  courseNameInput.value = draftSettings.courseName;
  leaderboardDescriptionInput.value = draftSettings.leaderboardDescription;
  tournamentStatusInput.value = draftSettings.status;
}

function renderAdminPlayers() {
  adminPlayerList.innerHTML = draftPlayers
    .map(
      (player) => `
        <article class="admin-row">
          <div class="admin-row-header">
            <div>
              <div class="player-name">${player.name}</div>
              <div class="admin-meta">Code ${player.accessCode} · ${player.division}</div>
            </div>
          </div>
          <form class="admin-controls" data-player-form="${player.id}">
            <label>
              Name
              <input type="text" name="name" value="${player.name}" />
            </label>
            <label>
              Player code
              <input type="text" maxlength="8" name="accessCode" value="${player.accessCode}" />
            </label>
            <label>
              Flight
              <input type="text" name="division" value="${player.division}" />
            </label>
            <label>
              Handicap
              <input type="number" min="0" max="54" name="handicap" value="${player.handicap}" />
            </label>
            <div class="button-stack">
              <button type="button" class="danger-button remove-player-button" data-remove-player="${player.id}">Remove</button>
            </div>
          </form>
        </article>
      `,
    )
    .join("");

  document.querySelectorAll("[data-player-form]").forEach((form) => {
    form.addEventListener("input", () => {
      const playerId = form.getAttribute("data-player-form");
      const player = draftPlayers.find((entry) => entry.id === playerId);
      if (!player) {
        return;
      }
      player.name = form.querySelector('input[name="name"]').value;
      player.accessCode = form.querySelector('input[name="accessCode"]').value.toUpperCase();
      player.division = form.querySelector('input[name="division"]').value;
      player.handicap = form.querySelector('input[name="handicap"]').value;
      adminLoginMessage.textContent = "Unsaved admin changes.";
    });
  });

  document.querySelectorAll("[data-remove-player]").forEach((button) => {
    button.addEventListener("click", () => {
      const playerId = button.getAttribute("data-remove-player");
      draftPlayers = draftPlayers.filter((player) => player.id !== playerId);
      adminLoginMessage.textContent = "Unsaved admin changes.";
      renderAdminPlayers();
      renderWorkspaceHeader();
    });
  });
}

function renderAdminCourse() {
  adminCourseList.innerHTML = draftCourse
    .map(
      (hole) => `
        <article class="admin-row">
          <div class="admin-row-header">
            <div>
              <div class="player-name">Hole ${hole.hole}</div>
              <div class="admin-meta">Set par, yardage, and handicap stroke index</div>
            </div>
          </div>
          <form class="admin-controls" data-hole-form="${hole.hole}">
            <label>
              Par
              <input type="number" min="3" max="6" name="par" value="${hole.par}" />
            </label>
            <label>
              Stroke index
              <input type="number" min="1" max="18" name="strokeIndex" value="${hole.strokeIndex}" />
            </label>
            <label>
              Yardage
              <input type="number" min="1" max="800" name="yardage" value="${hole.yardage}" />
            </label>
          </form>
        </article>
      `,
    )
    .join("");

  document.querySelectorAll("[data-hole-form]").forEach((form) => {
    form.addEventListener("input", () => {
      const holeNumber = Number(form.getAttribute("data-hole-form"));
      const hole = draftCourse[holeNumber - 1];
      if (!hole) {
        return;
      }
      hole.par = form.querySelector('input[name="par"]').value;
      hole.strokeIndex = form.querySelector('input[name="strokeIndex"]').value;
      hole.yardage = form.querySelector('input[name="yardage"]').value;
      adminLoginMessage.textContent = "Unsaved admin changes.";
    });
  });
}

function rerender(reload) {
  if (reload) {
    refreshState();
  }

  renderTournamentManager();
  renderHeader();

  if (!adminUnlocked) {
    adminSignoutButton.classList.add("hidden");
    adminControlsPanel.classList.add("hidden");
    return;
  }

  adminSignoutButton.classList.remove("hidden");
  adminControlsPanel.classList.remove("hidden");
  syncDraftsFromState();
  renderWorkspaceHeader();
  renderScopedSectionLabels();
  renderSettings();
  renderAdminPlayers();
  renderAdminCourse();
}

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  refreshState();

  if (!TournamentStore.validateAdminCode(state, adminCodeInput.value)) {
    adminUnlocked = false;
    adminLoginMessage.textContent = "That admin code is not correct.";
    rerender(false);
    return;
  }

  adminUnlocked = true;
  saveAdminSession(true);
  syncDraftsFromState();
  adminLoginMessage.textContent = "Admin controls unlocked.";
  rerender(false);
});

adminSignoutButton.addEventListener("click", () => {
  adminUnlocked = false;
  saveAdminSession(false);
  adminCodeInput.value = "";
  adminLoginMessage.textContent = "Admin signed out on this device.";
  rerender(false);
});

adminTournamentSelect.addEventListener("change", () => {
  selectedTournamentId = adminTournamentSelect.value;
  syncDraftsFromState();
  adminLoginMessage.textContent = "Switched editing tournament.";
  rerender(false);
});

tournamentNameInput.addEventListener("input", () => {
  draftSettings.tournamentName = tournamentNameInput.value;
  adminLoginMessage.textContent = "Unsaved admin changes.";
});

courseNameInput.addEventListener("input", () => {
  draftSettings.courseName = courseNameInput.value;
  adminLoginMessage.textContent = "Unsaved admin changes.";
});

tournamentStatusInput.addEventListener("change", () => {
  draftSettings.status = tournamentStatusInput.value;
  adminLoginMessage.textContent = "Unsaved admin changes.";
});

leaderboardDescriptionInput.addEventListener("input", () => {
  draftSettings.leaderboardDescription = leaderboardDescriptionInput.value;
  adminLoginMessage.textContent = "Unsaved admin changes.";
});

setLiveButton.addEventListener("click", () => {
  if (!selectedTournamentId) {
    return;
  }
  state = TournamentStore.setLeaderboardTournament(state, selectedTournamentId);
  adminLoginMessage.textContent = "Selected tournament is now the public live leaderboard.";
  rerender(true);
});

createTournamentButton.addEventListener("click", () => {
  const name = newTournamentNameInput.value.trim();
  const course = newCourseNameInput.value.trim();

  state = TournamentStore.createTournamentFromAdmin(state, {
    tournamentName: name || "New Tournament",
    courseName: course || draftSettings.courseName || "Course Name",
    status: "upcoming",
    copyFromTournamentId: selectedTournamentId,
  });

  selectedTournamentId = TournamentStore.listTournaments(state).slice(-1)[0].id;
  newTournamentNameInput.value = "";
  newCourseNameInput.value = "";
  adminLoginMessage.textContent = "New tournament created from the selected setup.";
  rerender(true);
});

duplicateTournamentButton.addEventListener("click", () => {
  if (!selectedTournamentId) {
    return;
  }

  state = TournamentStore.duplicateTournament(state, selectedTournamentId, {
    tournamentName: `${draftSettings.tournamentName} Copy`,
    courseName: draftSettings.courseName,
    status: "upcoming",
  });

  selectedTournamentId = TournamentStore.listTournaments(state).slice(-1)[0].id;
  adminLoginMessage.textContent = "Tournament duplicated.";
  rerender(true);
});

clearScoresButton.addEventListener("click", () => {
  if (!selectedTournamentId) {
    return;
  }

  const tournament = TournamentStore.getTournament(state, selectedTournamentId);
  const confirmed = window.confirm(
    `Clear all scores for ${tournament?.tournamentName || "this tournament"}? Players and course settings will stay.`,
  );

  if (!confirmed) {
    return;
  }

  state = TournamentStore.clearTournamentScores(state, selectedTournamentId);
  adminLoginMessage.textContent = "All scores cleared for the selected tournament.";
  rerender(true);
});

deleteTournamentButton.addEventListener("click", () => {
  const tournaments = TournamentStore.listTournaments(state);

  if (!selectedTournamentId) {
    return;
  }

  if (tournaments.length <= 1) {
    adminLoginMessage.textContent = "At least one tournament must remain.";
    return;
  }

  const tournament = TournamentStore.getTournament(state, selectedTournamentId);
  const confirmed = window.confirm(`Delete ${tournament?.tournamentName || "this tournament"}?`);

  if (!confirmed) {
    return;
  }

  state = TournamentStore.deleteTournament(state, selectedTournamentId);
  selectedTournamentId =
    TournamentStore.getLiveTournament(state)?.id || TournamentStore.listTournaments(state)[0]?.id || null;
  adminLoginMessage.textContent = "Tournament deleted.";
  rerender(true);
});

addPlayerButton.addEventListener("click", () => {
  const name = newPlayerNameInput.value.trim();
  const code = newPlayerCodeInput.value.trim().toUpperCase();
  const division = newPlayerFlightInput.value.trim();

  if (!name || !code) {
    adminLoginMessage.textContent = "New players need at least a name and code.";
    return;
  }

  draftPlayers = [
    ...draftPlayers,
    {
      id: `draft-player-${Date.now()}`,
      name,
      hometown: "",
      division: division || "Championship Flight",
      teeTime: "",
      accessCode: code,
      handicap: 0,
      scores: new Array(18).fill(null),
    },
  ];

  newPlayerNameInput.value = "";
  newPlayerCodeInput.value = "";
  newPlayerFlightInput.value = "";
  adminLoginMessage.textContent = "Unsaved admin changes.";
  renderAdminPlayers();
  renderWorkspaceHeader();
});

saveButton.addEventListener("click", () => {
  if (!selectedTournamentId) {
    return;
  }

  const seenCodes = new Set();
  for (const player of draftPlayers) {
    const code = String(player.accessCode || "").trim().toUpperCase();
    if (!code || seenCodes.has(code)) {
      adminLoginMessage.textContent = "Each player needs a unique code before saving.";
      return;
    }
    seenCodes.add(code);
  }

  let nextState = TournamentStore.loadState();
  nextState = TournamentStore.updateTournamentSettings(nextState, selectedTournamentId, {
    tournamentName: draftSettings.tournamentName,
    courseName: draftSettings.courseName,
    leaderboardDescription: draftSettings.leaderboardDescription,
    status: draftSettings.status,
  });

  const latestTournament = TournamentStore.getTournament(nextState, selectedTournamentId);
  const latestIds = new Set((latestTournament?.players || []).map((player) => player.id));
  const draftIds = new Set(draftPlayers.map((player) => player.id));

  draftPlayers
    .filter((player) => latestIds.has(player.id))
    .forEach((player) => {
      nextState = TournamentStore.updatePlayerDetails(nextState, selectedTournamentId, player.id, {
        name: player.name,
        accessCode: player.accessCode,
        division: player.division,
      });
      nextState = TournamentStore.updatePlayerHandicap(nextState, selectedTournamentId, player.id, player.handicap);
    });

  draftPlayers
    .filter((player) => !latestIds.has(player.id))
    .forEach((player) => {
      nextState = TournamentStore.addPlayer(nextState, selectedTournamentId, {
        name: player.name,
        accessCode: player.accessCode,
        division: player.division,
        handicap: player.handicap,
        hometown: player.hometown,
        teeTime: player.teeTime,
      });
    });

  draftCourse.forEach((hole) => {
    nextState = TournamentStore.updateHole(nextState, selectedTournamentId, hole.hole, {
      par: hole.par,
      strokeIndex: hole.strokeIndex,
      yardage: hole.yardage,
    });
  });

  (latestTournament?.players || [])
    .filter((player) => !draftIds.has(player.id))
    .forEach((player) => {
      nextState = TournamentStore.removePlayer(nextState, selectedTournamentId, player.id);
    });

  state = nextState;
  adminLoginMessage.textContent = "Admin changes saved.";
  rerender(true);
});

resetButton.addEventListener("click", () => {
  state = TournamentStore.resetState();
  selectedTournamentId = TournamentStore.getLiveTournament(state)?.id || TournamentStore.listTournaments(state)[0]?.id || null;
  adminLoginMessage.textContent = "All tournaments reset to seed data.";
  rerender(true);
});

window.addEventListener("storage", () => {
  refreshState();
  restoreAdminSession();
  rerender(false);
});

restoreAdminSession();
rerender(false);
