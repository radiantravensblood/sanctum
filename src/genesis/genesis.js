import { appendEvent } from "../state.js";
import { composeBirth } from "./grammar.js";
import { applyDelta } from "./materialize.js";
import { makeGenesisSeed } from "./seed.js";
import { validateDelta } from "./validate.js";

export function crossFrontier({
  threshold,
  direction,
  state,
  world
}) {
  const realmId = threshold.genesisRealm;
  const realm = world.realms[realmId];

  if (!realm) {
    return {
      allowed: false,
      message: "Genesis cannot find the grammar for this realm."
    };
  }

  const counterKey = "realm:" + realmId;
  const creationIndex = (state.genesis.counters[counterKey] || 0) + 1;
  const seed = makeGenesisSeed([
    world.genesis.worldSeed,
    realmId,
    threshold.id,
    String(creationIndex)
  ]);

  const delta = composeBirth({
    seed,
    realm,
    creationIndex,
    originRoomId: state.location,
    sourceThresholdId: threshold.id,
    returnDirection: oppositeDirection(direction)
  });

  const verdict = validateDelta(delta, state, world);

  if (!verdict.allowed) {
    console.warn("Genesis rejected a proposed birth.", verdict.errors);
    return {
      allowed: false,
      message: "The frontier stirs, but the world refuses the proposed shape."
    };
  }

  applyDelta(delta, state);
  state.genesis.counters[counterKey] = creationIndex;

  appendEvent(state, {
    actor: "genesis",
    action: "genesis_birth",
    room: delta.operations.find((operation) => operation.op === "create_room").id,
    threshold: threshold.id,
    realm: realmId,
    seed
  });

  return {
    allowed: true,
    targetRoomId: state.thresholdTargets[threshold.id],
    seed,
    delta
  };
}

function oppositeDirection(direction) {
  const opposites = {
    north: "south",
    south: "north",
    east: "west",
    west: "east",
    up: "down",
    down: "up"
  };

  return opposites[direction] || "back";
}
