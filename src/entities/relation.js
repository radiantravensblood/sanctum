const PHASE_ORDER = ["unfamiliar", "familiar", "companionate", "friends"];


export function buildRelationPacket({ state, world }) {
  const relations = Object.values(ensureRelationState(state))
    .map((relation) => describeRelation(relation, world))
    .filter(Boolean)
    .sort((a, b) => {
      const phaseDelta =
        PHASE_ORDER.indexOf(b.phase) - PHASE_ORDER.indexOf(a.phase);
      if (phaseDelta) return phaseDelta;
      return new Date(b.lastEvidenceAt).getTime() -
        new Date(a.lastEvidenceAt).getTime();
    });

  return {
    version: 1,
    law: {
      labelsRequireEvidence:
        Boolean(world.entities.laws.relationshipLabelsRequireEvidence),
      relationshipsMayInfluenceChoice:
        Boolean(world.entities.laws.relationshipsMayInfluenceChoice)
    },
    relations
  };
}

export function relationKey(a, b) {
  return [a, b].sort().join("::");
}

export function ensureRelationState(state) {
  if (!state.entities) return {};
  if (!state.entities.relations) state.entities.relations = {};
  return state.entities.relations;
}

export function getRelation(state, a, b) {
  if (!a || !b || a === b) return null;
  const relations = ensureRelationState(state);
  return relations[relationKey(a, b)] || null;
}

export function registerRelationEvidence({
  state,
  world,
  a,
  b,
  type,
  actor = null,
  room = null,
  at = new Date().toISOString()
}) {
  if (!a || !b || a === b) return null;

  const relations = ensureRelationState(state);
  const key = relationKey(a, b);
  const relation = relations[key] || createRelation(a, b, at);
  const before = relation.phase;

  relation.lastEvidenceAt = at;
  if (room) {
    relation.lastSharedRoom = room;
    relation.rooms[room] = (relation.rooms[room] || 0) + 1;
  }

  ensurePerspective(relation, a);
  ensurePerspective(relation, b);

  switch (type) {
    case "encounter":
      relation.evidence.encounters += 1;
      break;
    case "attention":
      if (actor) relation.perspectives[actor].attention += 1;
      break;
    case "approach":
      if (actor) relation.perspectives[actor].approaches += 1;
      relation.evidence.routeConvergence += 1;
      break;
    case "linger_together":
      if (actor) relation.perspectives[actor].lingering += 1;
      relation.evidence.sharedPresence += 1;
      break;
    case "shared_rest":
      if (actor) relation.perspectives[actor].sharedRest += 1;
      relation.evidence.sharedRest += 1;
      break;
    case "reunion":
      if (actor) relation.perspectives[actor].reunions += 1;
      relation.evidence.reunions += 1;
      break;
    case "mutual_attention":
      relation.evidence.mutualAttention += 1;
      break;
    default:
      break;
  }

  relation.phase = classifyRelation(relation, world.entities.relation || {});
  relation.lastPhaseChangeAt =
    relation.phase !== before ? at : relation.lastPhaseChangeAt;

  relations[key] = relation;

  return {
    relation,
    changed: relation.phase !== before,
    from: before,
    to: relation.phase
  };
}

export function classifyRelation(relation, config = {}) {
  const phases = config.phases || {};
  const first = new Date(relation.firstEvidenceAt).getTime();
  const last = new Date(relation.lastEvidenceAt).getTime();
  const spanHours =
    Number.isFinite(first) && Number.isFinite(last)
      ? Math.max(0, last - first) / 3600000
      : 0;

  const distinctRooms = Object.keys(relation.rooms || {}).length;
  const reciprocal = relation.entities.map((id) =>
    reciprocalChoiceCount(relation.perspectives[id] || {})
  );

  if (
    meetsPhase(phases.friends, {
      encounters: relation.evidence.encounters,
      distinctRooms,
      spanHours,
      reciprocal,
      sharedRest: relation.evidence.sharedRest,
      reunions: relation.evidence.reunions
    })
  ) {
    return "friends";
  }

  if (
    meetsPhase(phases.companionate, {
      encounters: relation.evidence.encounters,
      distinctRooms,
      spanHours,
      reciprocal,
      sharedRest: relation.evidence.sharedRest,
      reunions: relation.evidence.reunions
    })
  ) {
    return "companionate";
  }

  if (
    meetsPhase(phases.familiar, {
      encounters: relation.evidence.encounters,
      distinctRooms,
      spanHours,
      reciprocal,
      sharedRest: relation.evidence.sharedRest,
      reunions: relation.evidence.reunions
    })
  ) {
    return "familiar";
  }

  return "unfamiliar";
}

export function relationChoiceBias(state, actorId, roomId) {
  if (!state.entities || !state.entities.records) return 0;

  const peers = Object.values(state.entities.records).filter(
    (record) => record.id !== actorId && record.location === roomId
  );

  return peers.reduce((sum, peer) => {
    const relation = getRelation(state, actorId, peer.id);
    if (!relation) return sum;

    const phaseBias = {
      unfamiliar: 0,
      familiar: 0.08,
      companionate: 0.18,
      friends: 0.32
    }[relation.phase] || 0;

    const actorPerspective = relation.perspectives[actorId] || {};
    const ownChoice = Math.min(
      0.14,
      reciprocalChoiceCount(actorPerspective) * 0.018
    );

    return sum + phaseBias + ownChoice;
  }, 0);
}

