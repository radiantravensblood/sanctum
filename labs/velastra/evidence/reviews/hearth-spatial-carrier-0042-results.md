# Hearth Spatial Carrier 0042 — Results

**Status:** protocol staged; no inference executed.

## Carrier integrity

- [ ] structured carrier generated
- [ ] destroyed carrier generated
- [ ] dimensions match
- [ ] exact pixel histogram matches
- [ ] local tile inventory preserved
- [ ] carrier contains no semantic room content
- [ ] carrier contains no painterly witness content

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

## Conclusion

Pending Qwen transport probe and 2+2 pilot.
