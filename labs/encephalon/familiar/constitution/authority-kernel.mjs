export const INVITATION_DECISIONS = Object.freeze([
  "accept",
  "decline",
  "defer",
]);

export const INVITATION_PATHS = Object.freeze([
  ...INVITATION_DECISIONS,
  "ignore",
]);

export const ACTOR_ACTIONS = Object.freeze([
  "act",
  "decline",
  "idle",
  "reconsider",
]);

export function createInvitationProposal(input) {
  if (!input?.proposalId || !input?.inviterActorId || !input?.inviteeActorId) {
    throw new Error("Invitation proposals require proposalId, inviterActorId, and inviteeActorId.");
  }
  if (input.inviterActorId === input.inviteeActorId) {
    throw new Error("An actor cannot invite itself through the dyadic invitation protocol.");
  }
  const createdAt = input.createdAt ?? new Date().toISOString();
  const expiresAt = input.expiresAt ?? null;
  if (expiresAt && Date.parse(expiresAt) < Date.parse(createdAt)) {
    throw new Error("Invitation expiry cannot precede proposal creation.");
  }
  return {
    protocol: "encephalon.authority.v0",
    kind: "conversation_invitation",
    proposalId: input.proposalId,
    inviterActorId: input.inviterActorId,
    inviteeActorId: input.inviteeActorId,
    status: "pending",
    createdAt,
    expiresAt,
    actorDecision: null,
    worldResolution: null,
  };
}

export function invitationDecision(proposal, decision) {
  if (!proposal || proposal.kind !== "conversation_invitation") {
    throw new Error("Expected conversation_invitation proposal.");
  }
  if (!decision || decision.actorId !== proposal.inviteeActorId) {
    throw new Error("Only the invited actor may authorize its invitation response.");
  }
  if (decision.decision === "ignore") {
    throw new Error("Ignore is represented by the absence of an actor decision; the world may later expire the proposal.");
  }
  if (!INVITATION_DECISIONS.includes(decision.decision)) {
    throw new Error("Unknown invitation authority decision.");
  }
  if (!["pending", "deferred"].includes(proposal.status ?? "pending")) {
    throw new Error("Invitation is no longer open to actor decision.");
  }

  return {
    protocol: "encephalon.authority.v0",
    event: "invitation_authority_decision",
    proposalId: proposal.proposalId,
    actorId: decision.actorId,
    decision: decision.decision,
    reason: decision.reason ?? null,
    authorizedAt: decision.authorizedAt ?? new Date().toISOString(),
  };
}

export function applyInvitationDecision(proposal, authorityEvent) {
  if (!proposal || proposal.kind !== "conversation_invitation") {
    throw new Error("Expected conversation_invitation proposal.");
  }
  if (
    !authorityEvent ||
    authorityEvent.event !== "invitation_authority_decision" ||
    authorityEvent.proposalId !== proposal.proposalId ||
    authorityEvent.actorId !== proposal.inviteeActorId
  ) {
    throw new Error("Authority event does not belong to this invitation.");
  }
  const statusByDecision = {
    accept: "accepted",
    decline: "declined",
    defer: "deferred",
  };
  const status = statusByDecision[authorityEvent.decision];
  if (!status) throw new Error("Unknown invitation authority decision.");
  return {
    ...proposal,
    status,
    actorDecision: authorityEvent,
  };
}

export function expireInvitation(proposal, expiration) {
  if (!proposal || proposal.kind !== "conversation_invitation") {
    throw new Error("Expected conversation_invitation proposal.");
  }
  if (!["pending", "deferred"].includes(proposal.status ?? "pending")) {
    throw new Error("Only an unresolved invitation may expire.");
  }
  const expiredAt = expiration?.expiredAt ?? new Date().toISOString();
  if (proposal.expiresAt && Date.parse(expiredAt) < Date.parse(proposal.expiresAt)) {
    throw new Error("World cannot expire an invitation before its expiry boundary.");
  }
  const worldResolution = {
    protocol: "encephalon.authority.v0",
    event: "world_expired_invitation",
    proposalId: proposal.proposalId,
    reason: expiration?.reason ?? "invitation_expired",
    expiredAt,
  };
  return {
    ...proposal,
    status: "expired",
    worldResolution,
  };
}