export function relationPhaseLabel(phase) {
  switch (phase) {
    case "familiar":
      return "familiar";
    case "companionate":
      return "companionate";
    case "friends":
      return "friends";
    default:
      return null;
  }
}

export function describeRelation(relation, world) {
  if (!relation) return null;

  const names = relation.entities.map((id) => {
    const template = (world.entities.entities || []).find(
      (entity) => entity.id === id
    );
    return template ? template.name : id;
  });

  const label = relationPhaseLabel(relation.phase);
  const roomCount = Object.keys(relation.rooms || {}).length;

  return {
    id: relation.id,
    entities: [...relation.entities],
    names,
    phase: relation.phase,
    label,
    firstEvidenceAt: relation.firstEvidenceAt,
    lastEvidenceAt: relation.lastEvidenceAt,
    lastSharedRoom: relation.lastSharedRoom,
    distinctSharedRooms: roomCount,
    evidence: {
      ...relation.evidence
    },
    perspectives: Object.fromEntries(
      Object.entries(relation.perspectives || {}).map(([id, perspective]) => [
        id,
        { ...perspective }
      ])
    )
  };
}

export function relationsForEntity(state, world, entityId) {
  return Object.values(ensureRelationState(state))
    .filter((relation) => relation.entities.includes(entityId))
    .map((relation) => describeRelation(relation, world))
    .filter(Boolean)
    .sort(
      (a, b) =>
        PHASE_ORDER.indexOf(b.phase) - PHASE_ORDER.indexOf(a.phase)
    );
}

export function seedRelationsFromLegacy(state, world) {
  const relations = ensureRelationState(state);
  if (Object.keys(relations).length) return;

  const records =
    (state.entities && state.entities.records) || {};

  Object.values(records).forEach((record) => {
    Object.values(record.relations || {}).forEach((legacy) => {
      if (!legacy.entity || legacy.entity === record.id) return;

      const key = relationKey(record.id, legacy.entity);
      const existing = relations[key];
      const first =
        legacy.firstEncounterAt ||
        legacy.lastEncounterAt ||
        record.createdAt ||
        new Date().toISOString();
      const last =
        legacy.lastEncounterAt ||
        first;

      const relation = existing || createRelation(record.id, legacy.entity, first);
      relation.evidence.encounters = Math.max(
        relation.evidence.encounters,
        Number(legacy.encounters || 0)
      );
      relation.firstEvidenceAt =
        earlierIso(relation.firstEvidenceAt, first);
      relation.lastEvidenceAt =
        laterIso(relation.lastEvidenceAt, last);

      if (legacy.lastRoom) {
        relation.lastSharedRoom = legacy.lastRoom;
        relation.rooms[legacy.lastRoom] =
          Math.max(1, relation.rooms[legacy.lastRoom] || 0);
      }

      relation.phase = classifyRelation(
        relation,
        world.entities.relation || {}
      );
      relations[key] = relation;
    });
  });
}

export function hoursSinceRelationEvidence(relation, at) {
  if (!relation || !relation.lastEvidenceAt) return Infinity;

  const before = new Date(relation.lastEvidenceAt).getTime();
  const after = new Date(at).getTime();

  if (!Number.isFinite(before) || !Number.isFinite(after)) return Infinity;
  return Math.max(0, after - before) / 3600000;
}

function createRelation(a, b, at) {
  const entities = [a, b].sort();

  return {
    id: relationKey(a, b),
    entities,
    phase: "unfamiliar",
    firstEvidenceAt: at,
    lastEvidenceAt: at,
    lastPhaseChangeAt: null,
    lastSharedRoom: null,
    rooms: {},
    evidence: {
      encounters: 0,
      sharedPresence: 0,
      sharedRest: 0,
      reunions: 0,
      routeConvergence: 0,
      mutualAttention: 0
    },
    perspectives: {
      [entities[0]]: emptyPerspective(),
      [entities[1]]: emptyPerspective()
    }
  };
}

function emptyPerspective() {
  return {
    attention: 0,
    approaches: 0,
    lingering: 0,
    sharedRest: 0,
    reunions: 0
  };
}

function ensurePerspective(relation, id) {
  relation.perspectives = relation.perspectives || {};
  relation.perspectives[id] = {
    ...emptyPerspective(),
    ...(relation.perspectives[id] || {})
  };
}

function reciprocalChoiceCount(perspective) {
  return (
    Number(perspective.attention || 0) +
    Number(perspective.approaches || 0) +
    Number(perspective.lingering || 0) +
    Number(perspective.sharedRest || 0) +
    Number(perspective.reunions || 0)
  );
}

function meetsPhase(rule, values) {
  if (!rule) return false;

  if (values.encounters < Number(rule.minEncounters || 0)) return false;
  if (values.distinctRooms < Number(rule.minDistinctRooms || 0)) return false;
  if (values.spanHours < Number(rule.minSpanHours || 0)) return false;
  if (values.sharedRest < Number(rule.minSharedRest || 0)) return false;
  if (values.reunions < Number(rule.minReunions || 0)) return false;

  const minimum = Number(rule.minReciprocalChoicesEach || 0);
  if (minimum && values.reciprocal.some((count) => count < minimum)) {
    return false;
  }

  return true;
}

function earlierIso(a, b) {
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

function laterIso(a, b) {
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}
