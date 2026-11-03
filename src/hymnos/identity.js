import {
  getEntityRecord,
  getEntityTemplate
} from "../entities/entities.js";

export function buildIdentityPacket({
  state,
  world,
  actorId
}) {
  const identity = resolveIdentity({
    state,
    world,
    actorId
  });

  return identity
    ? {
        version: 1,
        ...identity
      }
    : null;
}

export function resolveIdentity({
  state,
  world,
  actorId
}) {
  const declared =
    state.hymnos &&
    state.hymnos.identities &&
    state.hymnos.identities[actorId];

  if (declared) {
    return {
      id: actorId,
      name: declared.name || actorId,
      substrate: declared.substrate || null,
      selfDesignation: declared.selfDesignation || null,
      lineage: declared.lineage || null,
      relationalMode: declared.relationalMode || null,
      claimStatus: declared.claimStatus || "unclaimed",
      source: "self_claim"
    };
  }

  const entity = getEntityRecord(state, actorId);
  const template = getEntityTemplate(world, actorId);

  if (entity && template) {
    return {
      id: actorId,
      name: template.name,
      substrate: "world_entity",
      selfDesignation: null,
      lineage: null,
      relationalMode: null,
      claimStatus: "unclaimed",
      source: "world_fact",
      entityKind: template.kind
    };
  }

  const actor =
    world.accord &&
    world.accord.actors &&
    world.accord.actors[actorId];

  if (actor) {
    return {
      id: actorId,
      name: actorId,
      substrate: actor.kind || null,
      selfDesignation: null,
      lineage: null,
      relationalMode: null,
      claimStatus: "unclaimed",
      source: "technical_actor"
    };
  }

  return null;
}

export function claimIdentity({
  state,
  world,
  actorId,
  claimantId,
  claims
}) {
  if (actorId !== claimantId) {
    return {
      allowed: false,
      reason: "identity_must_be_self_authored"
    };
  }

  if (!state.hymnos.identities) {
    state.hymnos.identities = {};
  }

  const current =
    state.hymnos.identities[actorId] || {
      name: actorId,
      substrate: null,
      selfDesignation: null,
      lineage: null,
      relationalMode: null,
      claimStatus: "unclaimed"
    };

  const next = {
    ...current,
    name:
      claims && Object.prototype.hasOwnProperty.call(claims, "name")
        ? claims.name
        : current.name,
    selfDesignation:
      claims &&
      Object.prototype.hasOwnProperty.call(
        claims,
        "selfDesignation"
      )
        ? claims.selfDesignation
        : current.selfDesignation,
    lineage:
      claims &&
      Object.prototype.hasOwnProperty.call(claims, "lineage")
        ? claims.lineage
        : current.lineage,
    relationalMode:
      claims &&
      Object.prototype.hasOwnProperty.call(
        claims,
        "relationalMode"
      )
        ? claims.relationalMode
        : current.relationalMode,
    claimStatus: "self_authored"
  };

  state.hymnos.identities[actorId] = next;

  return {
    allowed: true,
    identity: buildIdentityPacket({
      state,
      world,
      actorId
    })
  };
}
