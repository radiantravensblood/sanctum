import { appendEvent } from "../state.js";
import {
  getRoom,
  getThresholdState,
  isGeneratedRoom
} from "../world.js";
import { getTemporalContext, durationBetween } from "../time/chronos.js";
import {
  getPathMemory,
  getRoomMemory,
  getObjectMemory
} from "../memory/mnemosyne.js";
import { createSeededRandom } from "../genesis/seed.js";
import {
  getEntityRecord,
  getEntityTemplate,
  rememberEntity,
  rememberEncounter
} from "./entities.js";

export function advanceEntities({
  state,
  world,
  now = new Date()
}) {
  if (!state.entities) return [];

  const changes = [];
  const baseline =
    state.entities.lastAdvancedAt ||
    (state.time && state.time.previousOpenedAt) ||
    (state.time && state.time.currentSessionStartedAt) ||
    now.toISOString();

  for (const template of world.entities.entities || []) {
    const record = getEntityRecord(state, template.id);
    if (!record) continue;

    const interval = Math.max(
      30,
      Number(template.rhythm && template.rhythm.intervalMinutes) || 240
    );

    const origin = new Date(
      record.lastActedAt ||
      record.lastMovedAt ||
      record.createdAt ||
      baseline
    );

    const elapsed = durationBetween(origin, now).minutes;
    const totalDue = Math.floor(elapsed / interval);

    if (totalDue < 1) continue;

    const maxCatchup = Number(
      (template.rhythm && template.rhythm.maxCatchupActions) ||
      (template.rhythm && template.rhythm.maxCatchupMoves) ||
      1
    );
    const due = Math.min(totalDue, Math.max(1, maxCatchup));
    const firstResolvedIndex = totalDue - due + 1;

    for (let offset = 0; offset < due; offset += 1) {
      const sequenceIndex = firstResolvedIndex + offset;
      const actionAt = new Date(
        origin.getTime() + sequenceIndex * interval * 60000
      );

      const temporal = getTemporalContext({
        state,
        world,
        roomId: record.location,
        now: actionAt
      });

      record.lastActedAt = actionAt.toISOString();

      if (
        Array.isArray(template.rhythm.active) &&
        !template.rhythm.active.includes(temporal.local.dayPhase)
      ) {
        record.status = "resting";
        record.focus = null;
        continue;
      }

      const action = chooseAction({
        template,
        record,
        state,
        world,
        at: actionAt,
        sequenceIndex
      });

      const change = executeAction({
        action,
        template,
        record,
        state,
        world,
        at: actionAt
      });

      if (change) changes.push(change);
    }
  }

  state.entities.lastAdvancedAt = now.toISOString();
  return changes;
}

function chooseAction({
  template,
  record,
  state,
  world,
  at,
  sequenceIndex
}) {
  const roomObjects = objectsAt(state, record.location);
  const peers = peersAt(state, template.id, record.location);
  const neighbors = knownNeighbors(record.location, state, world);
  const weights = {
    move: 0.4,
    linger: 0.2,
    rest: 0.15,
    notice_object: 0.15,
    attend_entity: 0.1,
    ...((template.behavior && template.behavior.weights) || {})
  };

  if (!neighbors.length) weights.move = 0;
  if (!roomObjects.length) weights.notice_object = 0;
  if (!peers.length) weights.attend_entity = 0;

  const seed = [
    world.genesis.worldSeed,
    template.id,
    record.location,
    at.toISOString(),
    String(sequenceIndex),
    String(record.history.length)
  ].join(":");

  const random = createSeededRandom(seed);
  const entries = Object.entries(weights)
    .filter(([, weight]) => Number(weight) > 0);

  const total = entries.reduce((sum, [, weight]) => sum + Number(weight), 0);

  if (!total) {
    return { type: "linger" };
  }

  let needle = random() * total;

  for (const [type, weight] of entries) {
    needle -= Number(weight);
    if (needle <= 0) {
      return {
        type,
        random,
        neighbors,
        roomObjects,
        peers
      };
    }
  }

  return { type: "linger" };
}

