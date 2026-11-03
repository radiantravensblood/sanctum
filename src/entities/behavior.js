import { appendEvent } from "../state.js";
import {
  getRoom,
  getThresholdState,
  isGeneratedRoom
} from "../world.js";
import { getTemporalContext, durationBetween } from "../time/chronos.js";
import { getPathMemory, getRoomMemory } from "../memory/mnemosyne.js";
import { createSeededRandom } from "../genesis/seed.js";
import {
  getEntityRecord,
  getEntityTemplate,
  rememberEntity
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
    const elapsed = durationBetween(
      new Date(record.lastMovedAt || record.createdAt || baseline),
      now
    ).minutes;

    if (elapsed < interval) continue;

    const temporal = getTemporalContext({
      state,
      world,
      roomId: record.location,
      now
    });

    if (
      Array.isArray(template.rhythm.active) &&
      !template.rhythm.active.includes(temporal.local.dayPhase)
    ) {
      continue;
    }

    const due = Math.min(
      Math.floor(elapsed / interval),
      Number(template.rhythm.maxCatchupMoves || 1)
    );

    for (let step = 0; step < due; step += 1) {
      const move = chooseMove({
        template,
        record,
        state,
        world,
        now,
        step
      });

      if (!move) break;

      const from = record.location;
      record.location = move.target;
      record.lastMovedAt = now.toISOString();

      const entityEvent = {
        at: now.toISOString(),
        action: "entity_move",
        from,
        to: move.target,
        entity: template.id,
        reason: move.reason
      };

      rememberEntity(record, entityEvent);
      appendEvent(state, {
        actor: template.id,
        action: "entity_move",
        from,
        to: move.target,
        entity: template.id,
        reason: move.reason
      });

      changes.push({
        entity: template.id,
        from,
        to: move.target
      });
    }
  }

  state.entities.lastAdvancedAt = now.toISOString();
  return changes;
}

function chooseMove({
  template,
  record,
  state,
  world,
  now,
  step
}) {
  const candidates = knownNeighbors(record.location, state, world);
  if (!candidates.length) return null;

  const seed = [
    world.genesis.worldSeed,
    template.id,
    record.location,
    now.toISOString().slice(0, 13),
    String(step),
    String(record.history.length)
  ].join(":");

  const random = createSeededRandom(seed);
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
  const path = getPathMemory(state, state.entities.records[template.id].location, candidate.target);
  const objects = Object.values(state.objectLocations || {}).filter(
    (location) => location === candidate.target
  ).length;

  let score = 0;

  score += Math.min(1, memory.echoes.length / 12) * Number(affinities.memory || 0);
  score += Math.min(1, path.crossings / 6) * Number(affinities.familiarPaths || 0);
  score += Math.min(1, objects / 3) * Number(affinities.objects || 0);

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
