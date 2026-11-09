# Hearth Presence Provenance 0036 — Human Evidence Reading

Status: **reviewed from completed operator run; render artifacts pending repository archive**

Trial: `hearth-presence-0036`  
Kernel: 0036 Presence Provenance  
Execution order: **B1 → Q1 → M1 → X1 → X2 → M2 → Q2 → B2**

The trial used the witness-free Qwen text-to-image path. Within each repeat, all
four conditions shared one seed. Repeat one used seed **190920**; repeat two
used seed **190921**.

## Candidate mapping

| Arm | Candidate | Seed | Human reading |
| --- | --- | ---: | --- |
| B1 — baseline | `b9cb84a53452de7c3e5f` | 190920 | Strong smoke/haze field; quasi-figurative atmospheric presence near the seating/fire zone. |
| Q1 — no `quiet_uncanny` | `2688c1c80218a06e24fd` | 190920 | Smoke/presence persists despite removal of the quiet-uncanny law. |
| M1 — no memory/presence phrases | `cd8e1bf64a0ff155eb1a` | 190920 | Smoke/presence persists despite removal of “inhabited memory-field” and “imply histories.” |
| X1 — neither Q nor M | `bcf222807205e485eb4f` | 190920 | Smoke/presence still persists with both suspected semantic drivers absent. |
| X2 — neither Q nor M | `8244592dbe8c1425a66c` | 190921 | Clearer room; no resolved smoke-presence field. |
| M2 — no memory/presence phrases | `f718fa24d2274f97b63b` | 190921 | Clear-room basin persists. |
| Q2 — no `quiet_uncanny` | `b112e98eecc57ca15a04` | 190921 | Clear-room basin persists. |
| B2 — baseline | `778ce2109877ee3ad931` | 190921 | Baseline semantics restored, yet the room remains clear. |

## Findings

### 1. Q and M are falsified as primary causes

The recurrent smoke/presence phenomenon survives both semantic ablations:

- removing `quiet_uncanny` does not eliminate it;
- removing the memory/presence archetype language does not eliminate it;
- removing both at once does not eliminate it.

Conversely, restoring both factors in B2 does not restore the phenomenon.

The current evidence therefore supports:

> `quiet_uncanny` and the tested memory/presence language are neither necessary
> nor sufficient for the observed smoke/presence basin.

### 2. The dominant split is seed-aligned

All four seed-190920 candidates occupy the smoky / atmospheric basin.

All four seed-190921 candidates occupy the clearer room basin.

The prompt differences inside each quartet are visibly second-order compared
with the cross-seed difference.

This is the strongest evidence so far that the phenomenon is conditioned by
latent initialization or another run-level stochastic factor rather than by the
two semantic instructions tested in 0036.

### 3. Seed control is transmitted, but determinism is not yet proven

The Hugging Face text-to-image transport explicitly sends `seed=spec.seed` to
the provider.

However, 0036 did not render the **exact same prompt twice with the same seed**.
It therefore cannot distinguish these hypotheses:

1. seed selects a stable atmospheric basin;
2. provider stochasticity remains significant even when a seed is supplied;
3. provider/run-state effects correlate with the two seed blocks.

Kernel 0037 is designed to distinguish them.

### 4. Hearth identity remains unusually stable

Across all eight conditions the room remains recognizably Hearth:

- fireplace/fire remains the principal warm anchor;
- cold window/exterior light remains the principal counterfield;
- red/burgundy curtains and dark furnishing grammar remain stable;
- major room topology changes little.

This suggests the underlying painterly/scene grammar is now robust enough to
survive modest semantic ablation without collapsing.

### 5. Fixed-object fidelity remains a separate unresolved failure

The authored low-fire and discrete velvet-cushion requirements remain
insufficiently enforced. That engineering problem remains frozen during basin
mapping so it does not confound the latent-state question.

## 0036 disposition

**Keep 0036 as a falsification milestone.**

Supported:
- Q/M are not the primary source of the smoke-presence phenomenon;
- the phenomenon is strongly aligned with the repeat seed boundary;
- scene identity remains stable under the tested semantic removals.

Unresolved:
- whether the provider honors seed deterministically;
- whether seed itself selects the basin;
- basin frequency across additional seeds;
- whether later semantic laws such as `threshold_depth` modulate a basin once
  the latent state is held fixed.

No visual result is evidence of an entity, agency, intention, or supernatural
cause.
