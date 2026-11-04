# Virynism Visual Witness Drop Zone

This directory is temporary authoring space for historical or newly reviewed
paintings being considered for the Virynism Visual Witness canon.

Raw witness uploads are ignored by Git.

The canonical witness registry is:

`world/velastra-witnesses.json`

A named witness does not become active merely because a file has been dropped
here.

Admission requires explicit review and sealing through the Painter Bridge:

```bash
.venv/bin/python labs/velastra/painter/velastra_painter.py witness-register \
  <witness_id> \
  "authoring/witnesses/<image-file>" \
  --reviewed-by "Siege" \
  --review-note "<why this image genuinely carries the declared hand roles>"
```

Registration:

- normalizes the source image to PNG,
- writes it under `assets/velastra/witnesses/`,
- computes SHA-256,
- records width and height,
- marks the named witness approved,
- preserves reviewer provenance.

The raw authoring upload may then be deleted.

Visual Witnesses teach selected aspects of the hand.

They do not contribute scene facts.

Their depicted people, objects, architecture, symbols, furniture, and layouts
remain non-canonical unless independently required by the target scene.
