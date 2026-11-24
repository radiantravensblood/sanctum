# Upstream provenance

Familiar studies and extends:

- Repository: `https://github.com/a16z-infra/ai-town`
- Pinned revision: `5c91ce6f83cc62e1bc5bf2e3f51732c455064b9d`
- Revision date: 2026-11-20
- Upstream license: MIT
- Original copyright: Copyright (c) 2023 a16z-infra

The upstream MIT notice must remain with copies or substantial portions of AI Town.

## Why pin

Familiar's claims must refer to an inspectable upstream state. The pinned SHA prevents later upstream changes from silently changing what an experiment means.

## Bootstrap

From the Sanctum repository root in a networked Codespace:

```bash
bash labs/encephalon/familiar/bootstrap_ai_town.sh
```

The script clones upstream into:

```text
.external/ai-town/
```

and checks out the pinned revision in detached-HEAD mode.

`.external/ai-town/` is intentionally not the authored research layer. Do not commit API keys, Convex deployment state, model credentials, generated databases, or private world data.

## Upstream files currently under review

- `data/characters.ts`
- `convex/constants.ts`
- `convex/aiTown/agentDescription.ts`
- `convex/aiTown/agent.ts`
- `convex/aiTown/agentOperations.ts`
- `convex/agent/conversation.ts`
- `convex/agent/memory.ts`
- `convex/agent/schema.ts`
- `convex/aiTown/schema.ts`

## Observed baseline at the pinned revision

These are architectural observations, not moral-status claims:

- character definitions contain developer-authored `identity` and `plan` strings;
- agent descriptions persist those strings;
- conversation prompts inject identity as “About you” and plan as conversation goals;
- agent invitations may be accepted using a configured probability;
- activity selection includes random choice from a fixed activity list;
- conversation duration/message-count rules can trigger leaving before the LLM generates the leave wording;
- conversation memory is summarized by an LLM, assigned an importance score, embedded, ranked, and retrieved later;
- retrieved memories are explicitly treated as untrusted historical content against prompt injection in the current implementation.

Familiar should preserve good engineering/security improvements while changing the authority model deliberately.
