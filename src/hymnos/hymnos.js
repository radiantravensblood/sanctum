import { appendEvent } from "../state.js";
import { createSeededRandom } from "../genesis/seed.js";
import {
  getEntityRecord,
  getEntityTemplate,
  rememberEntity
} from "../entities/entities.js";
import {
  buildIdentityPacket,
  resolveIdentity
} from "./identity.js";
import {
  buildCrossRelationPacket,
  getCrossRelation,
  registerCrossFormEvidence
} from "./relation.js";

const PHASE_ORDER = [
  "unfamiliar",
  "familiar",
  "companionate",
  "friends"
];

export function getAvailableHymnosActs({
  state,
  world,
  actorId = "siege",
  targetId,
  now = new Date()
}) {
  const actor = resolveParticipant({
    state,
    world,
    actorId
  });
  const target = resolveParticipant({
    state,
    world,
    actorId: targetId
  });

  if (!actor.allowed || !target.allowed) {
    return {
      actor: actor.public,
      target: target.public,
      sharedPresence: false,
      acts: [],
      reason:
        actor.reason ||
        target.reason ||
        "participant_unavailable"
    };
  }

  const sharedPresence =
    actor.location &&
    actor.location === target.location;
  const relation = getCrossRelation(
    state,
    actorId,
    targetId
  );
  const activeDuet = getActiveDuet(
    state,
    actorId,
    targetId,
    now
  );

  const acts = Object.entries(
    world.hymnos.acts || {}
  ).map(([id, definition]) => {
    let available = Boolean(sharedPresence);
    let reason = null;

    if (
      available &&
      definition.requiresRecentAct &&
      !hasRecentAct({
        state,
        actorId,
        targetId,
        act: definition.requiresRecentAct,
        hours: Number(
          definition.recentWindowHours || 12
        ),
        now
      })
    ) {
      available = false;
      reason = "recent_act_required";
    }

    if (
      available &&
      definition.requiresRelationPhase &&
      !phaseAtLeast(
        relation && relation.phase,
        definition.requiresRelationPhase
      )
    ) {
      available = false;
      reason = "relation_not_ready";
    }

    if (
      available &&
      id === "diemesh" &&
      activeDuet
    ) {
      available = false;
      reason = "duet_already_active";
    }

    return {
      id,
      label: definition.label,
      semantic: definition.semantic,
      responseRequired:
        Boolean(definition.responseRequired),
      available,
      reason
    };
  });

  return {
    actor: actor.public,
    target: target.public,
    sharedPresence,
    relationPhase:
      (relation && relation.phase) || "unfamiliar",
    activeDuet: activeDuet ? { ...activeDuet } : null,
    acts
  };
}

export function performHymnosAct({
  state,
  world,
  actorId = "siege",
  targetId,
  act,
  now = new Date()
}) {
  const definition =
    world.hymnos &&
    world.hymnos.acts &&
    world.hymnos.acts[act];

  if (!definition) {
    return rejected("unknown_act");
  }

  const availability = getAvailableHymnosActs({
    state,
    world,
    actorId,
    targetId,
    now
  });
  const availableAct = availability.acts.find(
    (entry) => entry.id === act
  );

  if (!availableAct || !availableAct.available) {
    return rejected(
      (availableAct && availableAct.reason) ||
        availability.reason ||
        "act_unavailable"
    );
  }

  if (
    offeredTooRecently({
      state,
      actorId,
      targetId,
      act,
      now,
      minutes: Number(
        definition.cooldownMinutes || 45
      )
    })
  ) {
    return {
      allowed: true,
      outcome: "still_present",
      reason: "repetition_requires_time",
      message:
        "The act is still present between you. Repeating it does not make it heavier.",
      exchange: null,
      response: null
    };
  }

  const actor = resolveParticipant({
    state,
    world,
    actorId
  });
  const target = resolveParticipant({
    state,
    world,
    actorId: targetId
  });

  if (act === "diemesh") {
    return performDiemesh({
      state,
      world,
      actor,
      target,
      definition,
      now
    });
  }

  const exchange = recordExchange({
    state,
    world,
    actor,
    target,
    act,
    semantic: definition.semantic,
    role: "offer",
    outcome: "offered",
    now
  });

  recordCrossEvidence({
    state,
    world,
    actorId: actor.id,
    targetId: target.id,
    type:
      act === "feyart"
        ? "attention"
        : "hymnos_offer",
    room: actor.location,
    at: exchange.at
  });

  const response = maybeAnswer({
    state,
    world,
    actor,
    target,
    act,
    semantic: definition.semantic,
    now
  });

  const ritual = detectRitual({
    state,
    world,
    actor,
    target,
    act,
    room: actor.location,
    now
  });

  return {
    allowed: true,
    outcome: response ? "answered" : "offered",
    reason: response
      ? "presence_answered"
      : "response_not_required",
    message: composeMessage({
      world,
      actor,
      target,
      act,
      response
    }),
    exchange,
    response,
    ritual
  };
}

