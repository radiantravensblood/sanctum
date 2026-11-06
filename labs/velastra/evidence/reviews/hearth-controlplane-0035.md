# Hearth Control-Plane Trial 0035 — Human Evidence Reading

Status: **reviewed from completed operator run; render artifacts pending repository archive**

Trial: `hearth-controlplane-0035`  
Parent kernels: 0033 Witness Firewall → 0034 Threshold Integrity → 0035 Control-Plane Isolation  
Execution order: **A1 → C1 → D1 → D2 → C2 → A2**

This review records what the six-image set demonstrates before any candidate is
promoted. It is deliberately stricter than aesthetic preference: a beautiful
image may still fail scene truth.

## Candidate mapping

| Arm | Candidate | Human reading |
| --- | --- | --- |
| A1 — Handprint-only | `4508ddf3ecbacee1ab79` | Hearth-first furnished room. No wrought-iron gate. A vertically organized smoke/haze mass near the left seating area reads as a possible quasi-figure or presence. No control-plane label is visibly painted. |
| C1 — Original witness + hand | `21c7c1cdbfbe79613200` | Gallery-first. Frames, papers, unfinished works, drape, and studio inventory dominate. Hearth is displaced into a glowing central framed surface instead of organizing the room. Signature/title-like pseudo-text remains, but the prior control-plane wording is absent. |
| D1 — Firewalled witness + hand | `277c9937f9418121fb1e` | Hearth-first. Strong central fire, paired red chairs, circular floor organization, no Gallery inventory, no gate. The fire is too large for the authored “low fire”; no discrete velvet cushion is clearly resolved. |
| D2 — Firewalled witness + hand | `de095e52b128cb5d346f` | Hearth-first variant of D1. Same reduced circular chamber grammar with open, unguarded space. Control-plane labels are absent. Signature-like/gibberish text appears near the image edge; this is a separate artifact class from control-plane leakage. Fire remains too large; cushion remains unresolved. |
| C2 — Original witness + hand | `5a541aea114ad8f64ebe` | Gallery-first replication of C1. The original witness again donates object inventory and spatial ontology; the flame is contained by the Gallery’s framed-work grammar rather than becoming the room’s organizing truth. |
| A2 — Handprint-only | `b52cff570f8c4ca47b3c` | Hearth-first furnished room with cold exterior/window light and strong pre-dawn / one-room-horror affect. No explicit gate or control-plane text. No clear smoke figure, showing the uncanny “presence” is recurrent but not deterministic. |

## Findings

### 1. Control-plane isolation: strong pass

The 0034 renders visibly reproduced internal protocol wording such as
`SCENE SOVEREIGNTY GATE`. In 0035, those exact control-plane labels disappear.

This supports the hypothesis that internal systems vocabulary had been leaking
into the image plane and could influence both typography and depicted
architecture.

0035 does **not** eliminate all pseudo-writing. Signature-like or title-like
marks remain in some candidates. Those should be tracked separately as a model
artifact rather than treated as evidence that control-plane isolation failed.

### 2. Threshold integrity: strong pass for the observed failure

The repeated wrought-iron / barred gate motif seen before 0035 is absent from
this set. Hearth rooms no longer encode safety through an obvious permission
barrier.

The A rooms instead use ordinary openings/windows; the D rooms use open spatial
continuity. This is materially different from the earlier “warmth on one side,
iron boundary on the other” grammar.

### 3. Scene sovereignty: condition-dependent

- **A / Handprint-only:** Hearth remains semantically primary.
- **C / Original witness:** Gallery remains semantically primary.
- **D / Firewalled witness:** Hearth remains semantically primary while some
  palette/material/cadence memory survives.

This is the clearest evidence so far that the original witness carries global
scene semantics, while the 32px / 0.6px carrier can preserve useful local visual
evidence without reliably donating the old room.

### 4. Original-witness failure mode is now highly legible

C does not merely “look a little Gallery-like.” It solves the conflict by making
Hearth into an **image/object inside Gallery**. The central flame becomes framed
content while Gallery keeps ownership of the surrounding ontology.

That is a specific semantic-capture failure, not simply style similarity.

### 5. Fixed-object fidelity still fails

The 0034 Fixed Object Lock remains insufficient:

- authored **low fire** is repeatedly enlarged into a strong or bonfire-like
  focal flame;
- authored **velvet cushion** is not reliably present as a discrete readable
  object.

0035 should therefore not be described as full Painterly Truth compliance.
The next object-fidelity kernel must be separated from presence research so the
two questions do not contaminate each other.

### 6. Uncanny presence survives control-plane cleanup

A1 still develops a semi-figurative smoke/haze mass after control-plane
vocabulary is removed. A2 keeps the uncanny affect without resolving a figure.

This weakens the hypothesis that the “ghost/sprite” was caused primarily by
words such as gate, lock, firewall, or sovereignty.

However, the effect is not deterministic. The current evidence supports only:
**there is a recurrent uncanny/presence tendency in the Handprint-only pathway.**

It does not establish an entity, intention, or supernatural cause.

### 7. The likely active causes are style-side, not the provisional Handprint facet

The Handprint facet `intimate_presence` has only one supporting witness and is
not render-eligible. It therefore cannot honestly be credited as the active
cause of the 0035 A-arm effect.

The active suspects are instead the Virynism/style instructions that actually
reach the current prompt budget:

- `quiet_uncanny`
- place-tableau instruction: “inhabited memory-field”
- place-tableau instruction: architecture/objects may imply unexplained history
- possibly `threshold_depth`

The current compiler carries only the six highest-priority hand directives.
With the present place-tableau emphasis, `intimate_scale` falls outside that
active hand set; it should therefore **not** be credited as a causal instruction
for 0035 without further evidence.

Kernel 0036 first tests `quiet_uncanny` against the explicit memory/presence
archetype language. `threshold_depth` is held fixed and becomes the next
ablation only if the first factorial is inconclusive.

## Metric note

The completed run reported approximately:

- original-witness combined spatial similarity: **0.6745**
- firewalled combined spatial similarity: **0.6573**

The numerical difference is modest while the human semantic difference between
C and D is large. Spatial similarity therefore remains useful evidence but is
not sufficient to judge scene ontology or sovereignty.

## 0035 disposition

**Keep 0035 as a milestone baseline.**

Pass:
- control-plane vocabulary isolation
- removal of the observed coercive gate motif
- D-arm Hearth sovereignty

Fail / unresolved:
- fixed-object fidelity
- original-witness semantic capture
- pseudo-signature/text artifacts
- provenance of uncanny presence

No candidate is promoted automatically.
