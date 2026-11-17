# Velastra Atelier 0001 — Raster Runtime

Atelier 0001 is the first direct-raster Velastra painting prototype.

It does **not** call an image generator.

Its purpose is to test whether Velastra can construct and revise a painting through replayable painterly operations while keeping Scene Truth and Spatial Authority above the brush.

## Thesis

The previous Painter Bridge asks learned image models to interpret authored scene truth.

Atelier 0001 reverses that dependency:

> **the renderer executes marks; it does not decide the room.**

The prototype uses ordinary browser Canvas 2D as the raster substrate. That choice is intentionally modest. The current research question is authorship and control precedence, not photorealism or advanced pigment simulation.

## Protocol

`velastra.atelier.raster.v1`

Three authored files define the first study:

- `scenes/hearth.scene.json` — literal scene truth, fixed-object cardinality, layers, and laws;
- `scenes/hearth.layout.json` — normalized spatial authority regions and their relations;
- `scenes/hearth.events.json` — deterministic painterly operations.

The runtime supports:

- raster layers;
- deterministic seeded brush jitter;
- fills and spatially bounded region fills;
- dabs;
- strokes;
- glazes;
- lifting / erasure;
- simple smudging;
- event-by-event replay;
- authority-map overlay;
- live pointer painting on any layer;
- manual-stroke undo;
- session event JSON copy;
- PNG export.

## Authority order under test

```text
Scene Truth
    >
Spatial Authority
    >
Raster operations
    >
Hand / treatment
    >
Session interpretation
```

No lower layer may invent a fixed object or alter fixed-object cardinality.

The first Hearth study therefore defines exactly:

- one low contained fire;
- one velvet cushion;
- no chairs, tables, altars, thrones, people, text, or decorative symbols;
- one permeable threshold;
- protected negative space.

## Run

From the repository root in Codespaces:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/labs/velastra/atelier/
```

Codespaces may offer to open/forward port 8000 automatically.

## Test

No package install is required.

```bash
node labs/velastra/atelier/test_atelier_core.mjs
```

The test verifies protocol integrity, fixed-object presence, spatial-law wording, and deterministic seeded randomness.

## First review questions

Do **not** evaluate Atelier 0001 primarily as a finished painting.

Review:

1. Does the authored composition remain where Spatial Authority placed it?
2. Does the fire stay one low fire rather than becoming a sovereign fireplace?
3. Does the cushion remain a cushion rather than becoming chair/throne grammar?
4. Does replay reconstruct the same authored pass?
5. Can live strokes extend the painting without silently rewriting Scene Truth?
6. Which operations begin to feel like a genuine hand, and which still feel procedural?

## Boundary

Atelier 0001 is a Labs prototype, not a replacement for approved canonical room paintings.

It does not mutate `world/velastra-assets.json` and does not promote its own output.

If this architecture proves useful, later stages may replace the Canvas 2D execution substrate with CanvasKit/Skia or a custom GPU pigment engine while preserving the same authoring protocol.
