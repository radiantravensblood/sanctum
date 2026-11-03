import {
  getRoom,
  getThresholdState
} from "../world.js";
import { reconstructSceneTruth } from "../genesis/scene-truth.js";
import { resolveRoomVisual } from "../genesis/chroma.js";
import {
  getRoomMemory,
  roomMemoryWeight
} from "../memory/mnemosyne.js";
import { getTemporalContext } from "../time/chronos.js";
import { getEntitiesAt } from "../entities/entities.js";
import { getCrossRelation } from "../hymnos/relation.js";

export function buildExpressionContext({
  state,
  world,
  roomId = state.location,
  role = "place",
  now = new Date(),
  overrides = {}
}) {
  const room = getRoom(
    world,
    state,
    roomId,
    { fallback: false }
  );

  if (!room) {
    throw new Error(
      "Velastra cannot compose a place that the world does not know."
    );
  }

  const scene = reconstructSceneTruth(room, world);
  const visual = resolveRoomVisual(room, world, scene);
  const temporal = getTemporalContext({
    state,
    world,
    roomId,
    now
  });
  const memory = getRoomMemory(state, roomId);
  const remembrance = roomMemoryWeight(state, roomId);
  const entities = getEntitiesAt(world, state, roomId);
  const thresholdSignals = inspectThresholds(
    room,
    state,
    world
  );
  const relation = strongestLocalRelation(
    entities,
    state
  );
  const ritualCount = Object.values(
    (state.hymnos && state.hymnos.rituals) || {}
  ).filter((ritual) => ritual.room === roomId).length;

  const sensation =
    (visual && visual.sensation) || {};
  const geometry =
    (scene && scene.geometry) || {};
  const air =
    (scene && scene.air) || {};
  const anomaly =
    (scene && scene.anomaly) || {};

  const roleAxes =
    (world.velastra.roles &&
      world.velastra.roles[role] &&
      world.velastra.roles[role].axes) ||
    {};

  const derived = {
    intimacy: clamp(
      Number(roleAxes.intimacy || 0.45) * 0.52 +
        Number(sensation.tenderness || 0.5) * 0.22 +
        Number(sensation.warmth || 0.5) * 0.12 +
        relation.weight * 0.1 +
        Math.min(0.08, ritualCount * 0.03)
    ),
    certainty: clamp(
      Number(roleAxes.certainty || 0.7) * 0.56 +
        Number((anomaly && anomaly.stability) || 0.75) * 0.2 +
        (1 - thresholdSignals.unresolvedRatio) * 0.16 +
        (1 - Number((anomaly && anomaly.intensity) || 0)) * 0.08
    ),
    sacredness: clamp(
      Number(roleAxes.sacredness || 0.3) * 0.5 +
        thresholdSignals.protectedRatio * 0.2 +
        Math.min(0.18, ritualCount * 0.08) +
        Number(geometry.focality || 0.4) * 0.12
    ),
    urgency: clamp(
      Number(roleAxes.urgency || 0.05) * 0.84 +
        thresholdSignals.unresolvedRatio * 0.04
    ),
    density: clamp(
      Number(roleAxes.density || 0.55) * 0.48 +
        Number(sensation.density || geometry.enclosure || 0.55) * 0.42 +
        Math.min(0.1, entities.length * 0.035)
    ),
    age: clamp(
      Number(roleAxes.age || 0.5) * 0.46 +
        Number(sensation.age || 0.5) * 0.34 +
        remembrance * 0.2
    ),
    warmth: clamp(
      Number(roleAxes.warmth || 0.5) * 0.34 +
        Number(sensation.warmth || 0.5) * 0.5 +
        phaseWarmth(temporal.local.dayPhase) * 0.16
    ),
    porosity: clamp(
      Number(roleAxes.porosity || 0.45) * 0.44 +
        Number(
          scene &&
          scene.matter &&
          typeof scene.matter.porosity === "number"
            ? scene.matter.porosity
            : 0.45
        ) * 0.28 +
        (1 - Number(geometry.enclosure || 0.5)) * 0.28
    ),
    remembrance: clamp(
      Number(roleAxes.remembrance || 0.2) * 0.28 +
        remembrance * 0.72
    ),
    permeability: clamp(
      Number(roleAxes.permeability || 0.5) * 0.38 +
        thresholdSignals.openRatio * 0.34 +
        (1 - Number(geometry.enclosure || 0.5)) * 0.2 +
        Number(sensation.diffusion || 0.5) * 0.08
    ),
    relationality: clamp(
      Number(roleAxes.relationality || 0.25) * 0.34 +
        Math.min(0.24, entities.length * 0.08) +
        relation.weight * 0.28 +
        Math.min(0.14, ritualCount * 0.06)
    ),
    vitality: clamp(
      Number(roleAxes.vitality || 0.3) * 0.34 +
        Number(air.movement || 0.18) * 0.22 +
        (1 - Number(sensation.stillness || 0.62)) * 0.2 +
        Math.min(0.16, entities.length * 0.055) +
        (anomaly.law === "architecture_exhibits_slow_respiration"
          ? 0.08
          : 0)
    )
  };

  return {
    version: 1,
    engine: "Velastra",
    role,
    axes: {
      ...derived,
      ...sanitizeAxes(overrides.axes || {})
    },
    sensations: {
      wetness: clamp(Number(sensation.wetness || 0)),
      diffusion: clamp(Number(sensation.diffusion || 0.4)),
      stillness: clamp(Number(sensation.stillness || 0.6)),
      tenderness: clamp(Number(sensation.tenderness || 0.5)),
      enclosure: clamp(Number(geometry.enclosure || 0.5)),
      ...sanitizeAxes(overrides.sensations || {})
    },
    signals: {
      room: {
        id: room.id,
        name: room.name,
        region: room.region || null
      },
      time: {
        dayPhase: temporal.local.dayPhase,
        season: temporal.local.season
      },
      memory: {
        weight: remembrance,
        echoes: (memory.echoes || []).length,
        sittings: Number(memory.sittings || 0),
        anchors: Object.keys(memory.anchors || {}).length
      },
      company: {
        count: entities.length,
        strongestRelation: relation.phase
      },
      ritual: {
        count: ritualCount
      },
      thresholds: thresholdSignals
    },
    hints: {
      materials: [
        materialHint(scene),
        remembrance > 0.68 ? "paper" : null,
        ritualCount ? "brass" : null,
        Number(sensation.warmth || 0) > 0.76 ? "ember" : null,
        Number(sensation.wetness || 0) > 0.72 ? "glass" : null
      ].filter(Boolean),
      ...(overrides.hints || {})
    },
    provenance: {
      source: "sanctum_world_state",
      room: room.id,
      generated: Boolean(room.genesis),
      at: now.toISOString()
    }
  };
}

