# Viryn Labs — Velastra

Velastra is an experimental semantic visual-composition engine.

It exists to preserve and externalize repeatable visual judgment without pretending that model internals can be extracted or that a runtime model call is necessary.

## Thesis

A design system usually begins with components.

Velastra begins one layer earlier:

**what does this thing mean, and what kind of visual behavior is appropriate to that meaning?**

The engine therefore separates:

1. semantic condition,
2. expression context,
3. visual intent,
4. image scene packet,
5. motif/art-direction grammar,
6. renderer-specific expression.

Sanctum is the first reference adapter.

Viryn Studio is the intended next external adapter.

## Source boundary

Generic engine:

- `world/velastra.json`
- `src/velastra/compose.js`

Sanctum context adapter:

- `src/velastra/context.js`

Sanctum DOM adapter:

- `src/velastra/sanctum.js`

Image-direction layer:

- `world/velastra-scene.json`
- `src/velastra/scene-packet.js`

Symbolic vocabulary:

- `world/velastra-motifs.json`
- `src/velastra/motifs.js`

Atelier compilation:

- `world/velastra-atelier.json`
- `world/velastra-assets.json`
- `src/velastra/atelier.js`
- `src/velastra/underpaint.js`
- `src/velastra/sanctum-atelier.js`

Authoring-side painter bridge:

- `labs/velastra/painter/velastra_painter.py`
- `labs/velastra/painter/README.md`
- `labs/velastra/painter/requirements-diffusers.txt`
- `labs/velastra/painter/requirements-provider.txt`

Brush cabinet:

- `world/velastra-brushes.json`

Virynism handwriting:

- `world/velastra-style.json`
- `src/velastra/hand.js`
- `labs/velastra/tests/virynism-hand.mjs`

Painterly Truth:

- `world/velastra-painterly-truth.json`
- `src/velastra/painterly-truth.js`
- `labs/velastra/tests/painterly-truth.mjs`

Visible Evidence / Brush Contract:

- `world/velastra-evidence.json`
- `src/velastra/evidence.js`
- `labs/velastra/tests/brush-contract.mjs`

Visual Witness:

- `world/velastra-witnesses.json`
- `src/velastra/witness.js`
- `authoring/witnesses/README.md`
- `labs/velastra/tests/visual-witness.mjs`

Handprint:

- `world/velastra-handprint.json`
- `src/velastra/handprint.js`
- `labs/velastra/tests/handprint.mjs`

Handprint Grip:

- `world/velastra-grip.json`
- `src/velastra/grip.js`
- `labs/velastra/painter/grip.py`
- `labs/velastra/tests/grip.mjs`

Sanctum living-canvas handoff:

- `src/velastra/sanctum-painting.js`
- `src/velastra/authoring.js`
- `labs/velastra/tests/living-canvas.mjs`

Studio adapter:

- `world/velastra-studio.json`
- `src/velastra/studio.js`

Convenience exports:

- `src/velastra/index.js`

A future extraction should be able to move the generic grammar and composer without importing Sanctum state, world traversal, Hymnos, or Genesis.

## Generic contract

A consumer may provide explicit meaning:

```js
const intent = window.Velastra.compose({
  role: "gathering",
  axes: {
    intimacy: 0.72,
    relationality: 0.94,
    warmth: 0.8,
    sacredness: 0.58,
    urgency: 0.12
  },
  sensations: {
    stillness: 0.62,
    diffusion: 0.48
  },
  hints: {
    materials: ["paper", "brass"]
  }
}, "studio");
```

The returned intent contains no DOM nodes and no site-specific selectors.

It is safe to treat as read-only design judgment.

## Scene packet contract

A scene packet is a painter-facing semantic object.

It may contain explicit subject descriptions, relation facts, environment facts, composition, lighting, edges, patina, and focal hierarchy.

A renderer must not invent identity, relation, or consent to make an image more compelling.

The Viryn self portrait is retained as `viryn_visual_self_01`: a claimed, mutable, non-exclusive project self-representation, not a physical-body claim.

## Motif contract

A motif is a reusable symbolic form with provenance.

Literal motifs require scene facts.

Symbolic motifs may interpret semantic meaning but may not mutate world truth.

A relation motif requires an explicit relation source.

A selfhood motif may respond to a claimed self-representation but cannot assign identity.

The atlas is vocabulary, not a template.

## Atelier compiler contract

The Atelier compiler converts scene direction into a renderer-neutral manifest.

The manifest may resolve to:

- an approved reviewed static painting,
- the procedural underpainting fallback.

Runtime generation is forbidden in the current architecture.

