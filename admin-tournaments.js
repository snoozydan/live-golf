AdminCommon.initAdminPage({
  renderContent({ state, tournament, selectedTournamentId, rerender, setMessage, replaceState, setDirty }) {
    const liveTournamentSelect = document.getElementById("live-tournament-select");
    const newTournamentNameInput = document.getElementById("new-tournament-name-input");
    const newCourseNameInput = document.getElementById("new-course-name-input");
    const newTournamentCourseTemplateSelect = document.getElementById("new-tournament-course-template-select");
    const setLiveButton = document.getElementById("set-live-button");
    const createTournamentButton = document.getElementById("create-tournament-button");
    const duplicateTournamentButton = document.getElementById("duplicate-tournament-button");
    const deleteTournamentButton = document.getElementById("delete-tournament-button");

    const tournaments = TournamentStore.listTournaments(state);
    const liveTournament = TournamentStore.getLiveTournament(state);
    const courseTemplates = TournamentStore.listCourseTemplates(state);

    const tournamentOptions = tournaments
      .map((entry) => `<option value="${entry.id}">${entry.tournamentName} · ${entry.courseName} · ${entry.status}</option>`)
      .join("");
    liveTournamentSelect.innerHTML = tournamentOptions;
    liveTournamentSelect.value = liveTournament?.id || "";

    const courseOptions = courseTemplates.map((template) => `<option value="${template.id}">${template.name}</option>`).join("");
    newTournamentCourseTemplateSelect.innerHTML = `<option value="">Use selected tournament course</option>${courseOptions}`;

    setLiveButton.onclick = async () => {
      let nextState = TournamentStore.setLeaderboardTournament(state, liveTournamentSelect.value);
      if (window.AppData?.enabled()) {
        nextState = await window.AppData.persistState(nextState);
      }
      replaceState(nextState);
      setMessage("Updated live leaderboard tournament.");
      await rerender(true);
    };

    createTournamentButton.onclick = async () => {
      let nextState = TournamentStore.createTournamentFromAdmin(state, {
        tournamentName: newTournamentNameInput.value.trim() || "New Tournament",
        courseName: newCourseNameInput.value.trim() || tournament?.courseName || "Course Name",
        courseTemplateId: newTournamentCourseTemplateSelect.value || "",
        status: "upcoming",
        copyFromTournamentId: selectedTournamentId,
      });
      if (window.AppData?.enabled()) {
        nextState = await window.AppData.persistState(nextState);
      }
      replaceState(nextState);
      newTournamentNameInput.value = "";
      newCourseNameInput.value = "";
      newTournamentCourseTemplateSelect.value = "";
      setDirty(false);
      setMessage("Created new tournament.");
      await rerender(true);
    };

    duplicateTournamentButton.onclick = async () => {
      if (!selectedTournamentId) return;
      let nextState = TournamentStore.duplicateTournament(state, selectedTournamentId, {
        tournamentName: `${tournament?.tournamentName || "Tournament"} Copy`,
        courseName: tournament?.courseName || "Course Name",
        status: "upcoming",
      });
      if (window.AppData?.enabled()) {
        nextState = await window.AppData.persistState(nextState);
      }
      replaceState(nextState);
      setMessage("Duplicated tournament.");
      await rerender(true);
    };

    deleteTournamentButton.onclick = async () => {
      if (!selectedTournamentId) return;
      if (tournaments.length <= 1) {
        setMessage("At least one tournament must remain.");
        return;
      }
      const confirmed = window.confirm(`Delete ${tournament?.tournamentName || "this tournament"}?`);
      if (!confirmed) return;
      let nextState = TournamentStore.deleteTournament(state, selectedTournamentId);
      if (window.AppData?.enabled()) {
        nextState = await window.AppData.persistState(nextState);
      }
      replaceState(nextState);
      setMessage("Deleted tournament.");
      await rerender(true);
    };
  },
});
