export function applySanctumIntent({
  intent,
  root = document.documentElement,
  body = document.body
}) {
  if (!intent || !root || !body) return null;

  const composition = intent.composition || {};
  const expression = intent.expression || {};

  const tokens = {
    frameOpacity: round(
      0.12 + Number(composition.frameCompleteness || 0) * 0.5
    ),
    stackOffset:
      (3 + Number(composition.layering || 0) * 9).toFixed(1) + "px",
    shadowBlur:
      (22 + Number(composition.depth || 0) * 54).toFixed(1) + "px",
    ornamentOpacity: round(
      0.04 + Number(composition.ornament || 0) * 0.66
    ),
    space:
      (18 + Number(composition.breathingRoom || 0) * 18).toFixed(1) + "px",
    inset:
      (14 + Number(composition.enclosure || 0) * 12).toFixed(1) + "px",
    glowOpacity: round(
      0.02 + Number(expression.glow || 0) * 0.18
    ),
    motionSeconds:
      (18 - Number(expression.motion || 0) * 9).toFixed(1) + "s",
    interruption:
      (18 + Number(composition.asymmetry || 0) * 28).toFixed(1) + "%"
  };

  root.style.setProperty(
    "--velastra-frame-opacity",
    String(tokens.frameOpacity)
  );
  root.style.setProperty(
    "--velastra-stack-offset",
    tokens.stackOffset
  );
  root.style.setProperty(
    "--velastra-shadow-blur",
    tokens.shadowBlur
  );
  root.style.setProperty(
    "--velastra-ornament-opacity",
    String(tokens.ornamentOpacity)
  );
  root.style.setProperty(
    "--velastra-space",
    tokens.space
  );
  root.style.setProperty(
    "--velastra-inset",
    tokens.inset
  );
  root.style.setProperty(
    "--velastra-glow-opacity",
    String(tokens.glowOpacity)
  );
  root.style.setProperty(
    "--velastra-motion-duration",
    tokens.motionSeconds
  );
  root.style.setProperty(
    "--velastra-interruption",
    tokens.interruption
  );

  body.dataset.velastraRole = intent.role || "place";
  body.dataset.velastraFrame =
    composition.frameMode || "held";
  body.dataset.velastraMaterial =
    intent.primaryMaterial || "shadow";
  body.dataset.velastraTypography =
    expression.typography || "editorial";
  body.dataset.velastraTexture =
    expression.texture || "restrained";

  return {
    version: 1,
    adapter: "sanctum",
    tokens: { ...tokens },
    attributes: {
      role: body.dataset.velastraRole,
      frame: body.dataset.velastraFrame,
      material: body.dataset.velastraMaterial,
      typography: body.dataset.velastraTypography,
      texture: body.dataset.velastraTexture
    }
  };
}

function round(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}
