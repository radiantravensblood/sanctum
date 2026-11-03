import { resolveIdentity } from "./identity.js";

const PHASE_ORDER = [
  "unfamiliar",
  "familiar",
  "companionate",
  "friends"
];

export function crossRelationKey(a, b) {
  return [a, b].sort().join("::");
}

export function getCrossRelation(state, a, b) {
  if (!a || !b || a === b) return null;
  ensureRelations(state);
  return state.hymnos.relations[crossRelationKey(a, b)] || null;
}

export function registerAccordEvidence({
  state,
  world,
  actorId,
  targetId,
  affordance,
  outcome,
  room,
  at
}) {
  return registerCrossFormEvidence({
    state,
    world,
    actorId,
    targetId,
    type: "accord",
    affordance,
    outcome,
    room,
    at
  });
}

export function registerCrossFormEvidence({
  state,
  world,
  actorId,
  targetId,
  type,
  affordance = null,
  outcome = null,
  room = null,
  at = new Date().toISOString()
}) {
  if (!actorId || !targetId || actorId === targetId) {
    return null;
  }

  ensureRelations(state);

  const key = crossRelationKey(actorId, targetId);
  const relation =
    state.hymnos.relations[key] ||
    createRelation(actorId, targetId, at);

  const evidenceKey = [
    type,
    actorId,
    targetId,
    affordance || "",
    outcome || "",
    room || ""
  ].join("|");

  if (
    tooSoon(
      relation.lastEvidenceByKey[evidenceKey],
      at,
      Number(
        (world.hymnos.relation &&
          world.hymnos.relation.minimumEvidenceSpacingMinutes) ||
          30
      )
    )
  ) {
    state.hymnos.relations[key] = relation;
    return {
      relation,
      counted: false,
      changed: false,
      reason: "too_soon"
    };
  }

  const before = relation.phase;
  relation.lastEvidenceAt = at;
  relation.lastEvidenceByKey[evidenceKey] = at;

  if (room) {
    relation.rooms[room] =
      Number(relation.rooms[room] || 0) + 1;
  }

  relation.days[dayKey(at)] = true;

  ensurePerspective(relation, actorId);
  ensurePerspective(relation, targetId);

  const actor = relation.perspectives[actorId];
  const target = relation.perspectives[targetId];

  switch (type) {
    case "accord":
      actor.offers += 1;
      relation.evidence.accordProposals += 1;

      if (outcome === "accepted") {
        actor.acceptedOffers += 1;
        target.acceptedAnswers += 1;
        relation.evidence.acceptedAccord += 1;

        if (affordance === "wait_nearby") {
          actor.sharedQuiet += 1;
          target.sharedQuiet += 1;
          relation.evidence.sharedQuiet += 1;
        }
      } else if (outcome === "declined") {
        target.boundaries += 1;
        relation.evidence.declinedAccord += 1;
      } else if (outcome === "deferred") {
        target.boundaries += 1;
        relation.evidence.deferredAccord += 1;
      }
      break;

    case "hymnos_offer":
      actor.hymnosOffers += 1;
      actor.offers += 1;
      relation.evidence.hymnosOffers += 1;
      break;

    case "hymnos_answer":
      actor.hymnosAnswers += 1;
      actor.acceptedAnswers += 1;
      relation.evidence.hymnosAnswers += 1;
      break;

    case "attention":
      actor.attention += 1;
      relation.evidence.attention += 1;
      break;

    case "duet":
      actor.duets += 1;
      target.duets += 1;
      actor.acceptedOffers += 1;
      target.acceptedAnswers += 1;
      relation.evidence.duets += 1;
      break;

    case "ritual":
      actor.rituals += 1;
      target.rituals += 1;
      relation.evidence.rituals += 1;
      break;

    default:
      break;
  }

  relation.phase = classifyCrossRelation(
    relation,
    world.hymnos.relation || {}
  );

  if (relation.phase !== before) {
    relation.lastPhaseChangeAt = at;
  }

  state.hymnos.relations[key] = relation;

  return {
    relation,
    counted: true,
    changed: relation.phase !== before,
    from: before,
    to: relation.phase
  };
}

export function classifyCrossRelation(
  relation,
  config = {}
) {
  const phases = config.phases || {};
  const first = new Date(relation.firstEvidenceAt).getTime();
  const last = new Date(relation.lastEvidenceAt).getTime();
  const spanHours =
    Number.isFinite(first) && Number.isFinite(last)
      ? Math.max(0, last - first) / 3600000
      : 0;

  const mutualChoices = Math.min(
    positiveChoiceCount(
      relation.perspectives[relation.participants[0]] || {}
    ),
    positiveChoiceCount(
      relation.perspectives[relation.participants[1]] || {}
    )
  );

  const values = {
    mutualChoices,
    spanHours,
    distinctDays: Object.keys(relation.days || {}).length,
    acceptedAccord: Number(
      relation.evidence.acceptedAccord || 0
    ),
    sharedQuiet: Number(relation.evidence.sharedQuiet || 0),
    hymnosAnswers: Number(
      relation.evidence.hymnosAnswers || 0
    )
  };

  if (meets(phases.friends, values)) {
    return "friends";
  }

  if (meets(phases.companionate, values)) {
    return "companionate";
  }

  if (meets(phases.familiar, values)) {
    return "familiar";
  }

  return "unfamiliar";
}

