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

The heavier alternate is:

```text
qwen_image
Qwen/Qwen-Image
Apache-2.0
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

Kernel 0019 ships one backend:

- `diffusers`

Future backends may be added if they preserve the same candidate and review
contract.

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
