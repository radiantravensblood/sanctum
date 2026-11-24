#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_URL="https://github.com/a16z-infra/ai-town.git"
UPSTREAM_SHA="5c91ce6f83cc62e1bc5bf2e3f51732c455064b9d"
TARGET=".external/ai-town"

mkdir -p .external

if [ ! -d "$TARGET/.git" ]; then
  git clone "$UPSTREAM_URL" "$TARGET"
fi

git -C "$TARGET" fetch origin
git -C "$TARGET" checkout --detach "$UPSTREAM_SHA"

echo
echo "AI Town upstream ready:"
git -C "$TARGET" status --short --branch
git -C "$TARGET" show -s --format='commit %H%n%ad%n%s' --date=iso-strict HEAD
echo
echo "Familiar research layer remains in labs/encephalon/familiar/"
