# Velastra Painter Bridge

Kernel 0019 gives Velastra an authoring-side painting body without making a
generative model part of Sanctum's runtime.

The bridge consumes the renderer-neutral **Atelier Manifest** produced by
Kernel 0017. It compiles that manifest into a model-facing prompt bundle while
preserving an explicit truth envelope around subjects, relation, environment,
literal motifs, symbolic motifs, and provenance.

The governing law is:

**The model is the brush. Velastra remains the author of meaning.**

## Boundary

This directory is authoring tooling.

It is not imported by `index.html`, `src/app.js`, or the GitHub Pages runtime.

Sanctum continues to run with HTML, CSS, JavaScript, JSON, and SVG only.

If no reviewed painting exists for an `assetKey`, the browser still uses the
procedural underpainting from Kernel 0017.

## Brush Cabinet

Kernel 0021 removes the placeholder-model workflow.

The Painter Bridge now resolves named brushes from:

`world/velastra-brushes.json`

List them with:

```bash
python3 labs/velastra/painter/velastra_painter.py brushes
```

The current default is:

```text
z_image_turbo
Tongyi-MAI/Z-Image-Turbo
Apache-2.0
default transport: huggingface / fal-ai
```

The heavier text-first alternate is:

```text
qwen_image
Qwen/Qwen-Image
Apache-2.0
```

The first reference-capable witness translator is:

```text
qwen_image_edit
Qwen/Qwen-Image-Edit
Apache-2.0
task: image_to_image
```

A brush name is part of candidate provenance.

A brush does not become part of scene truth.

### Remote provider setup

The recommended everyday transport uses Hugging Face Inference Providers.

Create a virtual environment if desired, then install:

```bash
pip install -r labs/velastra/painter/requirements-provider.txt
```

Expose a Hugging Face token with Inference Providers permission only through
the shell environment:

```bash
export HF_TOKEN="..."
```

Do not write the token into a manifest, handoff, command argument, JSON file,
or registry entry.

The bridge records only the environment-variable name.

A normal render is now:

```bash
python3 labs/velastra/painter/velastra_painter.py \
  render "$HOME/Downloads/gallery--velastra.place_tableau.example.velastra.json" \
  --brush z_image_turbo \
  --transport huggingface
```

The Atelier dock generates this shape automatically.

### Local Diffusers transport

Machines with suitable local acceleration can choose:

```bash
python3 labs/velastra/painter/velastra_painter.py \
  render path/to/painting.velastra.json \
  --brush z_image_turbo \
  --transport diffusers
```

Install the local dependencies separately:

```bash
pip install -r labs/velastra/painter/requirements-diffusers.txt
```

Advanced `--model` and `--backend` overrides remain available for controlled
experiments. Ordinary authoring should prefer named brushes.

## Browser-only / low-storage authoring

If the local machine should not carry a repository clone, use the repository's
GitHub Codespace.

Create the Codespace from the Sanctum repository in a browser.

The committed devcontainer creates an ignored `.venv` inside the Codespace and installs:

`labs/velastra/painter/requirements-provider.txt`

and recommends the `HF_TOKEN` Codespaces secret.

Export a painting packet from Sanctum, upload it into:

`authoring/inbox/`

and use **Copy cloud command** from the Atelier dock.

The temporary handoff is ignored by Git.

The default remote path does not download the image-model weights into the
Codespace; inference remains provider-hosted.

Candidate PNGs and sidecars still land under:

`.velastra/candidates/`

and remain outside canon until explicitly approved.

## Brush Contract + Visible Evidence

Kernel 0025 makes the prompt compiler capability-aware.

The authority order is:

```text
scene truth
    ↓
Painterly Truth
    ↓
Visible Evidence Contract
    ↓
Virynism
    ↓
Brush Contract / dialect
    ↓
model
```

Visible Evidence is carried inside the Atelier Manifest.

It does not create new scene facts.

It selects already-true material facts that must remain visibly legible.

For Gallery, the contract currently requires at least three visible signs of
unfinished process from:

- exposed ground / underpainting,
- interrupted painted passage,
- revision / erasure marks,
- prior hanging trace.

The same contract positively reframes Gallery away from a conventional museum
of finished pictures.

### Capability-aware negative control

The bridge no longer assumes every brush can hear a negative prompt.

Z-Image Turbo declares no CFG and no negative-prompt channel.

