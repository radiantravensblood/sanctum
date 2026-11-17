# Hearth Spatial Carrier 0042 — Results

**Status:** Qwen transport accepted; 2+2 pilot staged; human review pending.

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

## Pilot

- [ ] 2 destroyed-control attempts
- [ ] 2 structured-carrier attempts
- [ ] output hashes present
- [ ] candidate sidecars present
- [ ] human review complete

## Transport result

The one-request Z-Image transport gate was executed against:

- provider: `fal-ai`
- model: `Tongyi-MAI/Z-Image-Turbo`
- task: `image_to_image`

Provider response:

> `Model Tongyi-MAI/Z-Image-Turbo is not supported for task image-to-image and provider fal-ai. Supported task: text-to-image.`

No retry was attempted.

This is a hosted transport limitation for the tested provider route, not evidence that the Z-Image model family is incapable of image-to-image in other runtimes.

The protocol therefore advances to the documented **Qwen Image Edit** fallback.

## Qwen transport result

The one-request Qwen Image Edit fallback probe was accepted by `fal-ai` and produced a new Hearth image from the structured non-semantic carrier.

Observed at transport review:

- the carrier was not copied literally as a block/grid image;
- the output remained recognizably within the Hearth scene family;
- the global composition shifted substantially away from the prior centered/frontal fireplace basin;
- scene-truth fidelity was incomplete: the low fire became visually dominant and the velvet cushion was rendered as a chair-like furnishing rather than literal cushion.

Decision: transport is viable enough to justify the bounded 2+2 distributional pilot.

The accepted structured probe is reused as **structured repeat 1**. The pilot therefore authorizes only three additional provider requests in chronological order:

1. destroyed repeat 1
2. structured repeat 2
3. destroyed repeat 2

## Conclusion

Pending completion and human review of the 2+2 Qwen spatial-carrier pilot.
