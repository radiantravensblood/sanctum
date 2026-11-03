export function createInitialEntityState(world) {
  return {
    version: 1,
    lastAdvancedAt: null,
    records: Object.fromEntries(
      (world.entities.entities || []).map((template) => [
        template.id,
        {
          id: template.id,
          location: template.start,
          status: "present",
          createdAt: new Date().toISOString(),
          lastMovedAt: null,
          lastObservedAt: null,
          history: []
        }
      ])
    )
  };
}

export function mergeEntityState(base, saved = {}) {
  saved = saved || {};

  const records = { ...base.records };

  Object.entries(saved.records || {}).forEach(([id, record]) => {
    records[id] = {
      ...(records[id] || {}),
      ...record,
      history: Array.isArray(record.history)
        ? record.history.slice(-24)
        : (records[id] && records[id].history) || []
    };
  });

  return {
    ...base,
    ...saved,
    records
  };
}

export function getEntityTemplate(world, entityId) {
  return (world.entities.entities || []).find((entity) => entity.id === entityId) || null;
}

export function getEntityRecord(state, entityId) {
  return state.entities && state.entities.records
    ? state.entities.records[entityId] || null
    : null;
}

export function getEntitiesAt(world, state, roomId) {
  return (world.entities.entities || [])
    .map((template) => ({
      template,
      record: getEntityRecord(state, template.id)
    }))
    .filter(({ record }) => record && record.location === roomId);
}

export function rememberEntity(record, event) {
  record.history = Array.isArray(record.history) ? record.history : [];
  record.history.push(event);

  if (record.history.length > 24) {
    record.history = record.history.slice(-24);
  }
}

export function describeEntity({ world, state, entityId }) {
  const template = getEntityTemplate(world, entityId);
  const record = getEntityRecord(state, entityId);

  if (!template || !record) {
    return "Whatever was here has moved beyond the current edge of recognition.";
  }

  const index = Math.abs(hashString(
    entityId + ":" + String(record.history.length) + ":" + record.location
  )) % template.observe.length;

  const observation = template.observe[index] || template.description;
  const trail = recentTrail(record, world, state);

  return template.description + " " + observation + trail;
}

function recentTrail(record, world, state) {
  const rooms = [];
  const seen = new Set();

  [...(record.history || [])]
    .reverse()
    .forEach((event) => {
      const roomId = event.to || event.room || event.from;
      if (!roomId || seen.has(roomId)) return;
      seen.add(roomId);
      rooms.push(roomId);
    });

  const named = rooms
    .slice(0, 3)
    .map((roomId) => {
      const room =
        world.rooms[roomId] ||
        (state.genesis.generated.rooms && state.genesis.generated.rooms[roomId]);
      return room ? room.name : null;
    })
    .filter(Boolean);

  if (!named.length) return "";
  if (named.length === 1) return " Its recent history still points toward " + named[0] + ".";
  return " Its recent history passes through " + naturalList(named.reverse()) + ".";
}

function naturalList(values) {
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return values[0] + " and " + values[1];
  return values.slice(0, -1).join(", ") + ", and " + values[values.length - 1];
}

function hashString(input) {
  let hash = 2166136261;
  const value = String(input || "entity");

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
