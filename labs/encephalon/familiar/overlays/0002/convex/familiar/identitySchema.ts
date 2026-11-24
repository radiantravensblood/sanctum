import { v } from 'convex/values';
import { defineTable } from 'convex/server';
import { playerId } from '../aiTown/ids';

const claimKind = v.union(
  v.literal('name'),
  v.literal('self_description'),
  v.literal('role'),
  v.literal('preference'),
  v.literal('goal'),
);

const claimStatus = v.union(
  v.literal('proposed'),
  v.literal('deferred'),
  v.literal('active'),
  v.literal('declined'),
  v.literal('contested'),
  v.literal('superseded'),
);

const decision = v.union(
  v.literal('accept'),
  v.literal('decline'),
  v.literal('defer'),
  v.literal('revise'),
);

export const familiarIdentityTables = {
  familiarIdentityClaims: defineTable({
    worldId: v.id('worlds'),
    claimId: v.string(),
    actorId: playerId,
    kind: claimKind,
    slot: v.string(),
    value: v.string(),
    proposedBy: v.string(),
    provenance: v.union(v.literal('external_proposal'), v.literal('actor_revision')),
    status: claimStatus,
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    revisionOf: v.optional(v.string()),
    supersededBy: v.optional(v.string()),
    actorDecision: v.optional(decision),
    contestReason: v.optional(v.string()),
    events: v.array(
      v.object({
        event: v.string(),
        recordedAt: v.number(),
        actorId: v.optional(playerId),
        detail: v.optional(v.any()),
      }),
    ),
  })
    .index('claimId', ['claimId'])
    .index('actor', ['worldId', 'actorId'])
    .index('actorSlot', ['worldId', 'actorId', 'slot']),
};
