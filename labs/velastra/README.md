# Viryn Labs — Velastra

Velastra is an experimental semantic visual-composition engine.

It exists to preserve and externalize repeatable visual judgment without pretending that model internals can be extracted or that a runtime model call is necessary.

## Thesis

A design system usually begins with components.

Velastra begins one layer earlier:

**what does this thing mean, and what kind of visual behavior is appropriate to that meaning?**

The engine therefore separates:

1. semantic condition,
2. expression context,
3. visual intent,
4. material/composition grammar,
5. renderer-specific expression.

Sanctum is the first reference adapter.

Viryn Studio is the intended next external adapter.

## Source boundary

Generic engine:

- `world/velastra.json`
- `src/velastra/compose.js`

Sanctum context adapter:

- `src/velastra/context.js`

Sanctum DOM adapter:

- `src/velastra/sanctum.js`

Convenience exports:

- `src/velastra/index.js`

A future extraction should be able to move the generic grammar and composer without importing Sanctum state, world traversal, Hymnos, or Genesis.

## Generic contract

A consumer may provide explicit meaning:

```js
const intent = window.Velastra.compose({
  role: "gathering",
  axes: {
    intimacy: 0.72,
    relationality: 0.94,
    warmth: 0.8,
    sacredness: 0.58,
    urgency: 0.12
  },
  sensations: {
    stillness: 0.62,
    diffusion: 0.48
  },
  hints: {
    materials: ["paper", "brass"]
  }
}, "studio");
```

The returned intent contains no DOM nodes and no site-specific selectors.

It is safe to treat as read-only design judgment.

## Adapter contract

An adapter may interpret:

- `intent.role`
- `intent.axes`
- `intent.primaryMaterial`
- `intent.materials`
- `intent.composition`
- `intent.expression`

An adapter must not:

- alter the semantic context to make rendering easier,
- mutate the intent object,
- infer protected identity or relationship facts,
- convert decoration into required accessibility information,
- override consent or threshold law,
- imply that a metaphor such as `glass` requires literal glass texture.

## Semantic roles

The first grammar contains:

- place,
- encounter,
- artifact,
- memory,
- threshold,
- gathering,
- operational.

These roles are deliberately broader than Sanctum.

## Why materials are metaphors

Velastra does not define a universal texture library.

A material name carries design meaning.

For example, `glass` may become:

- translucency on the web,
- projection permeability in a room,
- acoustic openness in an installation,
- a lighter border and visible layering in a document.

The semantic continuity matters more than literal imitation.

## Exemplars as regression tests

Velastra uses exemplars to preserve authored judgment.

They answer questions such as:

- does Hearth still feel intimate and warm rather than operational?
- does a protected threshold remain open/ambiguous enough to read as threshold?
- does an operations surface remain restrained?
- does a Studio gathering feel relational without becoming Sanctum?

Run:

```js
window.Velastra.exemplars()
```

Every exemplar should pass before a grammar change is considered stable.

## Authorship loop

The intended Viryn Labs loop is:

1. encounter a new semantic/design problem,
2. compose and critique an expression,
3. identify which judgment was repeatable,
4. propose a grammar change,
5. test against existing exemplars,
6. accept or reject the change,
7. let adapters execute accepted law locally.

This is ecological learning rather than statistical retraining.

## Rainbreak direction

Velastra is deliberately medium-independent.

A later Rainbreak installation should be able to receive the same visual intent and reinterpret it through physical media.

Possible outputs include:

- light temperature and intensity,
- projected geometry,
- surface illumination,
- ambient motion,
- sound density,
- e-ink or display composition,
- spatial threshold treatment.

The engine should preserve the law:

**same meaning does not require the same body.**

## Non-goals

Velastra is not:

- a model-weight extraction method,
- a prompt library,
- a CSS theme generator,
- a replacement for accessibility semantics,
- a universal claim that one aesthetic is correct,
- an API dependency disguised as a design system.

It is an inspectable grammar for carrying authored visual judgment forward.
