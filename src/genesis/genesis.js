import { appendEvent } from "../state.js";
import { composeBirth, composeLoop } from "./grammar.js";
import { applyDelta } from "./materialize.js";
import { resolveMotif } from "./motif.js";
import { makeGenesisSeed } from "./seed.js";
import { planTopology } from "./topology.js";
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

  const motif = resolveMotif({
    threshold,
    realm,
    seed
  });

  const returnDirection = oppositeDirection(direction);
  const topology = planTopology({
    seed,
    state,
    world,
    realm,
    motif,
    originRoomId: state.location,
    returnDirection
  });

  const delta =
    topology.type === "loop"
      ? composeLoop({
          seed,
          realm,
          motif,
          originRoomId: state.location,
          sourceThresholdId: threshold.id,
          targetRoomId: topology.targetRoomId
        })
      : composeBirth({
          seed,
          realm,
          motif,
          topology,
          creationIndex,
          originRoomId: state.location,
          sourceThresholdId: threshold.id,
          returnDirection,
          visualGrammar: world.visualGrammar,
          semanticGrammar: world.semanticGrammar
        });

  const verdict = validateDelta(delta, state, world);

  if (!verdict.allowed) {
    console.warn("Genesis rejected a proposed change.", verdict.errors);
    return {
      allowed: false,
      message: "The frontier stirs, but the world refuses the proposed shape."
    };
  }

  applyDelta(delta, state);
  state.genesis.counters[counterKey] = creationIndex;

  const targetRoomId = state.thresholdTargets[threshold.id];

  if (delta.kind === "loop") {
    appendEvent(state, {
      actor: "genesis",
      action: "genesis_loop",
      from: state.location,
      to: targetRoomId,
      threshold: threshold.id,
      realm: realmId,
      motif: motif.id,
      seed
    });
  } else {
    appendEvent(state, {
      actor: "genesis",
      action: "genesis_birth",
      room: targetRoomId,
      threshold: threshold.id,
      realm: realmId,
      motif: motif.id,
      topology: topology.type,
      seed
    });
  }

  return {
    allowed: true,
    targetRoomId,
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
