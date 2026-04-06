(() => {
  let client = null;
  let bootstrapping = null;
  let syncChannel = null;
  let isPersisting = false;
  let needsRefreshAfterPersist = false;
  let supportsHomeDescription = null;
  const subscribers = new Set();

  function hasConfig() {
    return Boolean(window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.publishableKey && window.supabase?.createClient);
  }

  function getClient() {
    if (!hasConfig()) {
      return null;
    }

    if (!client) {
      client = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.publishableKey,
      );
    }

    return client;
  }

  function sortByNumber(key) {
    return (left, right) => Number(left[key]) - Number(right[key]);
  }

  async function detectHomeDescriptionSupport() {
    if (supportsHomeDescription !== null) {
      return supportsHomeDescription;
    }

    const supabase = getClient();
    if (!supabase) {
      supportsHomeDescription = false;
      return supportsHomeDescription;
    }

    const result = await supabase.from("tournaments").select("id, home_description").limit(1);
    supportsHomeDescription = !result.error;
    return supportsHomeDescription;
  }

  function tournamentRowToState(row, related, fallbackHomeDescription) {
    const holes = related.holes
      .filter((hole) => hole.tournament_id === row.id)
      .sort(sortByNumber("hole_number"))
      .map((hole) => ({
        hole: hole.hole_number,
        par: hole.par,
        strokeIndex: hole.stroke_index,
        yardage: hole.yardage,
      }));

    const playerRows = related.players
      .filter((player) => player.tournament_id === row.id)
      .sort(sortByNumber("display_order"));

    const scoreRows = related.scores.filter((score) => score.tournament_id === row.id);
    const players = playerRows.map((player) => {
      const scores = new Array(18).fill(null);
      scoreRows
        .filter((score) => score.player_id === player.id)
        .forEach((score) => {
          scores[score.hole_number - 1] = score.strokes;
        });

      return {
        id: player.id,
        name: player.name,
        hometown: player.hometown || "",
        division: player.division || "Championship Flight",
        teeTime: player.tee_time || "",
        accessCode: player.access_code,
        handicap: player.handicap || 0,
        scores,
      };
    });

    const groups = related.groups
      .filter((group) => group.tournament_id === row.id)
      .sort(sortByNumber("display_order"))
      .map((group) => ({
        id: group.id,
        name: group.name,
        scorerCode: group.scorer_code,
        playerIds: related.groupPlayers
          .filter((entry) => entry.group_id === group.id)
          .sort(sortByNumber("slot_number"))
          .map((entry) => entry.player_id),
      }));

    const updates = related.updates
      .filter((update) => update.tournament_id === row.id)
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .map((update) => ({
        id: `remote-update-${update.id}`,
        playerId: update.player_id,
        hole: update.hole_number,
        strokes: update.strokes,
        timestamp: new Date(update.created_at).getTime(),
      }))
      .slice(0, 30);

    return {
      id: row.id,
      tournamentName: row.tournament_name,
      courseName: row.course_name,
      homeDescription: row.home_description || fallbackHomeDescription || row.leaderboard_description,
      leaderboardDescription: row.leaderboard_description,
      status: row.status,
      updatedAt: new Date(row.updated_at).getTime(),
      course: holes,
      players,
      groups,
      updates,
    };
  }

  function templateRowToState(row, holes) {
    return {
      id: row.id,
      name: row.name,
      course: holes
        .filter((hole) => hole.template_id === row.id)
        .sort(sortByNumber("hole_number"))
        .map((hole) => ({
          hole: hole.hole_number,
          par: hole.par,
          strokeIndex: hole.stroke_index,
          yardage: hole.yardage,
        })),
    };
  }

  async function loadRemoteState() {
    const supabase = getClient();
    if (!supabase) {
      return TournamentStore.loadState();
    }

    await detectHomeDescriptionSupport();
    const localState = TournamentStore.loadState();
    const localTournamentMap = new Map(
      (localState.tournaments || []).map((tournament) => [tournament.id, tournament]),
    );

    const [
      tournamentsResult,
      holesResult,
      playersResult,
      groupsResult,
      groupPlayersResult,
      scoresResult,
      updatesResult,
      templatesResult,
      templateHolesResult,
    ] = await Promise.all([
      supabase.from("tournaments").select("*").order("updated_at", { ascending: false }),
      supabase.from("tournament_holes").select("*"),
      supabase.from("players").select("*"),
      supabase.from("groups").select("*"),
      supabase.from("group_players").select("*"),
      supabase.from("scores").select("*"),
      supabase.from("score_updates").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("course_templates").select("*"),
      supabase.from("course_template_holes").select("*"),
    ]);

    const errors = [
      tournamentsResult.error,
      holesResult.error,
      playersResult.error,
      groupsResult.error,
      groupPlayersResult.error,
      scoresResult.error,
      updatesResult.error,
      templatesResult.error,
      templateHolesResult.error,
    ].filter(Boolean);

    if (errors.length) {
      throw errors[0];
    }

    if (!tournamentsResult.data?.length) {
      const localState = TournamentStore.loadState();
      await persistState(localState);
      return TournamentStore.loadState();
    }

    const related = {
      holes: holesResult.data || [],
      players: playersResult.data || [],
      groups: groupsResult.data || [],
      groupPlayers: groupPlayersResult.data || [],
      scores: scoresResult.data || [],
      updates: updatesResult.data || [],
    };

    const nextState = {
      adminCode: tournamentsResult.data[0]?.admin_code || "pga",
      leaderboardTournamentId:
        tournamentsResult.data.find((row) => row.is_live)?.id || tournamentsResult.data[0]?.id || null,
      courseTemplates: (templatesResult.data || []).map((row) =>
        templateRowToState(row, templateHolesResult.data || []),
      ),
      tournaments: tournamentsResult.data.map((row) =>
        tournamentRowToState(row, related, localTournamentMap.get(row.id)?.homeDescription),
      ),
    };

    TournamentStore.saveState(nextState);
    return nextState;
  }

  async function replaceTournamentChildren(supabase, tournament) {
    const deleteTournamentHoles = await supabase.from("tournament_holes").delete().eq("tournament_id", tournament.id);
    if (deleteTournamentHoles.error) throw deleteTournamentHoles.error;

    const deletePlayers = await supabase.from("players").delete().eq("tournament_id", tournament.id);
    if (deletePlayers.error) throw deletePlayers.error;

    const deleteGroups = await supabase.from("groups").delete().eq("tournament_id", tournament.id);
    if (deleteGroups.error) throw deleteGroups.error;

    const deleteScores = await supabase.from("scores").delete().eq("tournament_id", tournament.id);
    if (deleteScores.error) throw deleteScores.error;

    const deleteUpdates = await supabase.from("score_updates").delete().eq("tournament_id", tournament.id);
    if (deleteUpdates.error) throw deleteUpdates.error;

    const holeRows = tournament.course.map((hole) => ({
      tournament_id: tournament.id,
      hole_number: hole.hole,
      par: Number(hole.par),
      stroke_index: Number(hole.strokeIndex),
      yardage: Number(hole.yardage),
    }));

    if (holeRows.length) {
      const { error } = await supabase.from("tournament_holes").insert(holeRows);
      if (error) throw error;
    }

    const playerRows = tournament.players.map((player, index) => ({
      id: player.id,
      tournament_id: tournament.id,
      name: player.name,
      hometown: player.hometown || "",
      division: player.division || "Championship Flight",
      tee_time: player.teeTime || "",
      access_code: player.accessCode,
      handicap: Number(player.handicap) || 0,
      display_order: index,
    }));

    if (playerRows.length) {
      const { error } = await supabase.from("players").insert(playerRows);
      if (error) throw error;
    }

    const groupRows = tournament.groups.map((group, index) => ({
      id: group.id,
      tournament_id: tournament.id,
      name: group.name,
      scorer_code: group.scorerCode,
      display_order: index,
    }));

    if (groupRows.length) {
      const { error } = await supabase.from("groups").insert(groupRows);
      if (error) throw error;
    }

    const groupPlayerRows = tournament.groups.flatMap((group) =>
      group.playerIds.map((playerId, index) => ({
        group_id: group.id,
        player_id: playerId,
        slot_number: index + 1,
      })),
    );

    if (groupPlayerRows.length) {
      const { error } = await supabase.from("group_players").insert(groupPlayerRows);
      if (error) throw error;
    }

    const scoreRows = tournament.players.flatMap((player) =>
      player.scores
        .map((score, index) =>
          score === null || score === ""
            ? null
            : {
                tournament_id: tournament.id,
                player_id: player.id,
                hole_number: index + 1,
                strokes: Number(score),
                updated_at: new Date().toISOString(),
              },
        )
        .filter(Boolean),
    );

    if (scoreRows.length) {
      const { error } = await supabase.from("scores").insert(scoreRows);
      if (error) throw error;
    }

    const updateRows = (tournament.updates || []).slice(0, 30).map((update) => ({
      tournament_id: tournament.id,
      player_id: update.playerId,
      hole_number: update.hole,
      strokes: Number(update.strokes),
      created_at: new Date(update.timestamp || Date.now()).toISOString(),
    }));

    if (updateRows.length) {
      const { error } = await supabase.from("score_updates").insert(updateRows);
      if (error) throw error;
    }
  }

  async function persistState(state) {
    const supabase = getClient();
    if (!supabase) {
      return TournamentStore.saveState(state || TournamentStore.loadState());
    }

    isPersisting = true;
    needsRefreshAfterPersist = false;

    try {
      await detectHomeDescriptionSupport();
      const nextState = TournamentStore.saveState(state || TournamentStore.loadState());
      const existingTournaments = await supabase.from("tournaments").select("id");
      if (existingTournaments.error) {
        throw existingTournaments.error;
      }

      const nextTournamentIds = nextState.tournaments.map((tournament) => tournament.id);
      const staleTournamentIds = (existingTournaments.data || [])
        .map((row) => row.id)
        .filter((id) => !nextTournamentIds.includes(id));

      if (staleTournamentIds.length) {
        const { error } = await supabase.from("tournaments").delete().in("id", staleTournamentIds);
        if (error) throw error;
      }

      const tournamentRows = nextState.tournaments.map((tournament) => {
        const row = {
          id: tournament.id,
          tournament_name: tournament.tournamentName,
          course_name: tournament.courseName,
          leaderboard_description: tournament.leaderboardDescription,
          status: tournament.status,
          is_live: tournament.id === nextState.leaderboardTournamentId,
          admin_code: nextState.adminCode,
          updated_at: new Date().toISOString(),
        };
        if (supportsHomeDescription) {
          row.home_description = tournament.homeDescription || tournament.leaderboardDescription;
        }
        return row;
      });

      if (tournamentRows.length) {
        const { error } = await supabase.from("tournaments").upsert(tournamentRows);
        if (error) throw error;
      }

      for (const tournament of nextState.tournaments) {
        await replaceTournamentChildren(supabase, tournament);
      }

      const existingTemplates = await supabase.from("course_templates").select("id");
      if (existingTemplates.error) {
        throw existingTemplates.error;
      }

      const nextTemplateIds = nextState.courseTemplates.map((template) => template.id);
      const staleTemplateIds = (existingTemplates.data || [])
        .map((row) => row.id)
        .filter((id) => !nextTemplateIds.includes(id));

      if (staleTemplateIds.length) {
        const { error } = await supabase.from("course_templates").delete().in("id", staleTemplateIds);
        if (error) throw error;
      }

      if (nextState.courseTemplates.length) {
        const { error } = await supabase.from("course_templates").upsert(
          nextState.courseTemplates.map((template) => ({
            id: template.id,
            name: template.name,
            updated_at: new Date().toISOString(),
          })),
        );
        if (error) throw error;
      }

      const deleteTemplateHoles = await supabase.from("course_template_holes").delete().neq("hole_number", 0);
      if (deleteTemplateHoles.error) throw deleteTemplateHoles.error;
      const templateHoleRows = nextState.courseTemplates.flatMap((template) =>
        template.course.map((hole) => ({
          template_id: template.id,
          hole_number: hole.hole,
          par: Number(hole.par),
          stroke_index: Number(hole.strokeIndex),
          yardage: Number(hole.yardage),
        })),
      );
      if (templateHoleRows.length) {
        const { error } = await supabase.from("course_template_holes").insert(templateHoleRows);
        if (error) throw error;
      }

      const refreshedState = await loadRemoteState();
      notifySubscribers();
      return refreshedState;
    } finally {
      isPersisting = false;
      if (needsRefreshAfterPersist) {
        needsRefreshAfterPersist = false;
        const refreshedState = await loadRemoteState().catch(() => null);
        if (refreshedState) {
          notifySubscribers();
        }
      }
    }
  }

  async function clearTournamentScores(tournamentId) {
    const supabase = getClient();
    if (!supabase) {
      const nextState = TournamentStore.clearTournamentScores(TournamentStore.loadState(), tournamentId);
      TournamentStore.saveState(nextState);
      return nextState;
    }

    isPersisting = true;
    needsRefreshAfterPersist = false;

    try {
      const deleteScores = await supabase.from("scores").delete().eq("tournament_id", tournamentId);
      if (deleteScores.error) throw deleteScores.error;

      const deleteUpdates = await supabase.from("score_updates").delete().eq("tournament_id", tournamentId);
      if (deleteUpdates.error) throw deleteUpdates.error;

      const refreshedState = await loadRemoteState();
      notifySubscribers();
      return refreshedState;
    } finally {
      isPersisting = false;
      if (needsRefreshAfterPersist) {
        needsRefreshAfterPersist = false;
        const refreshedState = await loadRemoteState().catch(() => null);
        if (refreshedState) {
          notifySubscribers();
        }
      }
    }
  }

  async function postScores(tournamentId, entries) {
    const supabase = getClient();
    if (!supabase) {
      let nextState = TournamentStore.loadState();
      entries.forEach((entry) => {
        nextState = TournamentStore.updatePlayerScore(
          nextState,
          tournamentId,
          entry.playerId,
          entry.holeNumber,
          entry.strokes,
        );
      });
      TournamentStore.saveState(nextState);
      return nextState;
    }

    isPersisting = true;
    needsRefreshAfterPersist = false;

    try {
      const timestamp = new Date().toISOString();
      const scoreRows = entries.map((entry) => ({
        tournament_id: tournamentId,
        player_id: entry.playerId,
        hole_number: Number(entry.holeNumber),
        strokes: Number(entry.strokes),
        updated_at: timestamp,
      }));

      if (scoreRows.length) {
        const { error } = await supabase
          .from("scores")
          .upsert(scoreRows, { onConflict: "tournament_id,player_id,hole_number" });
        if (error) throw error;
      }

      const updateRows = entries.map((entry) => ({
        tournament_id: tournamentId,
        player_id: entry.playerId,
        hole_number: Number(entry.holeNumber),
        strokes: Number(entry.strokes),
        created_at: timestamp,
      }));

      if (updateRows.length) {
        const { error } = await supabase.from("score_updates").insert(updateRows);
        if (error) throw error;
      }

      const { error: tournamentError } = await supabase
        .from("tournaments")
        .update({ updated_at: timestamp })
        .eq("id", tournamentId);
      if (tournamentError) throw tournamentError;

      const refreshedState = await loadRemoteState();
      notifySubscribers();
      return refreshedState;
    } finally {
      isPersisting = false;
      if (needsRefreshAfterPersist) {
        needsRefreshAfterPersist = false;
        const refreshedState = await loadRemoteState().catch(() => null);
        if (refreshedState) {
          notifySubscribers();
        }
      }
    }
  }

  async function bootstrap() {
    if (bootstrapping) {
      return bootstrapping;
    }

    bootstrapping = loadRemoteState()
      .catch((error) => {
        console.error("Supabase bootstrap failed", error);
        return TournamentStore.loadState();
      })
      .finally(() => {
        bootstrapping = null;
      });

    return bootstrapping;
  }

  function notifySubscribers() {
    subscribers.forEach((callback) => callback());
  }

  function startRealtime() {
    const supabase = getClient();
    if (!supabase || syncChannel) {
      return;
    }

    syncChannel = supabase.channel("fairway-live-sync");
    [
      "tournaments",
      "players",
      "groups",
      "group_players",
      "tournament_holes",
      "scores",
      "score_updates",
      "course_templates",
      "course_template_holes",
    ].forEach((table) => {
      syncChannel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        async () => {
          if (isPersisting) {
            needsRefreshAfterPersist = true;
            return;
          }
          await bootstrap();
          notifySubscribers();
        },
      );
    });

    syncChannel.subscribe();
  }

  function subscribe(callback) {
    subscribers.add(callback);
    startRealtime();
    return () => subscribers.delete(callback);
  }

  window.AppData = {
    enabled: () => Boolean(getClient()),
    bootstrap,
    persistState,
    postScores,
    clearTournamentScores,
    subscribe,
  };
})();
