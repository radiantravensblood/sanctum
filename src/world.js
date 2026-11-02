export async function loadWorld() {
  const [rooms, objects, thresholds] = await Promise.all([
    fetch("./world/rooms.json").then(assertResponse).then((response) => response.json()),
    fetch("./world/objects.json").then(assertResponse).then((response) => response.json()),
    fetch("./world/thresholds.json").then(assertResponse).then((response) => response.json())
  ]);

  return { rooms, objects, thresholds };
}

function assertResponse(response) {
  if (!response.ok) {
    throw new Error("The Sanctum could not read part of its world.");
  }
  return response;
}

export function getRoom(world, roomId) {
  return world.rooms[roomId] || world.rooms.hearth;
}

export function getVisibleObjects(world, state) {
  return Object.entries(state.objectLocations)
    .filter(([, location]) => location === state.location)
    .map(([objectId]) => world.objects[objectId])
    .filter(Boolean);
}

export function getInventory(world, state) {
  return Object.entries(state.objectLocations)
    .filter(([, location]) => location === "inventory")
    .map(([objectId]) => world.objects[objectId])
    .filter(Boolean);
}

export function getThresholdState(world, state, thresholdId) {
  const threshold = world.thresholds[thresholdId];
  if (!threshold) return null;

  return {
    ...threshold,
    state: state.thresholdStates[thresholdId] || threshold.state
  };
}
