export function compileAtelierManifest({
  atelierGrammar,
  assetRegistry,
  scenePacket,
  motifSelection,
  seed = "velastra-atelier"
}) {
  if (!atelierGrammar || !scenePacket || !motifSelection) {
    throw new Error(
      "Atelier compilation requires grammar, scene packet, and motif selection."
    );
  }

  const mediumId =
    atelierGrammar.archetypeProfiles?.[scenePacket.archetype] ||
    "environmental_oil";
  const medium =
    atelierGrammar.media?.[mediumId];

  if (!medium) {
    throw new Error("Unknown Atelier medium profile: " + mediumId);
  }

  const assetKey = buildAssetKey(scenePacket);
  const reviewedAsset = resolveReviewedAsset({
    registry: assetRegistry,
    assetKey,
    policy: atelierGrammar.staticAssetPolicy
  });

  const strategy = reviewedAsset
    ? "reviewed_static_asset"
    : atelierGrammar.staticAssetPolicy?.fallback ||
      "procedural_underpainting";

  const packet = {
    version: 1,
    engine: "Velastra",
    layer: "atelier_manifest",
    assetKey,
    archetype: scenePacket.archetype,
    focalMode: scenePacket.focalMode,
    medium: {
      id: mediumId,
      ...copy(medium)
    },
    render: {
      strategy,
      runtimeGeneration: false,
      reviewedAsset: reviewedAsset
        ? {
            path: reviewedAsset.path,
            status: reviewedAsset.status,
            provenance: copy(reviewedAsset.provenance || {})
          }
        : null,
      fallback: "procedural_underpainting"
    },
    authoring: {
      painterProtocol:
        atelierGrammar.painterBridge?.protocol || null,
      painterImplementation:
        atelierGrammar.painterBridge?.implementation || null,
      generation: "authoring_only",
      candidateStatus:
        atelierGrammar.painterBridge?.candidateStatus || "candidate",
      approvedStatus:
        atelierGrammar.painterBridge?.approvedStatus || "approved",
      approvalRequired: true,
      registryMutationDuringGeneration: false,
      modelIsSemanticAuthority: false
    },
    layers: (atelierGrammar.layerOrder || []).map(
      (id, index, all) => ({
        id,
        order: index,
        weight: round(layerWeight(id, scenePacket, medium)),
        semantic: layerMeaning(id),
        terminal: index === all.length - 1
      })
    ),
    scene: {
      composition: copy(scenePacket.composition),
      lighting: copy(scenePacket.lighting),
      edge: copy(scenePacket.edge),
      patina: copy(scenePacket.patina),
      subjects: copy(scenePacket.subjects),
      relation: copy(scenePacket.relation),
      environment: copy(scenePacket.environment)
    },
    motifs: copy(motifSelection.motifs || []),
    artBrief: buildArtBrief(scenePacket, motifSelection, mediumId),
    accessibility: {
      imageOptional: true,
      semanticFallback: buildSemanticFallback(scenePacket),
      decorationCannotCarryRequiredMeaning: true
    },
    provenance: {
      source: "velastra_atelier_compiler",
      sceneSource: scenePacket.provenance?.source || null,
      motifLayer: motifSelection.layer,
      deterministic: true,
      runtimeModelRequired: false,
      seed
    }
  };

  return freezeDeep(packet);
}

export function evaluateAtelierExemplars({
  atelierGrammar,
  assetRegistry,
  scenePackets,
  motifSelections
}) {
  return Object.entries(atelierGrammar.exemplars || {}).map(
    ([id, exemplar]) => {
      const scenePacket = scenePackets[exemplar.sceneExemplar];
      const motifSelection = motifSelections[exemplar.sceneExemplar];

      if (!scenePacket || !motifSelection) {
        return {
          id,
          pass: false,
          checks: [{
            rule: "inputs",
            pass: false,
            actual: null,
            expected: exemplar.sceneExemplar
          }],
          manifest: null
        };
      }

      const manifest = compileAtelierManifest({
        atelierGrammar,
        assetRegistry,
        scenePacket,
        motifSelection,
        seed: "atelier-exemplar:" + id
      });

      const checks = [
        {
          rule: "medium",
          pass: manifest.medium.id === exemplar.medium,
          actual: manifest.medium.id,
          expected: exemplar.medium
        },
        {
          rule: "strategy",
          pass: manifest.render.strategy === exemplar.strategy,
          actual: manifest.render.strategy,
          expected: exemplar.strategy
        }
      ];

      return {
        id,
        pass: checks.every((check) => check.pass),
        checks,
        manifest
      };
    }
  );
}

function resolveReviewedAsset({
  registry,
  assetKey,
  policy
}) {
  const entry =
    registry &&
    registry.entries &&
    registry.entries[assetKey];

  if (!entry) return null;

  const allowed =
    policy?.allowedStatuses || ["approved"];

  if (
    !allowed.includes(entry.status) ||
    !entry.path
  ) {
    return null;
  }

  return entry;
}