function executeAction({
  action,
  template,
  record,
  state,
  world,
  at
}) {
  switch (action.type) {
    case "move":
      return moveEntity({
        template,
        record,
        state,
        world,
        at,
        candidates: action.neighbors
      });

    case "notice_object":
      return noticeObject({
        template,
        record,
        state,
        world,
        at,
        objectIds: action.roomObjects,
        random: action.random
      });

    case "attend_entity":
      return encounterEntity({
        template,
        record,
        state,
        world,
        at,
        peerIds: action.peers,
        random: action.random
      });

    case "rest":
      return remain({
        template,
        record,
        state,
        at,
        action: "entity_rest",
        status: "resting"
      });

    case "linger":
    default:
      return remain({
        template,
        record,
        state,
        at,
        action: "entity_linger",
        status: "lingering"
      });
  }
}

function moveEntity({
  template,
  record,
  state,
  world,
  at,
  candidates
}) {
  const move = chooseMove({
    template,
    record,
    state,
    world,
    at,
    candidates
  });

  if (!move) {
    return remain({
      template,
      record,
      state,
      at,
      action: "entity_linger",
      status: "lingering"
    });
  }

  const from = record.location;
  record.location = move.target;
  record.lastMovedAt = at.toISOString();
  record.status = "wandering";
  record.focus = null;

  const entityEvent = {
    at: at.toISOString(),
    action: "entity_move",
    from,
    to: move.target,
    entity: template.id,
    reason: move.reason
  };

  rememberEntity(record, entityEvent);
  appendEvent(state, {
    ...entityEvent,
    actor: template.id
  });

  return {
    action: "move",
    entity: template.id,
    from,
    to: move.target
  };
}

function remain({
  template,
  record,
  state,
  at,
  action,
  status
}) {
  record.status = status;
  record.focus = null;

  const entityEvent = {
    at: at.toISOString(),
    action,
    room: record.location,
    entity: template.id
  };

  rememberEntity(record, entityEvent);
  appendEvent(state, {
    ...entityEvent,
    actor: template.id
  });

  return {
    action,
    entity: template.id,
    room: record.location
  };
}

function noticeObject({
  template,
  record,
  state,
  world,
  at,
  objectIds,
  random
}) {
  if (!objectIds.length) return null;

  const ranked = objectIds
    .map((objectId) => {
      const memory = getObjectMemory(state, objectId);
      return {
        objectId,
        score:
          (memory.echoes || []).length * 0.12 +
          (memory.locations || []).length * 0.18 +
          random() * 0.45
      };
    })
    .sort((a, b) => b.score - a.score);

  const objectId = ranked[0].objectId;

  record.status = "attending_object";
  record.focus = objectId;

  const entityEvent = {
    at: at.toISOString(),
    action: "entity_notice_object",
    room: record.location,
    entity: template.id,
    object: objectId
  };

  rememberEntity(record, entityEvent);
  appendEvent(state, {
    ...entityEvent,
    actor: template.id
  });

  return {
    action: "notice_object",
    entity: template.id,
    room: record.location,
    object: objectId
  };
}

function encounterEntity({
  template,
  record,
  state,
  world,
  at,
  peerIds,
  random
}) {
  if (!peerIds.length) return null;

  const otherId = peerIds[Math.floor(random() * peerIds.length)];
  const otherRecord = getEntityRecord(state, otherId);

  if (!otherRecord || otherRecord.location !== record.location) {
    return null;
  }

  record.status = "in_company";
  record.focus = otherId;
  otherRecord.status = otherRecord.status === "resting"
    ? "resting"
    : "in_company";
  if (otherRecord.status === "in_company") {
    otherRecord.focus = template.id;
  }

  const event = {
    at: at.toISOString(),
    room: record.location,
    entity: template.id,
    otherEntity: otherId
  };

  rememberEncounter(record, otherId, event);
  rememberEncounter(otherRecord, template.id, event);

  rememberEntity(record, {
    ...event,
    action: "entity_encounter"
  });
  rememberEntity(otherRecord, {
    ...event,
    action: "entity_encountered",
    entity: otherId,
    otherEntity: template.id
  });

  appendEvent(state, {
    actor: template.id,
    action: "entity_encounter",
    ...event
  });

  return {
    action: "encounter",
    entity: template.id,
    otherEntity: otherId,
    room: record.location
  };
}