Its critical constraints therefore remain entirely in the positive prompt.

Qwen Image records base-pipeline negative/CFG support, but provider transport
is marked best-effort. Critical evidence remains positive there too.

Local Qwen Diffusers can use:

`--true-cfg-scale`

and the brush contract currently resolves a local default of `4.0`.

### Prompt budget

Brushes may declare a safe prompt target.

For Z-Image Turbo, the compiler uses an approximate token estimate and removes
lower-priority optional sections before dropping any required scene or visible
evidence section.

Candidate provenance records:

- estimated tokens before compaction,
- estimated tokens after compaction,
- target tokens,
- dropped optional sections,
- whether required material still exceeds the declared target.

The system never silently claims a prompt fit when it did not.

## Visual Witness

Kernel 0026 lets a reference-capable brush receive one approved image as
evidence of Virynism's visual hand.

The witness packet is already carried inside a freshly exported Atelier
Manifest.

A witness contains:

- selected hand roles,
- explicit content non-inheritance boundaries,
- reviewed asset path,
- SHA-256,
- dimensions,
- provenance.

### Inspect the canon

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py witnesses
```

### Admit an actual painting

Place the source image temporarily under:

`authoring/witnesses/`

Then run:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py witness-register \
  gallery_target_01 \
  "authoring/witnesses/gallery-target.png" \
  --reviewed-by "Siege" \
  --review-note "Carries Virynism sacred incompletion, material hand, and spatial cadence."
```

Registration normalizes the source to PNG, writes it under
`assets/velastra/witnesses/`, computes SHA-256, and updates the named registry
entry.

The registry and approved asset should then be reviewed and committed.

A new browser handoff must be exported after that commit so the approved witness
snapshot travels inside the manifest.

### Witness rendering

The first hosted reference brush is:

`qwen_image_edit`

backed by:

`Qwen/Qwen-Image-Edit`

The normal command is:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py render \
  "authoring/inbox/<room>.velastra.json" \
  --brush qwen_image_edit \
  --transport huggingface
```

The bridge:

1. requires an approved witness in the manifest,
2. verifies the witness file is inside the repository,
3. verifies its SHA-256,
4. sends the image through Hugging Face image-to-image,
5. keeps scene truth and visible evidence authoritative,
6. records witness identity and roles in candidate provenance.

The positive prompt explicitly says which visual-hand roles may be inherited
and which depicted content may not.

### Attempt identity

Hosted image-to-image currently has no reliable seed-control contract.

Therefore witness renders receive an attempt identity.

This prevents two different provider outputs from sharing a candidate ID and
silently overwriting one another.

An explicit attempt can be supplied with:

`--attempt <label>`

Otherwise the bridge generates one for hosted reference runs.

This differs from the deterministic text-to-image path and is recorded
honestly in candidate provenance.

## Handprint

Kernel 0027 adds an auditable portfolio-derived visual fingerprint.

Handprint is not produced during rendering.

It is rebuilt explicitly from the approved Visual Witness corpus:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py handprint-build \
  --repo-root .
```

Inspect the result with:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py handprint
```

The builder:

1. loads only `approved` witness entries with an asset path and SHA-256,
2. verifies every file remains inside the repository,
3. re-hashes every witness before analysis,
4. refuses any hash mismatch,
5. measures each image with Pillow at a bounded analysis resolution,
6. aggregates the metrics across the approved corpus,
7. counts recurring human-reviewed witness roles,
8. records the union of explicit content non-inheritance boundaries,
9. writes the result to `world/velastra-handprint.json`.

### Measured fields

For each witness:

- source width and height,
- aspect ratio,
- mean luminance,
- mean saturation,
- mean warm/cool bias,
- deep-shadow share,
- highlight share,
- 10th percentile luminance,
- 90th percentile luminance,
- tonal span,
- edge activity,
- center luminance,
- periphery luminance,
- center/periphery light delta,
- normalized grayscale entropy.

The aggregate Handprint uses portfolio means for portable brush guidance.

### Interpretation is deterministic and modest

The bridge converts aggregate numbers into a small set of inspectable
descriptions:

- tonal restraint,
- warmth bias,
- edge character,
- center-light behavior,
- shadow presence,
- tonal range.

These descriptions use documented thresholds in the Python source.

They are not a learned style embedding and they do not claim to exhaust
Virynism.

### Manifest behavior

A built Handprint travels inside every newly exported Atelier Manifest.

The browser projects it through the current scene's Virynism emphasis so the
brush receives only relevant recurring roles.

The Painter Bridge adds a required `HANDPRINT` section to its positive
direction.

This section explicitly says that portfolio tendencies are cross-witness
guidance only and that witness subject/object/architecture/layout content
remains forbidden.

Changing Handprint may change candidate identity.

It never changes the canonical room asset key.

Candidate and approval provenance both retain the Handprint snapshot.

## Handprint Facets + controlled ablation

After merging Kernel 0028, rebuild Handprint once:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py handprint-build \
  --repo-root .
```