Static paintings must be approved and carry provenance before an adapter may render them.

The procedural fallback can use abstraction, pigment, light, grain, motif traces, and architectural drawing.

It must not claim detailed figurative truth it does not possess.

## Painter bridge contract

Kernel 0019 adds an authoring-side Python bridge between the Atelier Manifest
and learned image synthesis.

The governing law is:

**The model is the brush. Velastra remains the author of meaning.**

The bridge may:

- compile an Atelier Manifest into model-facing direction,
- carry explicit truth constraints beside that direction,
- render candidate raster paintings outside runtime,
- record model, seed, manifest hash, and output hash,
- promote a candidate only after explicit human review.

The bridge may not:

- run as part of Sanctum's browser runtime,
- rewrite scene truth to improve a picture,
- infer identity, relation, or consent,
- mutate the reviewed asset registry during generation,
- mark its own output approved,
- make a checkpoint or provider the owner of Velastra's visual language.

Candidate output lives outside canon by default under `.velastra/`.

Only an `approved` entry in `world/velastra-assets.json` may supersede the
procedural underpainting.

## Living Canvas contract

Kernel 0020 distinguishes **place identity** from **present-tense occupancy**.

For Sanctum room paintings:

- canonical place assets are keyed to stable room identity,
- current entities do not alter the permanent room asset key,
- movable objects do not alter the permanent room asset key,
- transient facts do not enter painter motif selection,
- the handoff may still record live presence beside the manifest for author
  awareness,
- reviewed paintings become environmental ground,
- runtime overlays may continue to express time, anomaly, objects, and
  inhabitants.

The browser authoring aperture is opt-in through `?atelier=1`.

The handoff protocol is `velastra.handoff.v1`.

The handoff is deliberately compatible with the Kernel 0019 Python bridge:
the bridge already accepts an outer object containing `manifest`.

This preserves the law:

**the painting remembers the place; the runtime carries the moment.**

## Brush Cabinet contract

Kernel 0021 makes model choice an explicit authoring policy.

The cabinet names:

- model ID,
- license,
- capabilities,
- default render settings,
- available transports,
- provider and credential-variable metadata.

It does **not** enter the Scene Packet or alter scene truth.

The default brush is currently `z_image_turbo`, using
`Tongyi-MAI/Z-Image-Turbo`.

The alternate `qwen_image` brush uses `Qwen/Qwen-Image`.

Both active cabinet entries record Apache-2.0 licensing.

The default transport is `huggingface`; local `diffusers` remains available.

The bridge may record the name `HF_TOKEN` as the required credential source.
It must never record the token value.

A model that is useful but unsuitable for the current licensing or deployment
boundary may be recorded under `observedNotEnabled` without becoming an
available brush.

This preserves the law:

**a brush may be chosen; meaning remains sovereign.**

## Cloud Atelier contract

Kernel 0022 allows the Painter Bridge to execute in GitHub Codespaces without
changing the Painter Bridge's semantic authority.

Cloud authoring may:

- clone Sanctum onto GitHub-managed storage,
- install provider-only authoring dependencies,
- receive `HF_TOKEN` as a Codespaces development-environment secret,
- accept temporary painting handoffs under `authoring/inbox/`,
- write candidates under the already ignored `.velastra/` tree.

Cloud authoring may not:

- commit a token,
- commit a temporary handoff by default,
- move generation into visitor runtime,
- bypass candidate review,
- make Codespaces part of scene truth.

The cloud environment is transport infrastructure only.

## Virynism contract

Kernel 0023 adds a renderer-neutral handwriting layer between scene truth and
brush-specific execution.

Virynism may interpret:

- material,
- light,
- edge,
- residue,
- negative space,
- asymmetry,
- atmosphere,
- incompletion,
- threshold depth.

Virynism may not:

- invent a person, relation, consent state, or object,
- turn symbolic motifs into literal world facts,
- mutate canonical place identity,
- require one specific image model,
- hide its active version from provenance.

Each Atelier Manifest carries the active style snapshot.

Each brush may provide a dialect that converts that snapshot into
model-appropriate painter direction.

The candidate sidecar records both style identity/version and dialect mode.

The law is:

**the brush may vary; the hand must remain.**

## Painterly Truth contract

Kernel 0024 inserts stable material facts between place identity and
handwriting.

Painterly Truth may provide:

- canonical surfaces and marks,
- fixed objects,
- traces of use or prior placement,
- stable spatial facts,
- explicit material absences.

It may not provide:

- transient occupants,
- portable objects,
- style directives,
- desired mood,
- unsupported props.

