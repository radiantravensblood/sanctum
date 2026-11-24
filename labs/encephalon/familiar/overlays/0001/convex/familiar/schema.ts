import { v } from 'convex/values';
import { defineTable } from 'convex/server';
import { playerId } from '../aiTown/ids';

const status = v.union(
  v.literal('pending'),
  v.literal('deferred'),
  v.literal('accepted'),
  v.literal('declined'),
  v.literal('expired'),
);

const decision = v.union(v.literal('accept'), v.literal('decline'), v.literal('defer'));

export const familiarTables = {
  familiarInvitationProposals: defineTable({
    worldId: v.id('worlds'),
    proposalId: v.string(),
    inviter: playerId,
    invitee: playerId,
    createdAt: v.number(),
    expiresAt: v.number(),
    status,
    decision: v.optional(decision),
    resolvedAt: v.optional(v.number()),
    worldResolution: v.optional(v.literal('expired')),
    conversationInputId: v.optional(v.id('inputs')),
    acceptInputId: v.optional(v.id('inputs')),
    conversationId: v.optional(v.string()),
    events: v.array(
      v.object({
        event: v.string(),
        recordedAt: v.number(),
        actorId: v.optional(playerId),
        detail: v.optional(v.any()),
      }),
    ),
  }).index('proposalId', ['proposalId']),
};
