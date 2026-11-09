# Hearth Basin Cartography 0037 — Human Evidence Reading

Status: **reviewed and archived**

Trial: `hearth-basin-0037`  
Kernel: 0037 Basin Cartography  
Prompt SHA-256: `dfd72e969f583c60ab213c49dcc05a71d1c7eab2c982f7bb3f5148acec0aa8aa`

All eight renders used the same painter-facing prompt. Only seed and attempt
identity varied.

## Seed pairs

| Seed | Replicate 1 | Replicate 2 | Pixel result | Human basin |
| ---: | --- | --- | --- | --- |
| 190920 | `b6867c720601c03bdc20` | `3e29576bd1aa3fdee73d` | different | smoky / presence-heavy |
| 190921 | `9aedee9896bc49525c0b` | `21bfadb2fd3ba4a31c77` | exact match | intimate clear-room |
| 190922 | `ad915a47c25e98cef65e` | `100961bb1c632393d65e` | exact match | wide bordered tableau |
| 190923 | `a1c16e5c80c2924526a4` | `f74a264aa1c63c1b1f26` | exact match | centered ceremonial room |

## Findings

### 1. Seed can select high-level rendering grammar

The different seeds do not merely alter decoration or noise. They select
different high-level solutions while scene semantics remain fixed:

- camera distance and viewpoint;
- room topology;
- furniture choreography;
- wall palette;
- compositional symmetry;
- atmospheric density;
- immersive-room versus framed/tableau presentation.

This supports treating seed as a meaningful compositional coordinate in the
current Qwen/Hugging Face path.

### 2. Three seeds are perfectly deterministic in this trial

Seeds 190921, 190922, and 190923 produced bit-for-bit identical PNGs across
replicates rendered at opposite ends of the interleaved schedule.

This demonstrates that the provider path **can** honor the supplied seed
deterministically under the current setup.

### 3. Seed 190920 is anomalous but basin-stable

The two 190920 outputs are not pixel-identical, yet both remain clearly within
the same smoky / presence-heavy family. Their differences are local:

- haze density and shape;
- furniture detail and exact placement;
- small room-geometry shifts.

The high-level atmosphere and scene grammar remain stable.

The current evidence therefore suggests a wider or less numerically stable
basin at 190920 rather than a complete basin jump.

### 4. The current basin vocabulary is richer than a smoky/clear binary

0037 resolves at least four useful scene families:

1. **smoky_presence** — atmospheric haze, ambiguous occupancy, intimate room;
2. **clear_intimate** — same Hearth family with clearer air and conventional framing;
3. **wide_tableau** — increased camera distance and a bordered/presentational surface;
4. **centered_ceremonial** — strong symmetry, centered fireplace, circular floor/rug logic.

These are working morphology labels, not canonical aesthetic categories.

### 5. This is not evidence of agency

The phrase “presence” refers only to a visual morphology. Reproducible latent
basins are not evidence of agency, consciousness, intention, or a supernatural
entity.

## 0037 disposition

**Pass as a basin-cartography milestone.**

Supported:
- identical prompt across all arms;
- seed-conditioned high-level compositional variation;
- provider determinism for 3/4 tested seeds;
- basin stability at 190920 despite pixel-level divergence.

Next question:
- how dense or sparse are these basins across a local seed neighborhood?

Kernel 0038 performs a one-pass density scan while freezing all semantic,
witness, control-plane, and fixed-object variables.