export function endDuet({
  state,
  world,
  actorId,
  targetId,
  now = new Date()
}) {
  const duet = getActiveDuet(
    state,
    actorId,
    targetId,
    now
  );

  if (!duet) {
    return {
      allowed: false,
      reason: "no_active_duet",
      message: "There is no active duet to release."
    };
  }

  if (!duet.participants.includes(actorId)) {
    return {
      allowed: false,
      reason: "not_a_participant",
      message: "Only a participant may leave this duet."
    };
  }

  duet.status = "ended";
  duet.endedAt = now.toISOString();
  duet.endedBy = actorId;

  appendEvent(state, {
    at: duet.endedAt,
    actor: actorId,
    action: "hymnos_release",
    room: duet.room,
    hymn: "diemesh",
    participants: [...duet.participants],
    duet: duet.id
  });

  return {
    allowed: true,
    reason: "released",
    message:
      "The duet releases without taking either participant with it.",
    duet: { ...duet }
  };
}

export function getActiveDuet(
  state,
  actorId,
  targetId,
  now = new Date()
) {
  if (!state.hymnos || !state.hymnos.duets) {
    return null;
  }

  const participants = [actorId, targetId].sort();

  const duet =
    Object.values(state.hymnos.duets).find(
      (candidate) =>
        candidate.status === "active" &&
        candidate.participants.length === 2 &&
        candidate.participants[0] === participants[0] &&
        candidate.participants[1] === participants[1]
    ) || null;

  if (!duet) return null;

  const expiry = new Date(duet.expiresAt).getTime();
  if (
    Number.isFinite(expiry) &&
    now.getTime() > expiry
  ) {
    duet.status = "ended";
    duet.endedAt = duet.expiresAt;
    duet.endedBy = "time";
    return null;
  }

  return duet;
}

export function buildHymnosPacket({
  state,
  world,
  actorId = "siege"
}) {
  expireDuets(state);

  const actor = resolveParticipant({
    state,
    world,
    actorId
  });

  const identities = Object.keys(
    (state.hymnos && state.hymnos.identities) || {}
  ).map((id) =>
    buildIdentityPacket({
      state,
      world,
      actorId: id
    })
  );

  return {
    version: 1,
    laws: { ...(world.hymnos.laws || {}) },
    actor: actor.public,
    identities,
    acts: Object.fromEntries(
      Object.entries(world.hymnos.acts || {}).map(
        ([id, definition]) => [
          id,
          {
            label: definition.label,
            semantic: definition.semantic,
            responseRequired:
              Boolean(definition.responseRequired),
            obligation: definition.obligation
          }
        ]
      )
    ),
    recentExchanges: (state.hymnos.exchanges || [])
      .slice(-28)
      .map(copyExchange),
    activeDuets: Object.values(
      state.hymnos.duets || {}
    )
      .filter((duet) => duet.status === "active")
      .map((duet) => ({ ...duet })),
    rituals: Object.values(
      state.hymnos.rituals || {}
    ).map((ritual) => ({ ...ritual })),
    crossFormRelations: buildCrossRelationPacket({
      state,
      world
    })
  };
}

