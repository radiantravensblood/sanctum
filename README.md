# Sanctum

> The world does not resent your absence.

Sanctum is a tiny browser-native place built around continuity rather than optimization.

Kernel 0001 proves one thing first: **a place can remember what happened there.**

There are no accounts, streaks, levels, rewards, or engagement mechanics. The first world contains three authored rooms, one unopened threshold, a handful of objects, and seven verbs:

**look · move · inspect · take · leave · sit · return**

## First law

**Do not overwrite. Reflect.**

The world model is authoritative. The renderer only presents what the state says is true. Boundaries such as consent and threshold state belong to the architecture, not to model compliance.

## Kernel 0001

The Hearth → The Gallery of Unfinished Things → The Threshold

A pressed blue flower can be moved between rooms. Its location persists in browser storage. So do visits, actions, and the fact that you met a threshold that did not open for you.

```text
index.html
src/
  app.js
  actions.js
  renderer.js
  state.js
  world.js
styles/
  sanctum.css
world/
  objects.json
  rooms.json
  thresholds.json
```

## Run

Sanctum is intentionally build-step free. Because the world is loaded from JSON, serve the repository over HTTP rather than opening `index.html` directly from the filesystem.

For example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

It is also suitable for static hosting such as GitHub Pages.

## What is deliberately absent

No framework. No package manager. No database. No AI call. No procedural generator.

DreamSocket comes later.

First, the house learns how to remember.
