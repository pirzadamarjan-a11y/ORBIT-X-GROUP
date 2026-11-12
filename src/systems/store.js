const STORAGE_KEY = 'orbitx:progress:v1';

const createInitialState = () => ({
  version: 1,
  missions: [],
  planets: [],
  quiz: {
    attempts: 0,
    bestPercent: 0,
    lastPercent: 0,
    history: [],
  },
  launches: {
    total: 0,
    successful: 0,
    last: null,
  },
  settings: {
    sound: false,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const mergeState = (stored) => {
  const base = createInitialState();
  if (!stored || typeof stored !== 'object') return base;
  return {
    ...base,
    ...stored,
    missions: Array.isArray(stored.missions) ? stored.missions.slice(0, 60) : [],
    planets: Array.isArray(stored.planets) ? [...new Set(stored.planets)] : [],
    quiz: {
      ...base.quiz,
      ...(stored.quiz && typeof stored.quiz === 'object' ? stored.quiz : {}),
      history: Array.isArray(stored.quiz?.history) ? stored.quiz.history.slice(0, 40) : [],
    },
    launches: {
      ...base.launches,
      ...(stored.launches && typeof stored.launches === 'object' ? stored.launches : {}),
    },
    settings: {
      ...base.settings,
      ...(stored.settings && typeof stored.settings === 'object' ? stored.settings : {}),
    },
  };
};

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? mergeState(JSON.parse(raw)) : createInitialState();
  } catch (error) {
    console.warn('[ORBIT X] Unable to read saved progress; starting a new archive.', error);
    return createInitialState();
  }
};

let state = loadState();
const listeners = new Set();

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[ORBIT X] Progress could not be saved to local storage.', error);
  }
};

const commit = (nextState) => {
  state = {
    ...nextState,
    updatedAt: new Date().toISOString(),
  };
  persist();
  listeners.forEach((listener) => {
    try {
      listener(store.getState());
    } catch (error) {
      console.error('[ORBIT X] Store listener failed.', error);
    }
  });
};

export const store = {
  getState() {
    return structuredClone(state);
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  recordMission(record) {
    const next = store.getState();
    next.missions.unshift(record);
    next.missions = next.missions.slice(0, 60);
    if (record.status === 'success' && record.destinationPlanetId) {
      next.planets = [...new Set([...next.planets, record.destinationPlanetId])];
    }
    commit(next);
    return next;
  },

  discoverPlanet(planetId) {
    if (!planetId || state.planets.includes(planetId)) return;
    const next = store.getState();
    next.planets = [...new Set([...next.planets, planetId])];
    commit(next);
  },

  recordQuiz({ difficulty, score, total }) {
    const next = store.getState();
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;
    next.quiz.attempts += 1;
    next.quiz.lastPercent = percent;
    next.quiz.bestPercent = Math.max(next.quiz.bestPercent, percent);
    next.quiz.history.unshift({
      id: `quiz-${Date.now()}`,
      difficulty,
      score,
      total,
      percent,
      timestamp: new Date().toISOString(),
    });
    next.quiz.history = next.quiz.history.slice(0, 40);
    commit(next);
    return next;
  },

  recordLaunch({ success, apogeeKm = 0 }) {
    const next = store.getState();
    next.launches.total += 1;
    if (success) next.launches.successful += 1;
    next.launches.last = {
      success,
      apogeeKm,
      timestamp: new Date().toISOString(),
    };
    commit(next);
    return next;
  },

  setSetting(key, value) {
    if (!(key in state.settings)) return;
    const next = store.getState();
    next.settings[key] = value;
    commit(next);
  },

  resetProgress() {
    commit(createInitialState());
  },
};

export const deriveStats = (snapshot) => {
  const missions = snapshot.missions ?? [];
  const successful = missions.filter((mission) => mission.status === 'success').length;
  const failed = missions.filter((mission) => mission.status !== 'success').length;
  const planets = snapshot.planets?.length ?? 0;
  const quizAttempted = (snapshot.quiz?.attempts ?? 0) > 0;
  const objectivesComplete = Math.min(5, successful);
  const goals = 5 + 8 + 1;
  const achieved = objectivesComplete + planets + (quizAttempted ? 1 : 0);

  return {
    totalMissions: missions.length,
    successful,
    failed,
    planetsDiscovered: planets,
    quizBest: snapshot.quiz?.bestPercent ?? 0,
    quizAttempts: snapshot.quiz?.attempts ?? 0,
    attemptRate: missions.length ? Math.round((successful / missions.length) * 100) : 0,
    programProgress: Math.round((achieved / goals) * 100),
    objectivesComplete,
  };
};

export const getMissionOutcome = (snapshot, missionId) => {
  const attempts = snapshot.missions.filter((mission) => mission.missionId === missionId);
  if (!attempts.length) return { status: 'available', attempts: 0 };
  if (attempts.some((mission) => mission.status === 'success')) {
    return { status: 'complete', attempts: attempts.length };
  }
  return { status: 'failed', attempts: attempts.length };
};

export const ORBITX_STORAGE_KEY = STORAGE_KEY;
