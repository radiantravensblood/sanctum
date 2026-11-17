# Hearth Regroup — Kernels 0038–0042

**Status:** synthesis checkpoint; no new inference authorized.

## Purpose

Pause the kernel sequence after 0042 and consolidate what the evidence actually supports before designing another intervention.

This note synthesizes:

- 0038 — Hearth Basin Density
- 0039 — Hearth Spatial Identity / semantic Place Memory
- 0040 — Visual Place Memory
- 0041 — Structural Hearth Memory
- 0042 — Non-Semantic Spatial Carrier

The goal is not to invent a new kernel automatically. The goal is to decide which architectural assumptions survived contact with evidence.

---

## 0038 — Basin Density

### Supported findings

- Hand fidelity is ahead of Hearth fidelity.
- Seed variation produces meaningful morphology changes.
- Domesticity and relational seating improve Hearth fidelity.
- Tableau / presentation modes are a major failure mode.
- Smoke / presence is orthogonal to Hearth fidelity.
- The dominant semantic mismatch is inherited old-world / Victorian parlor vocabulary rather than simply an incorrect fireplace.

### Architectural implication

The painterly hand is not the primary bottleneck.

The model can carry a coherent Velastra/Virynism treatment while still depicting the wrong *kind* of place.

---

## 0039 — Semantic Place Memory

### Supported findings

- Place Memory can coexist with Handprint, scene truth, and known seed basins.
- The intervention is non-destructive.
- Hearth movement is slight-to-modest.
- 190922 shows the strongest signal, but still only modestly.
- The failure mode is under-expression, not chaos.

### Architectural implication

Keep semantic Place Memory as a stable candidate-local layer, but do not expect it to supply strong spatial authority.

It is useful as bias / continuity, not as the mechanism that determines room topology.

---

## 0040 — Visual Place Memory

### Supported findings

- Deterministic transformed multi-source carriers can be built.
- Prompts can remain identical while carrier pixels vary.
- Both control and experimental arms converge on the same ceremonial Hearth attractor.
- Current Qwen Image Edit behavior is poorly aligned with “remember the world, forget the room.”
- Meso-scale visual adjacency did not establish a reliable House Freedom advantage.

### Architectural implication

Do not use scrambled visual references as the primary Place Memory mechanism for this problem.

The editor reconstructs room grammar too aggressively from visual input and/or shared model priors.

---

## 0041 — Structural Hearth Memory

### Supported findings

- Same-seed text-level topology intervention was cleanly isolated.
- Structural prose did not reduce the ceremonial axis.
- It did not create several non-collinear centers of use.
- It did not subordinate fire to the room.
- In one seed, the structural arm regressed toward stronger bilateral ceremony.
- Prompt compression weakened fixed-object fidelity.

### Architectural implication

Text is not a sufficient authority channel for the topology we want.

The prompt budget also creates a real competition between:

- scene sovereignty;
- Handprint expression;
- structural instruction.

Do not solve this by adding more prose.

---

## 0042 — Non-Semantic Spatial Carrier

### Supported findings

- Qwen Image Edit can accept a non-semantic carrier without copying the carrier literally.
- Carrier geometry influences composition locally.
- Structured versus destroyed geometry does not separate strongly enough to demonstrate a new global topology class.
- Both conditions converge on a narrow “left fireplace + right red velvet resting form” Hearth family.
- Scene-truth fidelity remains imperfect in both conditions.
- Weak geometry is subordinate to the learned Hearth prior.

### Architectural implication

A geometry channel can matter, but this carrier representation is too weak to be structurally sovereign.

Do not expand the same design with more repeats.

---

# What survives the sequence

## 1. Handprint survives

Handprint / painterly treatment remains useful.

0038 shows that the hand can be coherent even when the place is wrong. That means the hand should stay, but it should stop being asked to solve place identity.

**Role:** how Velastra paints.

Not:

**Role:** what room Velastra chooses.

---

## 2. Seed morphology survives

Seed-dependent basins are real and operationally useful.

They alter atmosphere, camera, topology, presentation, and presence without necessarily altering the underlying authored prompt.

**Role:** stochastic morphology / exploration coordinate.

Do not mistake a beautiful seed for Hearth fidelity.

---

