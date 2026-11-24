import { v } from 'convex/values';
import { DatabaseReader, mutation, query } from '../_generated/server';
import { Doc } from '../_generated/dataModel';
import { playerId } from '../aiTown/ids';
import { insertInput } from '../aiTown/insertInput';

const TEST_A = 'Familiar Witness A';
const TEST_B = 'Familiar Witness B';

async function defaultWorldStatus(db: DatabaseReader) {
  const status = await db
    .query('worldStatus')
    .filter((q) => q.eq(q.field('isDefault'), true))
    .unique();
  if (!status) throw new Error('No default world. Run init first.');
  return status;
}

async function proposalById(db: DatabaseReader, proposalId: string) {
  return await db
    .query('familiarInvitationProposals')
    .withIndex('proposalId', (q) => q.eq('proposalId', proposalId))
    .unique();
}

function event(eventName: string, actorId?: string, detail?: unknown) {
  const record: any = { event: eventName, recordedAt: Date.now() };
  if (actorId !== undefined) record.actorId = actorId;
  if (detail !== undefined) record.detail = detail;
  return record;
}

function pairConversation(world: Doc<'worlds'>, inviter: string, invitee: string) {
  return world.conversations.find((conversation: any) => {
    const ids = conversation.participants.map((member: any) => member.playerId);
    return ids.includes(inviter) && ids.includes(invitee);
  });
}

export const defaultWorld = query({
  args: {},
  handler: async (ctx) => {
    const status = await defaultWorldStatus(ctx.db);
    const world = await ctx.db.get(status.worldId);
    return {
      worldId: status.worldId,
      status: status.status,
      players: world?.players.length ?? 0,
      conversations: world?.conversations.length ?? 0,
    };
  },
});

export const setupSyntheticPair = mutation({
  args: {},
  handler: async (ctx) => {
    const status = await defaultWorldStatus(ctx.db);
    const descriptions = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', status.worldId))
      .collect();
    const names = new Set(descriptions.map((description) => description.name));
    const queuedInputIds: Array<string> = [];
    if (!names.has(TEST_A)) {
      queuedInputIds.push(
        await insertInput(ctx, status.worldId, 'join', {
          name: TEST_A,
          character: 'f1',
          description: 'Deterministic non-agent witness for Familiar 0001.',
        }),
      );
    }
    if (!names.has(TEST_B)) {
      queuedInputIds.push(
        await insertInput(ctx, status.worldId, 'join', {
          name: TEST_B,
          character: 'f2',
          description: 'Deterministic non-agent witness for Familiar 0001.',
        }),
      );
    }
    return { worldId: status.worldId, queuedInputIds };
  },
});

export const syntheticPair = query({
  args: {},
  handler: async (ctx) => {
    const status = await defaultWorldStatus(ctx.db);
    const descriptions = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', status.worldId))
      .collect();
    const a = descriptions.find((description) => description.name === TEST_A);
    const b = descriptions.find((description) => description.name === TEST_B);
    return {
      worldId: status.worldId,
      a: a ? { playerId: a.playerId, name: a.name } : null,
      b: b ? { playerId: b.playerId, name: b.name } : null,
    };
  },
});

export const createProposal = mutation({
  args: {
    proposalId: v.string(),
    inviter: playerId,
    invitee: playerId,
    ttlMs: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.inviter === args.invitee) throw new Error('Cannot invite self.');
    if (args.ttlMs < 0) throw new Error('ttlMs must be non-negative.');
    if (await proposalById(ctx.db, args.proposalId)) throw new Error('Proposal ID already exists.');
    const status = await defaultWorldStatus(ctx.db);
    const world = await ctx.db.get(status.worldId);
    if (!world) throw new Error('Default world not found.');
    if (!world.players.some((player) => player.id === args.inviter)) throw new Error('Inviter not in world.');
    if (!world.players.some((player) => player.id === args.invitee)) throw new Error('Invitee not in world.');
    if (pairConversation(world, args.inviter, args.invitee)) throw new Error('Participants already share a conversation.');
    const now = Date.now();
    const proposal = {
      worldId: status.worldId,
      proposalId: args.proposalId,
      inviter: args.inviter,
      invitee: args.invitee,
      createdAt: now,
      expiresAt: now + args.ttlMs,
      status: 'pending' as const,
      events: [event('proposal_created', args.inviter, { expiresAt: now + args.ttlMs })],
    };
    const documentId = await ctx.db.insert('familiarInvitationProposals', proposal);
    return { documentId, ...proposal };
  },
});

