AdminCommon.initAdminPage({
  renderContent({ state, tournament, selectedTournamentId, rerender, setMessage, replaceState }) {
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
      setMessage("Unsaved settings changes.");
    };
    courseNameInput.oninput = () => {
      draftSettings.courseName = courseNameInput.value;
      setMessage("Unsaved settings changes.");
    };
    courseTemplateSelect.onchange = () => {
      selectedCourseTemplateId = courseTemplateSelect.value;
      if (!selectedCourseTemplateId) {
        setMessage("Using the current tournament course.");
        return;
      }

      const selectedTemplate = courseTemplates.find((template) => template.id === selectedCourseTemplateId);
      if (!selectedTemplate) {
        return;
      }

      draftSettings.courseName = selectedTemplate.name;
      courseNameInput.value = selectedTemplate.name;
      setMessage("Selected saved course for this tournament.");
    };
    tournamentStatusInput.onchange = () => {
      draftSettings.status = tournamentStatusInput.value;
      setMessage("Unsaved settings changes.");
    };
    leaderboardDescriptionInput.oninput = () => {
      draftSettings.leaderboardDescription = leaderboardDescriptionInput.value;
      setMessage("Unsaved settings changes.");
    };

    setLiveButton.onclick = () => {
      const nextState = TournamentStore.setLeaderboardTournament(TournamentStore.loadState(), liveTournamentSelect.value);
      replaceState(nextState);
      setMessage("Updated live leaderboard tournament.");
      rerender(true);
    };

    saveButton.onclick = () => {
      let nextState = TournamentStore.loadState();

      if (selectedCourseTemplateId) {
        nextState = TournamentStore.applyCourseTemplate(nextState, selectedTournamentId, selectedCourseTemplateId);
      }

      nextState = TournamentStore.updateTournamentSettings(nextState, selectedTournamentId, draftSettings);
      replaceState(nextState);
      setMessage("Saved settings changes.");
      rerender(true);
    };

    clearScoresButton.onclick = () => {
      const confirmed = window.confirm(
        `Clear all scores for ${tournament?.tournamentName || "this tournament"}? Players and course settings will stay.`,
      );
      if (!confirmed) return;
      const nextState = TournamentStore.clearTournamentScores(TournamentStore.loadState(), selectedTournamentId);
      replaceState(nextState);
      setMessage("Cleared all scores for selected tournament.");
      rerender(true);
    };
  },
});
