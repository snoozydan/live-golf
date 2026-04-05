(() => {
  const ADMIN_SESSION_KEY = "fairway-live-admin-session-v1";
  const ADMIN_SELECTED_TOURNAMENT_KEY = "fairway-live-admin-selected-tournament-v1";

  function getSelectedTournamentId(state) {
    const saved = window.localStorage.getItem(ADMIN_SELECTED_TOURNAMENT_KEY);
    if (saved && TournamentStore.getTournament(state, saved)) {
      return saved;
    }
    return TournamentStore.getLiveTournament(state)?.id || TournamentStore.listTournaments(state)[0]?.id || null;
  }

  function setSelectedTournamentId(id) {
    if (!id) {
      window.localStorage.removeItem(ADMIN_SELECTED_TOURNAMENT_KEY);
      return;
    }
    window.localStorage.setItem(ADMIN_SELECTED_TOURNAMENT_KEY, id);
  }

  function initAdminPage({ renderContent }) {
    const loginForm = document.getElementById("admin-login-form");
    const adminCodeInput = document.getElementById("admin-code-input");
    const adminLoginMessage = document.getElementById("admin-login-message");
    const adminSignoutButton = document.getElementById("admin-signout-button");
    const adminControlsPanel = document.getElementById("admin-controls-panel");
    const workspaceTitle = document.getElementById("workspace-title");
    const workspaceMeta = document.getElementById("workspace-meta");
    const workspacePlayerCount = document.getElementById("workspace-player-count");
    const workspacePostedCount = document.getElementById("workspace-posted-count");
    const selectedTournamentSelect = document.getElementById("selected-tournament-select");

    let state = TournamentStore.loadState();
    let adminUnlocked = window.localStorage.getItem(ADMIN_SESSION_KEY) === "unlocked";
    let selectedTournamentId = getSelectedTournamentId(state);
    let hasUnsavedChanges = false;

    function currentTournament() {
      return TournamentStore.getTournament(state, selectedTournamentId);
    }

    function setMessage(message) {
      if (adminLoginMessage) {
        adminLoginMessage.textContent = message;
      }
    }

    function saveAdminSession(unlocked) {
      if (unlocked) {
        window.localStorage.setItem(ADMIN_SESSION_KEY, "unlocked");
        return;
      }
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
    }

    function setDirty(value) {
      hasUnsavedChanges = Boolean(value);
    }

    function confirmDiscardChanges() {
      if (!hasUnsavedChanges) {
        return true;
      }

      return window.confirm("You have unsaved admin changes. Leave this screen without saving?");
    }

    function renderWorkspace() {
      const tournament = currentTournament();
      if (workspaceTitle) {
        workspaceTitle.textContent = tournament ? tournament.tournamentName : "No tournament selected";
      }
      if (workspaceMeta) {
        workspaceMeta.textContent = tournament ? `${tournament.courseName} · ${tournament.status}` : "Choose a tournament";
      }
      if (workspacePlayerCount) {
        workspacePlayerCount.textContent = tournament ? `${tournament.players.length}` : "0";
      }
      if (workspacePostedCount) {
        workspacePostedCount.textContent = tournament ? `${TournamentStore.totalPostedScores(tournament)}` : "0";
      }

      if (selectedTournamentSelect) {
        selectedTournamentSelect.innerHTML = TournamentStore.listTournaments(state)
          .map(
            (tournamentOption) =>
              `<option value="${tournamentOption.id}">${tournamentOption.tournamentName} · ${tournamentOption.courseName} · ${tournamentOption.status}</option>`,
          )
          .join("");
        selectedTournamentSelect.value = selectedTournamentId || "";
      }
    }

    function setSelectedTournament(id) {
      if (!confirmDiscardChanges()) {
        if (selectedTournamentSelect) {
          selectedTournamentSelect.value = selectedTournamentId || "";
        }
        return;
      }
      selectedTournamentId = id;
      setSelectedTournamentId(id);
      setDirty(false);
      rerender(false);
    }

    async function rerender(reload) {
      if (reload) {
        state = window.AppData?.enabled() ? await window.AppData.bootstrap() : TournamentStore.loadState();
      }

      if (!TournamentStore.getTournament(state, selectedTournamentId)) {
        selectedTournamentId = getSelectedTournamentId(state);
        setSelectedTournamentId(selectedTournamentId);
      }

      renderWorkspace();

      if (!adminUnlocked) {
        adminControlsPanel.classList.add("hidden");
        adminSignoutButton?.classList.add("hidden");
        return;
      }

      adminControlsPanel.classList.remove("hidden");
      adminSignoutButton?.classList.remove("hidden");

      renderContent({
        state,
        tournament: currentTournament(),
        selectedTournamentId,
        setSelectedTournament,
        rerender,
        setMessage,
        setDirty,
        replaceState(nextState) {
          state = nextState;
          setDirty(false);
        },
      });
    }

    loginForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      state = window.AppData?.enabled() ? await window.AppData.bootstrap() : TournamentStore.loadState();
      if (!TournamentStore.validateAdminCode(state, adminCodeInput.value)) {
        adminUnlocked = false;
        saveAdminSession(false);
        setMessage("That admin code is not correct.");
        await rerender(false);
        return;
      }

      adminUnlocked = true;
      saveAdminSession(true);
      setMessage("Admin controls unlocked.");
      await rerender(false);
    });

    adminSignoutButton?.addEventListener("click", async () => {
      adminUnlocked = false;
      saveAdminSession(false);
      if (adminCodeInput) {
        adminCodeInput.value = "";
      }
      setMessage("Admin signed out on this device.");
      await rerender(false);
    });

    selectedTournamentSelect?.addEventListener("change", () => {
      setSelectedTournament(selectedTournamentSelect.value);
      setMessage("Switched editing tournament.");
    });

    document.querySelectorAll(".admin-subnav a, .admin-section-switcher a").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (confirmDiscardChanges()) {
          return;
        }
        event.preventDefault();
      });
    });

    window.addEventListener("beforeunload", (event) => {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    });

    window.addEventListener("storage", () => {
      adminUnlocked = window.localStorage.getItem(ADMIN_SESSION_KEY) === "unlocked";
      state = TournamentStore.loadState();
      selectedTournamentId = getSelectedTournamentId(state);
      rerender(false);
    });

    window.AppData?.subscribe(async () => {
      state = await window.AppData.bootstrap();
      selectedTournamentId = getSelectedTournamentId(state);
      await rerender(false);
    });

    (async () => {
      if (window.AppData?.enabled()) {
        state = await window.AppData.bootstrap();
        selectedTournamentId = getSelectedTournamentId(state);
      }
      await rerender(false);
    })();
  }

  window.AdminCommon = {
    initAdminPage,
  };
})();