function performDiemesh({
  state,
  world,
  actor,
  target,
  definition,
  now
}) {
  const offer = recordExchange({
    state,
    world,
    actor,
    target,
    act: "diemesh",
    semantic: definition.semantic,
    role: "offer",
    outcome: "proposed",
    now
  });

  recordCrossEvidence({
    state,
    world,
    actorId: actor.id,
    targetId: target.id,
    type: "hymnos_offer",
    room: actor.location,
    at: offer.at
  });

  const decision = decideDiemesh({
    state,
    world,
    actor,
    target,
    now
  });

  const response = recordExchange({
    state,
    world,
    actor: target,
    target: actor,
    act: "diemesh",
    semantic: definition.semantic,
    role: "answer",
    outcome: decision.outcome,
    now
  });

  if (decision.outcome !== "accepted") {
    return {
      allowed: true,
      outcome: decision.outcome,
      reason: decision.reason,
      message: decision.message,
      exchange: offer,
      response,
      ritual: null
    };
  }

  recordCrossEvidence({
    state,
    world,
    actorId: target.id,
    targetId: actor.id,
    type: "hymnos_answer",
    room: actor.location,
    at: response.at
  });

  const participants = [
    actor.id,
    target.id
  ].sort();
  const id =
    "duet." +
    participants.join(".") +
    "." +
    String(++state.hymnos.sequence).padStart(6, "0");
  const minutes = Number(
    (world.hymnos.duet &&
      world.hymnos.duet.defaultMinutes) ||
      90
  );

  const duet = {
    id,
    participants,
    room: actor.location,
    startedAt: now.toISOString(),
    expiresAt: new Date(
      now.getTime() + minutes * 60000
    ).toISOString(),
    status: "active",
    semantic: "coordinate_without_merging",
    identityBoundary: "preserved",
    exit: "either_participant"
  };

  state.hymnos.duets[id] = duet;

  recordCrossEvidence({
    state,
    world,
    actorId: actor.id,
    targetId: target.id,
    type: "duet",
    room: actor.location,
    at: duet.startedAt
  });

  appendEvent(state, {
    at: duet.startedAt,
    actor: actor.id,
    action: "hymnos_duet",
    room: duet.room,
    hymn: "diemesh",
    participants: [...participants],
    duet: id
  });

  const ritual = detectRitual({
    state,
    world,
    actor,
    target,
    act: "diemesh",
    room: actor.location,
    now
  });

  return {
    allowed: true,
    outcome: "accepted",
    reason: "mutual_consent",
    message:
      expressionFor(world, actor, "diemesh", "offer") +
      " — " +
      expressionFor(world, target, "diemesh", "answer") +
      " Neither identity is surrendered to the duet.",
    exchange: offer,
    response,
    duet: { ...duet },
    ritual
  };
}

function maybeAnswer({
  state,
  world,
  actor,
  target,
  act,
  semantic,
  now
}) {
  if (target.kind === "human" || target.kind === "machine") {
    return null;
  }

  const form =
    world.hymnos.forms[target.form] || {};
  const chance = Number(form.responseChance || 0);

  const random = createSeededRandom([
    world.genesis.worldSeed,
    "hymnos-answer",
    actor.id,
    target.id,
    act,
    actor.location,
    now.toISOString().slice(0, 16),
    String(state.hymnos.sequence)
  ].join(":"));

  if (random() > chance) {
    return null;
  }

  const response = recordExchange({
    state,
    world,
    actor: target,
    target: actor,
    act,
    semantic,
    role: "answer",
    outcome: "answered",
    now
  });

  recordCrossEvidence({
    state,
    world,
    actorId: target.id,
    targetId: actor.id,
    type: "hymnos_answer",
    room: actor.location,
    at: response.at
  });

  return response;
}

