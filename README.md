# Sanctum

> The world does not resent your absence.

Sanctum is a browser-native place built around continuity rather than optimization.

Kernel 0001 taught the house to remember.

Kernel 0002 introduced Genesis: the law beneath becoming.

Kernel 0003 taught Genesis geography.

Kernel 0004 taught the world to look like what it means.

**Kernel 0005 takes the room apart.**

## First law

**Do not overwrite. Reflect.**

The newest architectural distinction is simple:

**A room is not its description.**

It is also not its SVG.

It is also not its palette.

Those are renderings of a deeper canonical state.

## Scene Truth

Generated rooms are now born with a structured `scene` object assembled by `src/genesis/scene-truth.js`.

Scene Truth carries facets such as:

### Geometry
- form,
- scale,
- enclosure,
- depth,
- verticality,
- symmetry,
- focality.

### Matter
- material,
- roughness,
- reflectivity,
- thermal character,
- porosity.

### Air
- movement,
- humidity,
- temperature,
- pressure.

### Acoustics
- reverberation,
- clarity,
- delay.

### Light
- source behavior,
- intensity,
- temperature,
- directionality.

### Anomaly
- the impossible law operating in the room,
- its intensity,
- locality,
- stability.

### Senses
- scent,
- touch.

A Rain Room may therefore know that it contains porous stone, cool humid air, high reverberation, diffuse cold light, precipitation without a visible source, and the scent of petrichor.

None of those facts are prose yet.

None are pixels yet.

They are world truth.

## Many renderers, one reality

Scene Truth currently feeds three different interpreters.

### Language

`src/genesis/language.js` turns facets into prose.

The description is no longer constructed by simply concatenating the same four fixed sentences every time. Geometry, atmosphere, matter, anomaly, topology, carried objects, and sometimes scent are expressed through deterministic language variants.

The same seed and same Scene Truth produce the same voice.

### Chroma

`src/genesis/chroma.js` still respects the Studio visual grammar, but it now also reads physical facts.

Humidity can cool and deepen the field.

Warm directional light can lift amber and gold.

Cold light can pull the glow toward mineral blue.

High reverberation can subtly cool muted tones.

Sensation is therefore increasingly derived from reality instead of category labels.

### Geometry

`src/visual/scene.js` now reads physical geometry rather than merely drawing one of four canned icons.

Enclosure affects the room's span.

Depth affects perspective.

Verticality affects ceilings and arches.

Focality affects the visual center of a shrine.

Roughness changes material marks.

Reflectivity changes brass and glass behavior.

Humidity changes haze.

Reverberation changes visual echoes.

Anomaly-law determines impossible behavior such as source-less rain or breathing masonry.

The renderer is learning physics rather than room names.

## Semantic grammar

`world/semantic-grammar.json` is the first lexicon of the world beneath the words.

It gives Genesis structured meaning for forms, materials, atmospheres, and phenomena, along with deterministic phrase families used by the language renderer.

The long-term goal is not infinite adjective lists.

It is a compact set of meaningful primitives that can combine into places whose prose, visuals, sound, interaction, and future machine interpretation all agree about what is actually there.

## Existing canon

Rooms born before Kernel 0005 are not invalidated.

If an older generated room does not yet carry Scene Truth, the renderer reconstructs it deterministically from the Genesis metadata already preserved in that room.

New rooms store Scene Truth at birth.

Old halls remain old halls.

They have simply become more legible.

## The deeper architecture

The pipeline is now:

```text
Genesis choices
      ↓
  Scene Truth
      ↓
 ┌────┼─────────┐
 ↓    ↓         ↓
prose chroma geometry
```

That opens a much larger possibility.

Future renderers can read the exact same world:

- audio,
- tactile/haptic expression,
- accessibility narration,
- alternate visual styles,
- DreamSocket reasoning,
- machine traversal,
- memory summaries,
- different devices.

None of those systems need to invent the room again.

They translate the same reality.

## Current storage boundary

Kernel 0005 still persists to `localStorage`.

Each browser still carries its own lived history.

That remains useful while we discover which truths belong to cosmology and which belong to the traveler.

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

Now it is learning the difference between **what a place is** and **how a place is expressed**.