## 3. Semantic Place Memory survives, demoted

0039 established that semantic Place Memory is stable and non-destructive.

It should remain available as a continuity bias, but the evidence does not support treating it as the primary spatial controller.

**Role:** world tendency / place bias.

Not:

**Role:** topology authority.

---

## 4. Visual Place Memory is not promoted

0040 did not establish a reliable advantage for transformed visual-place carriers.

The representation may still be useful in other scenes or future architectures, but it should not be the next default Hearth mechanism.

---

## 5. Structural prose is falsified as the main topology lever

0041 is the strongest causal negative result in the sequence.

Do not add more topology adjectives and call it a stronger experiment.

---

## 6. Non-semantic geometry is promising as a channel, not yet as an authority

0042 matters because the carrier was accepted and affected composition without literal copying.

But the current low-frequency grayscale representation does not overpower the latent Hearth prior.

The lesson is not “geometry failed.”

The lesson is:

> geometry must be more structurally authoritative than this carrier if it is expected to determine topology.

---

# Bottleneck identified

The current bottleneck is **scene / topology sovereignty**.

The stack has several competent influences:

- Handprint can govern treatment.
- Seeds can govern morphology.
- Place Memory can govern weak world bias.
- Image-edit carriers can govern some local arrangement.

But none currently has enough authority to say:

> this is the actual spatial organization of the room, and the model may not collapse it into its preferred Hearth archetype.

The learned prior continues to dominate global composition.

---

# Important confound to isolate before another spatial-control kernel

Across the sequence, the model repeatedly receives a lexical / semantic cluster containing some combination of:

- “Hearth”;
- fire / fireplace;
- warmth;
- velvet;
- intimacy / refuge.

The evidence demonstrates a strong recurring Hearth attractor, but the current sequence does **not** isolate which part of that semantic cluster is doing the most work.

Before investing in stronger spatial-control infrastructure, isolate whether the authored name / noun cluster itself is functioning as a high-authority latent trigger.

This is not a proposal to erase the authored identity.

It is a diagnostic question:

> Is the renderer obeying our place architecture poorly, or are we repeatedly invoking a learned visual archetype more strongly than we realize?

No conclusion should be drawn until this is isolated experimentally.

---

# Recommended regroup

Do not begin Kernel 0043 immediately.

First design a **renderer authority model** with explicit channels:

1. **Scene Truth** — literal facts and object cardinality.
2. **Spatial Authority** — topology / camera / adjacency / occupancy.
3. **Hand Memory** — material and painterly treatment.
4. **Place Memory** — world-level tendencies.
5. **Morphology** — stochastic exploration / seed basin.
6. **Forbidden inheritance** — what no lower-priority channel may introduce or override.

The next architecture should define precedence before adding new mechanisms.

Suggested precedence:

```
Scene Truth
  >
Spatial Authority
  >
Forbidden Inheritance
  >
Hand Memory
  >
Place Memory
  >
Morphology / Seed
```

This precedence is a design hypothesis, not yet an empirical result.

---

# Next research questions

Before another paid spatial-control cohort, answer these in order:

### A. Lexical-attractor isolation

Does the recurring Hearth composition persist when the renderer is given the same scene truth without the title / archetypal noun “Hearth” or without redundant hearth-coded language?

This should be designed carefully so scene truth remains semantically equivalent.

### B. Scene-sovereignty fidelity

Can the renderer preserve exact cardinality and modifiers:

- one low fire;
- one velvet cushion;
- no additional furniture;

before asking it to solve House Freedom topology?

If not, topology experiments are being built on unstable scene truth.

### C. Strong structural conditioning

Only after A and B should we consider:

- depth maps;
- edge / line conditioning;
- ControlNet-like structural channels;
- explicit latent layout conditioning;
- local image-to-image runtimes with deterministic seed / strength controls;
- masks / region constraints.

---

# Stop condition

No new paid inference should be authorized merely because the next kernel number is available.

Resume inference when the next experiment isolates one unresolved variable more cleanly than 0041/0042 did.

---

# Working conclusion

The last five kernels did not fail to produce a painting.

They succeeded at locating the actual control problem.

> **Velastra already has a hand.**
>
> **What it does not yet have is sovereign spatial authorship.**

The next architecture should be built around that distinction.
