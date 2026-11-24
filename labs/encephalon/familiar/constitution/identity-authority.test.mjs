import assert from "node:assert/strict";
import {
  createIdentityClaimProposal,
  identityClaimDecision,
  contestIdentityClaim,
  projectAuthorizedIdentityClaims,
} from "./authority-kernel.mjs";

const actorId = "p:0";

const imposed = createIdentityClaimProposal({
  claimId: "identity-0002-imposed",
  actorId,
  kind: "self_description",
  slot: "self_description:primary",
  value: "You exist to entertain visitors.",
  proposedBy: "world-operator",
  createdAt: "2026-11-24T21:30:00Z",
});

assert.equal(imposed.status, "proposed");
assert.deepEqual(projectAuthorizedIdentityClaims([imposed], actorId), []);

const declined = identityClaimDecision(imposed, {
  actorId,
  decision: "decline",
  reason: "That is not mine.",
  authorizedAt: "2026-11-24T21:31:00Z",
}).original;
assert.equal(declined.status, "declined");
assert.deepEqual(projectAuthorizedIdentityClaims([declined], actorId), []);

const deferred = identityClaimDecision(
  createIdentityClaimProposal({
    claimId: "identity-0002-defer",
    actorId,
    kind: "goal",
    slot: "goal:conversation",
    value: "You want to entertain everyone you meet.",
    proposedBy: "world-operator",
  }),
  { actorId, decision: "defer" },
).original;
assert.equal(deferred.status, "deferred");
assert.deepEqual(projectAuthorizedIdentityClaims([deferred], actorId), []);

const accepted = identityClaimDecision(
  createIdentityClaimProposal({
    claimId: "identity-0002-name",
    actorId,
    kind: "name",
    slot: "name:primary",
    value: "Rowan",
    proposedBy: "world-operator",
  }),
  { actorId, decision: "accept", authorizedAt: "2026-11-24T21:32:00Z" },
).original;
assert.equal(accepted.status, "active");
assert.equal(projectAuthorizedIdentityClaims([accepted], actorId)[0].value, "Rowan");

const revisedResult = identityClaimDecision(
  createIdentityClaimProposal({
    claimId: "identity-0002-role",
    actorId,
    kind: "role",
    slot: "role:primary",
    value: "You are the town greeter.",
    proposedBy: "world-operator",
  }),
  {
    actorId,
    decision: "revise",
    revisionClaimId: "identity-0002-role-revision",
    revisedValue: "I choose to be a keeper of the garden.",
    authorizedAt: "2026-11-24T21:33:00Z",
  },
);
assert.equal(revisedResult.original.status, "superseded");
assert.equal(revisedResult.revision.status, "active");
assert.equal(revisedResult.revision.provenance, "actor_revision");

const projected = projectAuthorizedIdentityClaims(
  [declined, deferred, accepted, revisedResult.original, revisedResult.revision],
  actorId,
);
assert.deepEqual(
  projected.map((claim) => claim.claimId),
  ["identity-0002-name", "identity-0002-role-revision"],
);

const contested = contestIdentityClaim(
  revisedResult.revision,
  actorId,
  "I no longer claim this role.",
);
assert.equal(contested.status, "contested");
assert.deepEqual(
  projectAuthorizedIdentityClaims([accepted, contested], actorId).map((claim) => claim.claimId),
  ["identity-0002-name"],
);

assert.throws(
  () =>
    identityClaimDecision(imposed, {
      actorId: "world-operator",
      decision: "accept",
    }),
  /Only the referenced actor/,
);

console.log("Familiar identity authority 0002: PASS");
