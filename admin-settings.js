AdminCommon.initAdminPage({
  renderContent({ tournament, selectedTournamentId, rerender, setMessage, replaceState }) {
    const tournamentNameInput = document.getElementById("tournament-name-input");
    const courseNameInput = document.getElementById("course-name-input");
    const tournamentStatusInput = document.getElementById("tournament-status-input");
    const leaderboardDescriptionInput = document.getElementById("leaderboard-description-input");
    const clearScoresButton = document.getElementById("clear-scores-button");
    const saveButton = document.getElementById("save-button");

    let draftSettings = {
      tournamentName: tournament?.tournamentName || "",
      courseName: tournament?.courseName || "",
      leaderboardDescription: tournament?.leaderboardDescription || "",
      status: tournament?.status || "upcoming",
    };

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
    tournamentStatusInput.onchange = () => {
      draftSettings.status = tournamentStatusInput.value;
      setMessage("Unsaved settings changes.");
    };
    leaderboardDescriptionInput.oninput = () => {
      draftSettings.leaderboardDescription = leaderboardDescriptionInput.value;
      setMessage("Unsaved settings changes.");
    };

    saveButton.onclick = () => {
      const nextState = TournamentStore.updateTournamentSettings(
        TournamentStore.loadState(),
        selectedTournamentId,
        draftSettings,
      );
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
