# Hearth Spatial Carrier 0042 — Results

**Status:** complete; human review recorded; evidence archive sealed.

## Carrier integrity

- [x] structured carrier generated
- [x] destroyed carrier generated
- [x] dimensions match
- [x] exact pixel histogram matches
- [x] local tile inventory preserved
- [x] carrier contains no semantic room content
- [x] carrier contains no painterly witness content

## Transport gate

- [x] Z-Image hosted image-to-image probe attempted
- [x] provider rejected Z-Image Turbo for image-to-image on fal-ai
- [x] fallback decision recorded: use Qwen Image Edit transport gate
- [x] Qwen Image Edit structured transport probe accepted

## Pilot

- [x] 2 destroyed-control attempts completed
- [x] 2 structured-carrier attempts completed
- [x] output hashes present in local trial record
- [x] human review complete
- [x] output images / sidecars / render-time trial snapshot archived to repository

## Transport result

The one-request Z-Image transport gate was executed against:

- provider: `fal-ai`
- model: `Tongyi-MAI/Z-Image-Turbo`
- task: `image_to_image`

Provider response:

> `Model Tongyi-MAI/Z-Image-Turbo is not supported for task image-to-image and provider fal-ai. Supported task: text-to-image.`

No retry was attempted.

This is a hosted transport limitation for the tested provider route, not evidence that the Z-Image model family is incapable of image-to-image in other runtimes.

The protocol therefore advanced to the documented **Qwen Image Edit** fallback.

## Qwen transport result

The one-request Qwen Image Edit fallback probe was accepted by `fal-ai` and produced a new Hearth image from the structured non-semantic carrier.

Observed at transport review:

- the carrier was not copied literally as a block/grid image;
- the output remained recognizably within the Hearth scene family;
- the global composition shifted substantially away from the earlier centered/frontal Z-Image fireplace basin;
- scene-truth fidelity was incomplete: the low fire remained visually dominant and the velvet cushion was rendered as a chair-like furnishing rather than a literal cushion.

Decision: transport was viable enough to justify the bounded 2+2 distributional pilot.

The accepted structured probe was reused as **structured repeat 1**, followed by:

1. destroyed repeat 1
2. structured repeat 2
3. destroyed repeat 2

Provider seed control was unavailable, so interpretation is distributional rather than same-seed causal pairing.

## Human review — 2+2 cohort

Across all four Qwen outputs, the cohort converged on a narrow Hearth composition family:

- masonry fireplace positioned on the left;
- one dominant red velvet resting form on the right;
- warm firelight against a dark wall field;
- intimate cropped room framing;
- strong visual emphasis on the fire / fireplace relationship.

The four images were genuinely distinct, but their differences were mostly local rather than topological.

### Structured condition

Structured repeat 1 and structured repeat 2 both produced:

- a clear armchair-like resting form;
- a stable left-fireplace / right-seat relationship;
- relatively coherent room framing;
- no literal copying of the grayscale carrier.

The structured condition may show slightly stronger object-identity stability and compositional resolution, but the effect is subtle.

### Destroyed condition

Destroyed repeat 1 and destroyed repeat 2 remained in the same global scene family.

Observed differences included:

- greater variation in the right-side resting form;
- one output drifting toward a softer cushion/lounge form;
- changes in seat scale, fireplace crop, and wall glow;
- no meaningful collapse into block/tile artifacts.

The destroyed condition therefore did not erase Hearth coherence, and the structured condition did not create a clearly separate topology class.

## Scene-truth fidelity

Scene truth remained imperfect in both conditions.

The authored scene asks for:

- one low, contained fire;
- one velvet cushion;
- no unnecessary furniture / decorative props.

Observed:

- fire remained visually dominant rather than clearly low/subordinate;
- the cushion repeatedly became a chair-like furnishing;
- object identity varied, especially in the destroyed arm;
- the model retained a strong learned "fireplace + velvet seat" Hearth prior.

No condition demonstrated clearly superior scene-truth fidelity.

## Result

**Kernel 0042 demonstrates transport viability and weak carrier influence, but does not demonstrate a strong global-topology effect from preserved carrier geometry.**

The structured and destroyed conditions do not separate strongly enough to support the claim that global spatial retention, in this carrier representation, materially overrides the model's latent Hearth composition prior.

The cohort instead supports three narrower findings:

1. **Non-semantic carriers can successfully condition Qwen Image Edit without being copied literally.**
2. **Carrier structure can influence composition locally, but the effect is weaker than the model's learned Hearth prior.**
3. **Preserving versus destroying this carrier's global arrangement produces, at most, a subtle distributional difference in object stability / local composition rather than a new room topology.**

## Disposition

Do not expand 0042 with more repeats under the same design.

The pilot is sufficiently informative to justify stopping here.

Future work should not simply increase sample count or add more prose. Before another spatial-control kernel, reassess the intervention itself:

- stronger / more legible geometric carriers;
- explicit latent or depth / edge conditioning;
- a model/runtime with controllable structural inputs;
- scene-sovereignty improvements that retain fixed-object fidelity without consuming the full prompt budget.

## Cross-kernel synthesis

0041 and 0042 together narrow the problem substantially:

- **0041:** semantic topology language did not overcome the Hearth attractor.
- **0042:** non-semantic low-frequency carrier geometry altered composition but did not strongly overcome the Hearth attractor.

This suggests the next useful intervention must provide stronger structural authority than either prose or a weak grayscale carrier.

> **Do not ask more adjectives to do the work of geometry.**
>
> **Do not assume weak geometry can overpower a strong learned prior.**

## Interpretation boundary

This result concerns rendering behavior, prompt-conditioned priors, and spatial conditioning only. It is not evidence of agency, consciousness, supernatural presence, or autonomous intention.


## Archive note

The archived `results/trial.json` is the immutable **render-time snapshot** captured before human review. The canonical trial record at `labs/velastra/evidence/trials/hearth-spatial-carrier-0042.json` carries the finalized human-review state and disposition.

The archive manifest preserves SHA-256 values for the render-time evidence package. Candidate sidecar output hashes were verified against the trial outputs before closure.