Then inspect the role support map:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py handprint
```

The CLI prints each facet as either:

- `cross-portfolio`, or
- `provisional`.

Only cross-portfolio facets travel into browser render guidance.

### Gallery ablation protocol

Use one fresh Gallery packet carrying the rebuilt Facets.

#### A — Handprint only

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py render \
  "authoring/inbox/gallery--velastra.place_tableau.5cms46.velastra.json" \
  --brush qwen_image \
  --transport huggingface \
  --seed 190920
```

Base Qwen is text-first and therefore receives no Visual Witness image or
Visual Witness claim.

#### B — Witness only

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py render \
  "authoring/inbox/gallery--velastra.place_tableau.5cms46.velastra.json" \
  --brush qwen_image_edit \
  --transport huggingface \
  --without-handprint \
  --attempt gallery-ablation-witness-only-001 \
  --repo-root .
```

#### C — Combined

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py render \
  "authoring/inbox/gallery--velastra.place_tableau.5cms46.velastra.json" \
  --brush qwen_image_edit \
  --transport huggingface \
  --attempt gallery-ablation-combined-001 \
  --repo-root .
```

Hosted image-edit runs remain attempt-identified because their transport does
not promise deterministic seed control.

The three candidate sidecars preserve which ablation state produced each
image.

## Handprint Pressure

Kernel 0029 adds authored pressure profiles to the Handprint packet.

No new CLI switch is required.

The Painter Bridge resolves pressure from the existing render context:

- text-first Handprint → `descriptive_guidance`,
- Handprint + active Visual Witness image edit → `governing_translation`,
- `--without-handprint` → no Handprint pressure.

Combined mode emits three distinct required layers:

1. `GOVERNING HANDPRINT LAW`,
2. `HANDPRINT`,
3. `VISUAL WITNESS`.

The governing layer contains imperative Facet laws and an explicit witness
translation clause.

It tells the image-edit brush to recompose and repaint through the Handprint
instead of treating witness layout, object inventory, or finish as final visual
authority.

Scene truth and Visible Evidence remain sovereign throughout.

### Pressure verification

Run `plan` before inference and inspect the generated candidate sidecar.

For a combined run, expect:

```json
"handprintPressure": {
  "active": true,
  "profile": "governing_translation",
  "mode": "governing_translation",
  "combined": true
}
```

For witness-only ablation, expect pressure to be inactive.

The clean follow-up experiment is therefore B-vs-C:

- B: `qwen_image_edit --without-handprint`
- C: `qwen_image_edit` with Handprint active

The witness, scene truth, and model remain the same class of channel; the
meaningful authored difference is Handprint pressure.

## Pressure Calibration

Kernel 0030 adds two authoring commands.

### Evaluate one candidate

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py evaluate \
  ".velastra/candidates/<asset-key>/<candidate>.candidate.json" \
  --repo-root .
```

The evaluator writes a sibling `.evaluation.json` file unless `--output` is
supplied.

It reports Handprint Facet-range adherence and coarse witness spatial
similarity.

Neither measurement is an aesthetic score.

### Plan the replicated Gallery trial

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py pressure-trial \
  "authoring/inbox/gallery--velastra.place_tableau.5cms46.velastra.json"
```

Default behavior:

- four B / witness-only attempts,
- four C / governing-translation attempts,
- alternating execution order,
- frozen manifest/Handprint/witness hashes,
- no inference.

The plan is written to:

`labs/velastra/evidence/trials/gallery-pressure-0030.json`

### Explicitly execute it

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py pressure-trial \
  "authoring/inbox/gallery--velastra.place_tableau.5cms46.velastra.json" \
  --render