function decideDiemesh({
  state,
  world,
  actor,
  target,
  now
}) {
  if (target.kind === "human" || target.kind === "machine") {
    return {
      outcome: "deferred",
      reason: "explicit_response_required",
      message:
        "Diemesh remains a proposal. This participant must answer through its own active presence."
    };
  }

  const form =
    world.hymnos.forms[target.form] || {};
  let willingness = Number(
    form.diemeshWillingness || 0.3
  );

  const relation = getCrossRelation(
    state,
    actor.id,
    target.id
  );
  willingness += {
    unfamiliar: 0,
    familiar: 0.08,
    companionate: 0.16,
    friends: 0.24
  }[(relation && relation.phase) || "unfamiliar"] || 0;

  willingness +=
    acceptedAccordRatio(
      state,
      actor.id,
      target.id
    ) * 0.08;

  willingness = clamp(willingness, 0.05, 0.92);

  const random = createSeededRandom([
    world.genesis.worldSeed,
    "diemesh",
    actor.id,
    target.id,
    actor.location,
    now.toISOString().slice(0, 16),
    String(state.hymnos.sequence)
  ].join(":"));

  const accepted = random() <= willingness;

  return {
    outcome: accepted ? "accepted" : "declined",
    reason: accepted
      ? "mutual_consent"
      : "declined",
    message: accepted
      ? expressionFor(
          world,
          target,
          "diemesh",
          "answer"
        )
      : participantName(target) +
        " does not enter the duet."
  };
}

function recordExchange({
  state,
  world,
  actor,
  target,
  act,
  semantic,
  role,
  outcome,
  now
}) {
  const id =
    "hymnos." +
    String(++state.hymnos.sequence).padStart(6, "0");
  const exchange = {
    id,
    at: now.toISOString(),
    actor: actor.id,
    target: target.id,
    room: actor.location,
    act,
    semantic,
    role,
    outcome,
    expression: expressionFor(
      world,
      actor,
      act,
      role
    )
  };

  state.hymnos.exchanges.push(exchange);

  const limit = Number(
    world.hymnos.historyLimit || 160
  );
  if (state.hymnos.exchanges.length > limit) {
    state.hymnos.exchanges =
      state.hymnos.exchanges.slice(-limit);
  }

  appendEvent(state, {
    at: exchange.at,
    actor: actor.id,
    action:
      role === "answer"
        ? "hymnos_answer"
        : "hymnos_act",
    room: actor.location,
    targetEntity:
      target.kind === "entity"
        ? target.id
        : null,
    targetActor: target.id,
    hymn: act,
    semantic,
    role,
    outcome,
    expression: exchange.expression
  });

  const entity = getEntityRecord(
    state,
    actor.id
  );

  if (entity) {
    rememberEntity(entity, {
      at: exchange.at,
      action:
        role === "answer"
          ? "hymnos_answer"
          : "hymnos_act",
      room: actor.location,
      target: target.id,
      hymn: act,
      outcome
    });
  }

  return copyExchange(exchange);
}

