import { createSeededRandom, pick } from "./seed.js";
import { getRoom, getThresholdState } from "../world.js";

export function planTopology({
  seed,
  state,
  world,
  realm,
  motif,
  originRoomId,
  returnDirection
}) {
  const random = createSeededRandom(seed + ":topology");
  const config = {
    ...(realm.topology || {}),
    ...(motif.topology || {})
  };

  const loopCandidates = findLoopCandidates({
    state,
    world,
    originRoomId,
    motifId: motif.id
  });

  const generatedCount = Object.keys(state.genesis.generated.rooms || {}).length;
  const loopRoll = random();

  if (
    generatedCount >= Number(config.minRoomsBeforeLoop || 4) &&
    loopCandidates.length &&
    loopRoll < Number(config.loopChance || 0)
  ) {
    return {
      type: "loop",
      targetRoomId: pick(random, loopCandidates)
    };
  }

  const shapeRoll = random();
  const terminalChance = Number(config.terminalChance || 0);
  const branchChance = Number(config.branchChance || 0);

  let type = "linear";

  if (shapeRoll < terminalChance) {
    type = "terminal";
  } else if (shapeRoll < terminalChance + branchChance) {
    type = "branch";
  }

  return {
    type,
    frontierDirections: chooseFrontierDirections({
      seed,
      type,
      realm,
      returnDirection
    })
  };
}

function findLoopCandidates({ state, world, originRoomId, motifId }) {
  const origin = getRoom(world, state, originRoomId, { fallback: false });
  const immediateNeighbors = new Set();

  Object.values((origin && origin.exits) || {}).forEach((exit) => {
    if (typeof exit === "string") {
      immediateNeighbors.add(exit);
      return;
    }

    if (exit && exit.threshold) {
      const threshold = getThresholdState(world, state, exit.threshold);
      if (threshold && threshold.target) immediateNeighbors.add(threshold.target);
    }
  });

  const allCandidates = Object.keys(state.genesis.canonical || {})
    .filter((roomId) => state.genesis.canonical[roomId])
    .filter((roomId) => roomId !== originRoomId)
    .filter((roomId) => !immediateNeighbors.has(roomId))
    .filter((roomId) => Boolean(getRoom(world, state, roomId, { fallback: false })));

  const sameMotif = allCandidates.filter((roomId) => {
    const room = getRoom(world, state, roomId, { fallback: false });
    return room && room.genesis && room.genesis.motif === motifId;
  });

  return sameMotif.length ? sameMotif : allCandidates;
}

function chooseFrontierDirections({ seed, type, realm, returnDirection }) {
  const count = type === "branch" ? 2 : type === "terminal" ? 0 : 1;
  if (!count) return [];

  const random = createSeededRandom(seed + ":directions");
  const configured = Array.isArray(realm.topology && realm.topology.directions)
    ? realm.topology.directions
    : ["north", "east", "south", "west"];

  const available = configured.filter((direction) => direction !== returnDirection);
  const chosen = [];

  const preferred = realm.forwardDirection;
  if (preferred && available.includes(preferred)) {
    chosen.push(preferred);
    available.splice(available.indexOf(preferred), 1);
  }

  while (chosen.length < count && available.length) {
    const index = Math.floor(random() * available.length);
    chosen.push(available.splice(index, 1)[0]);
  }

  return chosen;
}
