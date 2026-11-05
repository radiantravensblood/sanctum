# Velastra Calibration Trials

This directory holds machine-readable authoring evidence.

A trial is not canon.

A trial may:

- freeze the exact manifest, Handprint, witness registry, model, and transport,
- plan replicated candidate attempts,
- record candidate measurements,
- compare stochastic output distributions,
- preserve human review notes.

A trial may not:

- approve a candidate,
- mutate scene truth,
- mutate Handprint,
- mutate Visual Witness canon,
- promote an asset,
- replace human review with a metric score.

## Pressure Calibration

Kernel 0030 introduces replicated B-vs-C pressure trials.

The default Gallery calibration compares:

- **B / witness_only** — Qwen Image Edit with Handprint disabled,
- **C / governing_translation** — the same brush and witness with authored
  Handprint pressure active.

Because the hosted image-edit transport does not promise deterministic seed
control, a single pair is an observation rather than causal evidence.

The default trial therefore uses four repeats per condition and alternates
execution order between pairs.

Planning is free of inference:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py pressure-trial \
  "authoring/inbox/gallery--velastra.place_tableau.5cms46.velastra.json"
```

This writes the trial JSON but executes no generation.

Rendering requires the explicit `--render` flag:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py pressure-trial \
  "authoring/inbox/gallery--velastra.place_tableau.5cms46.velastra.json" \
  --render
```

Already-rendered candidate IDs are reused rather than generated again.

The resulting summary reports descriptive distributions and directional deltas.

It is not a significance test and does not decide which image should be
approved.

**A single beautiful difference is an observation. A repeated difference may
become evidence.**


## Cross-Scene Grip Replication

Kernel 0032 repeats the pressure trial in The Hearth while keeping the
experimental controls frozen.

The Hearth packet is exported from the browser after navigating to Hearth with
Atelier enabled.

Plan the trial with the actual exported filename:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py pressure-trial \
  "authoring/inbox/<fresh-hearth-packet>.velastra.json" \
  --trial-id "hearth-pressure-0032" \
  --output "labs/velastra/evidence/trials/hearth-pressure-0032.json"
```

Planning performs no inference.

After inspecting the plan, explicitly render:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py pressure-trial \
  "authoring/inbox/<fresh-hearth-packet>.velastra.json" \
  --trial-id "hearth-pressure-0032" \
  --output "labs/velastra/evidence/trials/hearth-pressure-0032.json" \
  --render
```

When the Hearth trial is complete, compare it with Gallery:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py grip-replication
```

The comparator fails closed if Handprint, witness registry, selected witness,
witness hash, brush, model, transport, pressure schema, or repeat count changed
between scenes.

Matching categories are replicated observations only.

They cannot activate Grip for rendering.


## Scene Sovereignty Trial

Kernel 0033 tests whether a new room can remain itself while inheriting visual
hand from an approved witness.

The Hearth trial uses the fresh packet:

`authoring/inbox/hearth--velastra.place_tableau.1hsb6ko.velastra.json`

Plan:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py scene-sovereignty-trial \
  "authoring/inbox/hearth--velastra.place_tableau.1hsb6ko.velastra.json"
```

Planning performs no inference.

Render:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py scene-sovereignty-trial \
  "authoring/inbox/hearth--velastra.place_tableau.1hsb6ko.velastra.json" \
  --render
```

The default trial contains two repeats each for:

- A / handprint_only,
- C / original_witness_combined,
- D / firewall_combined.

The committed 0032 Hearth candidates remain the pre-sovereignty baseline.

Human review must answer whether the candidate reads first as Hearth and whether
its canonical fixed objects remain visible.

Witness-layout leakage and signature-like artifacts are recorded separately.

A semantic carrier may never be promoted to Visual Witness canon.
