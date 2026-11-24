#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
TARGET="$ROOT/.external/ai-town"
OVERLAY="$ROOT/labs/encephalon/familiar/overlays/0002"
PIN="5c91ce6f83cc62e1bc5bf2e3f51732c455064b9d"

if [ ! -d "$TARGET/.git" ]; then
  echo "Missing $TARGET. Run bootstrap_ai_town.sh first." >&2
  exit 1
fi

HEAD_SHA="$(git -C "$TARGET" rev-parse HEAD)"
if [ "$HEAD_SHA" != "$PIN" ]; then
  echo "Refusing overlay: expected pinned AI Town $PIN, found $HEAD_SHA" >&2
  exit 1
fi

# Compose on top of the already-proven invitation authority overlay.
bash "$ROOT/labs/encephalon/familiar/overlays/0001/apply.sh"

mkdir -p "$TARGET/convex/familiar"
cp "$OVERLAY/convex/familiar/identitySchema.ts" "$TARGET/convex/familiar/identitySchema.ts"
cp "$OVERLAY/convex/familiar/identity.ts" "$TARGET/convex/familiar/identity.ts"

python3 - "$TARGET/convex/schema.ts" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
if "familiarIdentityTables" not in text:
    needle = "import { familiarTables } from './familiar/schema';"
    if needle not in text:
        raise SystemExit("0001 familiar schema import missing")
    text = text.replace(
        needle,
        needle + "\nimport { familiarIdentityTables } from './familiar/identitySchema';",
    )
    spread = "  ...familiarTables,\n"
    if spread not in text:
        raise SystemExit("0001 familiar table spread missing")
    text = text.replace(
        spread,
        spread + "  ...familiarIdentityTables,\n",
    )
    path.write_text(text)
PY

python3 - "$TARGET/convex/agent/conversation.ts" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()

if "identityPromptLines" not in text:
    import_needle = "import { NUM_MEMORIES_TO_SEARCH } from '../constants';"
    if import_needle not in text:
        raise SystemExit("conversation import seam not found")
    text = text.replace(
        import_needle,
        import_needle + "\nimport { AuthorizedIdentityView, identityPromptLines, loadAuthorizedIdentityView } from '../familiar/identity';",
    )

    text = text.replace(
        "const { player, otherPlayer, agent, otherAgent, lastConversation } = await ctx.runQuery(",
        "const { player, otherPlayer, selfIdentity, otherIdentity, lastConversation } = await ctx.runQuery(",
    )
    text = text.replace(
        "const { player, otherPlayer, conversation, agent, otherAgent } = await ctx.runQuery(",
        "const { player, otherPlayer, conversation, selfIdentity, otherIdentity } = await ctx.runQuery(",
    )
    text = text.replace(
        "prompt.push(...agentPrompts(otherPlayer, agent, otherAgent ?? null));",
        "prompt.push(...agentPrompts(selfIdentity, otherIdentity));",
    )

    old_prompts = """function agentPrompts(
  otherPlayer: { name: string },
  agent: { identity: string; plan: string } | null,
  otherAgent: { identity: string; plan: string } | null,
): string[] {
  const prompt = [];
  if (agent) {
    prompt.push(`About you: ${agent.identity}`);
    prompt.push(`Your goals for the conversation: ${agent.plan}`);
  }
  if (otherAgent) {
    prompt.push(`About ${otherPlayer.name}: ${otherAgent.identity}`);
  }
  return prompt;
}
"""
    new_prompts = """function agentPrompts(
  selfIdentity: AuthorizedIdentityView,
  otherIdentity: AuthorizedIdentityView,
): string[] {
  return identityPromptLines(selfIdentity, otherIdentity);
}
"""
    if old_prompts not in text:
        raise SystemExit("legacy agentPrompts seam not found")
    text = text.replace(old_prompts, new_prompts)

    start = text.find("    const playerDescription = await ctx.db")
    end = text.find("    const lastTogether = await ctx.db", start)
    if start < 0 or end < 0:
        raise SystemExit("queryPromptData legacy metadata seam not found")

    replacement = """    const selfIdentity = await loadAuthorizedIdentityView(
      ctx.db,
      args.worldId,
      args.playerId,
    );
    const otherPlayer = world.players.find((p) => p.id === args.otherPlayerId);
    if (!otherPlayer) {
      throw new Error(`Player ${args.otherPlayerId} not found`);
    }
    const otherIdentity = await loadAuthorizedIdentityView(
      ctx.db,
      args.worldId,
      args.otherPlayerId,
    );
    const conversation = world.conversations.find((c) => c.id === args.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${args.conversationId} not found`);
    }
    const agent = world.agents.find((a) => a.playerId === args.playerId);
    if (!agent) {
      throw new Error(`Player ${args.playerId} is not an agent`);
    }
"""
    text = text[:start] + replacement + text[end:]

    old_return = """    return {
      player: { name: playerDescription.name, ...player },
      otherPlayer: { name: otherPlayerDescription.name, ...otherPlayer },
      conversation,
      agent: { identity: agentDescription.identity, plan: agentDescription.plan, ...agent },
      otherAgent: otherAgent && {
        identity: otherAgentDescription!.identity,
        plan: otherAgentDescription!.plan,
        ...otherAgent,
      },
      lastConversation,
    };
"""
    new_return = """    return {
      player: { name: selfIdentity.authorizedName ?? selfIdentity.operationalHandle, ...player },
      otherPlayer: {
        name: otherIdentity.authorizedName ?? otherIdentity.operationalHandle,
        ...otherPlayer,
      },
      conversation,
      selfIdentity,
      otherIdentity,
      lastConversation,
    };
"""
    if old_return not in text:
        raise SystemExit("queryPromptData return seam not found")
    text = text.replace(old_return, new_return)

    if "agent.identity" in text or "agent.plan" in text or "agentDescription.identity" in text or "agentDescription.plan" in text:
        raise SystemExit("legacy identity/plan prompt references remain after patch")

    path.write_text(text)
PY

echo "Familiar 0002 identity-authority overlay applied."
echo "Pinned upstream remains detached at $(git -C "$TARGET" rev-parse --short HEAD)."
echo "Legacy identity/plan remain stored for provenance, but the conversation prompt path no longer reads them."
echo "Deploy with: cd .external/ai-town && npx convex dev --once"