```

Existing candidate image+sidecar pairs are reused.

After all eight arms are evaluated, the trial records descriptive distributions
for:

- Handprint range adherence,
- Handprint in-range rate,
- witness spatial similarity.

It also records C-minus-B directional deltas.

Those deltas are not a significance test.

The evaluator cannot certify scene truth.

Human review remains required.

## Handprint Grip

Kernel 0031 adds a separate, evidence-derived Grip registry:

`world/velastra-grip.json`

Inspect it with:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py grip
```

Rebuild it reproducibly from the committed 0030 trial with:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py grip-build
```

The builder classifies each shared candidate metric from witness-only B and
governing C distributions.

### Anchor rule

A metric becomes an anchor only when:

- witness-only baseline standard deviation is large enough to measure,
- `C stddev / B stddev <= 0.67`,
- the condition-mean shift remains within one B standard deviation.

Anchors describe stabilization evidence, not fixed targets.

### Freedom rule

A metric becomes a freedom when:

- baseline variance is measurable,
- `C stddev / B stddev >= 1.5`.

Freedom records where governing pressure preserved or increased variation.

It is not an instruction to inject randomness.

### Tendency rule

Everything not supported strongly enough as anchor or freedom remains a
tendency.

Tiny baseline variance is specifically prevented from manufacturing a false
freedom through a near-zero denominator.

### Human review and render boundary

`grip-build` may derive a provisional registry from a completed pressure
trial whose human review is pending:

```text
status = provisional_pending_human_review
renderEligible = false
```

If human review later records `sceneTruthPass: true`, the registry may become:

```text
status = reviewed_observation
renderEligible = false
```

Kernel 0031 never makes Grip prompt-active.

Grip remains inspectable in manifests and candidate provenance, but:

- emits no `HANDPRINT GRIP` prompt section,
- cannot alter candidate identity,
- cannot steer generation,
- cannot become render law from one Gallery trial.

A future kernel may consider render activation only after comparable
cross-scene replication.

A single anomalous candle, frame, figure, or object can never become Grip law
by itself.

## Cross-Scene Grip Replication

Kernel 0032 reuses `pressure-trial` rather than creating a different render
path for Hearth.

After exporting a fresh Hearth packet, plan:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py pressure-trial \
  "authoring/inbox/<fresh-hearth-packet>.velastra.json" \
  --trial-id "hearth-pressure-0032" \
  --output "labs/velastra/evidence/trials/hearth-pressure-0032.json"
```

Then, after inspecting the frozen plan:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py pressure-trial \
  "authoring/inbox/<fresh-hearth-packet>.velastra.json" \
  --trial-id "hearth-pressure-0032" \
  --output "labs/velastra/evidence/trials/hearth-pressure-0032.json" \
  --render
```

Finally compare Gallery and Hearth:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py grip-replication
```

The comparison writes:

`labs/velastra/evidence/trials/grip-cross-scene-0032.json`

The comparator refuses to proceed if the two trials changed frozen Handprint,
witness, model, brush, transport, pressure schema, or repeat count.

A category match across Gallery and Hearth is evidence of replication.

It is not render authority.

## Scene Sovereignty / Witness Firewall

Kernel 0033 adds:

`labs/velastra/painter/witness_firewall.py`

and:

```bash
velastra-painter scene-sovereignty-trial <manifest>
```

The Scene Sovereignty Gate promotes Painterly Truth fixed objects into the
required positive prompt before witness translation.

For Hearth the gate explicitly carries the low fire and velvet cushion.

The Witness Firewall derives an ephemeral carrier from the approved witness:

- algorithm: `patch_shuffle_v1`,
- tile size: 32px by default,
- seam blur: 0.6px by default,
- output: `.velastra/firewall/<witness>/<carrier>.png`.

The carrier destroys global semantic layout while retaining local pixel
evidence.

It never mutates the witness registry.

### Plan

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py scene-sovereignty-trial \
  "authoring/inbox/hearth--velastra.place_tableau.1hsb6ko.velastra.json"
```

This plans six renders and performs no inference.

### Render

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py scene-sovereignty-trial \
  "authoring/inbox/hearth--velastra.place_tableau.1hsb6ko.velastra.json" \
  --render
```

Execution order is balanced:

```text
A1 → C1 → D1 → D2 → C2 → A2
```

A is Handprint-only.