function inspectThresholds(room, state, world) {
  const exits = Object.values(room.exits || {});
  let count = exits.length;
  let protectedCount = 0;
  let unresolvedCount = 0;
  let openCount = 0;

  exits.forEach((exit) => {
    if (typeof exit === "string") {
      openCount += 1;
      return;
    }

    if (!exit || !exit.threshold) return;

    const threshold = getThresholdState(
      world,
      state,
      exit.threshold
    );

    if (!threshold) {
      unresolvedCount += 1;
      return;
    }

    if (
      Array.isArray(threshold.requires) &&
      threshold.requires.length
    ) {
      protectedCount += 1;
    }

    if (
      threshold.state === "open" &&
      threshold.target
    ) {
      openCount += 1;
    } else {
      unresolvedCount += 1;
    }
  });

  count = Math.max(1, count);

  return {
    count: exits.length,
    protected: protectedCount,
    unresolved: unresolvedCount,
    open: openCount,
    protectedRatio: protectedCount / count,
    unresolvedRatio: unresolvedCount / count,
    openRatio: openCount / count
  };
}

function strongestLocalRelation(entities, state) {
  const order = {
    unfamiliar: 0,
    familiar: 0.34,
    companionate: 0.68,
    friends: 1
  };

  let phase = "unfamiliar";
  let weight = 0;

  entities.forEach(({ template }) => {
    const relation = getCrossRelation(
      state,
      "siege",
      template.id
    );

    const next =
      order[(relation && relation.phase) || "unfamiliar"] || 0;

    if (next > weight) {
      weight = next;
      phase = relation.phase;
    }
  });

  return { phase, weight };
}

function materialHint(scene) {
  const material =
    scene &&
    scene.matter &&
    (scene.matter.material || scene.matter.primary);

  if (
    ["stone", "brass", "glass"].includes(material)
  ) {
    return material;
  }

  if (material === "wood") return "paper";
  return null;
}

function phaseWarmth(dayPhase) {
  const map = {
    dawn: 0.64,
    morning: 0.58,
    afternoon: 0.5,
    evening: 0.72,
    night: 0.42,
    deep_night: 0.28
  };

  return Object.prototype.hasOwnProperty.call(map, dayPhase)
    ? map[dayPhase]
    : 0.5;
}

function sanitizeAxes(values) {
  return Object.fromEntries(
    Object.entries(values || {}).map(([key, value]) => [
      key,
      clamp(Number(value))
    ])
  );
}

function clamp(value, min = 0, max = 1) {
  const number = Number.isFinite(value) ? value : 0;
  return Math.min(max, Math.max(min, number));
}
