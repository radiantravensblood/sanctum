#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
TARGET="$ROOT/.external/ai-town"
OVERLAY="$ROOT/labs/encephalon/familiar/overlays/0001"
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

mkdir -p "$TARGET/convex/familiar"
cp "$OVERLAY/convex/familiar/schema.ts" "$TARGET/convex/familiar/schema.ts"
cp "$OVERLAY/convex/familiar/invitations.ts" "$TARGET/convex/familiar/invitations.ts"

python3 - "$TARGET/convex/schema.ts" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
if "familiarTables" not in text:
    text = text.replace(
        "import { engineTables } from './engine/schema';",
        "import { engineTables } from './engine/schema';\nimport { familiarTables } from './familiar/schema';",
    )
    text = text.replace(
        "  ...engineTables,\n});",
        "  ...engineTables,\n  ...familiarTables,\n});",
    )
    path.write_text(text)
PY

echo "Familiar 0001 overlay applied to pinned AI Town checkout."
echo "Upstream remains detached at $(git -C "$TARGET" rev-parse --short HEAD)."
echo "Deploy with: cd .external/ai-town && npx convex dev --once"