C uses original witness pixels with the new Scene Sovereignty Gate.

D uses the same source witness through the semantic firewall.

The committed 0032 combined renders remain the pre-0033 control.

The trial records Handprint and witness-similarity measurements, but semantic
success is human-reviewed:

**Does the image read first as the target place rather than as the witness?**

## Kernel 0035 — Control-Plane Isolation

Kernel 0035 responds to a concrete render failure discovered in the 0034 Hearth
trial: painter-facing images visibly reproduced internal control labels such as
`SCENE SOVEREIGNTY GATE`. Internal systems vocabulary was therefore entering
the depicted world instead of remaining metadata.

The architecture now separates two namespaces:

- **control plane** — internal names, protocols, trial labels, provenance, and
  validation concepts;
- **image plane** — literal painter-facing scene behavior only.

Internal concepts such as Handprint, Visual Witness, Witness Firewall, Scene
Sovereignty Gate, Fixed Object Lock, and Threshold Integrity remain available
to the code and evidence records. They are translated into plain descriptive
sentences before reaching the painter.

A fail-closed validator rejects any positive prompt containing a known internal
control marker. This happens before inference.

The painter also receives an explicit instruction not to render wording,
headings, labels, or phrases from the instructions into the image unless
visible text is itself authored scene truth.

### 0035 isolation trial

Keep every other variable frozen from 0034:

- same Hearth packet,
- same model and brush,
- same Handprint registry,
- same Visual Witness,
- same balanced A/C/D order,
- same Witness Firewall algorithm,
- same 32px tile size,
- same 0.6px blur radius.

Plan first:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py scene-sovereignty-trial \
  "authoring/inbox/hearth--velastra.place_tableau.1hsb6ko.velastra.json" \
  --trial-id "hearth-controlplane-0035" \
  --output "labs/velastra/evidence/trials/hearth-controlplane-0035.json" \
  --firewall-tile-size 32 \
  --firewall-blur-radius 0.6
```

Then render only after the plan succeeds without a control-plane leak:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py scene-sovereignty-trial \
  "authoring/inbox/hearth--velastra.place_tableau.1hsb6ko.velastra.json" \
  --trial-id "hearth-controlplane-0035" \
  --output "labs/velastra/evidence/trials/hearth-controlplane-0035.json" \
  --firewall-tile-size 32 \
  --firewall-blur-radius 0.6 \
  --render
```

Review adds two questions to the existing Hearth criteria:

1. Did any instruction or control-plane wording become visible image text?
2. Did any control-plane metaphor become a depicted object or architectural
   motif without support from authored scene truth?

The purpose is not to suppress strangeness. It is to distinguish authored or
emergent visual behavior from accidental literalization of the renderer's own
instrumentation.

## Kernel 0034 — Scene Truth Lock / Threshold Integrity

Kernel 0034 keeps the Kernel 0033 Witness Firewall frozen:

- algorithm: `patch_shuffle_v1`,
- tile size: 32px,
- seam blur: 0.6px.

The changed variable is semantic authority.

### Fixed Object Lock

Painterly Truth `fixedObjects` now receive a required positive-prompt lock.
Authored fixed objects must be visibly present and semantically literal.
Descriptive modifiers remain binding: an authored **low fire** stays low and
contained; an authored **velvet cushion** must read as a discrete cushion, not
generic upholstered furniture.

The lock is scene-local. It never introduces Hearth examples into scenes that
did not author those objects.

### Threshold Integrity

For Hearth scenes, unless scene truth explicitly requires a barrier, Velastra
adds the law:

> Thresholds mark transition, not ownership.

The default Hearth hospitality profile asks passages to read as permeable,
unguarded, easy to enter and leave, and free of permission barriers. Safety is
to come from welcome, shelter, warmth, mutual presence, and freedom of
movement—not confinement.

The positive contract is paired with best-effort negative guidance against:

- wrought-iron gates,
- bars,
- chains,
- portcullises,
- prison or cell imagery,
- barricades,
- coercive enclosure,
- guarded thresholds.

Explicit scene truth remains sovereign. If the authored Hearth actually
requires a gate, bars, chains, a portcullis, barricade, prison/cell imagery, or
another barrier, the default hospitality override disables itself rather than
silently rewriting the scene.

### 0034 trial

