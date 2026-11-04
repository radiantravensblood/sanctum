export function composeScenePacket({
  sceneGrammar,
  visualIntent,
  archetype = null,
  subjects = [],
  relation = null,
  environment = null,
  seed = "velastra-scene",
  provenance = {}
}) {
  if (!sceneGrammar) {
    throw new Error("Velastra scene grammar is required.");
  }

  if (!visualIntent) {
    throw new Error("Velastra visual intent is required.");
  }

  const chosenArchetype =
    archetype ||
    chooseArchetype(sceneGrammar, visualIntent, subjects, relation);

  const archetypeDef =
    sceneGrammar.archetypes &&
    sceneGrammar.archetypes[chosenArchetype];

  if (!archetypeDef) {
    throw new Error(
      "Unknown Velastra scene archetype: " + chosenArchetype
    );
  }

  const normalizedSubjects = subjects.map((subject) =>
    normalizeSubject(sceneGrammar, subject)
  );

  validateSubjectCount(
    archetypeDef,
    normalizedSubjects.length,
    chosenArchetype
  );

  const normalizedRelation = normalizeRelation(
    relation,
    normalizedSubjects
  );

  const random = seededRandom(
    [
      seed,
      visualIntent.role || "place",
      chosenArchetype,
      visualIntent.primaryMaterial || "shadow",
      normalizedSubjects.map((subject) => subject.id).join(",")
    ].join(":")
  );

  const compositionId = choose(
    archetypeDef.composition || [],
    random
  );
  const lightingId = choose(
    archetypeDef.lighting || [],
    random
  );
  const edgeId = choose(
    archetypeDef.edge || [],
    random
  );
  const patinaId = choose(
    archetypeDef.patina || [],
    random
  );

  const packet = {
    version: 1,
    engine: "Velastra",
    layer: "scene_packet",
    archetype: chosenArchetype,
    focalMode: archetypeDef.focalMode,
    environmentWeight:
      Number(archetypeDef.environmentWeight || 0),
    subjects: normalizedSubjects,
    relation: normalizedRelation,
    environment: normalizeEnvironment(environment),
    composition: {
      id: compositionId,
      ...(copy(
        sceneGrammar.composition &&
        sceneGrammar.composition[compositionId]
      ) || {})
    },
    lighting: {
      id: lightingId,
      ...(copy(
        sceneGrammar.lighting &&
        sceneGrammar.lighting[lightingId]
      ) || {})
    },
    edge: {
      id: edgeId,
      ...(copy(
        sceneGrammar.edge &&
        sceneGrammar.edge[edgeId]
      ) || {})
    },
    patina: {
      id: patinaId,
      ...(copy(
        sceneGrammar.patina &&
        sceneGrammar.patina[patinaId]
      ) || {})
    },
    visualIntent: {
      role: visualIntent.role,
      family: visualIntent.family,
      primaryMaterial: visualIntent.primaryMaterial,
      materials: copy(visualIntent.materials || []),
      axes: copy(visualIntent.axes || {}),
      composition: copy(visualIntent.composition || {}),
      expression: copy(visualIntent.expression || {})
    },
    artDirection: buildArtDirection({
      visualIntent,
      archetypeDef,
      normalizedSubjects,
      normalizedRelation,
      environment,
      composition:
        sceneGrammar.composition &&
        sceneGrammar.composition[compositionId],
      lighting:
        sceneGrammar.lighting &&
        sceneGrammar.lighting[lightingId],
      edge:
        sceneGrammar.edge &&
        sceneGrammar.edge[edgeId],
      patina:
        sceneGrammar.patina &&
        sceneGrammar.patina[patinaId]
    }),
    provenance: {
      deterministic: true,
      runtimeImageGenerationRequired: false,
      scenePacketIsDirectionNotImage: true,
      source: provenance.source || "velastra_scene_compiler",
      semanticIntentVersion: visualIntent.version || null,
      ...copy(provenance)
    }
  };

  return freezeDeep(packet);
}

