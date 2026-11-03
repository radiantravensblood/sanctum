import {
  getRoom,
  getObject,
  getThresholdState,
  getVisibleObjects
} from "../world.js";
import { getRoomMemory, getObjectMemory, getPathMemory } from "./mnemosyne.js";
import { reconstructSceneTruth } from "../genesis/scene-truth.js";
import { getTemporalContext } from "../time/chronos.js";
import { getEntitiesAt } from "../entities/entities.js";

export function buildContextPacket({ state, world, roomId = state.location }) {
  const room = getRoom(world, state, roomId, { fallback: false });
  if (!room) return null;

  const objects = getVisibleObjectsAt(world, state, roomId);
  const memory = getRoomMemory(state, roomId);
  const temporal = getTemporalContext({ state, world, roomId });
  const entities = getEntitiesAt(world, state, roomId);

  return {
    version: 3,
    time: temporal,
    location: {
      id: room.id,
      name: room.name,
      region: room.region,
      scene: reconstructSceneTruth(room, world),
      exits: describeExits(room, state, world)
    },
    localMemory: {
      arrivals: memory.arrivals,
      sittings: memory.sittings,
      echoes: memory.echoes.slice(-10),
      anchors: activeAnchors(memory, state)
    },
    entities: entities.map(({ template, record }) => ({
      id: template.id,
      name: template.name,
      kind: template.kind,
      description: template.description,
      lastMovedAt: record.lastMovedAt,
      lastObservedAt: record.lastObservedAt,
      recentHistory: (record.history || []).slice(-8)
    })),
    objects: objects.map((object) => ({
      id: object.id,
      name: object.name,
      portable: object.portable,
      memory: getObjectMemory(state, object.id)
    })),
    nearby: describeNearby(room, state, world),
    constraints: {
      entityLaws: world.entities.laws,
      consentThresholds: describeConsentThresholds(room, state, world),
      canonical: Boolean(state.genesis.canonical[room.id]),
      generated: Boolean(state.genesis.generated.rooms[room.id])
    }
  };
}

function getVisibleObjectsAt(world, state, roomId) {
  return Object.entries(state.objectLocations)
    .filter(([, location]) => location === roomId)
    .map(([objectId]) => getObject(world, state, objectId))
    .filter(Boolean);
}

function describeExits(room, state, world) {
  return Object.entries(room.exits || {}).map(([direction, exit]) => {
    if (typeof exit === "string") {
      const target = getRoom(world, state, exit, { fallback: false });
      return {
        direction,
        state: "known",
        target: target
          ? { id: target.id, name: target.name }
          : { id: exit, name: null },
        pathMemory: getPathMemory(state, room.id, exit)
      };
    }

    const threshold = getThresholdState(world, state, exit.threshold);

    return {
      direction,
      state: threshold ? threshold.state : "unknown",
      threshold: threshold
        ? {
            id: threshold.id,
            mode: threshold.mode,
            requires: threshold.requires || [],
            target: threshold.target
          }
        : null
    };
  });
}

function describeNearby(room, state, world) {
  const nearby = [];

  Object.entries(room.exits || {}).forEach(([direction, exit]) => {
    let targetId = null;

    if (typeof exit === "string") {
      targetId = exit;
    } else if (exit && exit.threshold) {
      const threshold = getThresholdState(world, state, exit.threshold);
      if (threshold && threshold.target) targetId = threshold.target;
    }

    if (!targetId) return;

    const target = getRoom(world, state, targetId, { fallback: false });
    if (!target) return;

    nearby.push({
      direction,
      id: target.id,
      name: target.name,
      remembered: getRoomMemory(state, target.id).echoes.length > 0
    });
  });

  return nearby;
}

function describeConsentThresholds(room, state, world) {
  return Object.entries(room.exits || {})
    .map(([direction, exit]) => {
      if (typeof exit !== "object" || !exit.threshold) return null;
      const threshold = getThresholdState(world, state, exit.threshold);
      if (!threshold || !threshold.requires || !threshold.requires.length) return null;

      return {
        direction,
        id: threshold.id,
        state: threshold.state,
        requires: threshold.requires,
        mode: threshold.mode
      };
    })
    .filter(Boolean);
}

function activeAnchors(memory, state) {
  return Object.values(memory.anchors || {}).filter((anchor) => {
    return state.objectLocations[anchor.object] === memory.room;
  });
}