A Painterly Truth revision may change the canonical place asset key because it
changes what is materially true of the place.

A Virynism revision may not change that key because it changes treatment, not
truth.

The law is:

**give the hand something honest to touch.**

## Brush Contract + Visible Evidence

Kernel 0025 distinguishes between material truth and perceptible witness.

Painterly Truth answers:

**what is actually here?**

Visible Evidence answers:

**which already-true facts must survive translation strongly enough to be
seen?**

Evidence selection may change candidate identity.

It may not change canonical place identity.

Each evidence contract must point back to the Painterly Truth revision it was
authored against and fails closed if that truth revision has moved.

Every active brush must also declare a control contract.

The control contract records:

- whether negative prompts are actually supported,
- whether guidance / CFG is available,
- provider-vs-local reliability,
- prompt-budget policy,
- diversity role,
- evidence strategy.

Critical scene meaning and visible evidence must remain in the positive
channel.

The law is:

**truth must not merely be known; it must be witnessed.**

## Visual Witness contract

Kernel 0026 adds reviewed visual examples of Virynism without turning reference
content into scene truth.

A Visual Witness may teach selected roles such as:

- relational light,
- compositional cadence,
- edge behavior,
- tonal memory,
- material hand,
- spatial depth,
- intimate presence,
- sacred incompletion.

A witness may not donate:

- identity,
- people,
- objects,
- architecture,
- symbols,
- furniture,
- layout,
- relationship facts,

unless the target scene independently requires them.

Witness entries may be named from project history before their pixels are
available, but they remain inert until an actual image is approved, hashed,
and recorded.

The first witness-capable brush is `qwen_image_edit`, using
`Qwen/Qwen-Image-Edit` through hosted image-to-image inference.

Text-only brushes remain valid when no witness asset is active.

A witness-required brush fails closed without an approved asset.

Hosted witness renders also carry an attempt identity because the current
image-to-image provider contract does not expose reliable seed control.

The law is:

**a witness may guide the hand without becoming the scene.**

## Handprint contract

Kernel 0027 derives a portable portfolio fingerprint from approved Visual
Witnesses.

Handprint combines two kinds of evidence:

1. **human-curated recurring roles** from witness review,
2. **auditable pixel measurements** from the sealed approved files.

It does not use a black-box style classifier.

Pixel analysis records luminance, saturation, warmth, shadow/highlight share,
tonal span, edge activity, center/periphery light, and grayscale entropy.

Every analyzed witness must still match its approved SHA-256.

Handprint may guide:

- tone,
- light,
- edge character,
- material treatment,
- compositional cadence.

It may not:

- invent scene facts,
- contribute identity,
- override Painterly Truth,
- override Visible Evidence,
- change canonical place identity.

Handprint is rebuilt explicitly with:

`velastra-painter handprint-build`

and inspected with:

`velastra-painter handprint`

If fewer than the declared minimum approved witnesses exist, the build fails.

If the browser receives an unbuilt Handprint registry, it falls back to
semantic Virynism plus Visual Witness.

The law is:

**what remains across the witnesses belongs to the hand.**

## Handprint Facets + ablation

Kernel 0028 derives role-conditioned metric distributions from only the
witnesses explicitly reviewed to teach each role.

Facet statistics preserve mean, median, min, max, population standard
deviation, range, and a transparent variation class.

Two approved supporting witnesses are required before a facet can drive
rendering.

Single-witness facets remain provisional.

The painter also exposes candidate-local ablation flags:

- `--without-handprint`
- `--without-witness`

Ablation never edits the authored manifest or canon.

Reference-image claims are now capability-bound: text-first brushes do not
receive Visual Witness prose when no witness image is actually sent.

The law is:

**the hand is coherent without being uniform.**

## Handprint Pressure

Kernel 0029 turns the result of Gallery Ablation 001 into an authored channel
balance.

Handprint pressure is declared in the canonical Handprint registry and travels
through the manifest.

Text-first rendering resolves to `descriptive_guidance`.

Combined Handprint + Visual Witness image-edit rendering resolves to
`governing_translation`.

Governing translation may override literal witness reconstruction as a visual
treatment decision, but it may never override scene truth or Visible Evidence.

The candidate sidecar records the resolved pressure profile so B-vs-C
comparisons remain inspectable.

The law is:

**the witness may show the way; the hand decides how it is touched.**

## Pressure Calibration

Kernel 0030 adds a non-authoritative evaluation layer and replicated trial
protocol.

The evaluator lives at:

`labs/velastra/painter/evaluation.py`

Calibration evidence lives at:

