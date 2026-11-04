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

The bridge contract uses only the Python standard library, so its safety and
promotion tests do not require model weights or Diffusers:

```bash
python -m py_compile labs/velastra/painter/velastra_painter.py
python -m unittest labs/velastra/painter/test_velastra_painter.py
```

CI runs those checks whenever the painter bridge, Atelier contract, or asset
review policy changes.
