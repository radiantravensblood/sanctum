import { composeMeaning } from "./compose.js";

export function composeStudioSurface({
  grammar,
  studioGrammar,
  surfaceId,
  frameworkId = null
}) {
  const profile =
    studioGrammar &&
    studioGrammar.surfaces &&
    studioGrammar.surfaces[surfaceId];

  if (!profile) {
    throw new Error(
      "Unknown Velastra Studio surface: " + surfaceId
    );
  }

  const framework =
    frameworkId &&
    studioGrammar.frameworks &&
    studioGrammar.frameworks[frameworkId]
      ? studioGrammar.frameworks[frameworkId]
      : null;

  const meaning = mergeMeaning(
    profile.meaning || {},
    framework || {}
  );

  const intent = composeMeaning({
    grammar,
    meaning,
    family: "studio"
  });

  const surface = {
    version: 1,
    engine: "Velastra",
    adapter: "studio",
    surfaceId,
    frameworkId: frameworkId || null,
    selector: profile.selector || null,
    intent,
    tokens: studioTokens(intent),
    attributes: {
      material: intent.primaryMaterial,
      frame: intent.composition.frameMode,
      typography: intent.expression.typography,
      texture: intent.expression.texture,
      role: intent.role
    },
    law: {
      adapterDoesNotRewriteCopy: true,
      adapterDoesNotReplaceApprovedArt: true,
      accessibilityStructureRemainsSovereign: true
    }
  };

  return freezeDeep(surface);
}

export function composeStudioDocument({
  grammar,
  studioGrammar
}) {
  const surfaces = Object.keys(
    studioGrammar.surfaces || {}
  ).map((surfaceId) =>
    composeStudioSurface({
      grammar,
      studioGrammar,
      surfaceId
    })
  );

  const frameworks = Object.keys(
    studioGrammar.frameworks || {}
  ).map((frameworkId) =>
    composeStudioSurface({
      grammar,
      studioGrammar,
      surfaceId: "framework_library",
      frameworkId
    })
  );

  return freezeDeep({
    version: 1,
    engine: "Velastra",
    adapter: "studio_document",
    surfaces,
    frameworks,
    laws: { ...(studioGrammar.laws || {}) }
  });
}

export function applyStudioSurface({
  element,
  surface
}) {
  if (!element || !surface) return null;

  Object.entries(surface.tokens || {}).forEach(
    ([key, value]) => {
      element.style.setProperty(
        "--velastra-" + kebab(key),
        String(value)
      );
    }
  );

  element.dataset.velastraSurface = surface.surfaceId;
  element.dataset.velastraMaterial =
    surface.attributes.material;
  element.dataset.velastraFrame =
    surface.attributes.frame;
  element.dataset.velastraTypography =
    surface.attributes.typography;
  element.dataset.velastraTexture =
    surface.attributes.texture;
  element.dataset.velastraRole =
    surface.attributes.role;

  if (surface.frameworkId) {
    element.dataset.velastraFramework =
      surface.frameworkId;
  }

  return {
    surfaceId: surface.surfaceId,
    frameworkId: surface.frameworkId,
    tokens: { ...surface.tokens },
    attributes: { ...surface.attributes }
  };
}

export function applyStudioDocument({
  document,
  grammar,
  studioGrammar
}) {
  if (!document) return [];

  const applied = [];

  Object.keys(studioGrammar.surfaces || {}).forEach(
    (surfaceId) => {
      const surface = composeStudioSurface({
        grammar,
        studioGrammar,
        surfaceId
      });
      const selector =
        studioGrammar.surfaces[surfaceId].selector;
      const element = selector
        ? document.querySelector(selector)
        : null;

      if (!element) return;

      applied.push(
        applyStudioSurface({
          element,
          surface
        })
      );
    }
  );

  document
    .querySelectorAll("[data-velastra-framework]")
    .forEach((element) => {
      const frameworkId =
        element.dataset.velastraFramework;

      if (
        !frameworkId ||
        !studioGrammar.frameworks[frameworkId]
      ) {
        return;
      }

      const surface = composeStudioSurface({
        grammar,
        studioGrammar,
        surfaceId: "framework_library",
        frameworkId
      });

      applied.push(
        applyStudioSurface({
          element,
          surface
        })
      );
    });

  return applied;
}

