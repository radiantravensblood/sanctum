import { resolveRoomVisual } from "../genesis/chroma.js";
import { roomMemoryWeight } from "../memory/mnemosyne.js";

export function applyRoomVisual({
  room,
  world,
  state,
  scene = null,
  temporal = null
}) {
  const visual = resolveRoomVisual(room, world, scene);
  const palette = applyTemporalPalette(visual.palette || {}, temporal);
  const root = document.documentElement;

  setVar(root, "--room-shadow", palette.shadow);
  setVar(root, "--room-field", palette.field);
  setVar(root, "--room-surface", palette.surface);
  setVar(root, "--room-ink", palette.ink);
  setVar(root, "--room-muted", palette.muted);
  setVar(root, "--room-accent", palette.accent);
  setVar(root, "--room-glow", palette.glow);
  setVar(root, "--room-organic", palette.organic);

  root.style.setProperty(
    "--room-line",
    hexToRgba(palette.ink || "#f3eadf", 0.14)
  );

  document.body.dataset.phenomenon =
    visual.phenomenon ||
    (scene && scene.anomaly && scene.anomaly.phenomenon) ||
    "authored";
  document.body.dataset.atmosphere =
    visual.atmosphere ||
    (scene && scene.air && scene.air.atmosphere) ||
    "authored";
  document.body.dataset.material =
    visual.material ||
    (scene && scene.matter && scene.matter.material) ||
    "authored";

  const memoryWeight = roomMemoryWeight(state, room.id);
  const patina = derivePatina(room, state, visual, memoryWeight);

  root.style.setProperty("--room-patina", String(patina));
  root.style.setProperty("--room-memory", String(memoryWeight));

  if (scene) {
    root.style.setProperty(
      "--room-humidity",
      String(Number((scene.air && scene.air.humidity) || 0))
    );
    root.style.setProperty(
      "--room-reverb",
      String(Number((scene.acoustics && scene.acoustics.reverb) || 0))
    );
    root.style.setProperty(
      "--room-light-directionality",
      String(Number((scene.light && scene.light.directionality) || 0))
    );
  }

  return visual;
}

function applyTemporalPalette(base, temporal) {
  if (!temporal || !temporal.rhythm) return { ...base };

  let next = { ...base };
  const phase = temporal.rhythm.phase || {};
  const season = temporal.rhythm.season || {};

  next = tintPalette(next, phase.tint, Number(phase.strength || 0));
  next = tintPalette(next, season.tint, Number(season.strength || 0));

  const light = Number(
    typeof phase.light === "number" ? phase.light : 1
  );

  if (light < 1) {
    const darkness = Math.min(0.16, (1 - light) * 0.3);
    ["shadow", "field", "surface"].forEach((key) => {
      if (next[key]) next[key] = mixHex(next[key], "#07080d", darkness);
    });
  }

  return next;
}

function tintPalette(palette, tint, amount) {
  if (!tint || !amount) return palette;
  const next = { ...palette };

  ["shadow", "field", "surface", "muted", "organic"].forEach((key) => {
    if (next[key]) next[key] = mixHex(next[key], tint, amount);
  });

  ["accent", "glow"].forEach((key) => {
    if (next[key]) next[key] = mixHex(next[key], tint, amount * 0.45);
  });

  return next;
}

function mixHex(a, b, amount) {
  const first = parseHex(a);
  const second = parseHex(b);
  if (!first || !second) return a;

  const channel = (left, right) =>
    Math.round(left + (right - left) * amount)
      .toString(16)
      .padStart(2, "0");

  return (
    "#" +
    channel(first.r, second.r) +
    channel(first.g, second.g) +
    channel(first.b, second.b)
  );
}

function parseHex(value) {
  const match = String(value || "").match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;

  return {
    r: parseInt(match[1].slice(0, 2), 16),
    g: parseInt(match[1].slice(2, 4), 16),
    b: parseInt(match[1].slice(4, 6), 16)
  };
}

function derivePatina(room, state, visual, memoryWeight) {
  const visits = Number(state.visits[room.id] || 0);
  const age = Number((visual.sensation && visual.sensation.age) || 0.5);
  const visitInfluence = Math.min(1, Math.log2(visits + 1) / 4);

  return Math.min(
    1,
    0.12 +
      age * 0.28 +
      visitInfluence * 0.28 +
      memoryWeight * 0.32
  );
}

function setVar(root, key, value) {
  if (value) root.style.setProperty(key, value);
}

function hexToRgba(hex, alpha) {
  const match = String(hex).match(/^#([0-9a-f]{6})$/i);
  if (!match) return "rgba(243, 234, 223, " + alpha + ")";

  const value = match[1];
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
}
