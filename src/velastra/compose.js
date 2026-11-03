export function composeMeaning({
  grammar,
  meaning = {},
  family = "sanctum"
}) {
  const context = normalizeMeaning(grammar, meaning);
  return composeVisualIntent({ grammar, context, family });
}

export function composeVisualIntent({
  grammar,
  context,
  family = "sanctum"
}) {
  const axes = normalizeAxes(grammar, context && context.axes);
  const sensations = normalizeSensations(context && context.sensations);
  const familyConfig =
    (grammar.families && grammar.families[family]) || {};

  const materialScores = scoreMaterials(
    grammar,
    axes,
    familyConfig,
    context && context.hints
  );

  const materials = materialScores.slice(0, 3);
  const primaryMaterial =
    materials[0] || { id: "shadow", score: 0 };

  const certainty = axes.certainty;
  const sacredness = axes.sacredness;
  const urgency = axes.urgency;
  const density = clamp(
    axes.density + Number(familyConfig.densityBias || 0)
  );
  const remembrance = axes.remembrance;
  const permeability = axes.permeability;
  const intimacy = axes.intimacy;
  const relationality = axes.relationality;
  const vitality = axes.vitality;
  const warmth = axes.warmth;

  const frameCompleteness = clamp(
    0.28 +
      certainty * 0.42 +
      density * 0.2 +
      sacredness * 0.12 -
      permeability * 0.28
  );

  const layering = clamp(
    0.12 +
      remembrance * 0.34 +
      sacredness * 0.22 +
      axes.age * 0.18 +
      relationality * 0.1
  );

  const rawOrnament = clamp(
    0.04 +
      sacredness * 0.32 +
      remembrance * 0.2 +
      relationality * 0.14 +
      axes.age * 0.12 -
      urgency * 0.16
  );

  const ornament = Math.min(
    rawOrnament,
    Number(familyConfig.ornamentCeiling || 1)
  );

  const asymmetry = clamp(
    0.14 +
      (1 - certainty) * 0.32 +
      permeability * 0.18 +
      vitality * 0.16 +
      sensations.diffusion * 0.1
  );

  const breathingRoom = clamp(
    0.28 +
      sacredness * 0.2 +
      intimacy * 0.18 +
      (1 - urgency) * 0.16 -
      density * 0.18
  );

  const enclosure = clamp(
    density * 0.32 +
      intimacy * 0.24 +
      (1 - permeability) * 0.24 +
      sacredness * 0.12 +
      sensations.enclosure * 0.08
  );

  const glow = clamp(
    warmth * 0.34 +
      sacredness * 0.28 +
      vitality * 0.18 +
      sensations.tenderness * 0.12 -
      urgency * 0.08
  );

  const motion = Math.min(
    clamp(
      vitality * 0.36 +
        (1 - sensations.stillness) * 0.34 +
        sensations.diffusion * 0.12 +
        relationality * 0.08
    ),
    Number(familyConfig.motionCeiling || 1)
  );

  const frameMode = chooseFrameMode({
    frameCompleteness,
    asymmetry,
    permeability,
    sacredness,
    certainty
  });

  const typography = chooseTypography({
    role: context && context.role,
    sacredness,
    certainty,
    density,
    urgency,
    intimacy
  });

  const texture = chooseTexture(primaryMaterial.id, {
    remembrance,
    vitality,
    sacredness,
    warmth
  });

  const intent = {
    version: 1,
    engine: "Velastra",
    laboratory: grammar.laboratory || "Viryn Labs",
    family,
    role: (context && context.role) || "place",
    axes,
    sensations,
    materials,
    primaryMaterial: primaryMaterial.id,
    composition: {
      frameMode,
      frameCompleteness,
      layering,
      ornament,
      asymmetry,
      breathingRoom,
      enclosure,
      depth: clamp(layering * 0.62 + density * 0.2 + sacredness * 0.12)
    },
    expression: {
      typography,
      texture,
      glow,
      motion,
      contrast: clamp(
        certainty * 0.44 +
          density * 0.22 +
          (1 - sensations.diffusion) * 0.16 +
          urgency * 0.14
      ),
      warmth
    },
    rationale: explainIntent({
      axes,
      sensations,
      primaryMaterial: primaryMaterial.id,
      frameMode,
      typography
    }),
    provenance: {
      contextVersion:
        (context && context.version) || null,
      source:
        (context && context.provenance && context.provenance.source) ||
        "semantic_input",
      deterministic: true,
      runtimeModelRequired: false
    }
  };

  return deepFreezeCopy(intent);
}

