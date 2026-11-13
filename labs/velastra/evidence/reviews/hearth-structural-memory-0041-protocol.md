# Kernel 0041 — Structural Hearth Memory Protocol

## Question

Can explicit lived-space topology overcome the ceremonial Hearth attractor without reference pixels?

Kernel 0040 showed strong cross-condition convergence toward a symmetrical, axial, ritualized Hearth chamber. Carrier differences were too weak to justify further paid image-edit repeats.

0041 removes reference images entirely.

## Experimental design

Brush: Z-Image Turbo  
Transport: Hugging Face / fal-ai  
Mode: text-to-image  
Default seeds: 190920, 190923

Each seed is rendered as a same-seed A/B pair.

### A — baseline

- authored Hearth scene truth;
- full Handprint;
- current painter dialect;
- threshold integrity;
- no reference pixels;
- no Structural Hearth Memory.

### B — structural_memory

Everything in A, plus a topology-only contract that requests:

- several non-collinear centers of use;
- open circulation through the room;
- warmth as one room element rather than sovereign altar;
- varied seating / rest orientation rather than mirrored bilateral pairing;
- visual weight distributed across warmth, rest, activity, and threshold;
- an inhabitable interior viewpoint rather than frontal ceremonial staging.

The structural layer may not invent people, relationships, fixed objects, or new semantic scene facts.

## Why Z-Image Turbo

The current hosted configuration provides deterministic seed control and has been materially cheaper in prior Velastra runs than Qwen Image Edit.

That restores true same-seed attribution while keeping the experiment inexpensive.

## Frozen invariants

- same seed within each A/B pair;
- same authored scene truth;
- same Handprint;
- same brush and provider;
- reference pixels absent;
- no style ablation;
- only experimental factor: structural_hearth_memory.

## Pilot size

Two seeds, four renders total.

Expand only if the first two pairs show directional topology change without scene-truth degradation.

## Human review

For each pair, review:

- painterly hand;
- scene-truth recognizability;
- reduction of ceremonial / axial organization;
- reduction of bilateral mirror symmetry;
- emergence of multiple centers of use;
- open circulation;
- inhabitable viewpoint;
- whether fire becomes subordinate to the room;
- ordinary domesticity.

## Success

0041 succeeds if both seed pairs show a directional structural change while remaining recognizably same-seed relatives and preserving scene truth / hand.

## Falsification

0041 is falsified or inconclusive if:

- both arms remain topologically indistinguishable;
- the experimental arm only adds clutter;
- the same ceremonial axis persists unchanged;
- authored scene truth degrades;
- structural prompting invents semantic facts.

## Interpretation boundary

Visual morphology is evidence about rendering behavior only. It must not be interpreted as evidence of agency, consciousness, supernatural presence, or autonomous intention.


## Canonical dry-run inspection

Use this projection after planning. The experimental-factor fields must be read from the nested `.experimentalFactor` object; bare field names at the root will return null and can accidentally substitute top-level `laws`.

```bash
jq '{
  status,
  seeds,
  promptDiagnostics,
  frozen,
  experimentalFactor: .experimentalFactor,
  executionOrder
}' labs/velastra/evidence/trials/hearth-structural-memory-0041.json
```

Expected before inference:

- `status == "planned"`
- `compactBaseTokensEstimate <= 300`
- `structuralFinalTokensEstimate <= 420`
- baseline and structural prompt hashes differ
- `experimentalFactor.profileId == "house_freedom_hearth_v1"`
- `experimentalFactor.structuralSha256` is non-null
- `experimentalFactor.nodes`, `relations`, and `laws` are populated
- `referencePixels == "none"`
- `onlyExperimentalFactor == "structural_hearth_memory"`
