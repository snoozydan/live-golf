AdminCommon.initAdminPage({
  renderContent({ tournament, selectedTournamentId, getFreshState, rerender, setMessage, replaceState, setDirty }) {
    const saveButton = document.getElementById("save-button");
    const addGroupButton = document.getElementById("add-group-button");
    const groupList = document.getElementById("admin-group-list");
    const players = tournament?.players || [];
    let draftGroups = tournament ? tournament.groups.map((group) => ({ ...group, playerIds: [...group.playerIds] })) : [];

    function createEmptyGroup(index) {
      return {
        id: `group-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`,
        name: `Group ${index}`,
        scorerCode: `GRP${index}`,
        playerIds: [],
      };
    }

    function ensureRequiredGroups() {
      const requiredCount = Math.max(1, Math.ceil(players.length / 4));
      if (draftGroups.length >= requiredCount) {
        return;
      }

      const nextGroups = [...draftGroups];
      for (let index = draftGroups.length + 1; index <= requiredCount; index += 1) {
        nextGroups.push(createEmptyGroup(index));
      }
      draftGroups = nextGroups;
    }

    function renderGroups() {
      ensureRequiredGroups();
      const playerOptions = players.map((player) => `<option value="${player.id}">${player.name}</option>`).join("");
      groupList.innerHTML = draftGroups
        .map((group, index) => {
          const slots = new Array(4).fill("").map((_, slotIndex) => group.playerIds[slotIndex] || "");
          return `
            <article class="admin-row">
              <div class="admin-row-header">
                <div>
                  <div class="player-name">${group.name || `Group ${index + 1}`}</div>
                  <div class="admin-meta">Scorer code ${group.scorerCode}</div>
                </div>
              </div>
              <form class="admin-group-form" data-group-form="${group.id}">
                <div class="admin-controls admin-controls-four">
                  <label>
                    Group name
                    <input type="text" name="name" value="${group.name}" />
                  </label>
                  <label>
                    Scorer code
                    <input type="text" maxlength="8" name="scorerCode" value="${group.scorerCode}" />
                  </label>
                  ${slots
                    .map(
                      (playerId, slotIndex) => `
                        <label>
                          Player ${slotIndex + 1}
                          <select name="player-${slotIndex}">
                            <option value="">Open slot</option>
                            ${playerOptions}
                          </select>
                        </label>
                      `,
                    )
                    .join("")}
                  <div class="button-stack">
                    <button type="button" class="danger-button" data-remove-group="${group.id}">Remove</button>
                  </div>
                </div>
              </form>
            </article>
          `;
        })
        .join("");

      document.querySelectorAll("[data-group-form]").forEach((form) => {
        const groupId = form.getAttribute("data-group-form");
        const group = draftGroups.find((entry) => entry.id === groupId);
        if (!group) return;
        for (let index = 0; index < 4; index += 1) {
          const select = form.querySelector(`select[name="player-${index}"]`);
          if (select) select.value = group.playerIds[index] || "";
        }
        form.addEventListener("input", () => {
          group.name = form.querySelector('input[name="name"]').value;
          group.scorerCode = form.querySelector('input[name="scorerCode"]').value.toUpperCase();
          group.playerIds = new Array(4)
            .fill("")
            .map((_, index) => form.querySelector(`select[name="player-${index}"]`).value)
            .filter(Boolean);
          setDirty(true);
          setMessage("Unsaved group changes.");
        });
      });

      document.querySelectorAll("[data-remove-group]").forEach((button) => {
        button.addEventListener("click", () => {
          const minimumGroupCount = Math.max(1, Math.ceil(players.length / 4));
          if (draftGroups.length <= minimumGroupCount) {
            setMessage(`This tournament needs at least ${minimumGroupCount} group${minimumGroupCount === 1 ? "" : "s"} for the current player count.`);
            return;
          }

          const groupId = button.getAttribute("data-remove-group");
          draftGroups = draftGroups.filter((group) => group.id !== groupId);
          renderGroups();
          setDirty(true);
          setMessage("Unsaved group changes.");
        });
      });
    }

    addGroupButton.onclick = () => {
      const nextIndex = draftGroups.length + 1;
      draftGroups = [...draftGroups, createEmptyGroup(nextIndex)];
      renderGroups();
      setDirty(true);
      setMessage("Added a new group.");
    };

    saveButton.onclick = async () => {
      ensureRequiredGroups();
      const seen = new Set();
      for (const group of draftGroups) {
        const code = String(group.scorerCode || "").trim().toUpperCase();
        if (!code || seen.has(code)) {
          setMessage("Each group needs a unique scorer code before saving.");
          return;
        }
        seen.add(code);
      }
      try {
        const baseState = await getFreshState();
        let nextState = TournamentStore.updateTournamentGroups(baseState, selectedTournamentId, draftGroups);
        if (window.AppData?.enabled()) {
          nextState = await window.AppData.persistState(nextState);
        }
        replaceState(nextState);
        setDirty(false);
        setMessage("Saved group changes.");
        await rerender(true);
      } catch (error) {
        console.error("Save group changes failed", error);
        setMessage("Could not save group changes. Please try again.");
      }
    };

    renderGroups();
  },
});
