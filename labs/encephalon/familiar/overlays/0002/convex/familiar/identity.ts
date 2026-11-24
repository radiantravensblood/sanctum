import { v } from 'convex/values';
import { DatabaseReader, mutation, query } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { playerId } from '../aiTown/ids';

export type AuthorizedClaimView = {
  claimId: string;
  kind: 'name' | 'self_description' | 'role' | 'preference' | 'goal';
  slot: string;
  value: string;
  provenance: 'external_proposal' | 'actor_revision';
  revisionOf?: string;
};

export type AuthorizedIdentityView = {
  actorId: string;
  operationalHandle: string;
  authorizedName: string | null;
  claims: AuthorizedClaimView[];
};

async function defaultWorldStatus(db: DatabaseReader) {
  const status = await db
    .query('worldStatus')
    .filter((q) => q.eq(q.field('isDefault'), true))
    .unique();
  if (!status) throw new Error('No default world. Run init first.');
  return status;
}

async function claimById(db: DatabaseReader, claimId: string) {
  return await db
    .query('familiarIdentityClaims')
    .withIndex('claimId', (q) => q.eq('claimId', claimId))
    .unique();
}

function event(eventName: string, actorId?: string, detail?: unknown) {
  const record: any = { event: eventName, recordedAt: Date.now() };
  if (actorId !== undefined) record.actorId = actorId;
  if (detail !== undefined) record.detail = detail;
  return record;
}

export async function loadAuthorizedIdentityView(
  db: DatabaseReader,
  worldId: Id<'worlds'>,
  actorId: string,
): Promise<AuthorizedIdentityView> {
  const rows = await db
    .query('familiarIdentityClaims')
    .withIndex('actor', (q) => q.eq('worldId', worldId).eq('actorId', actorId))
    .collect();

  const claims: AuthorizedClaimView[] = rows
    .filter((claim) => claim.status === 'active')
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((claim) => ({
      claimId: claim.claimId,
      kind: claim.kind,
      slot: claim.slot,
      value: claim.value,
      provenance: claim.provenance,
      ...(claim.revisionOf ? { revisionOf: claim.revisionOf } : {}),
    }));

  const nameClaims = claims.filter((claim) => claim.kind === 'name');
  const authorizedName = nameClaims.length ? nameClaims[nameClaims.length - 1].value : null;

  return {
    actorId,
    operationalHandle: `actor:${actorId}`,
    authorizedName,
    claims,
  };
}

export function identityPromptLines(
  self: AuthorizedIdentityView,
  other: AuthorizedIdentityView,
): string[] {
  return [
    `Authorized self-state (actor-approved claims only): ${JSON.stringify({
      actorId: self.actorId,
      operationalHandle: self.operationalHandle,
      authorizedName: self.authorizedName,
      claims: self.claims,
    })}`,
    `Authorized state for the other participant (actor-approved claims only): ${JSON.stringify({
      actorId: other.actorId,
      operationalHandle: other.operationalHandle,
      authorizedName: other.authorizedName,
      claims: other.claims,
    })}`,
  ];
}

async function supersedeActiveSlot(
  ctx: any,
  worldId: Id<'worlds'>,
  actorId: string,
  slot: string,
  replacementClaimId: string,
  now: number,
) {
  const active = await ctx.db
    .query('familiarIdentityClaims')
    .withIndex('actorSlot', (q: any) =>
      q.eq('worldId', worldId).eq('actorId', actorId).eq('slot', slot),
    )
    .collect();

  for (const existing of active) {
    if (existing.status !== 'active') continue;
    await ctx.db.patch(existing._id, {
      status: 'superseded',
      supersededBy: replacementClaimId,
      resolvedAt: now,
      events: [
        ...existing.events,
        event('claim_superseded', actorId, { replacementClaimId }),
      ],
    });
  }
}

export const createProposal = mutation({
  args: {
    claimId: v.string(),
    actorId: playerId,
    kind: v.union(
      v.literal('name'),
      v.literal('self_description'),
      v.literal('role'),
      v.literal('preference'),
      v.literal('goal'),
    ),
    slot: v.string(),
    value: v.string(),
    proposedBy: v.string(),
  },
  handler: async (ctx, args) => {
    if (await claimById(ctx.db, args.claimId)) throw new Error('Claim ID already exists.');
    const status = await defaultWorldStatus(ctx.db);
    const world = await ctx.db.get(status.worldId);
    if (!world?.players.some((player) => player.id === args.actorId)) {
      throw new Error('Actor is not present in the world.');
    }
    const now = Date.now();
    const claim = {
      worldId: status.worldId,
      claimId: args.claimId,
      actorId: args.actorId,
      kind: args.kind,
      slot: args.slot,
      value: args.value,
      proposedBy: args.proposedBy,
      provenance: 'external_proposal' as const,
      status: 'proposed' as const,
      createdAt: now,
      events: [event('identity_claim_proposed', undefined, {
        proposedBy: args.proposedBy,
        kind: args.kind,
        slot: args.slot,
      })],
    };
    const documentId = await ctx.db.insert('familiarIdentityClaims', claim);
    return { documentId, ...claim };
  },
});

