import { resolveRoomVisual } from "../genesis/chroma.js";

export function applyRoomVisual({ room, world, state }) {
  const visual = resolveRoomVisual(room, world);
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

  document.body.dataset.phenomenon = visual.phenomenon || "authored";
  document.body.dataset.atmosphere = visual.atmosphere || "authored";
  document.body.dataset.material = visual.material || "authored";

  const patina = derivePatina(room, state, visual);
  root.style.setProperty("--room-patina", String(patina));

  return visual;
}

function derivePatina(room, state, visual) {
  const visits = Number(state.visits[room.id] || 0);
  const age = Number((visual.sensation && visual.sensation.age) || 0.5);
  const visitInfluence = Math.min(1, Math.log2(visits + 1) / 4);
  return Math.min(1, 0.15 + age * 0.35 + visitInfluence * 0.5);
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
