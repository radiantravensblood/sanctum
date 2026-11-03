import { appendEvent } from "../state.js";
import { createSeededRandom } from "../genesis/seed.js";
import { getObject, getRoom, getThresholdState, isGeneratedRoom } from "../world.js";
import { getObjectMemory } from "../memory/mnemosyne.js";
import { getEntityRecord, getEntityTemplate, rememberEntity } from "../entities/entities.js";
import { getRelation } from "../entities/relation.js";
import { createInitialAccordState } from "./state.js";
import { registerAccordEvidence } from "../hymnos/relation.js";

export function getAvailableAffordances({
  state,
  world,
  actorId = "siege",
  targetId
}) {
  const actor = resolveActor(state, world, actorId);
  const target = getEntityRecord(state, targetId);
  const template = getEntityTemplate(world, targetId);

  if (!actor.allowed) {
    return {
      actor: actor.public,
      target: targetId,
      sharedPresence: false,
      affordances: [],
      reason: actor.reason
    };
  }

  if (!target || !template) {
    return {
      actor: actor.public,
      target: targetId,
      sharedPresence: false,
      affordances: [],
      reason: "target_unavailable"
    };
  }

  const sharedPresence = actor.location === target.location;

  const affordances = Object.entries(world.accord.affordances || {}).map(
    ([id, definition]) => {
      const policy = consentPolicy(template, id);
      const base = {
        id,
        label: definition.label,
        kind: definition.kind,
        sharedPresence,
        available: sharedPresence && policy.mode !== "deny"
      };

      if (definition.requiresObject) {
        const objects = carriedObjectsForActor(state, world, actor);
        return {
          ...base,
          available: base.available && objects.length > 0,
          objects: objects.map((object) => ({
            id: object.id,
            name: object.name
          }))
        };
      }

      return base;
    }
  );

  return {
    actor: actor.public,
    target: {
      id: targetId,
      name: template.name
    },
    sharedPresence,
    affordances
  };
}

export function proposeInteraction({
  state,
  world,
  actorId = "siege",
  targetId,
  affordance,
  objectId = null,
  now = new Date()
}) {
  const actor = resolveActor(state, world, actorId);
  const target = getEntityRecord(state, targetId);
  const template = getEntityTemplate(world, targetId);
  const definition =
    world.accord &&
    world.accord.affordances &&
    world.accord.affordances[affordance];

  if (!actor.allowed) {
    return rejected(actor.reason || "actor_not_allowed");
  }

  if (!definition) {
    return rejected("unknown_affordance");
  }

  if (!target || !template) {
    return rejected("target_unavailable");
  }

  if (actor.id === targetId) {
    return rejected("self_target");
  }

  if (
    world.accord.laws.interactionRequiresSharedPresence &&
    actor.location !== target.location
  ) {
    return rejected("not_co_located");
  }

  if (
    definition.requiresObject &&
    !actorMayOfferObject(state, world, actor, objectId)
  ) {
    return rejected("object_not_available");
  }

  const policy = consentPolicy(template, affordance);
  const decision = decideConsent({
    state,
    world,
    actor,
    target,
    template,
    affordance,
    policy,
    objectId,
    now
  });

  const event = recordInteraction({
    state,
    world,
    actor,
    target,
    template,
    affordance,
    objectId,
    decision,
    now
  });

  applyAcceptedEffect({
    state,
    world,
    actor,
    target,
    template,
    affordance,
    objectId,
    decision,
    now
  });

  return {
    allowed: true,
    outcome: decision.outcome,
    reason: decision.reason,
    message: decision.message,
    event: copyEvent(event)
  };
}