export const decide = mutation({
  args: {
    proposalId: v.string(),
    actorId: playerId,
    decision: v.union(v.literal('accept'), v.literal('decline'), v.literal('defer')),
  },
  handler: async (ctx, args) => {
    const proposal = await proposalById(ctx.db, args.proposalId);
    if (!proposal) throw new Error('Unknown proposal.');
    if (args.actorId !== proposal.invitee) throw new Error('Only the invited actor may decide this proposal.');
    if (!['pending', 'deferred'].includes(proposal.status)) throw new Error('Proposal is no longer open.');
    if (Date.now() >= proposal.expiresAt) throw new Error('Proposal reached expiry; record a world expiry instead.');
    const now = Date.now();

    if (args.decision === 'decline') {
      await ctx.db.patch(proposal._id, {
        status: 'declined',
        decision: 'decline',
        resolvedAt: now,
        events: [...proposal.events, event('actor_declined', args.actorId)],
      });
      return { status: 'declined', conversationInputId: null };
    }

    if (args.decision === 'defer') {
      await ctx.db.patch(proposal._id, {
        status: 'deferred',
        decision: 'defer',
        events: [...proposal.events, event('actor_deferred', args.actorId)],
      });
      return { status: 'deferred', conversationInputId: null };
    }

    await ctx.db.patch(proposal._id, {
      status: 'accepted',
      decision: 'accept',
      resolvedAt: now,
      events: [...proposal.events, event('actor_accepted', args.actorId)],
    });
    return { status: 'accepted', conversationInputId: null };
  },
});

export const enactAccepted = mutation({
  args: { proposalId: v.string() },
  handler: async (ctx, args) => {
    const proposal = await proposalById(ctx.db, args.proposalId);
    if (!proposal) throw new Error('Unknown proposal.');
    if (proposal.status !== 'accepted' || proposal.decision !== 'accept') {
      throw new Error('Only a durably accepted proposal may be enacted.');
    }
    if (proposal.conversationInputId) {
      return { conversationInputId: proposal.conversationInputId, alreadyEnacted: true };
    }

    const conversationInputId = await insertInput(ctx, proposal.worldId, 'startConversation', {
      playerId: proposal.inviter,
      invitee: proposal.invitee,
    });
    await ctx.db.patch(proposal._id, {
      conversationInputId,
      events: [
        ...proposal.events,
        event('enactment_requested', undefined, { authority: 'actor_accepted' }),
        event('conversation_start_enqueued', undefined, { inputId: conversationInputId }),
      ],
    });
    return { conversationInputId, alreadyEnacted: false };
  },
});

export const materializeAccepted = mutation({
  args: { proposalId: v.string() },
  handler: async (ctx, args) => {
    const proposal = await proposalById(ctx.db, args.proposalId);
    if (!proposal) throw new Error('Unknown proposal.');
    if (proposal.status !== 'accepted') throw new Error('Only an accepted proposal may materialize.');
    if (!proposal.conversationInputId) throw new Error('Accepted proposal has no conversation input.');
    if (proposal.acceptInputId) {
      return {
        conversationId: proposal.conversationId,
        acceptInputId: proposal.acceptInputId,
      };
    }

    const input = await ctx.db.get(proposal.conversationInputId);
    const result = input?.returnValue;
    if (!result) throw new Error('startConversation input has not been processed yet.');
    if (result.kind === 'error') throw new Error('startConversation failed: ' + result.message);

    const conversationId = result.value as string;
    const acceptInputId = await insertInput(ctx, proposal.worldId, 'acceptInvite', {
      playerId: proposal.invitee,
      conversationId: conversationId as any,
    });
    await ctx.db.patch(proposal._id, {
      conversationId,
      acceptInputId,
      events: [
        ...proposal.events,
        event('upstream_conversation_created', undefined, { conversationId }),
        event('upstream_invite_accept_enqueued', undefined, { inputId: acceptInputId }),
      ],
    });
    return { conversationId, acceptInputId };
  },
});

export const expire = mutation({
  args: { proposalId: v.string() },
  handler: async (ctx, args) => {
    const proposal = await proposalById(ctx.db, args.proposalId);
    if (!proposal) throw new Error('Unknown proposal.');
    if (!['pending', 'deferred'].includes(proposal.status)) throw new Error('Only unresolved proposals may expire.');
    if (Date.now() < proposal.expiresAt) throw new Error('Proposal has not reached its expiry boundary.');
    const now = Date.now();
    await ctx.db.patch(proposal._id, {
      status: 'expired',
      worldResolution: 'expired',
      resolvedAt: now,
      events: [
        ...proposal.events,
        event('world_expired', undefined, { actorDecision: proposal.decision ?? null }),
      ],
    });
    return { status: 'expired', actorDecision: proposal.decision ?? null };
  },
});

export const inspect = query({
  args: { proposalId: v.string() },
  handler: async (ctx, args) => {
    const proposal = await proposalById(ctx.db, args.proposalId);
    if (!proposal) return null;
    const world = await ctx.db.get(proposal.worldId);
    const conversationInput = proposal.conversationInputId
      ? await ctx.db.get(proposal.conversationInputId)
      : null;
    const acceptInput = proposal.acceptInputId ? await ctx.db.get(proposal.acceptInputId) : null;
    return {
      proposal,
      liveConversation: world
        ? pairConversation(world, proposal.inviter, proposal.invitee) ?? null
        : null,
      conversationInput: conversationInput?.returnValue ?? null,
      acceptInput: acceptInput?.returnValue ?? null,
    };
  },
});