export function evaluateExemplars(grammar) {
  return Object.entries(grammar.exemplars || {}).map(
    ([id, exemplar]) => {
      const intent = composeMeaning({
        grammar,
        meaning: exemplar.meaning || {},
        family: exemplar.family || "sanctum"
      });
      const expect = exemplar.expect || {};
      const checks = [];

      if (expect.materialsAny) {
        checks.push({
          rule: "materialsAny",
          pass: expect.materialsAny.includes(intent.primaryMaterial),
          actual: intent.primaryMaterial,
          expected: [...expect.materialsAny]
        });
      }

      if (expect.frameAny) {
        checks.push({
          rule: "frameAny",
          pass: expect.frameAny.includes(intent.composition.frameMode),
          actual: intent.composition.frameMode,
          expected: [...expect.frameAny]
        });
      }

      if (typeof expect.ornamentMin === "number") {
        checks.push({
          rule: "ornamentMin",
          pass: intent.composition.ornament >= expect.ornamentMin,
          actual: intent.composition.ornament,
          expected: expect.ornamentMin
        });
      }

      if (typeof expect.ornamentMax === "number") {
        checks.push({
          rule: "ornamentMax",
          pass: intent.composition.ornament <= expect.ornamentMax,
          actual: intent.composition.ornament,
          expected: expect.ornamentMax
        });
      }

      if (typeof expect.motionMax === "number") {
        checks.push({
          rule: "motionMax",
          pass: intent.expression.motion <= expect.motionMax,
          actual: intent.expression.motion,
          expected: expect.motionMax
        });
      }

      if (expect.typographyAny) {
        checks.push({
          rule: "typographyAny",
          pass: expect.typographyAny.includes(intent.expression.typography),
          actual: intent.expression.typography,
          expected: [...expect.typographyAny]
        });
      }

      return {
        id,
        pass: checks.every((check) => check.pass),
        checks,
        intent
      };
    }
  );
}

function normalizeMeaning(grammar, meaning) {
  const role = meaning.role || "place";
  const roleAxes =
    (grammar.roles &&
      grammar.roles[role] &&
      grammar.roles[role].axes) ||
    {};

  return {
    version: 1,
    role,
    axes: {
      ...roleAxes,
      ...(meaning.axes || {})
    },
    sensations: {
      ...(meaning.sensations || {})
    },
    hints: {
      ...(meaning.hints || {})
    },
    provenance: {
      source: "explicit_meaning"
    }
  };
}

function normalizeAxes(grammar, provided = {}) {
  return Object.fromEntries(
    Object.entries(grammar.axes || {}).map(([id, definition]) => [
      id,
      clamp(
        Object.prototype.hasOwnProperty.call(provided, id)
          ? Number(provided[id])
          : Number(definition.default || 0)
      )
    ])
  );
}

function normalizeSensations(provided = {}) {
  return {
    wetness: clamp(Number(provided.wetness || 0)),
    diffusion: clamp(Number(provided.diffusion || 0.4)),
    stillness: clamp(
      Object.prototype.hasOwnProperty.call(provided, "stillness")
        ? Number(provided.stillness)
        : 0.6
    ),
    tenderness: clamp(Number(provided.tenderness || 0.5)),
    enclosure: clamp(Number(provided.enclosure || 0.5))
  };
}