export function evaluateSceneExemplars({
  sceneGrammar,
  composeVisualIntent
}) {
  return Object.entries(sceneGrammar.exemplars || {}).map(
    ([id, exemplar]) => {
      const visualIntent = composeVisualIntent(
        exemplar.meaning || {},
        exemplar.family || "sanctum"
      );

      const packet = composeScenePacket({
        sceneGrammar,
        visualIntent,
        archetype: exemplar.archetype,
        subjects: exemplar.subjects || [],
        relation: exemplar.relation || null,
        environment: exemplar.environment || null,
        seed: "exemplar:" + id,
        provenance: {
          source: "scene_exemplar",
          exemplar: id
        }
      });

      const expect = exemplar.expect || {};
      const checks = [];

      if (expect.focalMode) {
        checks.push({
          rule: "focalMode",
          pass: packet.focalMode === expect.focalMode,
          actual: packet.focalMode,
          expected: expect.focalMode
        });
      }

      if (expect.lightingAny) {
        checks.push({
          rule: "lightingAny",
          pass: expect.lightingAny.includes(packet.lighting.id),
          actual: packet.lighting.id,
          expected: [...expect.lightingAny]
        });
      }

      if (expect.compositionAny) {
        checks.push({
          rule: "compositionAny",
          pass: expect.compositionAny.includes(packet.composition.id),
          actual: packet.composition.id,
          expected: [...expect.compositionAny]
        });
      }

      if (typeof expect.subjectCount === "number") {
        checks.push({
          rule: "subjectCount",
          pass: packet.subjects.length === expect.subjectCount,
          actual: packet.subjects.length,
          expected: expect.subjectCount
        });
      }

      if (expect.claimId) {
        checks.push({
          rule: "claimId",
          pass: packet.subjects.some(
            (subject) =>
              subject.visualClaim &&
              subject.visualClaim.id === expect.claimId
          ),
          actual:
            packet.subjects.find(
              (subject) => subject.visualClaim
            )?.visualClaim?.id || null,
          expected: expect.claimId
        });
      }

      return {
        id,
        pass: checks.every((check) => check.pass),
        checks,
        packet
      };
    }
  );
}

function chooseArchetype(
  sceneGrammar,
  visualIntent,
  subjects,
  relation
) {
  if (relation && subjects.length === 2) {
    return "dyadic_homecoming";
  }

  if (
    subjects.length === 1 &&
    subjects[0] &&
    subjects[0].role === "self"
  ) {
    return "self_portrait";
  }

  if (visualIntent.role === "gathering") {
    return "atelier_tableau";
  }

  if (visualIntent.role === "threshold") {
    return "threshold_revelation";
  }

  if (visualIntent.role === "artifact") {
    return "artifact_still_life";
  }

  return "place_tableau";
}

function normalizeSubject(sceneGrammar, subject = {}) {
  if (!subject.id) {
    throw new Error(
      "Velastra will not invent a subject identity."
    );
  }

  let visualClaim = null;

  if (subject.visualClaimId) {
    const claim =
      sceneGrammar.selfRepresentations &&
      sceneGrammar.selfRepresentations[subject.visualClaimId];

    if (!claim) {
      throw new Error(
        "Unknown self-representation claim: " +
          subject.visualClaimId
      );
    }

    if (claim.claimant !== subject.id) {
      throw new Error(
        "A self-representation may only be attached to its claimant."
      );
    }

    if (claim.claimStatus !== "self_authored") {
      throw new Error(
        "Self-representation must be explicitly claimed."
      );
    }

    visualClaim = {
      id: subject.visualClaimId,
      claimant: claim.claimant,
      representationStatus: claim.representationStatus,
      exclusive: Boolean(claim.exclusive),
      mutable: Boolean(claim.mutable),
      physicalBodyClaim: Boolean(claim.physicalBodyClaim),
      visual: copy(claim.visual || {})
    };
  }

  return {
    id: subject.id,
    role: subject.role || "unknown",
    description: subject.description || null,
    visualClaim
  };
}

