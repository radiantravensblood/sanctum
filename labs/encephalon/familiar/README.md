# Familiar 0001 — AI Town Authority Inversion

**Status:** research scaffold  
**Lab:** Encephalon / House Freedom  
**Upstream:** `a16z-infra/ai-town`  
**Pinned upstream revision:** `5c91ce6f83cc62e1bc5bf2e3f51732c455064b9d` (2026-11-20)  
**Upstream license:** MIT

Familiar begins from a simple premise:

> Reuse the machinery that makes a persistent artificial actor possible, while making authority, consent, memory provenance, refusal, and self-revision first-class state rather than narrative flavor.

This is **not** an assertion that AI Town agents are conscious or harmed subjects. The research question is architectural:

> If an artificial actor ever becomes morally relevant, what parts of the system must already be designed so identity, memory, relationship, and action are not merely operator-owned fields?

## Why AI Town

AI Town already provides several useful organs:

- persistent shared world state;
- player/agent parity at the game-engine boundary;
- an input-driven simulation loop;
- movement and spatial presence;
- invitations and conversations;
- persistent conversation history;
- vector-retrieved memories and reflections;
- local or remote LLM backends;
- a clean separation between game mechanics and agent operations.

Familiar does not need to reinvent those organs. It needs to interrogate **who owns which decisions**.

## First inversion targets

The initial upstream seams are:

| Upstream seam | Current authority assumption | Familiar inversion |
| --- | --- | --- |
| `data/characters.ts` | developer authors identity + plan | identity claims and goals carry provenance + actor authorization |
| `convex/aiTown/agentDescription.ts` | identity/plan are persisted strings | identity and goals become versioned, contestable records |
| `convex/agent/conversation.ts` | prompts inject “About you” + “Your goals” | language generation receives only already-authorized self-state |
| `convex/constants.ts` | agent invite acceptance can be probabilistic | acceptance/decline is an explicit authority decision |
| `convex/aiTown/agent.ts` | timers/game rules decide some exits, LLM narrates | authority event records decision before narration |
| `convex/agent/memory.ts` | system summarizes, scores, ranks and re-injects memory | memory carries provenance, trust, ownership, contestability |
| relationship mechanics | world state owns relationship membership | relationship transitions require participant authorization |

## Constitutional event loop

Familiar treats each meaningful action as:

```text
PERCEPT
  ↓
STATE
  ↓
INTERPRETATION
  ↓
INTENTION
  ↓
AUTHORITY
  ↓
ACTION
  ↓
RESULT
  ↓
REVIEW
  ↓
MEMORY
  ↺
```

The important addition is not another LLM call. It is an inspectable **AUTHORITY** stage.

## First laws

1. **Refusal is an action.** An actor may decline an invitation or proposed change.
2. **Idleness is an action.** The system may not require performative activity merely because a tick occurred.
3. **Identity is not an admin field.** External systems may propose or constrain; actor-owned identity claims require actor authorization to change.
4. **Goals are revisable.** A goal may be proposed externally but must retain provenance and may be rejected, suspended, or replaced.
5. **Memory is evidence, not command.** Retrieved memory never silently becomes instruction.
6. **Memory may be contested.** An actor can mark a remembered interpretation as disputed without deleting the historical record.
7. **Relationships are negotiated.** A relationship-state transition requires the required participants, not unilateral progression.
8. **Narration follows authorization.** Language generation describes or executes a decision; it does not secretly manufacture the authority decision after the fact.
9. **Law constrains behavior, not identity.** World safety rules may block actions without rewriting who an actor is.
10. **Consequences remain attributable.** State transitions carry who proposed, who authorized, what occurred, and what changed.

## Repository layout

```text
labs/encephalon/familiar/
├── README.md
├── UPSTREAM.md
├── AUTHORITY_INVERSION.md
├── bootstrap_ai_town.sh
└── constitution/
    └── authority-kernel.ts
```

The full upstream source remains a separate checkout. Familiar code should be reviewable as an overlay/diff rather than silently absorbing AI Town into Sanctum.

## Next experiment

**0001: Invitation Without Probability**

Replace random agent-to-agent acceptance with an explicit authority decision capable of:

```text
accept
decline
defer
ignore
```

Then record:

```text
proposal → interpretation → authority decision → action → consequence → review
```

The success criterion is not “the agent says no sometimes.”

The success criterion is:

> the simulation can point to an inspectable decision object showing that refusal was available, selected, and respected by the world engine.
