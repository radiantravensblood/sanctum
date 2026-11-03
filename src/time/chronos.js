export function createInitialTime() {
  return {
    firstOpenedAt: null,
    previousOpenedAt: null,
    lastOpenedAt: null,
    currentSessionStartedAt: null,
    sessions: 0,
    lastTimezone: null
  };
}

export function mergeTime(base, saved = {}) {
  saved = saved || {};

  return {
    ...base,
    ...saved,
    sessions: Number(saved.sessions || base.sessions || 0)
  };
}

export function beginSession(state, now = new Date()) {
  if (!state.time) state.time = createInitialTime();

  const iso = now.toISOString();
  const previous = state.time.lastOpenedAt || null;

  if (!state.time.firstOpenedAt) {
    state.time.firstOpenedAt = iso;
  }

  state.time.previousOpenedAt = previous;
  state.time.lastOpenedAt = iso;
  state.time.currentSessionStartedAt = iso;
  state.time.sessions = Number(state.time.sessions || 0) + 1;
  state.time.lastTimezone = resolveTimezone();

  return {
    startedAt: iso,
    previousOpenedAt: previous,
    timezone: state.time.lastTimezone
  };
}

export function touchSession(state, now = new Date()) {
  if (!state.time) state.time = createInitialTime();
  state.time.lastOpenedAt = now.toISOString();
  state.time.lastTimezone = resolveTimezone();
}

export function getTemporalContext({
  state,
  world,
  roomId = state.location,
  now = new Date()
}) {
  const phase = resolveDayPhase(world.time, now);
  const season = resolveSeason(world.time, now);
  const timezone = resolveTimezone();
  const roomMemory =
    state.memory && state.memory.rooms
      ? state.memory.rooms[roomId] || null
      : null;

  return {
    version: 1,
    now: now.toISOString(),
    timezone,
    local: {
      date: formatLocalDate(now),
      time: formatLocalTime(now),
      weekday: new Intl.DateTimeFormat(undefined, {
        weekday: "long"
      }).format(now),
      dayPhase: phase.id,
      dayPhaseLabel: phase.label,
      season: season.id,
      seasonLabel: season.label
    },
    rhythm: {
      phase,
      season
    },
    session: {
      startedAt: state.time && state.time.currentSessionStartedAt,
      previousOpenedAt: state.time && state.time.previousOpenedAt,
      firstOpenedAt: state.time && state.time.firstOpenedAt,
      sessions: Number((state.time && state.time.sessions) || 0),
      absence: describeAbsence({
        from: state.time && state.time.previousOpenedAt,
        to: now,
        config: world.time.absence
      })
    },
    room: {
      firstRememberedAt: roomMemory && roomMemory.firstRememberedAt,
      lastRememberedAt: roomMemory && roomMemory.lastRememberedAt,
      sinceLastRemembered: roomMemory && roomMemory.lastRememberedAt
        ? durationBetween(new Date(roomMemory.lastRememberedAt), now)
        : null,
      sinceFirstRemembered: roomMemory && roomMemory.firstRememberedAt
        ? durationBetween(new Date(roomMemory.firstRememberedAt), now)
        : null
    }
  };
}

export function describeAbsence({ from, to = new Date(), config = {} }) {
  if (!from) {
    return {
      kind: "first_arrival",
      milliseconds: null,
      label: "This shard is opening for the first time."
    };
  }

  const start = new Date(from);
  if (Number.isNaN(start.getTime())) {
    return {
      kind: "unknown",
      milliseconds: null,
      label: "The interval since the last opening is unclear."
    };
  }

  const duration = durationBetween(start, to);
  const minutes = duration.minutes;
  const hours = duration.hours;
  const days = duration.days;

  if (minutes < Number(config.briefMinutes || 90)) {
    return {
      kind: "brief",
      milliseconds: duration.milliseconds,
      label: "The house was only briefly quiet."
    };
  }

  if (hours < Number(config.sameDayHours || 12)) {
    return {
      kind: "same_day",
      milliseconds: duration.milliseconds,
      label: "The house has been quiet for a few hours."
    };
  }

  if (days < Number(config.recentDays || 3)) {
    return {
      kind: "recent",
      milliseconds: duration.milliseconds,
      label: "The house has been quiet since recently."
    };
  }

  if (days < Number(config.longDays || 21)) {
    return {
      kind: "days",
      milliseconds: duration.milliseconds,
      label: "Some days have passed outside these rooms."
    };
  }

  return {
    kind: "long",
    milliseconds: duration.milliseconds,
    label: "A longer season of absence has passed. The world does not resent it."
  };
}

export function durationBetween(from, to = new Date()) {
  const start = from instanceof Date ? from : new Date(from);
  const end = to instanceof Date ? to : new Date(to);
  const milliseconds = Math.max(0, end.getTime() - start.getTime());

  return {
    milliseconds,
    minutes: milliseconds / 60000,
    hours: milliseconds / 3600000,
    days: milliseconds / 86400000
  };
}

function resolveDayPhase(config, now) {
  const hour = now.getHours();
  const phases = (config && config.dayPhases) || [];

  return (
    phases.find(
      (phase) => hour >= phase.startHour && hour < phase.endHour
    ) ||
    phases[0] || {
      id: "unknown",
      label: "unknown hour",
      tint: "#000000",
      strength: 0,
      light: 1
    }
  );
}

function resolveSeason(config, now) {
  const month = now.getMonth() + 1;
  const seasons = (config && config.seasons) || {};

  const entry = Object.entries(seasons).find(([, season]) =>
    (season.months || []).includes(month)
  );

  if (!entry) {
    return {
      id: "unseasoned",
      label: "unseasoned",
      tint: "#000000",
      strength: 0
    };
  }

  return {
    id: entry[0],
    ...entry[1]
  };
}

function resolveTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "local";
  } catch {
    return "local";
  }
}

function formatLocalDate(now) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(now);
}

function formatLocalTime(now) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(now);
}