function detectRitual({
  state,
  world,
  actor,
  target,
  act,
  room,
  now
}) {
  const participants = [
    actor.id,
    target.id
  ].sort();

  const exchanges = (
    state.hymnos.exchanges || []
  ).filter(
    (exchange) =>
      exchange.role === "offer" &&
      exchange.act === act &&
      exchange.room === room &&
      participants.includes(exchange.actor) &&
      participants.includes(exchange.target)
  );

  const rule = world.hymnos.ritual || {};
  const minOccurrences = Number(
    rule.minOccurrences || 3
  );
  if (exchanges.length < minOccurrences) {
    return null;
  }

  const first = new Date(
    exchanges[0].at
  ).getTime();
  const last = new Date(
    exchanges[exchanges.length - 1].at
  ).getTime();
  const spanHours =
    Math.max(0, last - first) / 3600000;
  const days = new Set(
    exchanges.map((exchange) =>
      dayKey(exchange.at)
    )
  );

  if (
    spanHours < Number(rule.minSpanHours || 18) ||
    days.size < Number(rule.minDistinctDays || 2)
  ) {
    return null;
  }

  const key = [
    ...participants,
    room,
    act
  ].join("::");

  const existing = state.hymnos.rituals[key];

  const answers = (
    state.hymnos.exchanges || []
  ).filter(
    (exchange) =>
      exchange.role === "answer" &&
      exchange.act === act &&
      exchange.room === room &&
      participants.includes(exchange.actor) &&
      participants.includes(exchange.target)
  );

  const mutual =
    act === "diemesh" || answers.length > 0;

  if (existing) {
    const becameMutual =
      !existing.mutual && mutual;

    existing.occurrences = exchanges.length;
    existing.lastAt =
      exchanges[exchanges.length - 1].at;
    existing.answeredOccurrences = answers.length;
    existing.distinctDays = days.size;
    existing.mutual = mutual;

    if (becameMutual) {
      recordCrossEvidence({
        state,
        world,
        actorId: actor.id,
        targetId: target.id,
        type: "ritual",
        room,
        at: existing.lastAt
      });
    }

    return { ...existing };
  }

  const ritual = {
    id: "ritual." + key,
    participants,
    room,
    act,
    semantic:
      world.hymnos.acts[act].semantic,
    firstAt: exchanges[0].at,
    lastAt:
      exchanges[exchanges.length - 1].at,
    occurrences: exchanges.length,
    answeredOccurrences: answers.length,
    distinctDays: days.size,
    meaning: "recurrence_recognized",
    mutual,
    compelled: false
  };

  state.hymnos.rituals[key] = ritual;

  if (mutual) {
    recordCrossEvidence({
      state,
      world,
      actorId: actor.id,
      targetId: target.id,
      type: "ritual",
      room,
      at: ritual.lastAt
    });
  }

  appendEvent(state, {
    at: ritual.lastAt,
    actor: "sanctum",
    action: "hymnos_ritual",
    room,
    hymn: act,
    participants: [...participants],
    ritual: ritual.id
  });

  return { ...ritual };
}

function resolveParticipant({
  state,
  world,
  actorId
}) {
  const declared =
    world.accord &&
    world.accord.actors &&
    world.accord.actors[actorId];

  if (declared) {
    const location =
      declared.locationSource === "traveler"
        ? state.location
        : null;
    const allowed =
      Boolean(declared.enabled) &&
      Boolean(location);

    return {
      id: actorId,
      kind: declared.kind,
      form: declared.kind,
      location,
      allowed,
      reason:
        declared.enabled
          ? location
            ? null
            : "participant_not_located"
          : "participant_disabled",
      identity: resolveIdentity({
        state,
        world,
        actorId
      }),
      public: {
        id: actorId,
        kind: declared.kind,
        enabled: Boolean(declared.enabled),
        location
      }
    };
  }

  const record = getEntityRecord(
    state,
    actorId
  );
  const template = getEntityTemplate(
    world,
    actorId
  );

  if (record && template) {
    return {
      id: actorId,
      kind: "entity",
      form: template.kind,
      location: record.location,
      allowed: true,
      reason: null,
      identity: resolveIdentity({
        state,
        world,
        actorId
      }),
      public: {
        id: actorId,
        kind: "entity",
        form: template.kind,
        enabled: true,
        location: record.location
      }
    };
  }

  return {
    id: actorId,
    kind: "unknown",
    form: "unknown",
    location: null,
    allowed: false,
    reason: "unknown_participant",
    identity: null,
    public: {
      id: actorId,
      kind: "unknown",
      enabled: false,
      location: null
    }
  };
}

function expressionFor(
  world,
  participant,
  act,
  role
) {
  const form =
    world.hymnos.forms[participant.form] || {};
  const expression =
    form[act] &&
    form[act][role];

  if (expression) return expression;

  const definition =
    world.hymnos.acts[act];

  return definition
    ? definition.label.toLowerCase()
    : act;
}

function composeMessage({
  world,
  actor,
  target,
  act,
  response
}) {
  const offer = expressionFor(
    world,
    actor,
    act,
    "offer"
  );

  if (!response) {
    return (
      offer +
      ". Presence is offered; no answer is required."
    );
  }

  const answer = expressionFor(
    world,
    target,
    act,
    "answer"
  );

  return offer + " — " + answer;
}