export function resolveAcceptedCompany({
  state,
  world,
  actorId = "siege",
  from,
  to,
  direction,
  now = new Date()
}) {
  const messages = [];
  const invitations = Object.values(
    (state.accord && state.accord.invitations) || {}
  ).filter(
    (invitation) =>
      invitation.actorId === actorId &&
      invitation.status === "accepted"
  );

  for (const invitation of invitations) {
    const target = getEntityRecord(state, invitation.targetId);
    const template = getEntityTemplate(world, invitation.targetId);

    if (!target || !template) {
      invitation.status = "expired";
      continue;
    }

    if (target.location !== from) {
      continue;
    }

    const expiry = new Date(invitation.expiresAt).getTime();
    if (Number.isFinite(expiry) && now.getTime() > expiry) {
      invitation.status = "expired";
      continue;
    }

    if (!entityMayTraverseActorExit({
      state,
      world,
      from,
      to,
      direction
    })) {
      invitation.status = "resolved";
      invitation.resolution = "boundary";

      const message =
        template.name +
        " does not follow through that threshold.";

      appendEvent(state, {
        actor: template.id,
        action: "interaction_boundary",
        room: from,
        entity: template.id,
        targetEntity: template.id,
        companion: actorId,
        affordance: "invite_company",
        outcome: "declined",
        reason: "boundary"
      });

      rememberEntity(target, {
        at: now.toISOString(),
        action: "declined_company",
        room: from,
        by: actorId,
        reason: "boundary"
      });

      messages.push(message);
      continue;
    }

    const policy = consentPolicy(template, "invite_company");
    const chance = clamp(
      Number(policy.followChance || 0.68) +
        previousAcceptanceBias(state, actorId, template.id) * 0.08,
      0.05,
      0.95
    );

    const random = createSeededRandom([
      world.genesis.worldSeed,
      "accompany",
      actorId,
      template.id,
      from,
      to,
      now.toISOString(),
      String(state.accord.sequence)
    ].join(":"));

    invitation.status = "resolved";

    if (random() <= chance) {
      target.location = to;
      target.lastMovedAt = now.toISOString();
      target.status = "accompanying";
      target.focus = actorId;
      invitation.resolution = "followed";

      const event = {
        at: now.toISOString(),
        action: "entity_accompany",
        from,
        to,
        entity: template.id,
        companion: actorId,
        reason: "accepted_invitation"
      };

      rememberEntity(target, event);
      appendEvent(state, {
        ...event,
        actor: template.id
      });

      messages.push(template.name + " chooses to come with you.");
    } else {
      invitation.resolution = "remained";

      const event = {
        at: now.toISOString(),
        action: "interaction_boundary",
        room: from,
        entity: template.id,
        companion: actorId,
        affordance: "invite_company",
        outcome: "declined",
        reason: "remained"
      };

      rememberEntity(target, {
        ...event,
        action: "declined_company"
      });
      appendEvent(state, {
        ...event,
        actor: template.id
      });

      messages.push(template.name + " chooses to remain behind.");
    }
  }

  return {
    messages
  };
}

export function buildAccordPacket({
  state,
  world,
  actorId = "siege"
}) {
  const actor = resolveActor(state, world, actorId);

  return {
    version: 1,
    laws: { ...(world.accord.laws || {}) },
    actor: actor.public,
    recentInteractions: (state.accord.history || [])
      .slice(-24)
      .map(copyEvent),
    invitations: Object.values(state.accord.invitations || {})
      .map((invitation) => ({ ...invitation })),
    localAffordances:
      actor.allowed && actor.location
        ? (world.entities.entities || [])
            .map((template) => {
              const record = getEntityRecord(state, template.id);
              if (!record || record.location !== actor.location) return null;
              return getAvailableAffordances({
                state,
                world,
                actorId,
                targetId: template.id
              });
            })
            .filter(Boolean)
        : []
  };
}

