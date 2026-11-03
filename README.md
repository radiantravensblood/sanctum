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

**Kernel 0008 invites the first inhabitants inside.**

**Kernel 0009 gives those inhabitants ecology rather than scripts.**

**Kernel 0010 lets relationship become a fact of the world.**

**Kernel 0011 makes interaction a consent-bearing proposal.**

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

**Mnemosyne → Chronos → Inhabitants → Familiars / DreamSocket**

Memory gives continuity an address.

Time gives continuity distance.

Entities can now inherit both.

## Inhabitants

`world/entities.json` defines the first small ecology.

Kernel 0008 begins with three original inhabitants:

- **the pale lumenmoth** — drawn toward warm and unexplained light,
- **the little processional** — a brass wanderer that favors familiar paths and pauses at thresholds,
- **the loose threadling** — an impossible knot-like lifeform drawn toward objects and places with history.

They are not quest dispensers, rewards, mascots, or simulated people.

They are presences with location, rhythm, and memory.

### Entity law

Inhabitants may move only through known lawful geography.

They cannot:

- generate rooms,
- cross latent unwritten frontiers,
- cross consent-bearing thresholds,
- enter an unwitnessed generated room.

They can therefore inhabit canon without acquiring authority over canon.

The northern mirror remains exactly as protected as before.

### Temporal movement

GitHub Pages does not secretly run inhabitants while the browser is closed.

When the Sanctum is actually opened or remains active, the entity engine compares civil time with each inhabitant's own last movement and advances a bounded number of lawful steps.

Returning after an absence may therefore reveal that an inhabitant is elsewhere.

That is temporal catch-up at invocation, not a claim that a hidden process remained awake.

### Memory

Entity movement becomes ordinary world history.

Rooms remember when an inhabitant arrived or departed.

Observation becomes a local echo.

Each entity also carries a bounded personal trail so inspection can reveal where its recent history passes.

There is no affection meter and no reward for observation.

Presence does not imply obligation.

### Dual-ended accessibility

Visual presentation is allowed to become subtly surreal without becoming the sole carrier of truth.

Inhabitants have tiny deterministic SVG signatures:

- a drifting pale glint for the lumenmoth,
- a low brass shape for the processional,
- a curling line for the threadling.

But the semantic interface always names who is present in the **In company** section and provides a text-based Observe action.

Reduced-motion preferences disable entity animation without removing entity state.

The same rule applies to future visual experimentation:

**visual ambiguity, semantic certainty.**

### Context packets

`window.Sanctum.context()` is now version 5.

Alongside Scene Truth, Mnemosyne, Chronos, objects, nearby rooms, and consent boundaries, it includes:

- inhabitants currently present,
- their recent histories,
- their last observed and moved times,
- the entity laws governing their permissions.

A future familiar therefore receives not merely company, but the laws under which company may act.

## Ecology

Kernel 0009 distinguishes **movement** from **life**.

An inhabitant's rhythm may now resolve into:

- movement through a known lawful path,
- lingering in the same room,
- resting,
- attending to an object already present,
- encountering another inhabitant.

Stillness is therefore a valid ecological action.

Time passing no longer means every inhabitant must change rooms.

### Backdated catch-up

When the browser returns after an absence, bounded catch-up actions are assigned to their lawful temporal intervals rather than all being stamped with the reopening moment.

The engine may skip older unresolved intervals when an absence is very long, preserving a bounded amount of history instead of manufacturing hundreds of unseen actions.

This creates temporal continuity without pretending a hidden browser process stayed awake.

### Familiarity without affection metrics

Repeated encounters create a small factual relationship record:

- encounter count,
- first encounter,
- most recent encounter,
- most recent shared room.

This is **familiarity evidence**, not friendship XP.

The system does not conclude that two inhabitants love, hate, trust, or belong to one another merely because they shared space.

Interpretation remains softer than evidence.

### Objects as ecological attention

Inhabitants may notice objects without taking, altering, claiming, or consuming them.

Object history can influence attention.

A threadling is therefore more likely to attend to an object whose biography already crosses several rooms, but the object's own state remains untouched.

The law remains:

**entities cannot alter objects without an explicit world law permitting that action.**

### Story residue

`window.Sanctum.ecology()` exposes a read-oriented ecology packet.

It contains:

- current inhabitant state,
- current location,
- present focus,
- recent history,
- factual familiarity records,
- recent ecological events,
- the laws governing entity behavior.

Those recent events form **story residue**.

A future language model may summarize, narrate, or reflect on that residue.

It should not invent events and then write those inventions backward into canon.

The new law is explicit:

**Story must follow events.**

### State and expression

The semantic interface states what an inhabitant is presently doing.

The SVG layer is allowed to remain subtler:

- resting presences dim and cease their ambient motion,
- lingering presences slow,
- attending presences hold more strongly,
- company can remain visually ambiguous while still being textually explicit.

The accessibility principle remains:

**visual ambiguity, semantic certainty.**

## Relation

Kernel 0010 treats relationship as shared world-state rather than an affection meter.

Each pair of inhabitants may accumulate evidence through ordinary ecological behavior:

- encounters,
- chosen approaches,
- lingering together,
- shared rest,
- reunion after separation,
- route convergence,
- mutual attention.