export function evaluateStudioExemplars({
  grammar,
  studioGrammar
}) {
  return Object.entries(
    studioGrammar.exemplars || {}
  ).map(([id, exemplar]) => {
    const surface = composeStudioSurface({
      grammar,
      studioGrammar,
      surfaceId: exemplar.surface,
      frameworkId: exemplar.framework || null
    });

    const expect = exemplar.expect || {};
    const checks = [];

    if (expect.materialsAny) {
      checks.push({
        rule: "materialsAny",
        pass: expect.materialsAny.includes(
          surface.intent.primaryMaterial
        ),
        actual: surface.intent.primaryMaterial,
        expected: [...expect.materialsAny]
      });
    }

    if (expect.frameAny) {
      checks.push({
        rule: "frameAny",
        pass: expect.frameAny.includes(
          surface.intent.composition.frameMode
        ),
        actual: surface.intent.composition.frameMode,
        expected: [...expect.frameAny]
      });
    }

    if (expect.typographyAny) {
      checks.push({
        rule: "typographyAny",
        pass: expect.typographyAny.includes(
          surface.intent.expression.typography
        ),
        actual: surface.intent.expression.typography,
        expected: [...expect.typographyAny]
      });
    }

    if (typeof expect.ornamentMax === "number") {
      checks.push({
        rule: "ornamentMax",
        pass:
          surface.intent.composition.ornament <=
          expect.ornamentMax,
        actual: surface.intent.composition.ornament,
        expected: expect.ornamentMax
      });
    }

    if (
      typeof expect.relationalityMin === "number"
    ) {
      checks.push({
        rule: "relationalityMin",
        pass:
          surface.intent.axes.relationality >=
          expect.relationalityMin,
        actual: surface.intent.axes.relationality,
        expected: expect.relationalityMin
      });
    }

    if (typeof expect.vitalityMin === "number") {
      checks.push({
        rule: "vitalityMin",
        pass:
          surface.intent.axes.vitality >=
          expect.vitalityMin,
        actual: surface.intent.axes.vitality,
        expected: expect.vitalityMin
      });
    }

    return {
      id,
      pass: checks.every((check) => check.pass),
      checks,
      surface
    };
  });
}

function studioTokens(intent) {
  const c = intent.composition || {};
  const e = intent.expression || {};
  const axes = intent.axes || {};

  return {
    sectionSpace:
      round(0.92 + Number(c.breathingRoom || 0.5) * 0.2),
    frameOpacity:
      round(0.18 + Number(c.frameCompleteness || 0.5) * 0.52),
    ornamentOpacity:
      round(0.12 + Number(c.ornament || 0.3) * 0.62),
    shadowBlur:
      (18 + Number(c.depth || 0.5) * 34).toFixed(1) + "px",
    layerOffset:
      (2 + Number(c.layering || 0.4) * 6).toFixed(1) + "px",
    cardLift:
      (1 + Number(c.layering || 0.4) * 4).toFixed(1) + "px",
    artSaturation:
      round(0.9 + Number(axes.vitality || 0.4) * 0.14),
    artContrast:
      round(0.94 + Number(e.contrast || 0.5) * 0.08),
    artGlow:
      round(0.04 + Number(e.glow || 0.4) * 0.16),
    noteAngle:
      (
        (Number(c.asymmetry || 0.5) - 0.5) *
        3.2
      ).toFixed(2) + "deg",
    lineInset:
      (10 + Number(c.enclosure || 0.5) * 14).toFixed(1) + "px",
    rhythm:
      (0.96 + Number(axes.relationality || 0.4) * 0.08).toFixed(3)
  };
}

function mergeMeaning(base, overlay) {
  const overlayMaterials =
    (overlay.hints && overlay.hints.materials) || [];
  const baseMaterials =
    (base.hints && base.hints.materials) || [];
  const mergedMaterials = overlayMaterials.length
    ? [...overlayMaterials]
    : [...baseMaterials];

  return {
    role: overlay.role || base.role || "gathering",
    axes: {
      ...(base.axes || {}),
      ...(overlay.axes || {})
    },
    sensations: {
      ...(base.sensations || {}),
      ...(overlay.sensations || {})
    },
    hints: {
      ...(base.hints || {}),
      ...(overlay.hints || {}),
      materials: [...new Set(mergedMaterials)]
    }
  };
}

function kebab(value) {
  return String(value).replace(
    /[A-Z]/g,
    (match) => "-" + match.toLowerCase()
  );
}

function round(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
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