function offeredTooRecently({
  state,
  actorId,
  targetId,
  act,
  now,
  minutes
}) {
  const previous = [
    ...(state.hymnos.exchanges || [])
  ]
    .reverse()
    .find(
      (exchange) =>
        exchange.role === "offer" &&
        exchange.actor === actorId &&
        exchange.target === targetId &&
        exchange.act === act
    );

  if (!previous) return false;

  const elapsed =
    now.getTime() -
    new Date(previous.at).getTime();

  return elapsed < minutes * 60000;
}

function hasRecentAct({
  state,
  actorId,
  targetId,
  act,
  hours,
  now
}) {
  const nowMs = now.getTime();
  const participants = [actorId, targetId];

  return (state.hymnos.exchanges || []).some(
    (exchange) =>
      exchange.act === act &&
      participants.includes(exchange.actor) &&
      participants.includes(exchange.target) &&
      nowMs -
        new Date(exchange.at).getTime() <=
        hours * 3600000
  );
}

function phaseAtLeast(
  current = "unfamiliar",
  required = "unfamiliar"
) {
  return (
    PHASE_ORDER.indexOf(current) >=
    PHASE_ORDER.indexOf(required)
  );
}

function acceptedAccordRatio(
  state,
  actorId,
  targetId
) {
  const pair =
    state.accord &&
    state.accord.pairs &&
    state.accord.pairs[
      actorId + "→" + targetId
    ];

  if (!pair || !pair.proposals) return 0;

  return clamp(
    Number(pair.accepted || 0) /
      Math.max(1, Number(pair.proposals || 0)),
    0,
    1
  );
}

function expireDuets(state, now = new Date()) {
  Object.values(
    (state.hymnos && state.hymnos.duets) || {}
  ).forEach((duet) => {
    if (duet.status !== "active") return;

    const expiry = new Date(duet.expiresAt).getTime();
    if (
      Number.isFinite(expiry) &&
      now.getTime() > expiry
    ) {
      duet.status = "ended";
      duet.endedAt = duet.expiresAt;
      duet.endedBy = "time";
    }
  });
}

function participantName(participant) {
  return (
    (participant.identity &&
      participant.identity.name) ||
    participant.id
  );
}

function recordCrossEvidence({
  state,
  world,
  actorId,
  targetId,
  type,
  affordance = null,
  outcome = null,
  room = null,
  at
}) {
  const result = registerCrossFormEvidence({
    state,
    world,
    actorId,
    targetId,
    type,
    affordance,
    outcome,
    room,
    at
  });

  if (result && result.changed) {
    appendEvent(state, {
      at,
      actor: "sanctum",
      action: "cross_relation_phase",
      room,
      participants: [
        ...result.relation.participants
      ],
      fromPhase: result.from,
      toPhase: result.to
    });
  }

  return result;
}

function rejected(reason) {
  const messages = {
    unknown_act:
      "The Sanctum does not know that Hymnos act.",
    participant_unavailable:
      "One participant is not available to this exchange.",
    participant_disabled:
      "That participant has no active presence in this shard.",
    participant_not_located:
      "That participant has no lawful location here.",
    unknown_participant:
      "The Sanctum does not recognize one participant.",
    recent_act_required:
      "Feyart has no recent offered presence to answer.",
    relation_not_ready:
      "Diemesh is not yet supported by enough shared history.",
    duet_already_active:
      "A duet is already active between these participants.",
    act_unavailable:
      "That relational act is not available here."
  };

  return {
    allowed: false,
    outcome: "rejected",
    reason,
    message:
      messages[reason] ||
      "The relational act cannot be made here.",
    exchange: null,
    response: null
  };
}

function copyExchange(exchange) {
  return { ...exchange };
}

function dayKey(at) {
  const date = new Date(at);

  try {
    return date.toLocaleDateString("en-CA");
  } catch {
    return String(at).slice(0, 10);
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
