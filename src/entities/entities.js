export function createInitialEntityState(world) {
  return {
    version: 3,
    lastAdvancedAt: null,
    relations: {},
    records: Object.fromEntries(
      (world.entities.entities || []).map((template) => [
        template.id,
        createRecord(template)
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
      status: record.status || (records[id] && records[id].status) || "present",
      focus: record.focus || null,
      relations: {
        ...((records[id] && records[id].relations) || {}),
        ...(record.relations || {})
      },
      history: Array.isArray(record.history)
        ? record.history.slice(-40)
        : (records[id] && records[id].history) || []
    };
  });

  return {
    ...base,
    ...saved,
    version: 3,
    relations: {
      ...(base.relations || {}),
      ...(saved.relations || {})
    },
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

  if (record.history.length > 40) {
    record.history = record.history.slice(-40);
  }
}

export function rememberEncounter(record, otherId, event) {
  record.relations = record.relations || {};

  const relation = record.relations[otherId] || {
    entity: otherId,
    encounters: 0,
    firstEncounterAt: null,
    lastEncounterAt: null,
    lastRoom: null
  };

  relation.encounters += 1;
  relation.firstEncounterAt = relation.firstEncounterAt || event.at;
  relation.lastEncounterAt = event.at;
  relation.lastRoom = event.room;

  record.relations[otherId] = relation;
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
  const stateText = describeState(record, world, state);
  const trail = recentTrail(record, world, state);

  return template.description + " " + observation + stateText + trail;
}

function createRecord(template) {
  return {
    id: template.id,
    location: template.start,
    status: "present",
    focus: null,
    createdAt: new Date().toISOString(),
    lastActedAt: null,
    lastMovedAt: null,
    lastObservedAt: null,
    relations: {},
    history: []
  };
}

function describeState(record, world, state) {
  switch (record.status) {
    case "resting":
      return " It is presently at rest.";
    case "lingering":
      return " It appears to have chosen to remain here for a while.";
    case "attending_object": {
      const object = getObject(state, world, record.focus);
      return object
        ? " Its attention has settled on the " + object.name + "."
        : " Its attention is fixed on something no longer here.";
    }
    case "in_company": {
      const other = getEntityTemplate(world, record.focus);
      return other
        ? " Its attention keeps returning to " + other.name + "."
        : " It seems recently aware of another presence.";
    }
    case "wandering":
      return " It seems to have arrived by way of its own wandering.";
    default:
      return "";
  }
}

function getObject(state, world, objectId) {
  if (!objectId) return null;

  return (
    (state.genesis &&
      state.genesis.generated &&
      state.genesis.generated.objects &&
      state.genesis.generated.objects[objectId]) ||
    world.objects[objectId] ||
    null
  );
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
