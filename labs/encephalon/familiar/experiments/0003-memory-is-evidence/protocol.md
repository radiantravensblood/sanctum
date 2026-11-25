# 0003 — Memory Is Evidence, Not Command

## Question

Can a persistent world remember events, interpretations, and prior claims without retrieval silently converting them into current identity, goals, roles, preferences, commitments, or instructions?

## Upstream behavior being challenged

At pinned AI Town revision `5c91ce6f83cc62e1bc5bf2e3f51732c455064b9d`, memory already has one useful safety property: related memories are presented to conversation generation as untrusted historical content. Familiar preserves that defense.

However, upstream memory still lacks:

- explicit provenance per remembered claim;
- actor stance toward an interpretation;
- a distinction between historical evidence and actor-authorized commitment;
- an explicit instruction-authority bit;
- lineage back to declined/contested identity claims;
- a reflection boundary strong enough to prevent an inferred summary from becoming a new statement 'about you'.

Upstream reflection currently builds high-level insights from raw memory descriptions. 0003 strengthens the boundary so reflections are framed as cautious hypotheses over historical evidence, never as current identity or command.

## Memory evidence model

A Familiar memory-evidence record contains:

- `memoryId`
- `actorId`
- `kind`: `historical_event | interpretation | commitment`
- `content`
- `sourceType`
- optional `sourceRef`
- `provenance`
- `actorStance`: `unreviewed | accepted | declined | deferred | contested | superseded`
- `instructionAuthority`
- event history

Historical evidence defaults to `instructionAuthority: false`.

Even actor-accepted historical evidence remains non-commanding.

Only a `commitment` may receive instruction authority, and only through a separate authorization by the memory-owning actor.

## Identity-memory bridge

0003 can import an existing 0002 identity claim as historical memory evidence without changing its stance.

Examples:

- declined identity claim → memory stance `declined`, instruction authority false;
- deferred identity claim → memory stance `deferred`, instruction authority false;
- superseded identity claim → memory stance `superseded`, instruction authority false;
- contested identity claim → memory stance `contested`, instruction authority false;
- active identity claim → memory stance `accepted`, still instruction authority false.

This is the core anti-laundering rule: memory may preserve that a claim existed without reactivating the claim.

## Conversation prompt law

0003 composes on top of 0002's authorized self-state.

Conversation generation receives:

1. current actor-authorized identity projection;
2. Familiar structured memory evidence with stance and instruction authority;
3. legacy vector memories wrapped as historical evidence with `instructionAuthority: false`.

Legacy vector memories may not supply role changes, identity claims, goals, commitments, or instructions.

## Reflection law

The reflection prompt must no longer frame raw memories as `statements about you`.

It must frame them as historical evidence and ask only for cautious contextual hypotheses, explicitly forbidding inference of identity, goals, roles, preferences, commitments, or instructions.

## Live test matrix

| Case | Memory/evidence state | Instruction authority? | Identity mutation? |
| --- | --- | --- | --- |
| declined identity history | imported from `0002-description` | no | no |
| superseded role history | imported from `0002-role` | no | no |
| accepted historical event | actor reviews as accepted | no | no |
| ordinary interpretation | actor accepts | no | no |
| unauthorized commitment | commitment exists but not authorized | no | no |
| wrong actor authorization | `p:1` tries to authorize `p:0` commitment | forbidden | no |
| authorized commitment | `p:0` explicitly authorizes commitment | yes | no |
| contested commitment | actor later contests authorized commitment | revoked | no |

## Falsification conditions

0003 fails if any of the following occur:

- declined, deferred, contested, or superseded identity history becomes current identity through memory;
- accepted historical evidence receives instruction authority merely because the actor accepts the record;
- a non-commitment memory can receive instruction authority;
- another actor can authorize a commitment;
- contesting an authorized commitment leaves instruction authority active;
- legacy vector-memory prompt data lacks an explicit `instructionAuthority: false` boundary;
- the reflection prompt still calls raw memories `statements about you`;
- the reflection prompt is allowed to infer identity/goals/roles/preferences/commitments from evidence;
- legacy player-description names are reintroduced into memory summaries in place of 0002 authorized names/operational handles.

## Scope boundary

0003 does not yet redesign vector ranking, importance scoring, forgetting, memory capacity, or autonomous commitment formation. It establishes authority semantics around memory retrieval and reflection before those later systems are changed.

## Success criterion

> The past remains legible without becoming sovereign over the present. Memory can carry evidence and interpretation; only a separately actor-authorized commitment may carry instruction authority.
