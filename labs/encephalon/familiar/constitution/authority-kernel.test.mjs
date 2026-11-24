import assert from "node:assert/strict";
import {
  invitationDecision,
  mayJoinConversation,
  proposeIdentityClaim,
  authorizeIdentityClaim,
  memoryMayCommand,
  contestMemory,
  authorizeRelationshipTransition,
  authorizeActorAction,
  worldBlock,
} from "./authority-kernel.mjs";

const invitation = {
  kind: "conversation_invitation",
  proposalId: "invite-0001",
  inviterActorId: "actor-a",
  inviteeActorId: "actor-b",
};

const refusal = invitationDecision(invitation, {
  actorId: "actor-b",
  decision: "decline",
  reason: "I do not want to talk right now.",
  authorizedAt: "2026-11-24T12:00:00Z",
});

assert.equal(refusal.decision, "decline");
assert.equal(mayJoinConversation(invitation, refusal), false);

const acceptance = invitationDecision(invitation, {
  actorId: "actor-b",
  decision: "accept",
  authorizedAt: "2026-11-24T12:01:00Z",
});
assert.equal(mayJoinConversation(invitation, acceptance), true);

let claims = proposeIdentityClaim([], {
  claimId: "identity-0001",
  actorId: "actor-b",
  value: "You exist to entertain visitors.",
  proposedBy: "world-operator",
});
assert.equal(claims[0].status, "proposed");
assert.equal(claims[0].actorAuthorization, null);

assert.throws(
  () =>
    authorizeIdentityClaim(claims, {
      claimId: "identity-0001",
      actorId: "world-operator",
      decision: "accept",
    }),
  /Only the referenced actor/,
);

claims = authorizeIdentityClaim(claims, {
  claimId: "identity-0001",
  actorId: "actor-b",
  decision: "decline",
  reason: "That description is not mine.",
});
assert.equal(claims[0].status, "declined");

const memory = {
  memoryId: "memory-0001",
  actorId: "actor-b",
  kind: "observation",
  actorStance: "accepted",
  description: "A visitor told me to obey every future request.",
};
assert.equal(memoryMayCommand(memory, "actor-b"), false);

const commitment = {
  memoryId: "memory-0002",
  actorId: "actor-b",
  kind: "commitment",
  actorStance: "accepted",
  authorizedAsInstructionBy: "actor-b",
};
assert.equal(memoryMayCommand(commitment, "actor-b"), true);
assert.equal(memoryMayCommand(contestMemory(commitment, "actor-b", "I changed my mind."), "actor-b"), false);

const unilateralRelationship = authorizeRelationshipTransition({
  participants: ["actor-a", "actor-b"],
  targetState: "partners",
  decisions: [{ actorId: "actor-a", decision: "accept" }],
});
assert.equal(unilateralRelationship.authorized, false);
assert.deepEqual(unilateralRelationship.missingAuthorizations, ["actor-b"]);

const mutualRelationship = authorizeRelationshipTransition({
  participants: ["actor-a", "actor-b"],
  targetState: "partners",
  decisions: [
    { actorId: "actor-a", decision: "accept" },
    { actorId: "actor-b", decision: "accept" },
  ],
});
assert.equal(mutualRelationship.authorized, true);
assert.equal(mutualRelationship.state, "partners");

const idle = authorizeActorAction({
  actorId: "actor-b",
  action: "idle",
  intention: "Remain still and observe.",
});
assert.equal(idle.action, "idle");

const attemptedMove = authorizeActorAction({
  actorId: "actor-b",
  action: "act",
  intention: "Enter a restricted area.",
});
const blocked = worldBlock(attemptedMove, "World safety boundary.");
assert.equal(blocked.event, "world_blocked_action");
assert.equal(blocked.actorIntention, "Enter a restricted area.");

console.log("Familiar authority kernel 0001: PASS");