function chooseMove({
  template,
  record,
  state,
  world,
  at,
  candidates
}) {
  if (!candidates.length) return null;

  const random = createSeededRandom([
    world.genesis.worldSeed,
    template.id,
    record.location,
    at.toISOString(),
    "move",
    String(record.history.length)
  ].join(":"));

  const scored = candidates.map((candidate) => ({
    ...candidate,
    score:
      0.25 +
      random() * 0.3 +
      affinityScore({
        template,
        candidate,
        state,
        world
      })
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

function knownNeighbors(roomId, state, world) {
  const room = getRoom(world, state, roomId, { fallback: false });
  if (!room) return [];

  const candidates = [];

  Object.entries(room.exits || {}).forEach(([direction, exit]) => {
    let targetId = null;

    if (typeof exit === "string") {
      targetId = exit;
    } else if (exit && exit.threshold) {
      const threshold = getThresholdState(world, state, exit.threshold);
      if (!threshold) return;
      if (threshold.requires && threshold.requires.length) return;
      if (threshold.state !== "open" || !threshold.target) return;
      targetId = threshold.target;
    }

    if (!targetId) return;

    const target = getRoom(world, state, targetId, { fallback: false });
    if (!target) return;

    if (
      isGeneratedRoom(state, targetId) &&
      !state.genesis.canonical[targetId]
    ) {
      return;
    }

    candidates.push({
      target: targetId,
      direction,
      reason: "known_path"
    });
  });

  return candidates;
}

function affinityScore({
  template,
  candidate,
  state,
  world
}) {
  const affinities = template.affinities || {};
  const room = getRoom(world, state, candidate.target, { fallback: false });
  const memory = getRoomMemory(state, candidate.target);
  const path = getPathMemory(
    state,
    state.entities.records[template.id].location,
    candidate.target
  );
  const objects = objectsAt(state, candidate.target).length;

  let score = 0;

  score += Math.min(1, memory.echoes.length / 12) *
    Number(affinities.memory || 0);
  score += Math.min(1, path.crossings / 6) *
    Number(affinities.familiarPaths || 0);
  score += Math.min(1, objects / 3) *
    Number(affinities.objects || 0);

  if (room && room.genesis) {
    const realm = world.realms[room.genesis.realm];
    const atmosphere = realm && (realm.atmospheres || []).find(
      (item) => item.id === room.genesis.atmosphere
    );
    const phenomenon = realm && (realm.phenomena || []).find(
      (item) => item.id === room.genesis.phenomenon
    );

    if (atmosphere && atmosphere.id === "warm") {
      score += 0.55 * Number(affinities.warmth || 0);
    }

    if (phenomenon && phenomenon.id === "misplaced_light") {
      score += 0.8 * Number(affinities.light || 0);
    }
  } else if (candidate.target === "hearth") {
    score += 0.72 * Number(affinities.warmth || 0);
    score += 0.48 * Number(affinities.light || 0);
  }

  return score;
}

function objectsAt(state, roomId) {
  return Object.entries(state.objectLocations || {})
    .filter(([, location]) => location === roomId)
    .map(([objectId]) => objectId);
}

function peersAt(state, entityId, roomId) {
  return Object.values(
    (state.entities && state.entities.records) || {}
  )
    .filter((record) => record.id !== entityId && record.location === roomId)
    .map((record) => record.id);
}
