# Sanctum

> The world does not resent your absence.

Sanctum is a tiny browser-native place built around continuity rather than optimization.

Kernel 0001 taught the house to remember.

**Kernel 0002 introduces Genesis: the law beneath becoming.**

## First law

**Do not overwrite. Reflect.**

The renderer presents what the world says is true. Genesis may propose new reality only at a frontier. The proposal must pass architectural law before it can materialize. Once a generated place is witnessed, it becomes canon and is never casually rerolled.

## World grammar

Authored truth lives in `world/*.json`.

Current truth lives in persistent browser state.

Historical truth lives in the event ledger.

Genesis governs **potential truth**: things that could exist but do not yet.

The lifecycle is:

`UNKNOWN → POTENTIAL → PROPOSED → VALIDATED → MATERIALIZED → WITNESSED → CANON`

## Genesis

`src/genesis/` contains the first world-making engine:

- `laws.js` — immutable architectural constraints.
- `seed.js` — deterministic seeded possibility.
- `grammar.js` — turns realm grammar into a proposed WorldDelta.
- `validate.js` — rejects changes that violate the laws.
- `materialize.js` — applies permitted deltas to current world state.
- `provenance.js` — records why generated reality exists and when it became canon.
- `genesis.js` — coordinates a birth at a latent frontier.

Nothing edits the world by divine fiat. Genesis produces a **WorldDelta**, law validates it, and only then can it become real.

## The first realm

The authored Sanctum remains stable:

`The Hearth → The Gallery of Unfinished Things → The Threshold`

The north mirror is still a consent-bearing threshold and Genesis cannot touch it.

A separate eastern edge in The Threshold is an **unwritten frontier**. Crossing it births exactly one room from the Frontier grammar. That room always receives:

- one stable return path,
- one generated object,
- one new latent frontier.

The realm therefore grows only where it is actually crossed.

No rooms are generated ahead of the traveler.

## Canon

A generated room is materialized when the frontier is crossed.

The moment it is entered for the first time, the room is marked **witnessed** and **canonical**.

Creation gets one chance.

History gets the rest.

## Current storage boundary

Kernel 0002 still persists to `localStorage`. Each browser therefore holds its own universe.

That is intentional for now. Shared canonical state belongs to a later threshold, after the laws of becoming have proven themselves.

## Run

Sanctum is deliberately build-step free. Serve the repository over HTTP or use GitHub Pages.

No framework. No package manager. No database. No AI call.

DreamSocket comes later.

First, the world learns how to become.
