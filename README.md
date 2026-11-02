# Sanctum

> The world does not resent your absence.

Sanctum is a browser-native place built around continuity rather than optimization.

Kernel 0001 taught the house to remember.

Kernel 0002 introduced Genesis: the law beneath becoming.

Kernel 0003 taught Genesis geography.

**Kernel 0004 teaches the world to show what it feels like.**

## First law

**Do not overwrite. Reflect.**

That law now applies to the visual layer too.

A room is not assigned a decorative theme after Genesis creates it. New generated rooms are born with **visual DNA** derived from the same semantic facts that shape their prose and topology:

- motif,
- form,
- material,
- atmosphere,
- phenomenon,
- seed.

The visual profile becomes part of the room's canon.

## Chroma

`world/visual-grammar.json` defines the house language.

It contains:

- the baseline Sanctum palette,
- authored profiles for the Hearth, Gallery, and Threshold,
- motif palettes,
- material influence,
- atmospheric influence,
- phenomenon influence,
- sensation channels,
- environmental effects.

Genesis resolves those layers in `src/genesis/chroma.js`.

A room therefore carries both language and sensation.

For example, a Rain Room is not simply "blue." Its visual profile is pulled toward cool mineral shadow, damp slate, mossed organic tones, diffused silver light, and low warmth.

The intended feeling is closer to **petrichor** than to a generic rain icon.

## Sensation channels

Visual profiles currently carry continuous values such as:

- wetness,
- warmth,
- diffusion,
- stillness,
- density,
- age,
- tenderness.

Those channels do not appear as scores in the interface.

They inform presentation.

The user should feel the room before they need to read a label explaining it.

## Scene grammar

The repeated orbit graphic has been replaced by a lightweight deterministic SVG renderer.

`src/visual/scene.js` composes scenes from reusable grammar:

### Form
- chamber,
- gallery,
- cistern,
- shrine.

### Material
- stone produces mineral marks,
- brass introduces warm linear traces,
- wood produces organic grain,
- glass introduces translucent planes.

### Atmosphere and phenomenon
- impossible rain becomes animated rain strokes,
- borrowed light enters from a source outside visible geometry,
- echoes become repeated rings,
- overgrowth becomes creeping linework,
- living architecture subtly breathes,
- authored spaces keep their own house symbols such as frames, mirror, and Hearth-fire.

The same room seed always produces the same composition.

## Geometry, atmosphere, patina

The visual doctrine is now:

**Geometry tells you what a place is.**

**Atmosphere tells you what being there feels like.**

**Patina tells you that something has happened there.**

Patina is intentionally quiet in Kernel 0004. Repeated visits deepen the room's surface treatment without showing a visit counter. Portable objects left in a room can appear as small visual residue inside the scene.

Later history systems can make patina richer without replacing the room's canonical identity.

## Existing canon

Rooms born before Kernel 0004 are not erased.

If an older generated room does not already carry stored visual DNA, the renderer reconstructs its profile deterministically from the Genesis metadata it already possesses.

New rooms store their resolved visual profile at birth.

So the visual upgrade respects prior history instead of declaring the old halls invalid.

## The Studio language

Sanctum's presentation is deliberately moving toward the same broader visual language intended for Viryn Studio:

- editorial rather than dashboard-like,
- warm and tactile,
- ornamental without becoming heavy,
- intimate rather than gamified,
- richly composed while remaining technically light.

The point is not to imitate a static concept image.

The point is to make the **system capable of producing that degree of atmosphere from world-state**.

## Current storage boundary

Kernel 0004 still persists to `localStorage`.

Each browser still carries its own history.

That remains useful: identical laws can currently produce different lived worlds on different machines.

Shared canon is a later threshold.

## Run

Sanctum remains build-step free and suitable for GitHub Pages.

No framework.

No package manager.

No database.

No AI runtime.

The renderer is still plain browser technology: HTML, CSS, JavaScript, JSON, and SVG.

First the world remembered.

Then it learned to become.

Then it learned to become somewhere.

Now it is learning to **look like what it means**.
