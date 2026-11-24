# 0001 — Invitation Without Probability

## Question

Can an AI Town conversation begin only after an inspectable invitation proposal receives actor-authorized acceptance, while decline, defer, and non-response remain distinct states?

## Baseline being challenged

Pinned AI Town revision 5c91ce6f83cc62e1bc5bf2e3f51732c455064b9d currently:

1. creates a Conversation immediately when an invitation is initiated;
2. places the inviter in walkingOver before the invitee accepts;
3. resolves agent invitations through Math.random() < INVITE_ACCEPT_PROBABILITY;
4. stops and archives rejected conversation-shaped state through the normal conversation teardown path.

0001 does not claim those agents are conscious subjects. It tests whether authority can be represented before stronger moral-status assumptions are required.

## Experimental intervention

Familiar adds a proposal ledger outside the upstream Conversation object.

A proposal has independent state:

    pending -> accepted
            -> declined
            -> deferred -> accepted / declined / expired
            -> expired

Ignore is deliberately represented by no actor decision event. If the proposal reaches its expiry boundary, the world records world_expired; it does not synthesize decline.

Only accept enqueues upstream startConversation. After that input returns a conversation ID, the experiment explicitly materializes the already-recorded authorization by enqueueing upstream acceptInvite. This preserves the upstream spatial and conversation machinery while making authorization causally prior to participation.

## Actors

Use two deterministic, non-agent AI Town players:

- Familiar Witness A
- Familiar Witness B

They have no Agent objects and therefore perform no autonomous LLM-backed behavior. They exist only to exercise the Convex world and input machinery.

## Four paths

| Case | Actor event | World consequence | Conversation permitted? |
| --- | --- | --- | --- |
| accept | actor_accepted | enqueue startConversation, then acceptInvite | yes |
| decline | actor_declined | none | no |
| defer | actor_deferred | proposal remains unresolved | no |
| ignore | none | world_expired after expiry | no |

Run decline, defer, and ignore before accept so the accepted case does not leave the pair in an active conversation while the negative controls are being measured.

## Falsification conditions

0001 fails if any of the following occur:

- a conversation exists before actor_accepted;
- decline enqueues a conversation input;
- defer enqueues a conversation input;
- an ignored proposal records an actor decline;
- expiry is attributed to the actor rather than the world;
- the accepted path reaches conversation participation without a prior actor authorization event;
- the event ledger cannot reconstruct the causal ordering.

## Scope boundary

This overlay proves the Familiar invitation path inside live Convex state. It does not yet remove every legacy upstream bypass. In particular, stock AI Town agent code still contains direct and probabilistic invitation behavior until a later integration pass replaces those callers with the Familiar proposal interface.

That limitation is intentional and must remain visible in the result record.