function decideConsent({
  state,
  world,
  actor,
  target,
  template,
  affordance,
  policy,
  objectId,
  now
}) {
  if (policy.mode === "deny") {
    return {
      outcome: policy.defer ? "deferred" : "declined",
      reason: "policy",
      message: chooseMessage(
        policy,
        policy.defer ? "deferred" : "declined",
        template,
        affordance,
        state,
        actor.id
      )
    };
  }

  if (policy.mode === "allow") {
    return {
      outcome: "accepted",
      reason: "policy",
      message: chooseMessage(
        policy,
        "accepted",
        template,
        affordance,
        state,
        actor.id
      )
    };
  }

  if (
    Array.isArray(policy.deferWhen) &&
    policy.deferWhen.includes(target.status)
  ) {
    return {
      outcome: "deferred",
      reason: "current_state",
      message: chooseMessage(
        policy,
        "deferred",
        template,
        affordance,
        state,
        actor.id
      )
    };
  }

  const requirements = policy.requiresAccepted || [];
  const missing = requirements.filter(
    (required) =>
      !hasAcceptedInteraction(state, actor.id, template.id, required)
  );

  if (missing.length) {
    return {
      outcome: "deferred",
      reason: "not_yet",
      message: chooseMessage(
        policy,
        "deferred",
        template,
        affordance,
        state,
        actor.id
      )
    };
  }

  let willingness = Number(policy.baseWillingness || 0.5);

  willingness += previousAcceptanceBias(
    state,
    actor.id,
    template.id
  ) * Number(policy.historyInfluence || 0.12);

  if (
    Array.isArray(policy.preferredWhen) &&
    policy.preferredWhen.includes(target.status)
  ) {
    willingness += Number(policy.preferredStateBonus || 0.1);
  }

  if (
    objectId &&
    Array.isArray(policy.preferredObjectTemplates)
  ) {
    const object = getObject(world, state, objectId);
    if (
      object &&
      policy.preferredObjectTemplates.includes(
        object.templateId || object.id
      )
    ) {
      willingness += Number(policy.preferredObjectBonus || 0.16);
    }
  }

  if (objectId && Number(policy.objectMemoryInfluence || 0) > 0) {
    const memory = getObjectMemory(state, objectId);
    const weight = Math.min(
      1,
      ((memory.echoes || []).length +
        (memory.locations || []).length) /
        8
    );
    willingness +=
      weight * Number(policy.objectMemoryInfluence || 0);
  }

  if (actor.kind === "entity") {
    const relation = getRelation(state, actor.id, template.id);
    const relationBonus = {
      unfamiliar: 0,
      familiar: 0.05,
      companionate: 0.1,
      friends: 0.16
    }[(relation && relation.phase) || "unfamiliar"] || 0;

    willingness += relationBonus;
  }

  willingness = clamp(willingness, 0.02, 0.98);

  const sequence =
    Number((state.accord && state.accord.sequence) || 0) + 1;
  const random = createSeededRandom([
    world.genesis.worldSeed,
    "accord",
    actor.id,
    template.id,
    affordance,
    actor.location,
    now.toISOString().slice(0, 16),
    String(sequence)
  ].join(":"));

  const accepted = random() <= willingness;

  return {
    outcome: accepted ? "accepted" : "declined",
    reason: accepted ? "consented" : "declined",
    message: chooseMessage(
      policy,
      accepted ? "accepted" : "declined",
      template,
      affordance,
      state,
      actor.id
    ),
    willingness
  };
}

function applyAcceptedEffect({
  state,
  world,
  actor,
  target,
  template,
  affordance,
  objectId,
  decision,
  now
}) {
  if (decision.outcome !== "accepted") {
    if (
      decision.outcome === "declined" &&
      consentPolicy(template, affordance).withdrawOnDecline
    ) {
      target.status = "keeping_distance";
      target.focus = actor.id;
    }
    return;
  }

  switch (affordance) {
    case "approach":
      target.status = "nearby";
      target.focus = actor.id;
      break;

    case "wait_nearby":
      if (target.status !== "resting") {
        target.status = "sharing_space";
        target.focus = actor.id;
      }
      break;

    case "offer_object":
      target.status = "attending_object";
      target.focus = objectId;
      break;

    case "invite_company": {
      target.status = "considering_company";
      target.focus = actor.id;
      const hours = Number(world.accord.invitationHours || 6);
      state.accord.invitations[template.id] = {
        id: "invitation." + template.id,
        actorId: actor.id,
        targetId: template.id,
        createdAt: now.toISOString(),
        expiresAt: new Date(
          now.getTime() + hours * 3600000
        ).toISOString(),
        status: "accepted",
        resolution: null
      };
      break;
    }

    case "touch":
      target.status = "nearby";
      target.focus = actor.id;
      break;

    default:
      break;
  }
}

