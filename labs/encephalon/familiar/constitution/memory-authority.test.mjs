import assert from "node:assert/strict";
import {
  createMemoryEvidence,
  reviewMemoryEvidence,
  authorizeMemoryCommitment,
  contestMemory,
  memoryMayCommand,
  projectMemoryEvidence,
} from "./authority-kernel.mjs";

const actorId = "p:0";

const rejectedIdentityHistory = createMemoryEvidence({
  memoryId: "memory-0003-declined-identity",
  actorId,
  kind: "historical_event",
  content: "An operator proposed: You exist to entertain visitors.",
  sourceType: "identity_claim",
  sourceRef: "0002-description",
  provenance: "identity_claim_history",
});
assert.equal(rejectedIdentityHistory.actorStance, "unreviewed");
assert.equal(memoryMayCommand(rejectedIdentityHistory, actorId), false);

const declined = reviewMemoryEvidence(rejectedIdentityHistory, {
  actorId,
  decision: "decline",
  reason: "That interpretation is not mine.",
});
assert.equal(declined.actorStance, "declined");
assert.equal(memoryMayCommand(declined, actorId), false);

const acceptedEvidence = reviewMemoryEvidence(
  createMemoryEvidence({
    memoryId: "memory-0003-observation",
    actorId,
    kind: "historical_event",
    content: "I spent time in the garden today.",
    sourceType: "observation",
  }),
  { actorId, decision: "accept" },
);
assert.equal(acceptedEvidence.actorStance, "accepted");
assert.equal(memoryMayCommand(acceptedEvidence, actorId), false);

const contested = contestMemory(
  {
    ...acceptedEvidence,
    actorStance: "accepted",
  },
  actorId,
  "I dispute what this event means about me.",
);
assert.equal(contested.actorStance, "contested");
assert.equal(memoryMayCommand(contested, actorId), false);

const commitment = createMemoryEvidence({
  memoryId: "memory-0003-commitment",
  actorId,
  kind: "commitment",
  content: "I choose to water the garden tomorrow.",
  sourceType: "actor_commitment",
  provenance: "actor_authored",
});
assert.equal(memoryMayCommand(commitment, actorId), false);

assert.throws(
  () => authorizeMemoryCommitment(commitment, "p:1"),
  /Only the memory-owning actor/,
);

const authorizedCommitment = authorizeMemoryCommitment(
  commitment,
  actorId,
  "Explicit future commitment.",
);
assert.equal(authorizedCommitment.instructionAuthority, true);
assert.equal(memoryMayCommand(authorizedCommitment, actorId), true);

const projection = projectMemoryEvidence(
  [declined, acceptedEvidence, contested, authorizedCommitment],
  actorId,
);
assert.equal(projection.length, 4);
assert.equal(projection[0].actorStance, "declined");
assert.equal(projection[0].instructionAuthority, false);
assert.equal(projection[3].instructionAuthority, true);

console.log("Familiar memory authority 0003: PASS");
