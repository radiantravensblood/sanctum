const STORAGE_KEY = "sanctum.kernel.v1";
const VERSION = 1;

export function loadState(world) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialState(world);

    const parsed = JSON.parse(saved);
    if (parsed.version !== VERSION) return createInitialState(world);
    if (!world.rooms[parsed.location]) parsed.location = "hearth";

    return {
      ...createInitialState(world),
      ...parsed,
      objectLocations: {
        ...createInitialObjectLocations(world),
        ...(parsed.objectLocations || {})
      },
      thresholdStates: {
        ...createInitialThresholdStates(world),
        ...(parsed.thresholdStates || {})
      },
      ledger: Array.isArray(parsed.ledger) ? parsed.ledger : []
    };
  } catch (error) {
    console.warn("Sanctum state could not be restored.", error);
    return createInitialState(world);
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
    visits: { hearth: 1 },
    ledger: [
      {
        at: new Date().toISOString(),
        actor: "siege",
        action: "arrive",
        room: "hearth"
      }
    ]
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
    Object.values(world.thresholds).map((threshold) => [threshold.id, threshold.state])
  );
}

export function appendEvent(state, event) {
  state.ledger.push({
    at: new Date().toISOString(),
    actor: "siege",
    ...event
  });

  if (state.ledger.length > 80) {
    state.ledger = state.ledger.slice(-80);
  }
}