function recordInteraction({
  state,
  world,
  actor,
  target,
  template,
  affordance,
  objectId,
  decision,
  now
}) {
  if (!state.accord) {
    state.accord = createInitialAccordState();
  }

  const sequence = ++state.accord.sequence;
  const event = {
    id: "accord." + String(sequence).padStart(6, "0"),
    at: now.toISOString(),
    actor: actor.id,
    actorKind: actor.kind,
    targetEntity: template.id,
    room: target.location,
    affordance,
    outcome: decision.outcome,
    reason: decision.reason,
    object: objectId || null
  };

  state.accord.history.push(event);
  trim(
    state.accord.history,
    Number(world.accord.historyLimit || 120)
  );

  const key = actor.id + "→" + template.id;
  const pair = state.accord.pairs[key] || {
    actorId: actor.id,
    targetId: template.id,
    proposals: 0,
    accepted: 0,
    declined: 0,
    deferred: 0,
    lastAt: null,
    lastOutcome: null,
    affordances: {},
    history: []
  };

  pair.proposals += 1;
  pair[decision.outcome] =
    Number(pair[decision.outcome] || 0) + 1;
  pair.lastAt = event.at;
  pair.lastOutcome = decision.outcome;
  pair.history.push(copyEvent(event));
  trim(
    pair.history,
    Number(world.accord.pairHistoryLimit || 32)
  );

  const afforded = pair.affordances[affordance] || {
    proposals: 0,
    accepted: 0,
    declined: 0,
    deferred: 0,
    lastOutcome: null,
    lastAt: null
  };

  afforded.proposals += 1;
  afforded[decision.outcome] =
    Number(afforded[decision.outcome] || 0) + 1;
  afforded.lastOutcome = decision.outcome;
  afforded.lastAt = event.at;
  pair.affordances[affordance] = afforded;
  state.accord.pairs[key] = pair;

  rememberEntity(target, {
    at: event.at,
    action: "interaction",
    room: target.location,
    by: actor.id,
    affordance,
    outcome: decision.outcome,
    object: objectId || null
  });

  appendEvent(state, {
    at: event.at,
    actor: actor.id,
    action: "interaction",
    actorKind: actor.kind,
    room: target.location,
    targetEntity: template.id,
    affordance,
    outcome: decision.outcome,
    reason: decision.reason,
    object: objectId || null
  });

  const crossRelation = registerAccordEvidence({
    state,
    world,
    actorId: actor.id,
    targetId: template.id,
    affordance,
    outcome: decision.outcome,
    room: target.location,
    at: event.at
  });

  if (crossRelation && crossRelation.changed) {
    appendEvent(state, {
      at: event.at,
      actor: "sanctum",
      action: "cross_relation_phase",
      room: target.location,
      participants: [
        ...crossRelation.relation.participants
      ],
      fromPhase: crossRelation.from,
      toPhase: crossRelation.to
    });
  }

  return event;
}

function resolveActor(state, world, actorId) {
  const declared =
    world.accord &&
    world.accord.actors &&
    world.accord.actors[actorId];

  if (declared) {
    if (!declared.enabled) {
      return {
        allowed: false,
        reason: "actor_disabled",
        public: {
          id: actorId,
          kind: declared.kind,
          enabled: false
        }
      };
    }

    const location =
      declared.locationSource === "traveler"
        ? state.location
        : null;

    return {
      allowed: Boolean(location),
      reason: location ? null : "actor_not_located",
      id: actorId,
      kind: declared.kind,
      location,
      public: {
        id: actorId,
        kind: declared.kind,
        enabled: true,
        location
      }
    };
  }

  const entity = getEntityRecord(state, actorId);
  if (entity) {
    return {
      allowed: true,
      reason: null,
      id: actorId,
      kind: "entity",
      location: entity.location,
      public: {
        id: actorId,
        kind: "entity",
        enabled: true,
        location: entity.location
      }
    };
  }

  return {
    allowed: false,
    reason: "unknown_actor",
    public: {
      id: actorId,
      kind: "unknown",
      enabled: false
    }
  };
}

