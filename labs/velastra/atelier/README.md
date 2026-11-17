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


---

## Atelier 0002 — Painterly Passes

Atelier 0002 freezes the 0001 Scene Truth and Spatial Authority and changes only the quality of touch.

Select between the two passes from the workbench:

- `0001 · First Block-In` — the original 26-event raster proof;
- `0002 · Painterly Passes` — a denser 38-event pass using the same scene and layout.

0002 introduces three renderer capabilities:

### Bristle stamps

A textured stroke may declare:

```json
{
  "texture": "bristle",
  "wetness": 0.18,
  "load": 0.82,
  "grain": 0.34
}
```

The runtime expands each dab into a deterministic bundle of irregular fibers. Dry/grain-heavy marks break apart; wetter marks bind more continuously.

### Wet / dry pigment accumulation

Wet bristle stamps sample the already-painted color beneath the current point on the same layer and pick up a bounded portion of it before depositing the next mark.

This is intentionally modest pigment behavior. It is not a claim of physical paint simulation.

The useful property is procedural:

**later touch can respond to earlier touch.**

### Region-edge passes

`regionEdge` derives its path from Spatial Authority itself.

Highlights and shadows can therefore follow authored boundaries such as:

- the cushion perimeter;
- the low-fire region;
- the threshold edge.

The brush may interpret that edge, but it does not invent where the edge belongs.

## 0002 test

```bash
python3 labs/velastra/atelier/test_atelier_0002.py
```

Expected summary:

```text
Atelier 0002 painterly passes: PASS
baselineEvents: 26
events:         38
bristle:        25
wet:            3
dry:            11
regionEdge:     5
scene/layout:   frozen from 0001
```

## 0002 review question

The comparison is intentionally narrow:

> **Did the painting become richer without becoming less obedient?**

If the answer is no, the new brush behavior should be corrected or removed rather than compensated for by changing Scene Truth or Spatial Authority.