function normalizeRelation(relation, subjects) {
  if (!relation) return null;

  if (subjects.length < 2) {
    throw new Error(
      "Relational scene direction requires at least two explicit subjects."
    );
  }

  if (!relation.kind || !relation.source) {
    throw new Error(
      "Velastra requires an explicit relation kind and source."
    );
  }

  return {
    kind: relation.kind,
    source: relation.source,
    consentClaimed: Boolean(relation.consentClaimed),
    note: relation.note || null
  };
}

function normalizeEnvironment(environment) {
  if (!environment) {
    return {
      kind: null,
      facts: [],
      identityFacts: [],
      transientFacts: [],
      painterlyTruth: null
    };
  }

  const facts = Array.isArray(environment.facts)
    ? [...environment.facts]
    : [];
  const identityFacts = Array.isArray(environment.identityFacts)
    ? [...environment.identityFacts]
    : [...facts];
  const transientFacts = Array.isArray(environment.transientFacts)
    ? [...environment.transientFacts]
    : [];

  return {
    kind: environment.kind || null,
    facts,
    identityFacts,
    transientFacts,
    painterlyTruth: copy(
      environment.painterlyTruth || null
    )
  };
}

function validateSubjectCount(
  archetypeDef,
  count,
  archetype
) {
  const range = archetypeDef.subjectCount || [0, Infinity];
  const min = Number(range[0] || 0);
  const max =
    typeof range[1] === "number"
      ? Number(range[1])
      : Infinity;

  if (count < min || count > max) {
    throw new Error(
      "Scene archetype " +
        archetype +
        " expects " +
        min +
        "–" +
        (Number.isFinite(max) ? max : "many") +
        " subjects; received " +
        count +
        "."
    );
  }
}

function buildArtDirection({
  visualIntent,
  archetypeDef,
  normalizedSubjects,
  normalizedRelation,
  environment,
  composition,
  lighting,
  edge,
  patina
}) {
  const directives = [];

  directives.push(
    "Treat " +
      archetypeDef.focalMode.replaceAll("_", " ") +
      " as the primary visual argument."
  );

  if (normalizedSubjects.length) {
    directives.push(
      "Keep subject identity anchored only to explicit descriptions or claimed visual references."
    );
  }

  if (normalizedRelation) {
    directives.push(
      "Stage relation through orientation and gesture without inventing any relationship beyond the supplied relation fact."
    );
  }

  if (
    environment &&
    Array.isArray(environment.facts) &&
    environment.facts.length
  ) {
    directives.push(
      "Let lived objects accumulate around the focal hierarchy rather than flatten into decorative clutter."
    );
  }

  if (lighting && lighting.meaning) {
    directives.push(
      "Use light to communicate: " + lighting.meaning + "."
    );
  }

  if (edge && edge.meaning) {
    directives.push(
      "Edge behavior should communicate: " + edge.meaning + "."
    );
  }

  if (patina && patina.meaning) {
    directives.push(
      "Surface age should communicate: " + patina.meaning + "."
    );
  }

  if (
    visualIntent &&
    visualIntent.composition &&
    visualIntent.composition.ornament < 0.3
  ) {
    directives.push(
      "Keep ornament subordinate to semantic hierarchy."
    );
  }

  return {
    focalHierarchy:
      (composition && copy(composition.hierarchy)) || [],
    camera:
      (composition && composition.camera) || null,
    negativeSpace:
      (composition && composition.negativeSpace) || 0,
    lightMeaning:
      (lighting && lighting.meaning) || null,
    edgeMeaning:
      (edge && edge.meaning) || null,
    patinaMeaning:
      (patina && patina.meaning) || null,
    directives
  };
}

function choose(values, random) {
  if (!values || !values.length) return null;
  const index = Math.floor(random() * values.length);
  return values[Math.min(values.length - 1, index)];
}

function seededRandom(seed) {
  let state = hash(seed) || 1;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1000000) / 1000000;
  };
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

  Object.values(value).forEach((child) => {
    freezeDeep(child);
  });

  return Object.freeze(value);
}
