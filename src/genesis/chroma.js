export function composeVisualProfile({
  visualGrammar,
  motif,
  material,
  atmosphere,
  phenomenon,
  form,
  seed,
  scene
}) {
  const house = visualGrammar.house || {};
  const layers = [
    visualGrammar.motifs && visualGrammar.motifs[motif.id],
    visualGrammar.materials && visualGrammar.materials[material.id],
    visualGrammar.atmospheres && visualGrammar.atmospheres[atmosphere.id],
    visualGrammar.phenomena && visualGrammar.phenomena[phenomenon.id]
  ].filter(Boolean);

  let palette = { ...(house.palette || {}) };
  let sensation = { ...(house.sensation || {}) };
  const effects = new Set(house.effects || []);

  layers.forEach((layer) => {
    const blend = clamp(
      typeof layer.blend === "number" ? layer.blend : 0.18,
      0,
      1
    );

    palette = blendPalette(palette, layer.palette || {}, blend);
    sensation = blendSensation(sensation, layer.sensation || {}, blend);
    (layer.effects || []).forEach((effect) => effects.add(effect));
  });

  if (scene) {
    sensation = applySceneSensation(sensation, scene);
    palette = applyPhenomenology(palette, scene);
  }

  return {
    version: visualGrammar.version || 1,
    seed,
    form: form.id,
    motif: motif.id,
    material: material.id,
    atmosphere: atmosphere.id,
    phenomenon: phenomenon.id,
    palette,
    sensation,
    effects: Array.from(effects)
  };
}

export function resolveRoomVisual(room, world, sceneOverride = null) {
  if (room.visual && !sceneOverride) return room.visual;

  if (room.visualProfile && world.visualGrammar.authored[room.visualProfile]) {
    const authored = world.visualGrammar.authored[room.visualProfile];
    return {
      version: world.visualGrammar.version || 1,
      seed: room.id,
      form: room.visualForm || "chamber",
      palette: {
        ...world.visualGrammar.house.palette,
        ...(authored.palette || {})
      },
      sensation: {
        ...world.visualGrammar.house.sensation,
        ...(authored.sensation || {})
      },
      effects: Array.from(
        new Set([
          ...(world.visualGrammar.house.effects || []),
          ...(authored.effects || [])
        ])
      )
    };
  }

  if (room.genesis) {
    const realm = world.realms[room.genesis.realm];
    if (realm) {
      const motif = (realm.motifs || []).find((item) => item.id === room.genesis.motif);
      const material = (realm.materials || []).find((item) => item.id === room.genesis.material);
      const atmosphere = (realm.atmospheres || []).find((item) => item.id === room.genesis.atmosphere);
      const phenomenon = (realm.phenomena || []).find((item) => item.id === room.genesis.phenomenon);
      const form = (realm.forms || []).find((item) => item.id === room.genesis.form);

      if (motif && material && atmosphere && phenomenon && form) {
        return composeVisualProfile({
          visualGrammar: world.visualGrammar,
          motif,
          material,
          atmosphere,
          phenomenon,
          form,
          seed: room.genesis.seed,
          scene: sceneOverride || room.scene || null
        });
      }
    }
  }

  return {
    version: world.visualGrammar.version || 1,
    seed: room.id,
    form: "chamber",
    palette: { ...(world.visualGrammar.house.palette || {}) },
    sensation: { ...(world.visualGrammar.house.sensation || {}) },
    effects: [...(world.visualGrammar.house.effects || [])]
  };
}

function applySceneSensation(base, scene) {
  const next = { ...base };

  const mappings = {
    wetness: scene.air && scene.air.humidity,
    warmth: scene.air && scene.air.temperature,
    diffusion: scene.light && 1 - Number(scene.light.directionality || 0),
    stillness: scene.air && 1 - Number(scene.air.movement || 0),
    density: scene.geometry && scene.geometry.enclosure,
    age: scene.matter && scene.matter.porosity,
    tenderness:
      scene.matter &&
      1 - Math.abs(Number(scene.matter.roughness || 0.5) - 0.45)
  };

  Object.entries(mappings).forEach(([key, value]) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      next[key] = clamp((Number(next[key] || 0.5) + value) / 2, 0, 1);
    }
  });

  return next;
}

function applyPhenomenology(palette, scene) {
  let next = { ...palette };

  if (scene.air && scene.air.humidity > 0.7) {
    next = {
      ...next,
      field: mixHex(next.field, "#1a3136", 0.16),
      surface: mixHex(next.surface, "#2a4243", 0.12),
      glow: mixHex(next.glow, "#a6bec2", 0.12)
    };
  }

  if (scene.light && scene.light.temperature > 0.66) {
    next.accent = mixHex(next.accent, "#d5a15f", 0.16);
    next.glow = mixHex(next.glow, "#ead39a", 0.18);
  }

  if (scene.light && scene.light.temperature < 0.34) {
    next.glow = mixHex(next.glow, "#93b1bb", 0.2);
    next.field = mixHex(next.field, "#172a31", 0.12);
  }

  if (scene.acoustics && scene.acoustics.reverb > 0.75) {
    next.muted = mixHex(next.muted, "#9faab0", 0.12);
  }

  const scents = new Set(
    ((scene.senses && scene.senses.scent) || []).map((value) =>
      String(value).toLowerCase()
    )
  );

  if (
    scents.has("petrichor") ||
    scents.has("wet stone") ||
    scents.has("fresh rain on earth")
  ) {
    next.organic = mixHex(next.organic, "#596c58", 0.22);
    next.accent = mixHex(next.accent, "#806b55", 0.16);
    next.field = mixHex(next.field, "#1b2c2b", 0.08);
  }

  if (scents.has("green stems") || scents.has("wet leaves")) {
    next.organic = mixHex(next.organic, "#74845d", 0.2);
  }

  if (scents.has("sun-warmed dust")) {
    next.glow = mixHex(next.glow, "#e4c584", 0.14);
  }

  return next;
}

function blendPalette(base, overlay, amount) {
  const result = { ...base };

  Object.entries(overlay).forEach(([key, value]) => {
    result[key] = mixHex(result[key] || value, value, amount);
  });

  return result;
}

function blendSensation(base, overlay, amount) {
  const result = { ...base };

  Object.entries(overlay).forEach(([key, value]) => {
    const current = typeof result[key] === "number" ? result[key] : value;
    result[key] = clamp(current + (value - current) * amount, 0, 1);
  });

  return result;
}

function mixHex(a, b, amount) {
  const first = parseHex(a);
  const second = parseHex(b);

  if (!first || !second) return b || a;

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
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;

  return {
    r: parseInt(match[1].slice(0, 2), 16),
    g: parseInt(match[1].slice(2, 4), 16),
    b: parseInt(match[1].slice(4, 6), 16)
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
