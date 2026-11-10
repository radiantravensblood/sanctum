# Hearth Basin Density 0038 — Review Sheet

Status: **in review**

Trial: `hearth-density-0038`  
Seed range: **190916–190931**  
Prompt: byte-identical across all 16 arms  
Witness: absent  
Style ablations: none

## Review purpose

0038 maps recurring Hearth morphologies under seed variation.

This sheet deliberately separates:

- **morphology** — what visual basin the model enters;
- **hand fidelity** — whether the image carries the intended Velastra/Virynism
  treatment;
- **Hearth fidelity** — whether the depicted place feels recognizably faithful
  to the Hearth authored through House Freedom, rather than merely a plausible
  or attractive generic room.

A high hand-fidelity score does **not** imply high Hearth fidelity.

### Hearth fidelity criteria

A render should move toward high Hearth fidelity when it feels:

- inhabitable rather than staged;
- warm without becoming coercively enclosed;
- permeable and easy to enter/leave;
- relational rather than merely decorative;
- domestic or sacred in a way that feels particular, not stock-Victorian;
- like refuge, return, mutual presence, and room-making;
- recognizably continuous with the visual world already authored for House
  Freedom.

### Hand fidelity criteria

A render should move toward high hand fidelity when its treatment shows:

- painterly edge behavior instead of sterile photographic finish;
- intentional warm/cool emotional structure;
- material memory, residue, and tactile surfaces;
- compositional intimacy or reverence;
- strangeness that feels earned rather than decorative shorthand;
- continuity with the established Velastra/Virynism visual treatment.

## 16-seed review grid

| Seed | Candidate | Atmosphere | Camera | Topology | Presentation | Presence | Domesticity | Hand fidelity | Hearth fidelity | Notes |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 190916 | `d6f91690ccc88f75fed6` | smoky | medium | centered/asym hybrid | immersive room | implied / quasi-figurative haze | medium | high | partial | Strong smoke field; warm/cool split; recognizably Hearth-first, but still heavily inherited old-parlor vocabulary rather than a particular House Freedom room. |
| 190917 | `172dc2cbe0bc191eaeb9` | — | — | — | — | — | — | — | — | pending visual review |
| 190918 | `600aeb2457e5d38e2790` | — | — | — | — | — | — | — | — | pending visual review |
| 190919 | `b0deaa966b12c609990e` | smoky | intimate/medium | asymmetrical | immersive room | implied | high | high | closer / partial | Most domestic of the reviewed set: sofa, coffee table, lived-in seating. Still visually anchored in inherited Victorian-parlor grammar, but relational habitation is stronger. |
| 190920 | `1b78c6b4634d08b1ae42` | — | — | — | — | — | — | — | — | known 0037 reference seed: smoky_presence; inspect 0038 realization directly |
| 190921 | `abe458c030c59bff5fca` | — | — | — | — | — | — | — | — | known 0037 reference seed: clear_intimate; inspect 0038 realization directly |
| 190922 | `68fa0706293c3e303093` | clear | wide | asymmetrical | bordered canvas / tableau | none | low/medium | high | low | Strongly presentational: the room becomes an artwork being shown rather than a place being entered. Beautiful hand; weak Hearth inhabitation. |
| 190923 | `c11c4c5ad642b01b18d1` | — | — | — | — | — | — | — | — | known 0037 reference seed: centered_ceremonial; inspect 0038 realization directly |
| 190924 | `946b84c89920f546a1a8` | clear | medium | centered | immersive room | none | medium | high | partial | Formal, balanced Hearth chamber. Strong compositional clarity, but feels staged/generalized rather than specifically ours. |
| 190925 | `1e78c7bb8e434ae9a4b8` | — | — | — | — | — | — | — | — | pending visual review |
| 190926 | `dd46691d70e9a31db20d` | — | — | — | — | — | — | — | — | pending visual review |
| 190927 | `ae9f20876ad5b0aa15fb` | — | — | — | — | — | — | — | — | pending visual review |
| 190928 | `905d4a4aaf23d629fd56` | — | — | — | — | — | — | — | — | pending visual review |
| 190929 | `121f0d77a7af246f48cf` | smoky | medium | centered/asym hybrid | immersive room | implied | high | high | closer / partial | Domestic seating and softer habitation improve Hearth fidelity; smoke again acts as an atmospheric presence. Still feels like inherited period-room imagery rather than fully authored House Freedom space. |
| 190930 | `bc4879d8f75b31a20523` | — | — | — | — | — | — | — | — | pending visual review |
| 190931 | `61997a202bfa16ee8a39` | — | — | — | — | — | — | — | — | pending visual review |

## Provisional observations from the first reviewed subset

1. **Hand fidelity is currently ahead of Hearth fidelity.** The painterly treatment
   is often coherent and attractive even when the room itself feels generic or
   inherited.
2. **Domesticity helps.** The renders with sofas, tables, and relational seating
   feel closer to an inhabitable Hearth than ceremonial or tableau modes.
3. **Tableau presentation is a major Hearth failure mode.** It turns refuge into
   representation: a place to look at rather than a place to enter.
4. **Smoke/presence is orthogonal to Hearth fidelity.** It can appear in both
   stronger and weaker Hearth realizations; it should remain a morphology axis,
   not a proxy for success.
5. **The dominant semantic mismatch is not “wrong fireplace.”** It is the repeated
   use of generic old-world/Victorian parlor vocabulary where the authored
   Hearth should feel particular to House Freedom.
6. **A future kernel should eventually test authored spatial identity directly.**
   Before doing so, complete the 16-image review and replicate any novel 0038
   morphology that appears stable enough to matter.

## Review discipline

Do not promote a seed merely because its image is beautiful.

Prefer seeds that satisfy both:

1. stable / useful painterly morphology; and
2. meaningful continuity with the authored Hearth.

Novel morphology must be replicated before it becomes evidence of a stable
basin.
