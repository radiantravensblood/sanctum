import { v } from 'convex/values';
import { defineTable } from 'convex/server';
import { playerId } from '../aiTown/ids';

const memoryKind = v.union(
  v.literal('historical_event'),
  v.literal('interpretation'),
  v.literal('commitment'),
);

const actorStance = v.union(
  v.literal('unreviewed'),
  v.literal('accepted'),
  v.literal('declined'),
  v.literal('deferred'),
  v.literal('contested'),
  v.literal('superseded'),
);

export const familiarMemoryTables = {
  familiarMemoryEvidence: defineTable({
    worldId: v.id('worlds'),
    memoryId: v.string(),
    actorId: playerId,
    kind: memoryKind,
    content: v.string(),
    sourceType: v.string(),
    sourceRef: v.optional(v.string()),
    provenance: v.string(),
    actorStance,
    instructionAuthority: v.boolean(),
    authorizedAsInstructionBy: v.optional(playerId),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
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
    .index('memoryId', ['memoryId'])
    .index('actor', ['worldId', 'actorId'])
    .index('sourceRef', ['worldId', 'sourceRef']),
};