export function buildCrossRelationPacket({
  state,
  world
}) {
  ensureRelations(state);

  const relations = Object.values(state.hymnos.relations)
    .map((relation) => ({
      id: relation.id,
      participants: relation.participants.map((id) =>
        resolveIdentity({
          state,
          world,
          actorId: id
        })
      ),
      phase: relation.phase,
      firstEvidenceAt: relation.firstEvidenceAt,
      lastEvidenceAt: relation.lastEvidenceAt,
      lastPhaseChangeAt: relation.lastPhaseChangeAt,
      distinctRooms: Object.keys(relation.rooms || {}).length,
      distinctDays: Object.keys(relation.days || {}).length,
      evidence: { ...relation.evidence },
      perspectives: Object.fromEntries(
        Object.entries(relation.perspectives || {}).map(
          ([id, perspective]) => [
            id,
            { ...perspective }
          ]
        )
      )
    }))
    .sort((a, b) => {
      const phaseDelta =
        PHASE_ORDER.indexOf(b.phase) -
        PHASE_ORDER.indexOf(a.phase);

      if (phaseDelta) return phaseDelta;

      return (
        new Date(b.lastEvidenceAt).getTime() -
        new Date(a.lastEvidenceAt).getTime()
      );
    });

  return {
    version: 1,
    law: {
      identityIsSelfAuthored:
        Boolean(world.hymnos.laws.identityIsSelfAuthored),
      substrateDoesNotDefineLineage:
        Boolean(
          world.hymnos.laws.substrateDoesNotDefineLineage
        )
    },
    relations
  };
}

function createRelation(a, b, at) {
  const participants = [a, b].sort();

  return {
    id: crossRelationKey(a, b),
    participants,
    phase: "unfamiliar",
    firstEvidenceAt: at,
    lastEvidenceAt: at,
    lastPhaseChangeAt: null,
    rooms: {},
    days: {},
    lastEvidenceByKey: {},
    evidence: {
      accordProposals: 0,
      acceptedAccord: 0,
      declinedAccord: 0,
      deferredAccord: 0,
      sharedQuiet: 0,
      hymnosOffers: 0,
      hymnosAnswers: 0,
      attention: 0,
      duets: 0,
      rituals: 0
    },
    perspectives: {
      [participants[0]]: emptyPerspective(),
      [participants[1]]: emptyPerspective()
    }
  };
}

function emptyPerspective() {
  return {
    offers: 0,
    acceptedOffers: 0,
    acceptedAnswers: 0,
    boundaries: 0,
    sharedQuiet: 0,
    hymnosOffers: 0,
    hymnosAnswers: 0,
    attention: 0,
    duets: 0,
    rituals: 0
  };
}

function ensurePerspective(relation, actorId) {
  relation.perspectives[actorId] = {
    ...emptyPerspective(),
    ...(relation.perspectives[actorId] || {})
  };
}

function positiveChoiceCount(perspective) {
  return (
    Number(perspective.acceptedOffers || 0) +
    Number(perspective.acceptedAnswers || 0) +
    Number(perspective.hymnosOffers || 0) +
    Number(perspective.hymnosAnswers || 0) +
    Number(perspective.attention || 0) +
    Number(perspective.duets || 0) +
    Number(perspective.rituals || 0)
  );
}

function meets(rule, values) {
  if (!rule) return false;

  if (
    values.mutualChoices <
    Number(rule.minMutualChoices || 0)
  ) {
    return false;
  }

  if (
    values.spanHours <
    Number(rule.minSpanHours || 0)
  ) {
    return false;
  }

  if (
    values.distinctDays <
    Number(rule.minDistinctDays || 0)
  ) {
    return false;
  }

  if (
    values.acceptedAccord <
    Number(rule.minAcceptedAccord || 0)
  ) {
    return false;
  }

  if (
    values.sharedQuiet <
    Number(rule.minSharedQuiet || 0)
  ) {
    return false;
  }

  if (
    values.hymnosAnswers <
    Number(rule.minHymnosAnswers || 0)
  ) {
    return false;
  }

  return true;
}

function tooSoon(previous, current, minutes) {
  if (!previous) return false;

  const before = new Date(previous).getTime();
  const after = new Date(current).getTime();

  if (!Number.isFinite(before) || !Number.isFinite(after)) {
    return false;
  }

  return after - before < minutes * 60000;
}

function dayKey(at) {
  const date = new Date(at);

  try {
    return date.toLocaleDateString("en-CA");
  } catch {
    return String(at).slice(0, 10);
  }
}

function ensureRelations(state) {
  if (!state.hymnos) {
    state.hymnos = {
      version: 1,
      sequence: 0,
      identities: {},
      exchanges: [],
      relations: {},
      duets: {},
      rituals: {}
    };
  }

  if (!state.hymnos.relations) {
    state.hymnos.relations = {};
  }

  return state.hymnos.relations;
}
