const STORAGE_KEY = "sanctum.kernel.v1";
const VERSION = 2;

export function loadState(world) {
  const base = createInitialState(world);

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return base;

    const parsed = migrateState(JSON.parse(saved), world);
    if (!parsed) return base;

    const restored = {
      ...base,
      ...parsed,
      objectLocations: {
        ...base.objectLocations,
        ...(parsed.objectLocations || {})
      },
      thresholdStates: {
        ...base.thresholdStates,
        ...(parsed.thresholdStates || {})
      },
      thresholdTargets: {
        ...base.thresholdTargets,
        ...(parsed.thresholdTargets || {})
      },
      visits: {
        ...base.visits,
        ...(parsed.visits || {})
      },
      ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
      genesis: mergeGenesis(base.genesis, parsed.genesis)
    };

    if (!getKnownRoom(restored, world, restored.location)) {
      restored.location = "hearth";
    }

    return restored;
  } catch (error) {
    console.warn("Sanctum state could not be restored.", error);
    return base;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createInitialState(world) {
  return {
    version: VERSION,
    location: "hearth",
    objectLocations: createInitialObjectLocations(world),
    thresholdStates: createInitialThresholdStates(world),
    thresholdTargets: {},
    visits: { hearth: 1 },
    ledger: [
      {
        at: new Date().toISOString(),
        actor: "siege",
        action: "arrive",
        room: "hearth"
      }
    ],
    genesis: createInitialGenesis(world)
  };
}

function createInitialGenesis(world) {
  return {
    worldSeed: world.genesis.worldSeed,
    counters: {},
    generated: {
      rooms: {},
      objects: {},
      thresholds: {}
    },
    provenance: {},
    witnessed: {},
    canonical: {}
  };
}

function mergeGenesis(base, saved = {}) {
  return {
    ...base,
    ...saved,
    counters: {
      ...base.counters,
      ...(saved.counters || {})
    },
    generated: {
      rooms: {
        ...base.generated.rooms,
        ...((saved.generated && saved.generated.rooms) || {})
      },
      objects: {
        ...base.generated.objects,
        ...((saved.generated && saved.generated.objects) || {})
      },
      thresholds: {
        ...base.generated.thresholds,
        ...((saved.generated && saved.generated.thresholds) || {})
      }
    },
    provenance: {
      ...base.provenance,
      ...(saved.provenance || {})
    },
    witnessed: {
      ...base.witnessed,
      ...(saved.witnessed || {})
    },
    canonical: {
      ...base.canonical,
      ...(saved.canonical || {})
    }
  };
}

function migrateState(saved, world) {
  if (!saved || typeof saved !== "object") return null;
  if (saved.version > VERSION) return null;

  if (saved.version === 1 || !saved.version) {
    return {
      ...saved,
      version: VERSION,
      thresholdTargets: saved.thresholdTargets || {},
      genesis: saved.genesis || createInitialGenesis(world)
    };
  }

  return saved;
}

function createInitialObjectLocations(world) {
  const locations = {};

  Object.values(world.rooms).forEach((room) => {
    (room.objects || []).forEach((objectId) => {
      locations[objectId] = room.id;
    });
  });

  return locations;
}

function createInitialThresholdStates(world) {
  return Object.fromEntries(
    Object.values(world.thresholds).map((threshold) => [threshold.id, threshold.state])
  );
}

function getKnownRoom(state, world, roomId) {
  return (
    world.rooms[roomId] ||
    (state.genesis.generated &&
      state.genesis.generated.rooms &&
      state.genesis.generated.rooms[roomId])
  );
}

export function appendEvent(state, event) {
  const { actor = "siege", ...rest } = event;

  state.ledger.push({
    at: new Date().toISOString(),
    actor,
    ...rest
  });

  if (state.ledger.length > 120) {
    state.ledger = state.ledger.slice(-120);
  }
}