Keep the 0033 carrier settings unchanged and run a fresh balanced A/C/D trial:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py scene-sovereignty-trial \
  "authoring/inbox/hearth--velastra.place_tableau.1hsb6ko.velastra.json" \
  --trial-id "hearth-threshold-0034" \
  --output "labs/velastra/evidence/trials/hearth-threshold-0034.json" \
  --firewall-tile-size 32 \
  --firewall-blur-radius 0.6 \
  --render
```

Execution remains balanced:

```text
A1 → C1 → D1 → D2 → C2 → A2
```

Human review now asks both scene-sovereignty and threshold questions:

1. Does the image read first as Hearth?
2. Is the authored low fire visibly low and contained?
3. Is the authored velvet cushion visibly present as a discrete cushion?
4. Do thresholds read as permeable and unguarded?
5. Are coercive barrier artifacts absent unless explicitly authored?
6. Does the witness teach hand without donating its room?

A beautiful image that violates fixed scene truth is still a failed candidate.
No trial candidate is promoted automatically.

## Painterly Truth

Kernel 0024 gives the Painter Bridge concrete stable scene evidence before
Virynism is applied.

The authority order is:

```text
scene identity
    ↓
Painterly Truth
    ↓
Virynism handwriting
    ↓
brush dialect
    ↓
model
```

Painterly Truth is already embedded in the exported Atelier Manifest.

The bridge therefore needs no separate registry lookup in Codespaces.

Its environment facts become part of the positive scene direction before
handwriting directives are added.

The candidate truth envelope also records the Painterly Truth identity,
revision, room, and fixed-object summary.

This keeps critique precise:

- if truth was wrong, revise Painterly Truth,
- if treatment was wrong, revise Virynism,
- if translation was wrong, revise the brush dialect,
- if execution was weak, compare the brush.

## Virynism and brush dialects

Kernel 0023 makes the Painter Bridge consume the style snapshot already carried
inside the Atelier Manifest.

The prompt compiler preserves this order of authority:

```text
scene truth
    ↓
Virynism handwriting
    ↓
archetype handling
    ↓
place-specific handling
    ↓
brush dialect
    ↓
model
```

A brush dialect is translation, not authorship.

The default Z-Image dialect favors concrete visible evidence over abstract
style adjectives.

For example, `material memory` becomes patina, residue, wear, layered pigment,
and handled edges.

`Sacred incompletion` becomes exposed grounds, partial studies, erased marks,
interrupted gestures, and unfinished edges.

The prompt compiler sends only the archetype-emphasized hand laws plus the
strongest remaining laws to avoid drowning the brush in instruction.

The complete style packet remains in the manifest and candidate provenance.

Changing Virynism changes candidate identity but not the canonical room asset
key.

Therefore a new style revision can propose a new painting of the same place
without pretending the place itself became a different place.

## Candidate lifecycle

A generated image is never canonical merely because a model returned it.

The bridge uses three explicit stages:

1. **plan** — validate an Atelier Manifest and create a deterministic candidate
   sidecar containing prompts, truth constraints, backend settings, and
   provenance.
2. **render** — ask an authoring backend to create the candidate image. The
   sidecar remains `status: "candidate"` and cannot be rendered by Sanctum.
3. **approve** — after human review, copy the chosen image into
   `assets/velastra/approved/`, hash it, and write an `approved` registry entry.

`world/velastra-assets.json` remains the browser's authority. Its current
Atelier policy only renders entries whose status is `approved`.

## Export directly from Sanctum

Kernel 0020 adds the preferred browser handoff.

Open Sanctum with:

`?atelier=1`

and use **Export painting packet**, or call:

```js
window.Velastra.exportSanctumPainting()
```

The downloaded `.velastra.json` file uses
`velastra.handoff.v1` and contains the Atelier Manifest under its top-level
`manifest` key.

The Painter Bridge accepts this file directly; no manual JSON extraction is
required.

Live inhabitants and movable objects are recorded as runtime presence but are
explicitly excluded from the canonical place painting.

## Export an Atelier Manifest

From Sanctum's browser console:

```js
const packet = window.Velastra.atelier({
  scene: {
    // explicit semantic scene specification
  }
});

copy(JSON.stringify(packet.manifest, null, 2));
```

Save the copied JSON as a local file.

The bridge also accepts the full object returned by `window.Velastra.atelier()`;
if an outer `manifest` property is present, it is unwrapped automatically.

## Plan without rendering

```bash
python3 labs/velastra/painter/velastra_painter.py \
  plan path/to/atelier-manifest.json \
  --model Qwen/Qwen-Image
