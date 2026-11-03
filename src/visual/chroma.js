import { resolveRoomVisual } from "../genesis/chroma.js";
import { roomMemoryWeight } from "../memory/mnemosyne.js";

export function applyRoomVisual({ room, world, state, scene = null }) {
  const visual = resolveRoomVisual(room, world, scene);
  const palette = visual.palette || {};
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
