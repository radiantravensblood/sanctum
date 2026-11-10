# Hearth Spatial Identity 0039 — Protocol

**Kernel:** 0039  
**Status:** experimental / unrendered  
**Question:** Can a candidate-local Place Memory layer make known Hearth seed basins read more like House Freedom without destroying Velastra's painterly hand, authored scene truth, or the characteristic morphology of each seed?

## Why this kernel exists

0037 and 0038 separated two things that had previously been entangled:

1. **Hand fidelity** is becoming coherent across seeds.
2. **Hearth fidelity** remains underdetermined and often falls back to inherited parlor, ceremonial, prestige, or tableau grammar.

0039 does not retune the Handprint and does not mutate the Hearth manifest. It introduces one experimental representation layer: **Place Memory / Spatial Identity**.

The layer encodes relational and temporal behavior rather than a shopping list of objects. It asks for a room organized around belonging, mutual presence, ordinary use, sacred/ordinary coexistence, non-alienating technology, visible repair, unfinishedness, and return.

The internal profile name is provenance only. The image model receives concrete spatial consequences, not the words "House Freedom", "Place Memory", or "Spatial Identity".

## Frozen coordinates

| Seed | Existing working morphology |
| --- | --- |
| 190920 | smoky_presence |
| 190921 | clear_intimate |
| 190922 | wide_tableau |
| 190923 | centered_ceremonial |

Each seed receives a paired test:

- **A — baseline:** current 0038-era Hearth prompt.
- **B — spatial_identity:** identical manifest, Handprint, brush, transport, seed, and scene truth plus the candidate-local Place Memory profile.

Eight renders total.

Execution alternates A/B order across seeds to reduce simple run-order bias.

## What is frozen

- `qwen_image`
- Hugging Face transport
- the Hearth manifest
- the current Handprint
- witness pixels absent
- style ablations absent
- control-plane isolation
- threshold integrity
- fixed-object enforcement as inherited from 0038
- same seed within each A/B pair

## What changes

Exactly one experimental factor:

`house_freedom_hearth_v1`

Its painter-facing consequences live in `world/velastra-place-identities.json`. Its ethical/semantic commitments remain provenance and are not literal object requests.

## Review dimensions

For each image:

- hand fidelity
- Hearth fidelity
- basin character
- camera
- topology
- presentation mode
- relational geometry
- evidence of lived use
- sacred/ordinary coexistence
- whether technology belongs naturally
- temporal texture / visible continuity
- threshold hospitality
- generic prestige prior
- scene-truth pass

For each A/B pair:

- basin character preserved?
- hand fidelity preserved?
- Hearth fidelity improved?
- inhabitation improved?
- prestige/tableau prior reduced?
- scene truth still recognizable?

## Success condition

0039 is interesting only if Place Memory improves Hearth fidelity in more than one basin **without** homogenizing the four seeds into one composition or damaging the painterly hand.

A merely "cozier" image is not sufficient.

A successful result should preserve the seed's character while changing what the room appears to believe a home is.

## Falsification

If B simply adds clutter, makes every room look alike, damages the hand, overrides scene truth, or converts the ethics into visible slogans/signage, the layer fails in its current form.

If text-only Place Memory is too weak, the next experiment may test **visual place memory** as a representation distinct from ordinary Visual Witness pixels.

## Commands

Plan only:

```bash
.venv/bin/python labs/velastra/painter/spatial_identity_trial.py \
  authoring/inbox/hearth--velastra.place_tableau.1hsb6ko.velastra.json
```

Render the planned eight-image trial:

```bash
.venv/bin/python labs/velastra/painter/spatial_identity_trial.py \
  authoring/inbox/hearth--velastra.place_tableau.1hsb6ko.velastra.json \
  --render
```

The trial record is written to:

`labs/velastra/evidence/trials/hearth-spatial-identity-0039.json`

Candidates remain candidates. Nothing in this kernel promotes output into canon automatically.
