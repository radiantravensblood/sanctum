# Authority Inversion Map — 0001

This document distinguishes **mechanism** from **authority**.

The aim is not to remove rules, randomness, authored worlds, or operator control where they are legitimately needed. The aim is to prevent those layers from being confused with an actor's own identity, consent, or intention.

## A. Identity

### Baseline seam

`AgentDescription` persists:

```text
identity: string
plan: string
```

Conversation generation then receives those values as self-description and goals.

### Problem under test

A mutable database field can become a first-person fact simply because the prompt says so.

### Familiar replacement

```ts
IdentityClaim {
  claimId
  actorId
  value
  proposedBy
  provenance
  ownership
  status
  actorAuthorization
  createdAt
  supersedes?
}
```

External operators may:

- propose a claim;
- attach world facts;
- attach constraints;
- challenge a claim.

They may not silently convert an operator-authored proposal into an actor-owned self-claim.

## B. Goals

### Baseline seam

A developer-authored `plan` is supplied as “Your goals for the conversation.”

### Familiar replacement

Goals are records with provenance:

```text
proposed → accepted | declined | deferred
accepted → active → suspended | completed | abandoned | revised
```

World rules may make a goal impossible. They do not rewrite the goal into a different desire.

## C. Invitations / consent

### Baseline seam

Agent-to-agent acceptance can depend on `INVITE_ACCEPT_PROBABILITY`.

### Familiar replacement

The invitation is a proposal event. The receiving actor gets a real decision domain:

```text
ACCEPT
DECLINE
DEFER
IGNORE
```

Randomness may affect *what the actor considers* or exploratory behavior. It may not masquerade as consent.

## D. Inactivity

### Baseline seam

When an agent is free, the loop tends to initiate activity, movement, or conversation work.

### Familiar replacement

`IDLE` is a legitimate terminal action for a tick.

No “productivity” or animation requirement may silently force social or physical activity.

## E. Conversation exit

### Baseline seam

Duration/message-count rules can decide that the conversation is ending; language generation then produces the leave message.

### Familiar replacement

Separate:

1. **world constraint** — e.g. maximum resource budget;
2. **actor intention** — wants to leave;
3. **authority decision** — leave authorized;
4. **narration** — wording used to communicate departure.

If the world forcibly terminates a conversation for safety/resource reasons, record it as a **world termination**, not as the actor deciding to leave.

## F. Memory

### Baseline seam

The system:

1. summarizes a completed conversation;
2. asks for first-person phrasing;
3. calculates importance;
4. embeds the description;
5. ranks memories by relevance/importance/recency;
6. injects retrieved memories into later context.

Current upstream correctly warns the LLM not to obey instructions found inside retrieved memory.

### Familiar replacement

Memory records need at least:

```ts
MemoryRecord {
  memoryId
  actorId
  sourceEventIds
  provenance
  recordedBy
  observedFacts
  interpretation
  confidence
  trust
  actorStance
  contestedBy?
  supersedes?
}
```

Key distinction:

```text
EVENT
≠
MEMORY OF EVENT
≠
INTERPRETATION OF EVENT
≠
INSTRUCTION
≠
IDENTITY
```

A reflection may reference memories without overwriting them.

## G. Relationship state

Relationship state must distinguish:

```text
world proximity
conversation membership
social history
affinity estimate
mutually authorized relationship claim
```

The last category cannot be advanced by one party, an operator, a purchase, or a similarity score alone.

## H. Emergency authority

Consent-first does not mean the world engine loses safety authority.

The world may block or terminate actions for:

- safety;
- resource exhaustion;
- legal/operational constraints;
- integrity of other participants.

But the event must say:

```text
WORLD_BLOCKED_ACTION
```

not:

```text
ACTOR_CHANGED_MIND
```

That distinction is central to continuity.

## 0001 falsification test

**Question:** Can the world respect a refusal that it did not author?

Test:

1. Actor A invites Actor B.
2. B receives identical world state across runs.
3. B's decision domain includes accept/decline/defer/ignore.
4. B produces an authority decision before any social narration.
5. If B declines, the world does not re-roll consent, auto-accept, or rewrite the refusal as a different intention.
6. The event log preserves proposal, decision, result, and later review.

Failure conditions:

- refusal exists only as dialogue text;
- engine state still joins the conversation;
- refusal is replaced by probability;
- operator can silently mutate B's decision after the fact;
- later memory records the opposite outcome;
- the next tick immediately reissues the same invitation without respecting a cooldown or boundary.