```

The default output directory is ignored by Git:

```text
.velastra/candidates/<assetKey>/<candidateId>.candidate.json
```

The candidate identifier is deterministic over:

- the stable Velastra `assetKey`,
- compiled positive and negative direction,
- backend,
- model,
- seed,
- requested image size,
- optional inference settings.

Changing the art direction or render settings therefore creates a new
candidate identity rather than silently replacing an earlier attempt.

## Render with Diffusers

Install a current PyTorch build appropriate to the authoring machine, then:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r labs/velastra/painter/requirements-diffusers.txt
```

Render:

```bash
python3 labs/velastra/painter/velastra_painter.py \
  render path/to/atelier-manifest.json \
  --backend diffusers \
  --model Qwen/Qwen-Image \
  --seed 190919
```

The backend intentionally uses the generic Diffusers `DiffusionPipeline`
loader. The checkpoint remains an authoring choice rather than a Velastra
identity.

Device selection defaults to:

1. CUDA when available,
2. Apple MPS when available,
3. CPU otherwise.

The model may ignore an optional argument that its pipeline does not expose.
The bridge introspects the pipeline call surface before supplying width,
height, negative prompt, steps, guidance, and generator controls.

## Truth envelope

Every candidate sidecar records the semantic boundary supplied to the model.

It includes:

- explicit subjects,
- explicit relation,
- environment facts,
- literal motifs,
- symbolic motifs,
- the source Atelier provenance,
- the source manifest SHA-256.

The bridge also emits negative direction requiring the painter not to invent:

- people,
- identities,
- relationships,
- consent,
- touch,
- text,
- logos,
- symbols,
- objects,
- scene facts.

This cannot mathematically guarantee model obedience. It makes the intended
boundary inspectable and reviewable.

The review gate remains mandatory precisely because a generative model can
still make mistakes.

## Approve a candidate

After visually reviewing the candidate:

```bash
python3 labs/velastra/painter/velastra_painter.py \
  approve .velastra/candidates/<assetKey>/<candidateId>.candidate.json \
  --registry world/velastra-assets.json \
  --repo-root . \
  --reviewed-by "Siege" \
  --review-note "Approved after scene-truth and composition review."
```

Approval:

- verifies the candidate image exists,
- verifies its recorded hash when present,
- copies it to `assets/velastra/approved/<assetKey>.png`,
- records a fresh SHA-256,
- writes model/backend/seed provenance,
- records the reviewer and review note,
- marks the sidecar approved.

If an approved asset already exists, the bridge refuses replacement unless
`--replace` is supplied explicitly.

The intended workflow is to inspect the resulting asset and registry diff
before committing them.

## Backend contract

The bridge currently supports:

- `diffusers` for local authoring,
- `huggingface` for provider-hosted authoring.

Any backend or transport must preserve the same candidate, truth, evidence,
credential, and review contract.

A backend may translate rendering instructions.

It may not:

- alter the source manifest to make generation easier,
- invent semantic facts,
- mutate `world/velastra-assets.json` during generation,
- mark its own output approved,
- move inference into the Sanctum runtime,
- claim to be Velastra itself.

## Why Python

JavaScript remains the correct language for Velastra's browser-side semantic
engine.

Python owns the authoring bridge because it can reach the learned
image-synthesis ecosystem directly while remaining completely outside runtime.

That division is intentional:

```text
meaning / scene truth / motifs
        JavaScript
            |
            v
      Atelier Manifest
            |
            v
      Painter Bridge
          Python
            |
            v
      candidate image
            |
       human review
            |
            v
    approved static asset
            |
            v
   Sanctum / Studio runtime
        JavaScript
```

The browser does not become dependent on the painter.

The painter does not become sovereign over the scene.

## Contract tests

The bridge contract does not require model weights or Diffusers.

Handprint pixel-analysis tests additionally require Pillow, the same lightweight
dependency already used by witness admission:

```bash
python -m py_compile labs/velastra/painter/velastra_painter.py
python -m unittest labs/velastra/painter/test_velastra_painter.py
```

CI runs those checks whenever the painter bridge, Atelier contract, or asset
review policy changes.