Individual inhabitants still retain their own histories and perspectives.

The relationship itself has one symmetric canonical record.

### Naming without scoring

The human interface never displays a friendship percentage.

It may quietly name an evidenced phase:

- **familiar**,
- **companionate**,
- **friends**.

The underlying evidence remains available to machine context for inspection and reasoning, but the visible surface receives the relationship rather than the accounting.

The governing law is:

**Relationship must follow choice.**

A label cannot generate the behavior that justifies it.

Behavior comes first.

### Reciprocity

Later phases require reciprocal choice evidence.

Repeated accidental co-location is not enough by itself to make friendship.

The inhabitants must each, over time, contribute behavior such as attention, approach, lingering, shared rest, or reunion.

Friendship also requires history across time and place rather than a burst of repeated actions in one moment.

### Relationship may influence choice

Once familiarity genuinely exists, it may exert a small influence on future lawful movement.

A familiar or friendly inhabitant in an adjacent known room can make that room slightly more attractive.

This influence never overrides:

- topology,
- time,
- temperament,
- consent thresholds,
- latent frontier law,
- witnessed-canon law.

Relationship therefore has causal weight without becoming destiny.

### Historical migration

Older Kernel 0009 encounter records are used to seed relation history where the evidence exists.

Migration does not invent missing reciprocal choices, shared rest, reunions, or approaches.

Old familiarity may therefore become legible.

Newer relationship phases must still be earned by future events.

### Relation packets

`window.Sanctum.relations()` exposes a read-oriented relation packet.

`window.Sanctum.context()` version 5 includes the same relation state alongside Scene Truth, Mnemosyne, Chronos, Ecology, objects, geography, and consent law.

A relation packet contains:

- the two inhabitants,
- the currently evidenced phase,
- first and most recent evidence,
- shared rooms,
- factual evidence channels,
- each inhabitant's directional contribution.

This is intended for interpretation, not mutation.

A future language model may recognize that two inhabitants have become friends because the world already contains the evidence.

It may not declare them friends and write the declaration backward into canon.

## Accord

Kernel 0011 expands observation into consentful interaction.

The core distinction is:

**Interaction is a proposal, not permission owed.**

The first shared affordances are:

- approach,
- wait nearby,
- offer an object,
- invite along,
- touch.

These verbs are not universally available.

Each inhabitant carries its own consent grammar, and consent is evaluated in the present context.

### Present-tense consent

An accepted interaction does not grant future permission.

A successful approach does not imply permission to touch.

A past touch does not imply permission to touch again.

An inhabitant may accept, decline, or defer an interaction.

Deferred means **not now** or **not yet**, not punishment and not a hidden failure state.

### Different inhabitants, different boundaries

The pale lumenmoth is comfortable with shared distance but has a standing boundary against touch.

The little processional is unusually comfortable sharing the Hearth and may permit closer contact after an accepted approach.

The loose threadling is highly receptive to quiet co-presence and storied objects, while touch requires prior evidence that shared space itself was welcome.

Consent therefore belongs to the inhabitant rather than to the verb.

### Offering is not giving

Offering an object allows an inhabitant to attend to it.

It does not transfer ownership or mutate the object.

The object remains carried until a separate lawful action changes its location.

The law is explicit:

**object offer does not transfer ownership.**

### Invitation is not command

An accepted invitation to accompany creates a bounded one-shot possibility.

When the traveler next moves through an ordinary lawful path, the invited inhabitant decides whether to come.

It may remain behind.

It may not follow through a consent-bearing threshold.

It may not cross a latent frontier.

It may not enter unwitnessed generated canon.

The invitation therefore grants an opportunity to choose, not a movement command.

### Human and machine symmetry

`world/accord.json` defines declared actors and the shared affordance grammar.

The current human traveler, `siege`, is enabled and located through traveler state.

A future machine resident, `viryn`, is declared but disabled.

That declaration is architectural preparation, not a claim of current autonomous presence.

The same proposal engine also recognizes lawful entity actors.

A future bounded machine invocation can therefore use the same interaction protocol rather than receiving a privileged control surface.

### Machine-facing surfaces

`window.Sanctum.accord()` exposes the read-oriented interaction packet.

`window.Sanctum.affordances(targetId)` shows which interactions are presently meaningful with a local inhabitant.

`window.Sanctum.propose({...})` submits a proposal through the same consent engine used by the human UI.

The current context packet is version 6 and includes Accord law alongside Scene Truth, Mnemosyne, Chronos, Ecology, Relation, objects, geography, and consent boundaries.

A machine actor must be explicitly enabled and lawfully located before the engine will accept proposals from it.

### Accessibility

Consent outcomes are semantic world events.

They are not encoded only through animation.

Mnemosyne can remember that an interaction was accepted, declined, or deferred, and the visible response states the outcome in language.

Visual behavior may echo that state, but meaning remains available without visual inference.

## Current storage boundary

Kernel 0011 still persists to `localStorage`.

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

And it knows that **time passes through the house without owning it**.

Now the house knows that **presence can exist without demand**.

And it knows that **a life can leave story behind without being written as a script**.

Now it knows that **relationship can emerge from repeated freedom**.

And it is learning that **closeness only matters when either side can refuse it**.