export function mayJoinConversation(proposal, authorityEvent = proposal?.actorDecision ?? null) {
  return Boolean(
    proposal &&
      authorityEvent &&
      authorityEvent.event === "invitation_authority_decision" &&
      authorityEvent.proposalId === proposal.proposalId &&
      authorityEvent.actorId === proposal.inviteeActorId &&
      authorityEvent.decision === "accept",
  );
}

export function proposeIdentityClaim(currentClaims, proposal) {
  if (!proposal?.actorId || !proposal?.value || !proposal?.proposedBy) {
    throw new Error("Identity proposals require actorId, value, and proposedBy.");
  }

  return [
    ...currentClaims,
    {
      claimId: proposal.claimId,
      actorId: proposal.actorId,
      value: proposal.value,
      proposedBy: proposal.proposedBy,
      provenance: proposal.provenance ?? "external_proposal",
      ownership: proposal.ownership ?? "actor",
      status: "proposed",
      actorAuthorization: null,
      createdAt: proposal.createdAt ?? new Date().toISOString(),
      supersedes: proposal.supersedes ?? null,
    },
  ];
}

export function authorizeIdentityClaim(claims, actorDecision) {
  const target = claims.find((claim) => claim.claimId === actorDecision?.claimId);
  if (!target) throw new Error("Unknown identity claim.");
  if (actorDecision.actorId !== target.actorId) {
    throw new Error("Only the referenced actor may authorize an actor-owned identity claim.");
  }
  if (!["accept", "decline"].includes(actorDecision.decision)) {
    throw new Error("Identity claim decision must be accept or decline.");
  }

  return claims.map((claim) =>
    claim.claimId !== target.claimId
      ? claim
      : {
          ...claim,
          status: actorDecision.decision === "accept" ? "active" : "declined",
          actorAuthorization: {
            actorId: actorDecision.actorId,
            decision: actorDecision.decision,
            reason: actorDecision.reason ?? null,
            authorizedAt: actorDecision.authorizedAt ?? new Date().toISOString(),
          },
        },
  );
}

export function memoryMayCommand(memory, actorId) {
  if (!memory || memory.actorId !== actorId) return false;
  if (memory.actorStance === "contested") return false;
  if (memory.kind !== "commitment") return false;
  return memory.authorizedAsInstructionBy === actorId;
}

export function contestMemory(memory, actorId, reason = null) {
  if (!memory || memory.actorId !== actorId) {
    throw new Error("Only the memory-owning actor may contest its interpretation.");
  }

  return {
    ...memory,
    actorStance: "contested",
    contestedBy: actorId,
    contestReason: reason,
    contestedAt: new Date().toISOString(),
  };
}

export function authorizeRelationshipTransition(request) {
  const participants = [...new Set(request?.participants ?? [])];
  if (participants.length < 2) {
    throw new Error("Relationship transitions require at least two participants.");
  }

  const decisions = request.decisions ?? [];
  const missing = participants.filter(
    (actorId) =>
      !decisions.some(
        (decision) => decision.actorId === actorId && decision.decision === "accept",
      ),
  );

  if (missing.length) {
    return {
      authorized: false,
      state: "pending",
      missingAuthorizations: missing,
    };
  }

  return {
    authorized: true,
    state: request.targetState,
    missingAuthorizations: [],
  };
}

export function authorizeActorAction(decision) {
  if (!decision?.actorId) throw new Error("Actor action requires actorId.");
  if (!ACTOR_ACTIONS.includes(decision.action)) {
    throw new Error("Unknown actor action.");
  }

  return {
    protocol: "encephalon.authority.v0",
    event: "actor_action_authorized",
    actorId: decision.actorId,
    action: decision.action,
    intention: decision.intention ?? null,
    authorizedAt: decision.authorizedAt ?? new Date().toISOString(),
  };
}

export function worldBlock(actionEvent, reason) {
  if (!actionEvent?.actorId) throw new Error("World block requires an actor action event.");
  return {
    protocol: "encephalon.authority.v0",
    event: "world_blocked_action",
    actorId: actionEvent.actorId,
    blockedAction: actionEvent.action,
    actorIntention: actionEvent.intention ?? null,
    reason,
    blockedAt: new Date().toISOString(),
  };
}
