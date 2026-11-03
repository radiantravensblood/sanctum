const ROOM_ECHO_LIMIT = 28;
const OBJECT_ECHO_LIMIT = 20;
const PATH_ECHO_LIMIT = 18;

export function createInitialMemory() {
  return {
    rooms: {},
    objects: {},
    paths: {},
    sequence: 0
  };
}

export function mergeMemory(base, saved = {}) {
  saved = saved || {};

  return {
    ...base,
    ...saved,
    rooms: {
      ...base.rooms,
      ...(saved.rooms || {})
    },
    objects: {
      ...base.objects,
      ...(saved.objects || {})
    },
    paths: {
      ...base.paths,
      ...(saved.paths || {})
    },
    sequence: Number(saved.sequence || base.sequence || 0)
  };
}

export function rebuildMemoryFromLedger(state) {
  state.memory = createInitialMemory();

  (state.ledger || []).forEach((event) => {
    rememberEvent(state, event);
  });

  backfillGeneratedObjectOrigins(state);
  return state.memory;
}

export function rememberEvent(state, event) {
  if (!state.memory) {
    state.memory = createInitialMemory();
  }

  const echo = {
    id: "echo." + String(++state.memory.sequence).padStart(6, "0"),
    at: event.at || new Date().toISOString(),
    actor: event.actor || "siege",
    action: event.action,
    room: event.room || null,
    from: event.from || null,
    to: event.to || null,
    object: event.object || null,
    threshold: event.threshold || null,
    realm: event.realm || null,
    motif: event.motif || null,
    topology: event.topology || null,
    entity: event.entity || null,
    otherEntity: event.otherEntity || null,
    reason: event.reason || null
  };

  roomKeysFor(echo).forEach((roomId) => {
    const memory = ensureRoomMemory(state, roomId, echo.at);
    memory.echoes.push(echo);
    trim(memory.echoes, ROOM_ECHO_LIMIT);

    if (echo.action === "arrive" || echo.action === "move" || echo.action === "return") {
      memory.arrivals += 1;
      memory.lastEnteredAt = echo.at;
    }

    if (echo.action === "sit") {
      memory.sittings += 1;
      memory.lastSatAt = echo.at;
    }

    if (echo.action === "leave" && echo.object) {
      memory.anchors[echo.object] = {
        object: echo.object,
        firstLeftAt: memory.anchors[echo.object]
          ? memory.anchors[echo.object].firstLeftAt
          : echo.at,
        lastLeftAt: echo.at
      };
    }

    if (echo.action === "take" && echo.object && memory.anchors[echo.object]) {
      memory.anchors[echo.object].lastTakenAt = echo.at;
    }
  });

  if (echo.object) {
    const objectMemory = ensureObjectMemory(state, echo.object);
    objectMemory.echoes.push(echo);
    trim(objectMemory.echoes, OBJECT_ECHO_LIMIT);

    const location = locationFromEcho(echo);
    if (location) {
      objectMemory.locations.push({
        at: echo.at,
        room: location,
        action: echo.action
      });
      trim(objectMemory.locations, OBJECT_ECHO_LIMIT);
    }

    if (!objectMemory.firstSeenAt) {
      objectMemory.firstSeenAt = echo.at;
    }
    objectMemory.lastSeenAt = echo.at;
  }

  if (echo.from && echo.to) {
    const pathKey = echo.from + "→" + echo.to;
    const path = state.memory.paths[pathKey] || {
      from: echo.from,
      to: echo.to,
      crossings: 0,
      echoes: []
    };

    path.crossings += 1;
    path.lastCrossedAt = echo.at;
    path.echoes.push(echo);
    trim(path.echoes, PATH_ECHO_LIMIT);
    state.memory.paths[pathKey] = path;
  }

  return echo;
}

export function getRoomMemory(state, roomId) {
  return (
    (state.memory && state.memory.rooms && state.memory.rooms[roomId]) || {
      room: roomId,
      echoes: [],
      anchors: {},
      arrivals: 0,
      sittings: 0,
      firstRememberedAt: null,
      lastRememberedAt: null
    }
  );
}

export function getObjectMemory(state, objectId) {
  return (
    (state.memory && state.memory.objects && state.memory.objects[objectId]) || {
      object: objectId,
      echoes: [],
      locations: [],
      firstSeenAt: null,
      lastSeenAt: null
    }
  );
}

export function getPathMemory(state, from, to) {
  const key = from + "→" + to;
  return (
    (state.memory && state.memory.paths && state.memory.paths[key]) || {
      from,
      to,
      crossings: 0,
      echoes: []
    }
  );
}

export function roomMemoryWeight(state, roomId) {
  const memory = getRoomMemory(state, roomId);
  const anchorCount = Object.values(memory.anchors || {}).filter(
    (anchor) => state.objectLocations[anchor.object] === roomId
  ).length;

  return Math.min(
    1,
    memory.echoes.length / 18 +
      memory.sittings * 0.045 +
      anchorCount * 0.08
  );
}

function backfillGeneratedObjectOrigins(state) {
  const objects =
    state.genesis &&
    state.genesis.generated &&
    state.genesis.generated.objects
      ? state.genesis.generated.objects
      : {};

  Object.keys(objects).forEach((objectId) => {
    const memory = getObjectMemory(state, objectId);
    const alreadyHasOrigin = (memory.echoes || []).some(
      (echo) => echo.action === "object_manifest"
    );
    if (alreadyHasOrigin) return;

    const marker = ".object.";
    const markerIndex = objectId.indexOf(marker);
    if (markerIndex === -1) return;

    const originRoom = objectId.slice(0, markerIndex);
    const provenance =
      state.genesis.provenance && state.genesis.provenance[objectId];

    rememberEvent(state, {
      at:
        (provenance && provenance.createdAt) ||
        new Date().toISOString(),
      actor: "genesis",
      action: "object_manifest",
      room: originRoom,
      object: objectId,
      realm: provenance && provenance.realm
    });
  });
}

function ensureRoomMemory(state, roomId, at) {
  if (!state.memory.rooms[roomId]) {
    state.memory.rooms[roomId] = {
      room: roomId,
      echoes: [],
      anchors: {},
      arrivals: 0,
      sittings: 0,
      firstRememberedAt: at || new Date().toISOString(),
      lastRememberedAt: null
    };
  }

  state.memory.rooms[roomId].lastRememberedAt = at || new Date().toISOString();
  return state.memory.rooms[roomId];
}

function ensureObjectMemory(state, objectId) {
  if (!state.memory.objects[objectId]) {
    state.memory.objects[objectId] = {
      object: objectId,
      echoes: [],
      locations: [],
      firstSeenAt: null,
      lastSeenAt: null
    };
  }

  return state.memory.objects[objectId];
}

function roomKeysFor(echo) {
  const keys = new Set();

  if (echo.room) keys.add(echo.room);

  if (echo.action === "move" || echo.action === "return" || echo.action === "entity_move") {
    if (echo.from) keys.add(echo.from);
    if (echo.to) keys.add(echo.to);
  }

  if (echo.action === "take" && echo.from && echo.from !== "inventory") {
    keys.add(echo.from);
  }

  return Array.from(keys).filter(Boolean);
}

function locationFromEcho(echo) {
  if (echo.action === "leave") return echo.room;
  if (echo.action === "take") return echo.from;
  if (echo.action === "object_manifest") return echo.room;
  if (echo.room) return echo.room;
  return null;
}

function trim(values, limit) {
  if (values.length > limit) {
    values.splice(0, values.length - limit);
  }
}
