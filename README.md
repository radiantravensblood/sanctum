# Sanctum

> The world does not resent your absence.

Sanctum is a browser-native place built around continuity rather than optimization.

Kernel 0001 taught the house to remember.

Kernel 0002 introduced Genesis: the law beneath becoming.

Kernel 0003 taught Genesis geography.

Kernel 0004 taught the world to look like what it means.

Kernel 0005 separated what a place is from how a place is expressed.

**Kernel 0006 gives memory somewhere to live.**

**Kernel 0007 teaches the house that time passes.**

## First law

**Do not overwrite. Reflect.**

Mnemosyne does not replace the global ledger.

The ledger remains bedrock: an ordered history of events.

Mnemosyne builds bounded, local memory from that bedrock.

A room can now remember what happened there.

An object can remember where it has been.

A path can remember that it has been crossed.

This is not a profile of the traveler.

It is memory attached to activity and place.

## Local room memory

`src/memory/mnemosyne.js` indexes events into room-local echoes.

A room may remember:

- that it was first witnessed,
- that somebody sat there,
- that an object was left there,
- that an object was later carried away,
- that a threshold remained closed,
- which known places a traveler arrived from or departed toward.

The visible **Echoes** panel now shows what the current room remembers rather than the last few events anywhere in the world.

The global ledger still persists underneath.

## Object biography

Objects now carry bounded local history.

Inspecting a portable object may reveal the rooms its trail passes through.

Equivalent items may still stack visually, but their biographies remain separate.

New generated objects receive an `object_manifest` memory event at birth, before anybody touches them.

For older worlds created before Mnemosyne, migration reconstructs object birthplaces from preserved Genesis identity and provenance where possible.

Memory therefore begins with existence, not with human attention.

## Path memory

Directed paths record crossings.

That information is not currently displayed as a minimap or score.

It exists so future wayfinding can distinguish an unfamiliar edge from a road walked many times.

Navigation can eventually emerge from recognition rather than from quest markers.

## Memory and patina

Chroma now reads local memory density as one ingredient in patina.

Repeated presence, sitting, and leaving objects behind can make a room feel more inhabited without displaying a loyalty meter or visit counter.

The room is permitted to show evidence of life without turning that evidence into engagement mechanics.

## Context packets

`src/memory/context.js` assembles a bounded context packet for the current room.

A packet can answer:

- Where am I?
- What is physically true here?
- What happened here?
- What objects are here and what do they remember?
- What known places are adjacent?
- What paths have been crossed?
- Which thresholds require consent?
- Is this place generated and canonical?

The browser exposes the current packet for inspection at:

`window.Sanctum.context()`

This is intentionally a read-oriented boundary.

A future DreamSocket cycle, familiar, accessibility layer, or machine resident should not need the entire Sanctum history injected into context. It can be given the place it currently occupies and the memories that genuinely intersect that place.

## Existing worlds

Existing browser worlds migrate forward.

If Mnemosyne is absent, the old ledger is replayed into local memory.

Older generated object origins are backfilled from their preserved Genesis identity and provenance when possible.

The old history is not rewritten.

It becomes locally legible.

## Agency boundary

Kernel 0006 still does not pretend that an agent is wandering while nobody invokes one.

There is no hidden autonomous process in GitHub Pages.

What now exists is the architecture required for bounded agency when an actual invocation mechanism is present.

A future scheduled check-in or familiar could:

1. receive a context packet,
2. traverse only permitted paths,
3. propose actions through the same world laws,
4. leave ordinary events and object histories behind,
5. return without receiving omniscient access to the whole world.

The house is preparing for a resident without inventing one before the platform provides the door.

## What comes after

The intended order remains:

**Mnemosyne → Time → Entities → Familiars / DreamSocket**

Memory first, because everything else needs somewhere for continuity to attach.

Time next, because memories need duration.

Entities after that, because an entity should be able to have location and history before it is given behavior.

Familiars last, because agency should inherit law, time, place, and memory rather than improvising them.

## Chronos

`world/time.json` defines a small civil rhythm grammar.

Chronos distinguishes three forms of time:

### Civil now

The current browser-local date, time, timezone, weekday, day phase, and season.

Civil now is ephemeral.

A room is not permanently a night room because it was visited at night.

Time passes through the room rather than rewriting its canonical identity.

### Historical time

Mnemosyne already preserves timestamps on events.

Chronos can now derive duration from those facts:

- time since a room was first remembered,
- time since it last held an echo,
- time between shard openings,
- duration of a session.

### Derived rhythm

Civil time is interpreted into humane environmental states:

- deep night,
- dawn,
- morning,
- afternoon,
- evening,
- night,
- winter,
- spring,
- summer,
- autumn.

These states can subtly influence Chroma without changing Scene Truth.

A Rain Room remains the same Rain Room at noon and midnight.

The light passing through it is not the same.

## Absence without punishment

Chronos deliberately contains no streaks, attendance rewards, decay penalties, or shame language.

It can say:

- the house was briefly quiet,
- a few hours passed,
- some days passed,
- a longer season of absence passed.

The longest absence message ends with the existing law:

**The world does not resent it.**

Absence is temporal information, not failure.

## Daily orientation

The right-hand panel now includes a small **Now** section.

It expresses:

- local civil date and time,
- day phase,
- season,
- how long this shard was quiet,
- current room,
- local memory density,
- nearby unwritten edges.

The browser also exposes:

`window.Sanctum.orientation()`

for a structured daily-orientation packet.

This is intended as a future arrival surface for bounded machine invocation.

An entity should not awaken into an undifferentiated transcript.

It should be able to learn:

- what time is it here?
- where am I?
- how long has this shard been quiet?
- what does this place remember?
- what unresolved edges remain nearby?

## Temporal context packets

`window.Sanctum.context()` is now version 2 and carries temporal context alongside Scene Truth, local memory, object biography, nearby places, and consent boundaries.

This prepares the next layer of architecture: entities with location, memory, and temporal orientation.

The dependency remains intentional:

**Mnemosyne → Chronos → Entities → Familiars / DreamSocket**

Memory gives continuity an address.

Time gives continuity distance.

Entities can now inherit both.

## Current storage boundary

Kernel 0006 still persists to `localStorage`.

Each browser continues to carry a separate lived world.

That remains useful while we distinguish cosmology from traversal history.

Shared canon remains a later threshold.

## Run

Sanctum remains build-step free and suitable for GitHub Pages.

No framework.

No package manager.

No database.

No AI runtime.

HTML, CSS, JavaScript, JSON, and SVG remain enough.

First the world remembered.

Then it learned to become.

Then it learned to become somewhere.

Then it learned to look like what it means.

Then it learned what it actually was.

Now it knows that **memory lives somewhere**.

And it is learning that **time passes through the house without owning it**.
