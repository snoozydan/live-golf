AdminCommon.initAdminPage({
  renderContent({ state, tournament, selectedTournamentId, getFreshState, runBusyAction, rerender, setMessage, replaceState, setDirty }) {
    const newPlayerNameInput = document.getElementById("new-player-name-input");
    const newPlayerCodeInput = document.getElementById("new-player-code-input");
    const newPlayerFlightInput = document.getElementById("new-player-flight-input");
    const playerCountInput = document.getElementById("player-count-input");
    const setPlayerCountButton = document.getElementById("set-player-count-button");
    const addPlayerButton = document.getElementById("add-player-button");
    const saveButton = document.getElementById("save-button");
    const playerList = document.getElementById("admin-player-list");
    const sectionLabel = document.getElementById("players-section-label");

    let draftPlayers = tournament ? tournament.players.map((player) => ({ ...player, scores: [...player.scores] })) : [];
    sectionLabel.textContent = tournament ? `Players for ${tournament.tournamentName}` : "Players";
    playerCountInput.value = `${draftPlayers.length}`;

    function makeBlankPlayer(index) {
      return {
        id: `draft-player-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`,
        name: `Player ${index}`,
        hometown: "",
        division: "Championship Flight",
        teeTime: "",
        accessCode: `P${index}`,
        handicap: 0,
        winnings: 0,
        scores: new Array(18).fill(null),
      };
    }

    function renderPlayers() {
      playerCountInput.value = `${draftPlayers.length}`;
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
              <form class="admin-controls admin-controls-seven" data-player-form="${player.id}">
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
                  Tee time
                  <input type="text" name="teeTime" value="${player.teeTime || ""}" placeholder="8:10 AM" />
                </label>
                <label>
                  Handicap
                  <input type="number" min="0" max="54" name="handicap" value="${player.handicap}" />
                </label>
                <label>
                  Winnings
                  <input type="number" min="0" step="0.01" name="winnings" value="${player.winnings || 0}" />
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
          player.teeTime = form.querySelector('input[name="teeTime"]').value;
          player.handicap = form.querySelector('input[name="handicap"]').value;
          player.winnings = form.querySelector('input[name="winnings"]').value;
          setDirty(true);
          setMessage("Unsaved player changes.");
        });
      });

      document.querySelectorAll("[data-remove-player]").forEach((button) => {
        button.addEventListener("click", () => {
          const playerId = button.getAttribute("data-remove-player");
          draftPlayers = draftPlayers.filter((player) => player.id !== playerId);
          renderPlayers();
          setDirty(true);
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
        winnings: 0,
        scores: new Array(18).fill(null),
      });
      newPlayerNameInput.value = "";
      newPlayerCodeInput.value = "";
      newPlayerFlightInput.value = "";
      renderPlayers();
      setDirty(true);
      setMessage("Unsaved player changes.");
    };

    setPlayerCountButton.onclick = () => {
      const requestedCount = Math.max(1, Math.min(144, Number(playerCountInput.value) || draftPlayers.length || 1));
      if (requestedCount === draftPlayers.length) {
        setMessage("Player count already matches this tournament.");
        return;
      }

      if (requestedCount > draftPlayers.length) {
        const nextPlayers = [...draftPlayers];
        for (let index = draftPlayers.length + 1; index <= requestedCount; index += 1) {
          nextPlayers.push(makeBlankPlayer(index));
        }
        draftPlayers = nextPlayers;
        renderPlayers();
        setDirty(true);
        setMessage("Added blank player rows for this tournament.");
        return;
      }

      const confirmed = window.confirm(
        `Reduce this tournament from ${draftPlayers.length} players to ${requestedCount}? The last ${draftPlayers.length - requestedCount} player rows will be removed.`,
      );

      if (!confirmed) {
        playerCountInput.value = `${draftPlayers.length}`;
        return;
      }

      draftPlayers = draftPlayers.slice(0, requestedCount);
      renderPlayers();
      setDirty(true);
      setMessage("Reduced the player list for this tournament.");
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

      await runBusyAction(saveButton, "Saving...", async () => {
        try {
          const baseState = await getFreshState();
          let nextState = TournamentStore.replaceTournamentPlayers(
            baseState,
            selectedTournamentId,
            draftPlayers,
          );

          if (window.AppData?.enabled()) {
            nextState = await window.AppData.persistState(nextState);
          }

          replaceState(nextState);
          setDirty(false);
          setMessage("Saved player changes.");
          await rerender(true);
        } catch (error) {
          console.error("Player save failed", error);
          setMessage("Could not save player changes. Please try again.");
        }
      });
    };

    renderPlayers();
  },
});