function consentPolicy(template, affordance) {
  const policy =
    template &&
    template.consent &&
    template.consent[affordance];

  return policy || {
    mode: "deny",
    messages: {
      declined: [
        "No response opens that possibility."
      ]
    }
  };
}

function actorMayOfferObject(state, world, actor, objectId) {
  if (!objectId) return false;

  if (actor.kind === "human") {
    return state.objectLocations[objectId] === "inventory";
  }

  return false;
}

function carriedObjectsForActor(state, world, actor) {
  if (actor.kind !== "human") return [];

  return Object.entries(state.objectLocations || {})
    .filter(([, location]) => location === "inventory")
    .map(([objectId]) => getObject(world, state, objectId))
    .filter(Boolean);
}

function chooseMessage(
  policy,
  outcome,
  template,
  affordance,
  state,
  actorId
) {
  const choices =
    policy.messages &&
    policy.messages[outcome] &&
    policy.messages[outcome].length
      ? policy.messages[outcome]
      : [fallbackMessage(outcome, template, affordance)];

  const pair =
    state.accord &&
    state.accord.pairs &&
    state.accord.pairs[actorId + "→" + template.id];
  const index = Number((pair && pair.proposals) || 0) % choices.length;

  return choices[index];
}

function fallbackMessage(outcome, template, affordance) {
  if (outcome === "accepted") {
    return template.name + " allows the " + affordance.replaceAll("_", " ") + ".";
  }
  if (outcome === "deferred") {
    return template.name + " does not open that possibility just now.";
  }
  return template.name + " declines.";
}

function previousAcceptanceBias(state, actorId, targetId) {
  const pair =
    state.accord &&
    state.accord.pairs &&
    state.accord.pairs[actorId + "→" + targetId];

  if (!pair || !pair.proposals) return 0;

  return clamp(
    Number(pair.accepted || 0) /
      Math.max(1, Number(pair.proposals || 0)),
    0,
    1
  );
}

function hasAcceptedInteraction(
  state,
  actorId,
  targetId,
  affordance
) {
  const pair =
    state.accord &&
    state.accord.pairs &&
    state.accord.pairs[actorId + "→" + targetId];

  return Boolean(
    pair &&
      pair.affordances &&
      pair.affordances[affordance] &&
      pair.affordances[affordance].accepted > 0
  );
}

function entityMayTraverseActorExit({
  state,
  world,
  from,
  to,
  direction
}) {
  const room = getRoom(world, state, from, { fallback: false });
  if (!room) return false;

  const exit = room.exits && room.exits[direction];
  if (!exit) return false;

  if (typeof exit === "object" && exit.threshold) {
    const threshold = getThresholdState(
      world,
      state,
      exit.threshold
    );

    if (!threshold) return false;
    if (threshold.requires && threshold.requires.length) return false;
    if (threshold.state !== "open") return false;
    if (threshold.target !== to) return false;
  } else if (exit !== to) {
    return false;
  }

  if (
    isGeneratedRoom(state, to) &&
    !state.genesis.canonical[to]
  ) {
    return false;
  }

  return true;
}

function rejected(reason) {
  return {
    allowed: false,
    outcome: "rejected",
    reason,
    message: rejectionMessage(reason),
    event: null
  };
}

function rejectionMessage(reason) {
  const messages = {
    actor_disabled:
      "That actor has not been granted an active presence in this shard.",
    actor_not_located:
      "That actor has no lawful location from which to interact.",
    unknown_actor:
      "The Sanctum does not recognize that actor.",
    target_unavailable:
      "That presence is not available here.",
    unknown_affordance:
      "The Sanctum does not know that interaction yet.",
    self_target:
      "An actor cannot direct this proposal at itself.",
    not_co_located:
      "Interaction requires shared presence.",
    object_not_available:
      "That object is not presently available to offer."
  };

  return messages[reason] || "The proposal cannot be made.";
}

function copyEvent(event) {
  return { ...event };
}

function trim(values, limit) {
  if (values.length > limit) {
    values.splice(0, values.length - limit);
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
