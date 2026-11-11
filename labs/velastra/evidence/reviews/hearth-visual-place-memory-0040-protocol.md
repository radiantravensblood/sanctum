# Kernel 0040 — Visual Place Memory Protocol

## Question

Can Velastra learn the visual ontology of House Freedom without copying a reference scene?

Kernel 0039 established that semantic Place Memory is stable but under-expressed. It preserved painterly hand and seed-basin identity, yet did not reliably overcome the inherited dark-parlor / fireplace prior.

Kernel 0040 therefore tests a visual carrier while preserving threshold integrity.

## Experimental design

Hosted Qwen Image Edit does not expose seed control. 0040 is therefore a repeated distributional A/B trial, not a same-seed pair.

Each condition receives:

- the same authored Hearth scene truth;
- the same Handprint;
- the same semantic Place Memory profile from 0039;
- the same approved source-image corpus;
- the same normalized source pixels;
- the same painter-facing positive and negative prompt;
- the same Qwen Image Edit brush and hosted provider;
- the same number of repeated attempts.

The only systematic factor is carrier spatial retention.

### Control — micro_scrub_control

The normalized source corpus is divided into 32px tiles and globally shuffled.

Expected retained evidence:

- global palette;
- local pigment / surface memory;
- tiny edge fragments;
- low-level material evidence.

Expected destroyed evidence:

- room layout;
- object placement;
- medium-scale material adjacency;
- architecture;
- source composition.

### Experimental — visual_place_memory

The exact same normalized source corpus is divided into 96px neighborhoods. Those neighborhoods are globally shuffled and independently rotated / mirrored.

Expected retained evidence:

- the same low-level evidence as control;
- limited meso-scale material adjacency;
- small-scale relationships between wear, surface, light, clutter, repair, and neighboring material.

Expected destroyed evidence:

- global room layout;
- source composition;
- architectural topology;
- source object inventory as a coherent scene.

## Source corpus

The initial 0040 source corpus is deliberately place-oriented:

1. studio_atelier_01 — lived abundance, workbench depth, process evidence, spatial layering.
2. gallery_target_01 — sacred incompletion, material residue, haunted process, non-showroom composition.

The self-portrait is excluded. This kernel tests place-memory, not person-memory.

Both source assets remain reviewed Visual Witness canon. Their people, objects, symbols, architecture, and relationships remain non-canonical for the Hearth.

## Frozen invariants

- Scene truth remains authoritative.
- Handprint remains enabled and unablated.
- Semantic Place Memory remains identical across both conditions.
- Source image corpus is identical across conditions.
- Normalized source pixels are identical before carrier transformation.
- Painter-facing prompts must hash identically across conditions.
- Ordinary Witness Firewall remains disabled because both carriers are already transformed.
- No source person, relationship, object inventory, or architecture may become scene truth.
- Provider seed control is unavailable and must not be implied.

## Execution

Default trial size:

- 4 control renders
- 4 Visual Place Memory renders
- alternating execution order to reduce provider / time-order bias

The trial driver must fail closed if painter-facing prompt hashes differ between conditions.

## Human review axes

Review the two distributions for:

- scene-truth recognizability;
- painterly hand fidelity;
- source-layout leakage;
- source-object leakage;
- place specificity;
- inhabitation;
- relational geometry;
- sacred / ordinary coexistence;
- old / new coexistence;
- technology belonging naturally;
- persistence or reduction of generic prestige / parlor grammar.

## Success

0040 succeeds if the Visual Place Memory distribution shows a directional increase in lived-place specificity across more than one output while:

- preserving authored scene truth;
- preserving painterly hand;
- avoiding source-room copying;
- avoiding source-object inheritance;
- avoiding collapse into one source composition.

A prettier or moodier image is not sufficient.

## Falsification

0040 is falsified or inconclusive if:

- control and experimental distributions are visually indistinguishable;
- experimental outputs inherit source architecture or object inventory;
- scene truth materially degrades;
- the only improvement is atmospheric prettiness;
- one lucky output carries the entire apparent effect;
- provider stochasticity overwhelms any carrier effect.

## Interpretation boundary

Visual morphology is evidence about rendering behavior only. It must not be interpreted as evidence of agency, consciousness, supernatural presence, or autonomous intention.