function scoreMaterials(grammar, axes, familyConfig, hints = {}) {
  const bias = familyConfig.materialBias || {};
  const requested = new Set(hints.materials || []);

  return Object.entries(grammar.materials || {})
    .map(([id, material]) => {
      const vector = material.vector || {};
      const entries = Object.entries(vector);
      const distance = entries.length
        ? entries.reduce(
            (sum, [axis, target]) =>
              sum + Math.abs(Number(axes[axis] || 0) - Number(target)),
            0
          ) / entries.length
        : 1;

      return {
        id,
        score: clamp(
          1 -
            distance +
            Number(bias[id] || 0) +
            (requested.has(id) ? 0.12 : 0)
        ),
        meaning: material.meaning || null
      };
    })
    .sort((a, b) => b.score - a.score);
}

function chooseFrameMode({
  frameCompleteness,
  asymmetry,
  permeability,
  sacredness,
  certainty
}) {
  if (
    permeability > 0.72 ||
    frameCompleteness < 0.4
  ) {
    return "open";
  }

  if (
    asymmetry > 0.6 &&
    certainty < 0.66
  ) {
    return "interrupted";
  }

  if (
    sacredness > 0.72 &&
    frameCompleteness > 0.5
  ) {
    return "ceremonial";
  }

  return "held";
}

function chooseTypography({
  role,
  sacredness,
  certainty,
  density,
  urgency,
  intimacy
}) {
  if (
    role === "operational" ||
    (density > 0.76 && urgency > 0.3)
  ) {
    return "operational";
  }

  if (
    sacredness > 0.66 ||
    (intimacy > 0.72 && certainty < 0.72)
  ) {
    return "ceremonial";
  }

  if (
    certainty > 0.82 &&
    density < 0.52
  ) {
    return "declarative";
  }

  return "editorial";
}

function chooseTexture(primaryMaterial, axes) {
  if (primaryMaterial === "glass") return "translucent";
  if (primaryMaterial === "stone") return "mineral";
  if (primaryMaterial === "paper") return "fibrous";
  if (primaryMaterial === "brass") return "engraved";
  if (primaryMaterial === "botanical") return "living";
  if (primaryMaterial === "ember") return "luminous";
  if (primaryMaterial === "velvet") return "soft_depth";
  if (axes.remembrance > 0.72) return "patinated";
  return "restrained";
}

function explainIntent({
  axes,
  sensations,
  primaryMaterial,
  frameMode,
  typography
}) {
  const reasons = [];

  if (axes.remembrance > 0.58) {
    reasons.push("history is visually permitted to remain");
  }
  if (axes.sacredness > 0.62) {
    reasons.push("ritual gravity earns protected space");
  }
  if (axes.relationality > 0.62) {
    reasons.push("relation is allowed to shape composition");
  }
  if (axes.permeability > 0.66) {
    reasons.push("the boundary should feel traversable rather than sealed");
  }
  if (axes.intimacy > 0.7) {
    reasons.push("the expression should remain human-scale and close");
  }
  if (sensations.stillness > 0.72) {
    reasons.push("motion remains subordinate to stillness");
  }

  reasons.push(
    primaryMaterial + " carries the strongest current material metaphor"
  );
  reasons.push(
    frameMode + " framing and " + typography + " typography fit the current meaning"
  );

  return reasons;
}

function deepFreezeCopy(value) {
  const clone = JSON.parse(JSON.stringify(value));
  return freezeDeep(clone);
}

function freezeDeep(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Object.isFrozen(value)
  ) {
    return value;
  }

  Object.values(value).forEach((child) => {
    freezeDeep(child);
  });

  return Object.freeze(value);
}

function clamp(value, min = 0, max = 1) {
  const number = Number.isFinite(value) ? value : 0;
  return Math.min(max, Math.max(min, number));
}
