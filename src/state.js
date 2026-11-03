import {
  createInitialMemory,
  mergeMemory,
  rebuildMemoryFromLedger,
  rememberEvent
} from "./memory/mnemosyne.js";
import { createInitialTime, mergeTime } from "./time/chronos.js";
import { createInitialEntityState, mergeEntityState } from "./entities/entities.js";

const STORAGE_KEY = "sanctum.kernel.v1";
const VERSION = 6;

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
      genesis: mergeGenesis(base.genesis, parsed.genesis),
      memory: mergeMemory(base.memory, parsed.memory),
      time: mergeTime(base.time, parsed.time),
      entities: mergeEntityState(base.entities, parsed.entities)
    };

    if (!parsed.memory || !Object.keys(parsed.memory.rooms || {}).length) {
      rebuildMemoryFromLedger(restored);
    }

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
  const state = {
    version: VERSION,
    location: "hearth",
    objectLocations: createInitialObjectLocations(world),
    thresholdStates: createInitialThresholdStates(world),
    thresholdTargets: {},
    visits: { hearth: 1 },
    ledger: [],
    genesis: createInitialGenesis(world),
    memory: createInitialMemory(),
    time: createInitialTime(),
    entities: createInitialEntityState(world)
  };

  appendEvent(state, {
    actor: "siege",
    action: "arrive",
    room: "hearth"
  });

  return state;
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
    resolutions: {},
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
    resolutions: {
      ...base.resolutions,
      ...(saved.resolutions || {})
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

  return {
    ...saved,
    version: VERSION,
    thresholdTargets: saved.thresholdTargets || {},
    memory: saved.memory || null,
    time: saved.time || null,
    entities: saved.entities || null,
    genesis: {
      ...createInitialGenesis(world),
      ...(saved.genesis || {}),
      resolutions:
        saved.genesis && saved.genesis.resolutions
          ? saved.genesis.resolutions
          : {}
    }
  };
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
    Object.values(world.thresholds).map((threshold) => [
      threshold.id,
      threshold.state
    ])
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
  const entry = {
    at: new Date().toISOString(),
    actor,
    ...rest
  };

  state.ledger.push(entry);
  rememberEvent(state, entry);

  if (state.ledger.length > 240) {
    state.ledger = state.ledger.slice(-240);
  }

  return entry;
}
