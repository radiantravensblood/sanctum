export async function loadWorld() {
  const [rooms, objects, thresholds, genesis, frontier, visualGrammar, semanticGrammar, time, entities] = await Promise.all([
    fetch("./world/rooms.json").then(assertResponse).then((response) => response.json()),
    fetch("./world/objects.json").then(assertResponse).then((response) => response.json()),
    fetch("./world/thresholds.json").then(assertResponse).then((response) => response.json()),
    fetch("./world/genesis.json").then(assertResponse).then((response) => response.json()),
    fetch("./world/realms/frontier.json").then(assertResponse).then((response) => response.json()),
    fetch("./world/visual-grammar.json").then(assertResponse).then((response) => response.json()),
    fetch("./world/semantic-grammar.json").then(assertResponse).then((response) => response.json()),
    fetch("./world/time.json").then(assertResponse).then((response) => response.json()),
    fetch("./world/entities.json").then(assertResponse).then((response) => response.json())
  ]);

  return {
    rooms,
    objects,
    thresholds,
    genesis,
    visualGrammar,
    semanticGrammar,
    time,
    entities,
    realms: {
      [frontier.id]: frontier
    }
  };
}

function assertResponse(response) {
  if (!response.ok) {
    throw new Error("The Sanctum could not read part of its world.");
  }
  return response;
}

export function getRoom(world, state, roomId, options = {}) {
  const generated =
    state &&
    state.genesis &&
    state.genesis.generated &&
    state.genesis.generated.rooms
      ? state.genesis.generated.rooms[roomId]
      : null;

  if (generated) return generated;
  if (world.rooms[roomId]) return world.rooms[roomId];
  return options.fallback === false ? null : world.rooms.hearth;
}

export function getObject(world, state, objectId) {
  if (
    state &&
    state.genesis &&
    state.genesis.generated &&
    state.genesis.generated.objects &&
    state.genesis.generated.objects[objectId]
  ) {
    return state.genesis.generated.objects[objectId];
  }

  return world.objects[objectId] || null;
}

export function getVisibleObjects(world, state) {
  return Object.entries(state.objectLocations)
    .filter(([, location]) => location === state.location)
    .map(([objectId]) => getObject(world, state, objectId))
    .filter(Boolean);
}

export function getInventory(world, state) {
  return Object.entries(state.objectLocations)
    .filter(([, location]) => location === "inventory")
    .map(([objectId]) => getObject(world, state, objectId))
    .filter(Boolean);
}

export function getThresholdState(world, state, thresholdId) {
  const generated =
    state &&
    state.genesis &&
    state.genesis.generated &&
    state.genesis.generated.thresholds
      ? state.genesis.generated.thresholds[thresholdId]
      : null;

  const threshold = generated || world.thresholds[thresholdId];
  if (!threshold) return null;

  return {
    ...threshold,
    state: state.thresholdStates[thresholdId] || threshold.state,
    target: state.thresholdTargets[thresholdId] || threshold.target || null
  };
}

export function isGeneratedRoom(state, roomId) {
  return Boolean(
    state.genesis &&
      state.genesis.generated &&
      state.genesis.generated.rooms &&
      state.genesis.generated.rooms[roomId]
  );
}
