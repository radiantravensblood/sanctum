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


---

## Atelier 0003 — Eye / Hand Loop

Atelier 0003 changes the unit of authorship.

0001 proved direct raster obedience.

0002 proved that richer brush behavior can be added without surrendering scene sovereignty.

0003 does **not** pre-author a finished painting. It introduces a gated production sequence:

```text
Layout
  ↓
Rough Key
  ↓ [observe]
Breakdown
  ↓ [observe]
Second Key
  ↓ [observe]
Material / Light
  ↓ [observe]
Cleanup
  ↓ [observe]
Composite
```

Only **Layout** and **Rough Key** exist in the first 0003 implementation.

The later stages are intentionally blocked until the active review is answered.

### Rough Key law

The fixed-object regions remain authoritative, but they no longer paint their own silhouettes.

For the Rough Key:

- the fire is constructed from broad bristle strokes inside the fire region;
- the cushion is constructed from layered mass strokes inside the cushion region;
- the threshold is constructed from dark and cool vertical strokes inside the threshold region;
- `regionFill` is forbidden for those three authored form regions.

The wall and floor may still receive broad ground fields because they are environmental support planes rather than fixed-object silhouettes.

### Observation packet

The 0003 workbench exposes the production stages and review questions below the canvas.

After viewing the complete Rough Key, record what the canvas actually did and choose **Copy observation packet**.

The packet records:

- workflow and review identity;
- current stage;
- scene, layout, and event fingerprints;
- authored and manual-event counts;
- the active review questions;
- human/painter notes;
- the fact that the next stage remains locked.

A copied observation does not automatically unlock anything. It is evidence for the next authored decision.

### Test

```bash
python3 labs/velastra/atelier/test_atelier_0003.py
```

The test fails if:

- a future stage is prematurely active;
- the required Rough Key review is missing;
- fixed forms are painted with `regionFill`;
- scene object identity/cardinality is lost.

The governing loop is:

> **render → observe → decide → author the next marks → render again**

The mathematics remain motor control.

Visual judgment decides what the hands do next.


---

## Velastra Eyes — Retina 0001

The first Eyes prototype is native to the Atelier workbench.

It does not call a generative model and it does not claim that numeric image analysis is aesthetic judgment.

**Capture Eyes** completes the current active stage, temporarily removes the Spatial Authority overlay, and samples the actual composite canvas.

It produces four simultaneous views:

- whole composition;
- fire crop;
- cushion crop;
- threshold crop.

Each view exposes simple perceptual instruments:

- mean luminance;
- local contrast;
- mean saturation;
- edge density;
- warmth.

These numbers are **measurement without sovereignty**.

They may help expose value collapse, flatness, excessive edge activity, or chromatic imbalance. They may not decide whether a passage is beautiful, alive, or worth preserving.

The Eye packet uses protocol:

```text
velastra.atelier.eye.v1
```

Its laws are:

```text
measurementsAreInstrumentsNotJudgment = true
eyeCannotRewriteSceneTruth = true
eyeCannotAuthorizeNewObjects = true
handMustReceiveExplicitPainterlyIntention = true
```

The intended loop is:

```text
canvas
  ↓
actual pixel checkpoint
  ↓
whole + foveal inspection
  ↓
visual judgment
  ↓
explicit painterly intention
  ↓
bounded Hand action
  ↓
canvas
```

Run the Eyes integrity test with:

```bash
python3 labs/velastra/atelier/test_atelier_eyes.py
```


---

## Eye Response 0001 — spatial hinge experiment

The first native Eyes checkpoint at Breakdown showed a specific perceptual failure:

- the fire was the only locally articulated passage;
- the cushion had chroma and some volume but weak edge hierarchy;
- the threshold still read primarily as a dark vertical interruption;
- the upper wall bands remained procedural;
- the whole composition lacked a stable depth coordinate.

Rather than advancing directly to Second Key, Atelier 0003 inserts **Eye Response 0001**.

The response is deliberately constrained to eight marks.

It may touch only:

- wall;
- floor;
- threshold.

It may not touch:

- fire;
- cushion;
- scene object cardinality;
- Scene Truth;
- Spatial Authority.

The painterly intention is:

> Create one believable spatial hinge at the threshold/floor/wall junction using selective value separation and lost/found edges, so the Hearth begins to exist as a place before its objects are further described.

The experimental question is:

> Can eight perception-led touches materially improve the whole-composition read without changing scene facts or compensating through prettier object rendering?

After rendering the cumulative 43-event canvas, capture Eyes again.

If the whole-composition read materially improves, the Eye → Hand bridge has demonstrated perceptual leverage.

If it does not, the next bottleneck is likely the expressive power of the Hand rather than observation.
