AdminCommon.initAdminPage({
  renderContent({ state, tournament, selectedTournamentId, rerender, setMessage, replaceState, setDirty }) {
    const tournamentNameInput = document.getElementById("tournament-name-input");
    const courseTemplateSelect = document.getElementById("course-template-select");
    const courseNameInput = document.getElementById("course-name-input");
    const tournamentStatusInput = document.getElementById("tournament-status-input");
    const leaderboardDescriptionInput = document.getElementById("leaderboard-description-input");
    const liveTournamentSelect = document.getElementById("live-tournament-select");
    const setLiveButton = document.getElementById("set-live-button");
    const clearScoresButton = document.getElementById("clear-scores-button");
    const saveButton = document.getElementById("save-button");

    const tournaments = TournamentStore.listTournaments(state);
    const courseTemplates = TournamentStore.listCourseTemplates(state);
    let selectedCourseTemplateId = "";
    let draftSettings = {
      tournamentName: tournament?.tournamentName || "",
      courseName: tournament?.courseName || "",
      leaderboardDescription: tournament?.leaderboardDescription || "",
      status: tournament?.status || "upcoming",
    };

    liveTournamentSelect.innerHTML = tournaments
      .map(
        (entry) => `<option value="${entry.id}">${entry.tournamentName} · ${entry.courseName} · ${entry.status}</option>`,
      )
      .join("");
    liveTournamentSelect.value = TournamentStore.getLiveTournament(state)?.id || "";

    courseTemplateSelect.innerHTML = [
      `<option value="">Current tournament course · ${tournament?.courseName || "Course"}</option>`,
      ...courseTemplates.map((template) => `<option value="${template.id}">${template.name}</option>`),
    ].join("");

    tournamentNameInput.value = draftSettings.tournamentName;
    courseNameInput.value = draftSettings.courseName;
    tournamentStatusInput.value = draftSettings.status;
    leaderboardDescriptionInput.value = draftSettings.leaderboardDescription;

    tournamentNameInput.oninput = () => {
      draftSettings.tournamentName = tournamentNameInput.value;
      setDirty(true);
      setMessage("Unsaved settings changes.");
    };
    courseNameInput.oninput = () => {
      draftSettings.courseName = courseNameInput.value;
      setDirty(true);
      setMessage("Unsaved settings changes.");
    };
    courseTemplateSelect.onchange = () => {
      selectedCourseTemplateId = courseTemplateSelect.value;
      if (!selectedCourseTemplateId) {
        setDirty(true);
        setMessage("Using the current tournament course.");
        return;
      }

      const selectedTemplate = courseTemplates.find((template) => template.id === selectedCourseTemplateId);
      if (!selectedTemplate) {
        return;
      }

      draftSettings.courseName = selectedTemplate.name;
      courseNameInput.value = selectedTemplate.name;
      setDirty(true);
      setMessage("Selected saved course for this tournament.");
    };
    tournamentStatusInput.onchange = () => {
      draftSettings.status = tournamentStatusInput.value;
      setDirty(true);
      setMessage("Unsaved settings changes.");
    };
    leaderboardDescriptionInput.oninput = () => {
      draftSettings.leaderboardDescription = leaderboardDescriptionInput.value;
      setDirty(true);
      setMessage("Unsaved settings changes.");
    };

    setLiveButton.onclick = async () => {
      let nextState = TournamentStore.setLeaderboardTournament(TournamentStore.loadState(), liveTournamentSelect.value);
      if (window.AppData?.enabled()) {
        nextState = await window.AppData.persistState(nextState);
      }
      replaceState(nextState);
      setMessage("Updated live leaderboard tournament.");
      await rerender(true);
    };

    saveButton.onclick = async () => {
      let nextState = TournamentStore.loadState();

      if (selectedCourseTemplateId) {
        nextState = TournamentStore.applyCourseTemplate(nextState, selectedTournamentId, selectedCourseTemplateId);
      }

      nextState = TournamentStore.updateTournamentSettings(nextState, selectedTournamentId, draftSettings);
      if (window.AppData?.enabled()) {
        nextState = await window.AppData.persistState(nextState);
      }
      replaceState(nextState);
      setMessage("Saved settings changes.");
      await rerender(true);
    };

    clearScoresButton.onclick = async () => {
      const confirmed = window.confirm(
        `Clear all scores for ${tournament?.tournamentName || "this tournament"}? Players and course settings will stay.`,
      );
      if (!confirmed) return;
      try {
        let nextState = TournamentStore.clearTournamentScores(TournamentStore.loadState(), selectedTournamentId);
        if (window.AppData?.enabled()) {
          nextState = await window.AppData.persistState(nextState);
        }
        replaceState(nextState);
        setDirty(false);
        setMessage("Cleared all scores for selected tournament.");
        await rerender(true);
      } catch (error) {
        console.error("Clear scores failed", error);
        setMessage("Could not clear scores for this tournament. Please try again.");
      }
    };
  },
});