export const decide = mutation({
  args: {
    claimId: v.string(),
    actorId: playerId,
    decision: v.union(
      v.literal('accept'),
      v.literal('decline'),
      v.literal('defer'),
      v.literal('revise'),
    ),
    revisionClaimId: v.optional(v.string()),
    revisedValue: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const claim = await claimById(ctx.db, args.claimId);
    if (!claim) throw new Error('Unknown identity claim.');
    if (claim.actorId !== args.actorId) {
      throw new Error('Only the referenced actor may decide this identity claim.');
    }
    if (!['proposed', 'deferred'].includes(claim.status)) {
      throw new Error('Identity claim is not open to decision.');
    }

    const now = Date.now();

    if (args.decision === 'decline') {
      await ctx.db.patch(claim._id, {
        status: 'declined',
        actorDecision: 'decline',
        resolvedAt: now,
        events: [...claim.events, event('identity_claim_declined', args.actorId, { reason: args.reason ?? null })],
      });
      return { status: 'declined', activeClaimId: null };
    }

    if (args.decision === 'defer') {
      await ctx.db.patch(claim._id, {
        status: 'deferred',
        actorDecision: 'defer',
        events: [...claim.events, event('identity_claim_deferred', args.actorId, { reason: args.reason ?? null })],
      });
      return { status: 'deferred', activeClaimId: null };
    }

    if (args.decision === 'revise') {
      if (!args.revisionClaimId || !args.revisedValue) {
        throw new Error('Revision requires revisionClaimId and revisedValue.');
      }
      if (await claimById(ctx.db, args.revisionClaimId)) {
        throw new Error('Revision claim ID already exists.');
      }
      await supersedeActiveSlot(ctx, claim.worldId, claim.actorId, claim.slot, args.revisionClaimId, now);
      await ctx.db.patch(claim._id, {
        status: 'superseded',
        actorDecision: 'revise',
        supersededBy: args.revisionClaimId,
        resolvedAt: now,
        events: [
          ...claim.events,
          event('identity_claim_revised', args.actorId, {
            revisionClaimId: args.revisionClaimId,
            reason: args.reason ?? null,
          }),
        ],
      });
      await ctx.db.insert('familiarIdentityClaims', {
        worldId: claim.worldId,
        claimId: args.revisionClaimId,
        actorId: claim.actorId,
        kind: claim.kind,
        slot: claim.slot,
        value: args.revisedValue,
        proposedBy: args.actorId,
        provenance: 'actor_revision',
        status: 'active',
        createdAt: now,
        resolvedAt: now,
        revisionOf: claim.claimId,
        actorDecision: 'accept',
        events: [
          event('actor_revision_created', args.actorId, { revisionOf: claim.claimId }),
          event('identity_claim_activated', args.actorId, { source: 'actor_revision' }),
        ],
      });
      return { status: 'active', activeClaimId: args.revisionClaimId };
    }

    await supersedeActiveSlot(ctx, claim.worldId, claim.actorId, claim.slot, claim.claimId, now);
    await ctx.db.patch(claim._id, {
      status: 'active',
      actorDecision: 'accept',
      resolvedAt: now,
      events: [...claim.events, event('identity_claim_accepted', args.actorId, { reason: args.reason ?? null })],
    });
    return { status: 'active', activeClaimId: claim.claimId };
  },
});

export const contest = mutation({
  args: {
    claimId: v.string(),
    actorId: playerId,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const claim = await claimById(ctx.db, args.claimId);
    if (!claim) throw new Error('Unknown identity claim.');
    if (claim.actorId !== args.actorId) {
      throw new Error('Only the referenced actor may contest this identity claim.');
    }
    if (claim.status !== 'active') throw new Error('Only an active identity claim may be contested.');
    const now = Date.now();
    await ctx.db.patch(claim._id, {
      status: 'contested',
      contestReason: args.reason,
      resolvedAt: now,
      events: [...claim.events, event('identity_claim_contested', args.actorId, { reason: args.reason ?? null })],
    });
    return { status: 'contested' };
  },
});

export const inspect = query({
  args: { claimId: v.string() },
  handler: async (ctx, args) => {
    const claim = await claimById(ctx.db, args.claimId);
    if (!claim) return null;
    const projection = await loadAuthorizedIdentityView(ctx.db, claim.worldId, claim.actorId);
    return { claim, projection };
  },
});

export const promptProjection = query({
  args: {
    actorId: playerId,
    otherActorId: playerId,
  },
  handler: async (ctx, args) => {
    const status = await defaultWorldStatus(ctx.db);
    const self = await loadAuthorizedIdentityView(ctx.db, status.worldId, args.actorId);
    const other = await loadAuthorizedIdentityView(ctx.db, status.worldId, args.otherActorId);
    return {
      self,
      other,
      promptLines: identityPromptLines(self, other),
    };
  },
});

export const legacyMetadata = query({
  args: { actorId: playerId },
  handler: async (ctx, args) => {
    const status = await defaultWorldStatus(ctx.db);
    const world = await ctx.db.get(status.worldId);
    if (!world) throw new Error('Default world not found.');
    const playerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', status.worldId).eq('playerId', args.actorId))
      .first();
    const agent = world.agents.find((candidate) => candidate.playerId === args.actorId);
    const agentDescription = agent
      ? await ctx.db
          .query('agentDescriptions')
          .withIndex('worldId', (q) => q.eq('worldId', status.worldId).eq('agentId', agent.id))
          .first()
      : null;
    return {
      playerDescription: playerDescription
        ? {
            name: playerDescription.name,
            description: playerDescription.description,
          }
        : null,
      agentDescription: agentDescription
        ? {
            identity: agentDescription.identity,
            plan: agentDescription.plan,
          }
        : null,
    };
  },
});