function buildAssetKey(scenePacket) {
  const semanticIdentity = {
    archetype: scenePacket.archetype,
    source:
      scenePacket.provenance?.room ||
      scenePacket.provenance?.exemplar ||
      scenePacket.environment?.kind ||
      scenePacket.provenance?.source ||
      "scene",
    subjects: (scenePacket.subjects || []).map(
      (subject) => ({
        id: subject.id,
        claim: subject.visualClaim?.id || null
      })
    ),
    relation: scenePacket.relation?.kind || null,
    facts: scenePacket.environment?.facts || []
  };

  return (
    "velastra." +
    scenePacket.archetype +
    "." +
    hash(stableStringify(semanticIdentity)).toString(36)
  );
}

function buildArtBrief(
  scenePacket,
  motifSelection,
  mediumId
) {
  return {
    thesis:
      "Render " +
      scenePacket.focalMode.replaceAll("_", " ") +
      " as the image's primary argument.",
    medium: mediumId,
    camera: scenePacket.composition?.camera || null,
    hierarchy:
      copy(scenePacket.artDirection?.focalHierarchy || []),
    lighting: {
      key: scenePacket.lighting?.key || null,
      fill: scenePacket.lighting?.fill || null,
      meaning: scenePacket.lighting?.meaning || null,
      bloom: scenePacket.lighting?.bloom || 0,
      shadowDepth: scenePacket.lighting?.shadowDepth || 0
    },
    edge: {
      focalSharpness:
        scenePacket.edge?.focalSharpness || 0,
      peripheralSoftness:
        scenePacket.edge?.peripheralSoftness || 0,
      brushVariance:
        scenePacket.edge?.brushVariance || 0,
      meaning: scenePacket.edge?.meaning || null
    },
    surface: {
      grain: scenePacket.patina?.grain || 0,
      wear: scenePacket.patina?.wear || 0,
      layering: scenePacket.patina?.layering || 0,
      imperfection:
        scenePacket.patina?.imperfection || 0,
      meaning: scenePacket.patina?.meaning || null
    },
    motifs: (motifSelection.motifs || []).map(
      (motif) => ({
        id: motif.id,
        mode: motif.mode,
        meaning: motif.meaning,
        provenance: copy(motif.provenance)
      })
    ),
    directives:
      copy(scenePacket.artDirection?.directives || [])
  };
}

function buildSemanticFallback(scenePacket) {
  const parts = [];

  if (scenePacket.environment?.kind) {
    parts.push(
      "Scene kind: " + scenePacket.environment.kind + "."
    );
  }

  if ((scenePacket.subjects || []).length) {
    parts.push(
      "Explicit subjects: " +
        scenePacket.subjects
          .map((subject) => subject.id)
          .join(", ") +
        "."
    );
  }

  if (scenePacket.relation?.kind) {
    parts.push(
      "Explicit relation: " +
        scenePacket.relation.kind.replaceAll("_", " ") +
        "."
    );
  }

  parts.push(
    "Focal argument: " +
      scenePacket.focalMode.replaceAll("_", " ") +
      "."
  );

  return parts.join(" ");
}

function layerWeight(id, scenePacket, medium) {
  const table = {
    field: 0.9,
    pigment:
      0.5 + Number(medium.pigmentLayers || 8) / 24,
    light:
      0.4 + Number(scenePacket.lighting?.bloom || 0) * 0.5,
    atmosphere:
      0.4 +
      Number(scenePacket.visualIntent?.sensations?.diffusion || 0.4) *
        0.4,
    motif: 0.35 + Number(medium.motifOpacity || 0.3),
    structure:
      0.35 +
      Number(scenePacket.visualIntent?.composition?.frameCompleteness || 0.5) *
        0.4,
    patina:
      0.3 + Number(scenePacket.patina?.layering || 0.5) * 0.5,
    grain: Number(medium.grain || 0.5),
    vignette: Number(medium.vignette || 0.5)
  };

  return clamp(table[id] ?? 0.5);
}

function layerMeaning(id) {
  const meanings = {
    field: "establish the emotional ground before detail",
    pigment: "accumulate color as material rather than flat fill",
    light: "place illumination according to semantic meaning",
    atmosphere: "create depth through diffusion and environmental movement",
    motif: "allow selected symbols to enter with preserved provenance",
    structure: "retain enough architecture for orientation",
    patina: "let use, time, and imperfection remain visible",
    grain: "prevent sterile digital smoothness",
    vignette: "hold attention without sealing the scene"
  };

  return meanings[id] || "support the scene";
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }

  if (value && typeof value === "object") {
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(
          (key) =>
            JSON.stringify(key) +
            ":" +
            stableStringify(value[key])
        )
        .join(",") +
      "}"
    );
  }

  return JSON.stringify(value);
}

function hash(value) {
  const text = String(value);
  let out = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    out ^= text.charCodeAt(i);
    out = Math.imul(out, 16777619);
  }

  return out >>> 0;
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function clamp(value, min = 0, max = 1) {
  const number = Number.isFinite(value) ? value : 0;
  return Math.min(max, Math.max(min, number));
}

function copy(value) {
  if (value === undefined || value === null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function freezeDeep(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Object.isFrozen(value)
  ) {
    return value;
  }

  Object.values(value).forEach((child) => freezeDeep(child));
  return Object.freeze(value);
}
