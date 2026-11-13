# Hearth Structural Memory 0041 — Results

**Status:** complete; human review recorded.

## Trial integrity

- [x] reference pixels absent
- [x] same-seed A/B pairs confirmed
- [x] Handprint enabled and unablated
- [x] baseline and structural prompt hashes differ
- [x] same scene truth / brush / provider within pair
- [x] compact shared causal base within 300-token target
- [x] structural arm within 420-token safe target
- [x] 2 baseline renders completed
- [x] 2 structural-memory renders completed
- [x] candidate IDs captured
- [x] human visual review completed

## Pair map

| Seed | Condition | Candidate |
| --- | --- | --- |
| 190920 | baseline | `d97e4f17e24bab4c1230` |
| 190920 | structural_memory | `baf996b037a950e25da0` |
| 190923 | baseline | `7f6e333029187dc9ff93` |
| 190923 | structural_memory | `3157c4d8bbb2280e2eee` |

## Pair review

| Seed | Same-seed relation | Ceremonial axis reduced | Bilateral symmetry reduced | Multiple centers of use | Open circulation | Fire subordinate | Scene truth | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 190920 | strong | no | no; structural arm is at least as formally balanced | no | weak / no directional gain | no | degraded in both arms | Both remain frontal fireplace compositions with paired cushions. Structural arm does not create distinct use-centers or a lived side-angle. |
| 190923 | strong | no; structural regresses toward center | no; structural arm increases bilateral seating grammar | no | weak / no directional gain | no | degraded differently across arms | Baseline is the most asymmetric render of the set, with one cushion and invented side furniture. Structural arm removes that peripheral asymmetry and produces three cushions around the same sovereign fireplace axis. |

## Cross-pair morphology

Across all four renders, Z-Image Turbo holds a highly stable latent template:

- frontal fireplace / chimney mass;
- fire as dominant luminous and semantic center;
- floor and wall recession organized toward the hearth;
- cushions treated as orbiting seating/rest markers around that center;
- peripheral room detail varies more freely than global topology.

The model spends variation budget on cushion count/placement, fireplace proportions, and minor peripheral furniture while preserving the same global spatial grammar.

## Scene-truth observations

The authored fixed objects are a **low fire** and **velvet cushion**.

Observed deviations:

- all four renders depict a large, visually sovereign fire rather than a low/subordinate fire;
- both 190920 arms show two cushions;
- the 190923 baseline invents a side table / vessel;
- the 190923 structural arm shows three cushions.

The compact causal prompt kept the A/B comparison valid because both conditions shared the same compact base, but the trial also shows that this compressed representation weakened literal fixed-object control compared with the full Painter contract.

## Conclusion

**Kernel 0041 is falsified as a text-level topology intervention for the current Z-Image Turbo Hearth basin.**

The structural-memory arm was present, bounded within the brush prompt envelope, and isolated as the only experimental factor. It did not produce directional topology change in either seed.

More strongly:

- seed 190920 shows no meaningful structural improvement;
- seed 190923 shows the baseline carrying more asymmetry than the structural arm;
- neither structural render makes fire subordinate to the room;
- neither structural render establishes several non-collinear centers of ordinary use;
- neither structural render meaningfully breaks the frontal ceremonial viewpoint.

The evidence therefore does **not** support expanding 0041 with more seeds.

## Interpretation

The failure is informative.

For this brush and this Hearth scene, the model prior associated with fireplace / hearth / warmth is stronger than the current semantic topology instructions. Additional prose is unlikely to be the most efficient next lever.

0041 also exposes a separate prompt-engineering constraint: preserving full scene sovereignty, full Handprint expression, and an additional topology intervention inside Z-Image Turbo's observed context envelope requires compression, and that compression can weaken fixed-object fidelity.

## Next experimental direction

Do not spend on a larger 0041 text-only cohort.

The next kernel should test a **non-semantic spatial control** or a brush with stronger compositional adherence. Candidate directions include:

1. a scene-authoritative layout carrier / abstract spatial scaffold that contains topology without importing semantic room content;
2. a model or transport that supports stronger spatial conditioning while preserving same-seed or otherwise controlled comparison;
3. a compact scene-sovereignty representation specifically optimized for fixed-object fidelity before combining it with structural control.

Any 0042 design should preserve the central lesson:

> Do not ask more adjectives to do the work of geometry.

## Interpretation boundary

This result concerns rendering behavior and prompt-conditioned spatial priors only. It is not evidence of agency, consciousness, supernatural presence, or autonomous intention.