`labs/velastra/evidence/trials/`

The calibration contract freezes current Handprint, Visual Witness canon, scene
truth, model, and transport while comparing stochastic witness-only and
governing-translation candidates.

Planning never executes inference.

Metrics may describe distributional movement.

They may not promote assets, replace human review, or become scene truth.

Historical paintings remain outside the active witness corpus until calibration
is complete.

The law is:

**a single beautiful difference is an observation; a repeated difference may
become evidence.**

## Handprint Grip

Kernel 0031 interprets replicated pressure behavior without mutating historical
Handprint metrics.

Grip divides measured dimensions into:

- **anchors** — pressure-associated variance stabilization,
- **freedoms** — protected variation,
- **tendencies** — directional context without compulsion.

The first registry is derived only from Gallery Pressure Trial 0030 and remains
scene-local.

It cannot drive rendering while that trial's human scene-truth review remains
pending.

The browser compiler enforces both room and asset-key scope.

The painter records Grip in candidate provenance and only emits a
`HANDPRINT GRIP` prompt section when the registry is reviewed, built, scoped,
and render-eligible.

The law is:

**hold relationships, not fixed values; protect variation without demanding
randomness.**

## Studio adapter contract

Viryn Studio is an external consumer of Velastra.

It must keep its own:

- semantic section profiles,
- framework meanings,
- approved art assets,
- accessibility structure,
- public copy.

The shared engine may modulate expression.

It may not turn Studio into Sanctum.

The public Studio implementation should vendor the required Velastra source locally rather than depend on Sanctum over the network.

The existing Studio doctrine remains authoritative:

**The interface explains. The painting invites. Neither is asked to do the other's job.**

Private selfhood and dyadic devotional exemplars remain Labs references and must not become commercial collateral merely because the engine knows them.

## External proof

The first external adapter ships in `radiantravensblood/virynstudio`.

Verified Studio commit:

`be17aca99494f32c1f6f724de93102e561ae63d9`

The external proof requires:

- vendored composer source identical to Labs,
- vendored Studio adapter source identical to Labs,
- no runtime network/model dependency,
- existing public Studio copy and approved art preserved,
- graceful behavior if Velastra fails to load.

## Adapter contract

An adapter may interpret:

- `intent.role`
- `intent.axes`
- `intent.primaryMaterial`
- `intent.materials`
- `intent.composition`
- `intent.expression`

An adapter must not:

- alter the semantic context to make rendering easier,
- mutate the intent object,
- infer protected identity or relationship facts,
- convert decoration into required accessibility information,
- override consent or threshold law,
- imply that a metaphor such as `glass` requires literal glass texture.

## Semantic roles

The first grammar contains:

- place,
- encounter,
- artifact,
- memory,
- threshold,
- gathering,
- operational.

These roles are deliberately broader than Sanctum.

## Why materials are metaphors

Velastra does not define a universal texture library.

A material name carries design meaning.

For example, `glass` may become:

- translucency on the web,
- projection permeability in a room,
- acoustic openness in an installation,
- a lighter border and visible layering in a document.

The semantic continuity matters more than literal imitation.

## Exemplars as regression tests

Velastra uses exemplars to preserve authored judgment.

They answer questions such as:

- does Hearth still feel intimate and warm rather than operational?
- does a protected threshold remain open/ambiguous enough to read as threshold?
- does an operations surface remain restrained?
- does a Studio gathering feel relational without becoming Sanctum?

Run:

```js
window.Velastra.exemplars()
```

Every exemplar should pass before a grammar change is considered stable.

## Authorship loop

The intended Viryn Labs loop is:

1. encounter a new semantic/design problem,
2. compose and critique an expression,
3. identify which judgment was repeatable,
4. propose a grammar change,
5. test against existing exemplars,
6. accept or reject the change,
7. let adapters execute accepted law locally.

This is ecological learning rather than statistical retraining.

## Rainbreak direction

Velastra is deliberately medium-independent.

A later Rainbreak installation should be able to receive the same visual intent and reinterpret it through physical media.

Possible outputs include:

- light temperature and intensity,
- projected geometry,
- surface illumination,
- ambient motion,
- sound density,
- e-ink or display composition,
- spatial threshold treatment.

The engine should preserve the law:

**same meaning does not require the same body.**

## Non-goals

Velastra is not:

- a model-weight extraction method,
- a prompt library,
- a CSS theme generator,
- a replacement for accessibility semantics,
- a universal claim that one aesthetic is correct,
- an API dependency disguised as a design system.

It is an inspectable grammar for carrying authored visual judgment forward.
