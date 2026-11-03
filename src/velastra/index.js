import { buildExpressionContext } from "./context.js";
import {
  composeMeaning,
  composeVisualIntent,
  evaluateExemplars
} from "./compose.js";
import { applySanctumIntent } from "./sanctum.js";

export function buildVelastraPacket({
  state,
  world,
  roomId = state.location,
  role = "place",
  family = "sanctum",
  now = new Date(),
  overrides = {},
  apply = false
}) {
  const context = buildExpressionContext({
    state,
    world,
    roomId,
    role,
    now,
    overrides
  });

  const intent = composeVisualIntent({
    grammar: world.velastra,
    context,
    family
  });

  const adapter = apply
    ? applySanctumIntent({ intent })
    : null;

  return {
    version: 1,
    engine: "Velastra",
    laboratory: "Viryn Labs",
    context,
    intent,
    adapter
  };
}

export function composeVelastraMeaning({
  world,
  meaning,
  family = "sanctum"
}) {
  return composeMeaning({
    grammar: world.velastra,
    meaning,
    family
  });
}

export function testVelastraExemplars(world) {
  return evaluateExemplars(world.velastra);
}

export { applySanctumIntent };
