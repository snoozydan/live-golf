AdminCommon.initAdminPage({
  renderContent({ state, tournament, selectedTournamentId, rerender, setMessage, replaceState }) {
    const newPlayerNameInput = document.getElementById("new-player-name-input");
    const newPlayerCodeInput = document.getElementById("new-player-code-input");
    const newPlayerFlightInput = document.getElementById("new-player-flight-input");
    const addPlayerButton = document.getElementById("add-player-button");
    const saveButton = document.getElementById("save-button");
    const playerList = document.getElementById("admin-player-list");
    const sectionLabel = document.getElementById("players-section-label");

    let draftPlayers = tournament ? tournament.players.map((player) => ({ ...player, scores: [...player.scores] })) : [];
    sectionLabel.textContent = tournament ? `Players for ${tournament.tournamentName}` : "Players";

    function renderPlayers() {
      playerList.innerHTML = draftPlayers
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
                  <button type="button" class="danger-button" data-remove-player="${player.id}">Remove</button>
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
          if (!player) return;
          player.name = form.querySelector('input[name="name"]').value;
          player.accessCode = form.querySelector('input[name="accessCode"]').value.toUpperCase();
          player.division = form.querySelector('input[name="division"]').value;
          player.handicap = form.querySelector('input[name="handicap"]').value;
          setMessage("Unsaved player changes.");
        });
      });

      document.querySelectorAll("[data-remove-player]").forEach((button) => {
        button.addEventListener("click", () => {
          const playerId = button.getAttribute("data-remove-player");
          draftPlayers = draftPlayers.filter((player) => player.id !== playerId);
          renderPlayers();
          setMessage("Unsaved player changes.");
        });
      });
    }

    addPlayerButton.onclick = () => {
      const name = newPlayerNameInput.value.trim();
      const code = newPlayerCodeInput.value.trim().toUpperCase();
      const division = newPlayerFlightInput.value.trim() || "Championship Flight";
      if (!name || !code) {
        setMessage("New players need at least a name and code.");
        return;
      }
      draftPlayers.push({
        id: `draft-player-${Date.now()}`,
        name,
        hometown: "",
        division,
        teeTime: "",
        accessCode: code,
        handicap: 0,
        scores: new Array(18).fill(null),
      });
      newPlayerNameInput.value = "";
      newPlayerCodeInput.value = "";
      newPlayerFlightInput.value = "";
      renderPlayers();
      setMessage("Unsaved player changes.");
    };

    saveButton.onclick = async () => {
      const seenCodes = new Set();
      for (const player of draftPlayers) {
        const code = String(player.accessCode || "").trim().toUpperCase();
        if (!code || seenCodes.has(code)) {
          setMessage("Each player needs a unique code before saving.");
          return;
        }
        seenCodes.add(code);
      }

      let nextState = TournamentStore.loadState();
      const latestTournament = TournamentStore.getTournament(nextState, selectedTournamentId);
      const existingIds = new Set((latestTournament?.players || []).map((player) => player.id));
      const draftIds = new Set(draftPlayers.map((player) => player.id));

      draftPlayers.filter((player) => existingIds.has(player.id)).forEach((player) => {
        nextState = TournamentStore.updatePlayerDetails(nextState, selectedTournamentId, player.id, player);
        nextState = TournamentStore.updatePlayerHandicap(nextState, selectedTournamentId, player.id, player.handicap);
      });

      draftPlayers.filter((player) => !existingIds.has(player.id)).forEach((player) => {
        nextState = TournamentStore.addPlayer(nextState, selectedTournamentId, player);
      });

      (latestTournament?.players || []).filter((player) => !draftIds.has(player.id)).forEach((player) => {
        nextState = TournamentStore.removePlayer(nextState, selectedTournamentId, player.id);
      });

      if (window.AppData?.enabled()) {
        nextState = await window.AppData.persistState(nextState);
      }
      replaceState(nextState);
      setMessage("Saved player changes.");
      await rerender(true);
    };

    renderPlayers();
  },
});
