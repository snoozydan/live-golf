(function () {
  const STORAGE_KEY = "fairway-live-state-v3";

  function makeId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  function createCourse() {
    const pars = [4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4];
    const strokeIndexes = [11, 3, 17, 7, 13, 1, 9, 15, 5, 12, 2, 8, 18, 6, 14, 4, 16, 10];
    const yardages = [412, 528, 177, 403, 421, 544, 389, 186, 408, 417, 536, 401, 171, 410, 432, 552, 183, 426];

    return pars.map((par, index) => ({
      hole: index + 1,
      par,
      strokeIndex: strokeIndexes[index],
      yardage: yardages[index],
    }));
  }

  function createLivePlayers() {
    return [
      ["p1", "Avery Brooks", "San Diego, CA", "Championship Flight", "8:00 AM", "AB12", 8, [4, 5, 2, 4, 4, 5, 4, null, null, null, null, null, null, null, null, null, null, null]],
      ["p2", "Jordan Lee", "Scottsdale, AZ", "Championship Flight", "8:10 AM", "JL18", 12, [4, 4, 3, 4, 3, 5, 4, 3, null, null, null, null, null, null, null, null, null, null]],
      ["p3", "Mika Patel", "Austin, TX", "Championship Flight", "8:20 AM", "MP07", 15, [5, 5, 3, 3, 4, 5, 4, 3, 4, null, null, null, null, null, null, null, null, null]],
      ["p4", "Riley Chen", "Seattle, WA", "Championship Flight", "8:30 AM", "RC22", 18, [4, 5, 3, 4, 4, 6, 4, null, null, null, null, null, null, null, null, null, null, null]],
      ["p5", "Taylor Morgan", "Boulder, CO", "Championship Flight", "8:40 AM", "TM31", 6, [3, 5, 3, 4, 4, 5, 4, 3, 4, 4, null, null, null, null, null, null, null, null]],
      ["p6", "Cameron Diaz", "Newport Beach, CA", "Championship Flight", "8:50 AM", "CD44", 10, [4, 5, 3, 4, 5, 5, null, null, null, null, null, null, null, null, null, null, null, null]],
      ["p7", "Drew Foster", "Phoenix, AZ", "Championship Flight", "9:00 AM", "DF55", 14, [5, 5, 3, 4, 4, 6, 4, null, null, null, null, null, null, null, null, null, null, null]],
      ["p8", "Emerson Grant", "Portland, OR", "Championship Flight", "9:10 AM", "EG66", 7, [4, 5, 2, 4, 4, 5, 4, 3, null, null, null, null, null, null, null, null, null, null]],
      ["p9", "Finley Harper", "Denver, CO", "Championship Flight", "9:20 AM", "FH77", 16, [5, 6, 3, 4, 4, 5, 4, 3, 5, null, null, null, null, null, null, null, null, null]],
      ["p10", "Graydon Irving", "Dallas, TX", "Championship Flight", "9:30 AM", "GI88", 11, [4, 5, 3, 5, 4, 5, 4, null, null, null, null, null, null, null, null, null, null, null]],
      ["p11", "Hayden James", "Las Vegas, NV", "Championship Flight", "9:40 AM", "HJ99", 9, [4, 4, 3, 4, 4, 5, 4, 3, 4, null, null, null, null, null, null, null, null, null]],
      ["p12", "Indie Keller", "Boise, ID", "Championship Flight", "9:50 AM", "IK10", 18, [5, 5, 4, 4, 5, 6, 4, 4, null, null, null, null, null, null, null, null, null, null]],
      ["p13", "Jules Larson", "Salt Lake City, UT", "Championship Flight", "10:00 AM", "JL21", 13, [4, 5, 3, 4, 4, 5, 5, 3, 4, 4, null, null, null, null, null, null, null, null]],
      ["p14", "Kai Monroe", "Sacramento, CA", "Championship Flight", "10:10 AM", "KM32", 5, [3, 5, 3, 4, 4, 5, 4, 3, 4, null, null, null, null, null, null, null, null, null]],
      ["p15", "Logan Nash", "Tucson, AZ", "Championship Flight", "10:20 AM", "LN43", 17, [5, 5, 3, 5, 4, 6, 4, 3, null, null, null, null, null, null, null, null, null, null]],
      ["p16", "Morgan Owens", "Reno, NV", "Championship Flight", "10:30 AM", "MO54", 20, [5, 6, 3, 4, 5, 6, 4, 4, 5, null, null, null, null, null, null, null, null, null]],
    ].map(([id, name, hometown, division, teeTime, accessCode, handicap, scores]) => ({
      id,
      name,
      hometown,
      division,
      teeTime,
      accessCode,
      handicap,
      scores,
    }));
  }

  function createCompletedPlayers() {
    return [
      ["cp1", "Avery Brooks", "San Diego, CA", "Championship Flight", "8:00 AM", "AB12", 8, [4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4]],
      ["cp2", "Jordan Lee", "Scottsdale, AZ", "Championship Flight", "8:10 AM", "JL18", 12, [4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 5, 4, 3, 5, 4, 5, 3, 4]],
      ["cp3", "Mika Patel", "Austin, TX", "Championship Flight", "8:20 AM", "MP07", 15, [5, 5, 3, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4]],
      ["cp4", "Riley Chen", "Seattle, WA", "Championship Flight", "8:30 AM", "RC22", 18, [4, 5, 3, 4, 4, 6, 4, 3, 4, 4, 6, 4, 3, 4, 4, 5, 3, 5]],
      ["cp5", "Taylor Morgan", "Boulder, CO", "Championship Flight", "8:40 AM", "TM31", 6, [3, 5, 3, 4, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4]],
      ["cp6", "Cameron Diaz", "Newport Beach, CA", "Championship Flight", "8:50 AM", "CD44", 10, [4, 5, 3, 4, 5, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4]],
      ["cp7", "Drew Foster", "Phoenix, AZ", "Championship Flight", "9:00 AM", "DF55", 14, [5, 5, 3, 4, 4, 6, 4, 3, 4, 5, 5, 4, 3, 4, 4, 5, 3, 4]],
      ["cp8", "Emerson Grant", "Portland, OR", "Championship Flight", "9:10 AM", "EG66", 7, [4, 5, 2, 4, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4]],
    ].map(([id, name, hometown, division, teeTime, accessCode, handicap, scores]) => ({
      id,
      name,
      hometown,
      division,
      teeTime,
      accessCode,
      handicap,
      scores,
    }));
  }

  function createUpdates() {
    return [
      { id: "u1", playerId: "p5", hole: 10, strokes: 4, timestamp: Date.now() - 1000 * 60 * 5 },
      { id: "u2", playerId: "p3", hole: 9, strokes: 4, timestamp: Date.now() - 1000 * 60 * 10 },
      { id: "u3", playerId: "p2", hole: 8, strokes: 3, timestamp: Date.now() - 1000 * 60 * 16 },
    ];
  }

  function createTournament(overrides) {
    return {
      id: overrides.id || makeId("tournament"),
      tournamentName: overrides.tournamentName || "New Tournament",
      courseName: overrides.courseName || "Course Name",
      leaderboardDescription:
        overrides.leaderboardDescription ||
        "This page is built for display screens, staff tablets, or players who just want to follow the rankings as scores come in.",
      status: overrides.status || "live",
      updatedAt: overrides.updatedAt || Date.now(),
      course: overrides.course || createCourse(),
      players: overrides.players || [],
      updates: overrides.updates || [],
    };
  }

  function createDefaultState() {
    const liveTournament = createTournament({
      id: "spring-invitational-live",
      tournamentName: "Spring Invitational",
      courseName: "North Course",
      status: "live",
      players: createLivePlayers(),
      updates: createUpdates(),
    });

    const completedTournament = createTournament({
      id: "winter-classic-results",
      tournamentName: "Winter Classic",
      courseName: "Lakeside Course",
      status: "completed",
      leaderboardDescription: "Final results from a completed tournament.",
      players: createCompletedPlayers(),
      updates: [],
    });

    return {
      adminCode: "pga",
      leaderboardTournamentId: liveTournament.id,
      tournaments: [liveTournament, completedTournament],
    };
  }

  function normalizeCourse(course, fallbackCourse) {
    return fallbackCourse.map((fallbackHole, index) => {
      const hole = course[index] || fallbackHole;
      return {
        hole: index + 1,
        par: Number(hole.par) || fallbackHole.par,
        strokeIndex: Number(hole.strokeIndex) || fallbackHole.strokeIndex,
        yardage: Number(hole.yardage) || fallbackHole.yardage,
      };
    });
  }

  function normalizePlayers(players, fallbackPlayers) {
    return players.map((player, index) => {
      const fallback = fallbackPlayers[index] || fallbackPlayers[0] || {
        id: makeId("player"),
        name: "Player",
        hometown: "",
        division: "Championship Flight",
        teeTime: "8:00 AM",
        accessCode: `P${index + 1}`,
        handicap: 0,
        scores: new Array(18).fill(null),
      };

      const scores = Array.isArray(player.scores) ? player.scores.slice(0, 18) : fallback.scores.slice();
      while (scores.length < 18) {
        scores.push(null);
      }

      return {
        id: player.id || fallback.id,
        name: player.name || fallback.name,
        hometown: player.hometown || fallback.hometown,
        division: player.division || fallback.division,
        teeTime: player.teeTime || fallback.teeTime,
        accessCode: String(player.accessCode || fallback.accessCode).toUpperCase(),
        handicap: Math.max(0, Number(player.handicap) || 0),
        scores: scores.map((score) => (score === null || score === "" ? null : Number(score))),
      };
    });
  }

  function normalizeTournament(tournament, fallbackTournament) {
    const fallback = fallbackTournament || createTournament({});
    return {
      id: tournament.id || fallback.id,
      tournamentName: tournament.tournamentName || fallback.tournamentName,
      courseName: tournament.courseName || fallback.courseName,
      leaderboardDescription: tournament.leaderboardDescription || fallback.leaderboardDescription,
      status: tournament.status || fallback.status,
      updatedAt: tournament.updatedAt || Date.now(),
      course: normalizeCourse(Array.isArray(tournament.course) ? tournament.course : fallback.course, fallback.course),
      players: normalizePlayers(Array.isArray(tournament.players) ? tournament.players : fallback.players, fallback.players),
      updates: Array.isArray(tournament.updates) ? tournament.updates : fallback.updates,
    };
  }

  function migrateLegacyState(legacy) {
    const defaults = createDefaultState();
    const wrapped = createTournament({
      id: "legacy-tournament",
      tournamentName: legacy.tournamentName || "Imported Tournament",
      courseName: legacy.courseName || "Course Name",
      leaderboardDescription: legacy.leaderboardDescription,
      status: "live",
      course: Array.isArray(legacy.course) ? legacy.course : createCourse(),
      players: Array.isArray(legacy.players) ? legacy.players : [],
      updates: Array.isArray(legacy.updates) ? legacy.updates : [],
    });

    return {
      adminCode: legacy.adminCode || defaults.adminCode,
      leaderboardTournamentId: wrapped.id,
      tournaments: [normalizeTournament(wrapped, defaults.tournaments[0]), defaults.tournaments[1]],
    };
  }

  function normalizeState(state) {
    const defaults = createDefaultState();

    if (!state || !Array.isArray(state.tournaments)) {
      return migrateLegacyState(state || {});
    }

    const tournaments = state.tournaments.map((tournament, index) =>
      normalizeTournament(tournament, defaults.tournaments[index] || defaults.tournaments[0]),
    );

    const leaderboardTournamentId =
      tournaments.find((tournament) => tournament.id === state.leaderboardTournamentId)?.id ||
      tournaments.find((tournament) => tournament.status === "live")?.id ||
      tournaments[0]?.id ||
      null;

    return {
      adminCode: state.adminCode || defaults.adminCode,
      leaderboardTournamentId,
      tournaments,
    };
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return createDefaultState();
      }
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      return createDefaultState();
    }
  }

  function saveState(state) {
    const normalized = normalizeState(state);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function resetState() {
    return saveState(createDefaultState());
  }

  function getTournament(state, tournamentId) {
    return state.tournaments.find((tournament) => tournament.id === tournamentId) || null;
  }

  function getLiveTournament(state) {
    return getTournament(state, state.leaderboardTournamentId) || state.tournaments[0] || null;
  }

  function listTournaments(state) {
    return state.tournaments.slice();
  }

  function strokesOnHole(handicap, strokeIndex) {
    if (handicap <= 0) {
      return 0;
    }

    const base = Math.floor(handicap / 18);
    const remainder = handicap % 18;
    return base + (strokeIndex <= remainder ? 1 : 0);
  }

  function strokeAllocation(handicap, course) {
    return course.map((hole) => ({
      hole: hole.hole,
      par: hole.par,
      strokeIndex: hole.strokeIndex,
      strokes: strokesOnHole(handicap, hole.strokeIndex),
    }));
  }

  function computePlayer(player, course) {
    const allocation = strokeAllocation(player.handicap, course);
    let completed = 0;
    let gross = 0;
    let parPlayed = 0;
    let received = 0;

    player.scores.forEach((score, index) => {
      if (score === null || score === undefined || score === "") {
        return;
      }

      completed += 1;
      gross += Number(score);
      parPlayed += course[index].par;
      received += allocation[index].strokes;
    });

    const net = gross - received;
    const grossToPar = gross - parPlayed;
    const netToPar = net - parPlayed;

    return {
      ...player,
      allocation,
      completed,
      gross,
      net,
      parPlayed,
      grossToPar,
      netToPar,
      thru: completed === 18 ? "F" : completed === 0 ? "-" : completed,
    };
  }

  function rankedPlayers(tournament) {
    if (!tournament) {
      return [];
    }

    const computed = tournament.players.map((player) => computePlayer(player, tournament.course));
    computed.sort((left, right) => {
      if (left.netToPar !== right.netToPar) {
        return left.netToPar - right.netToPar;
      }
      if (left.grossToPar !== right.grossToPar) {
        return left.grossToPar - right.grossToPar;
      }
      if (left.completed !== right.completed) {
        return right.completed - left.completed;
      }
      return left.name.localeCompare(right.name);
    });

    let displayRank = 1;
    return computed.map((player, index) => {
      const previous = computed[index - 1];
      const tied =
        previous &&
        previous.netToPar === player.netToPar &&
        previous.grossToPar === player.grossToPar &&
        previous.completed === player.completed;

      if (!tied) {
        displayRank = index + 1;
      }

      const next = computed[index + 1];
      const shared =
        tied ||
        (next &&
          next.netToPar === player.netToPar &&
          next.grossToPar === player.grossToPar &&
          next.completed === player.completed);

      return {
        ...player,
        rank: shared ? `T${displayRank}` : `${displayRank}`,
      };
    });
  }

  function updateTournament(state, tournamentId, updater) {
    const nextState = normalizeState(state);
    nextState.tournaments = nextState.tournaments.map((tournament) => {
      if (tournament.id !== tournamentId) {
        return tournament;
      }

      return normalizeTournament(
        {
          ...updater(tournament),
          updatedAt: Date.now(),
        },
        tournament,
      );
    });
    return saveState(nextState);
  }

  function updatePlayerScore(state, tournamentId, playerId, holeNumber, strokes) {
    return updateTournament(state, tournamentId, (tournament) => {
      const nextTournament = {
        ...tournament,
        players: tournament.players.map((player) => {
          if (player.id !== playerId) {
            return player;
          }
          const scores = [...player.scores];
          scores[holeNumber - 1] = Number(strokes);
          return { ...player, scores };
        }),
        updates: [
          {
            id: makeId("update"),
            playerId,
            hole: holeNumber,
            strokes: Number(strokes),
            timestamp: Date.now(),
          },
          ...tournament.updates,
        ].slice(0, 30),
      };
      return nextTournament;
    });
  }

  function updatePlayerHandicap(state, tournamentId, playerId, handicap) {
    return updateTournament(state, tournamentId, (tournament) => ({
      ...tournament,
      players: tournament.players.map((player) =>
        player.id === playerId ? { ...player, handicap: Math.max(0, Number(handicap) || 0) } : player,
      ),
    }));
  }

  function updatePlayerDetails(state, tournamentId, playerId, changes) {
    const nextState = normalizeState(state);
    const tournament = getTournament(nextState, tournamentId);
    if (!tournament) {
      return nextState;
    }

    const normalizedCode = String(changes.accessCode || "").trim().toUpperCase();
    const codeTaken =
      normalizedCode &&
      tournament.players.some((player) => player.id !== playerId && player.accessCode === normalizedCode);

    return updateTournament(nextState, tournamentId, (currentTournament) => ({
      ...currentTournament,
      players: currentTournament.players.map((player) => {
        if (player.id !== playerId) {
          return player;
        }

        return {
          ...player,
          name: String(changes.name || "").trim() || player.name,
          division: String(changes.division || "").trim() || player.division,
          accessCode: codeTaken ? player.accessCode : normalizedCode || player.accessCode,
        };
      }),
    }));
  }

  function updateTournamentSettings(state, tournamentId, changes) {
    return updateTournament(state, tournamentId, (tournament) => ({
      ...tournament,
      tournamentName: String(changes.tournamentName || "").trim() || tournament.tournamentName,
      courseName: String(changes.courseName || "").trim() || tournament.courseName,
      leaderboardDescription:
        String(changes.leaderboardDescription || "").trim() || tournament.leaderboardDescription,
      status: String(changes.status || "").trim() || tournament.status,
    }));
  }

  function updateHole(state, tournamentId, holeNumber, changes) {
    return updateTournament(state, tournamentId, (tournament) => ({
      ...tournament,
      course: tournament.course.map((hole) =>
        hole.hole === holeNumber
          ? {
              ...hole,
              par: Math.max(3, Number(changes.par) || hole.par),
              strokeIndex: Math.min(18, Math.max(1, Number(changes.strokeIndex) || hole.strokeIndex)),
              yardage: Math.max(1, Number(changes.yardage) || hole.yardage),
            }
          : hole,
      ),
    }));
  }

  function createTournamentFromAdmin(state, details) {
    const nextState = normalizeState(state);
    const sourceTournament = getTournament(nextState, details.copyFromTournamentId || nextState.leaderboardTournamentId);
    const tournament = createTournament({
      tournamentName: String(details.tournamentName || "").trim() || "New Tournament",
      courseName: String(details.courseName || "").trim() || sourceTournament?.courseName || "Course Name",
      leaderboardDescription:
        String(details.leaderboardDescription || "").trim() ||
        sourceTournament?.leaderboardDescription ||
        "This page is built for display screens, staff tablets, or players who just want to follow the rankings as scores come in.",
      status: details.status || "upcoming",
      course: sourceTournament ? sourceTournament.course.map((hole) => ({ ...hole })) : createCourse(),
      players: sourceTournament
        ? sourceTournament.players.map((player, index) => ({
            ...player,
            id: makeId(`player${index + 1}`),
            scores: new Array(18).fill(null),
          }))
        : [],
      updates: [],
    });

    nextState.tournaments = [...nextState.tournaments, tournament];
    if (!nextState.leaderboardTournamentId) {
      nextState.leaderboardTournamentId = tournament.id;
    }
    return saveState(nextState);
  }

  function duplicateTournament(state, tournamentId, details) {
    const nextState = normalizeState(state);
    const source = getTournament(nextState, tournamentId);
    if (!source) {
      return nextState;
    }

    const duplicate = createTournament({
      tournamentName: String(details.tournamentName || "").trim() || `${source.tournamentName} Copy`,
      courseName: String(details.courseName || "").trim() || source.courseName,
      leaderboardDescription: source.leaderboardDescription,
      status: details.status || "upcoming",
      course: source.course.map((hole) => ({ ...hole })),
      players: source.players.map((player, index) => ({
        ...player,
        id: makeId(`player${index + 1}`),
        scores: new Array(18).fill(null),
      })),
      updates: [],
    });

    nextState.tournaments = [...nextState.tournaments, duplicate];
    return saveState(nextState);
  }

  function addPlayer(state, tournamentId, details) {
    return updateTournament(state, tournamentId, (tournament) => {
      const nextIndex = tournament.players.length + 1;
      const player = {
        id: makeId("player"),
        name: String(details.name || "").trim() || `Player ${nextIndex}`,
        hometown: String(details.hometown || "").trim() || "",
        division: String(details.division || "").trim() || "Championship Flight",
        teeTime: String(details.teeTime || "").trim() || "",
        accessCode: String(details.accessCode || "").trim().toUpperCase() || `P${nextIndex}`,
        handicap: Math.max(0, Number(details.handicap) || 0),
        scores: new Array(18).fill(null),
      };

      const codeTaken = tournament.players.some((entry) => entry.accessCode === player.accessCode);
      if (codeTaken) {
        player.accessCode = `${player.accessCode}${nextIndex}`.slice(0, 8);
      }

      return {
        ...tournament,
        players: [...tournament.players, player],
      };
    });
  }

  function removePlayer(state, tournamentId, playerId) {
    return updateTournament(state, tournamentId, (tournament) => ({
      ...tournament,
      players: tournament.players.filter((player) => player.id !== playerId),
      updates: tournament.updates.filter((update) => update.playerId !== playerId),
    }));
  }

  function clearTournamentScores(state, tournamentId) {
    return updateTournament(state, tournamentId, (tournament) => ({
      ...tournament,
      players: tournament.players.map((player) => ({
        ...player,
        scores: new Array(18).fill(null),
      })),
      updates: [],
    }));
  }

  function setLeaderboardTournament(state, tournamentId) {
    const nextState = normalizeState(state);
    if (!getTournament(nextState, tournamentId)) {
      return nextState;
    }
    nextState.leaderboardTournamentId = tournamentId;
    nextState.tournaments = nextState.tournaments.map((tournament) =>
      tournament.id === tournamentId ? { ...tournament, status: "live" } : tournament,
    );
    return saveState(nextState);
  }

  function deleteTournament(state, tournamentId) {
    const nextState = normalizeState(state);
    const remaining = nextState.tournaments.filter((tournament) => tournament.id !== tournamentId);

    if (!remaining.length) {
      return nextState;
    }

    nextState.tournaments = remaining;

    if (nextState.leaderboardTournamentId === tournamentId) {
      nextState.leaderboardTournamentId =
        remaining.find((tournament) => tournament.status === "live")?.id || remaining[0].id;
    }

    return saveState(nextState);
  }

  function findPlayerByCode(tournament, code) {
    const cleaned = String(code || "").trim().toUpperCase();
    return tournament?.players.find((player) => player.accessCode === cleaned) || null;
  }

  function validateAdminCode(state, code) {
    return String(code || "").trim() === String(state.adminCode || "");
  }

  function totalPostedScores(tournament) {
    if (!tournament) {
      return 0;
    }

    return tournament.players.reduce(
      (sum, player) => sum + player.scores.filter((score) => score !== null && score !== "").length,
      0,
    );
  }

  function resultsTournaments(state) {
    return state.tournaments.filter((tournament) => tournament.status === "completed");
  }

  window.TournamentStore = {
    loadState,
    saveState,
    resetState,
    listTournaments,
    getTournament,
    getLiveTournament,
    resultsTournaments,
    rankedPlayers,
    computePlayer,
    updatePlayerScore,
    updatePlayerHandicap,
    updatePlayerDetails,
    updateTournamentSettings,
    updateHole,
    createTournamentFromAdmin,
    duplicateTournament,
    addPlayer,
    removePlayer,
    clearTournamentScores,
    setLeaderboardTournament,
    deleteTournament,
    findPlayerByCode,
    validateAdminCode,
    totalPostedScores,
  };
})();
