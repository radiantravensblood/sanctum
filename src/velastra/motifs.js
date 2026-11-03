export function selectMotifs({
  atlas,
  scenePacket,
  limit = 7,
  seed = "velastra-motifs"
}) {
  if (!atlas || !scenePacket) {
    throw new Error("Velastra motif selection requires an atlas and scene packet.");
  }

  const facts = collectFacts(scenePacket);
  const role = scenePacket.visualIntent?.role || "place";
  const axes = scenePacket.visualIntent?.axes || {};
  const materials = new Set(
    (scenePacket.visualIntent?.materials || []).map((entry) => entry.id)
  );
  const lighting = scenePacket.lighting?.id || null;
  const relation = scenePacket.relation || null;
  const hasClaimedSubject = (scenePacket.subjects || []).some(
    (subject) => subject.visualClaim?.representationStatus === "claimed"
  );

  const random = seededRandom(
    [
      seed,
      scenePacket.archetype,
      role,
      scenePacket.composition?.id || "",
      lighting || ""
    ].join(":")
  );

  const candidates = Object.entries(atlas.motifs || {})
    .map(([id, motif]) => {
      if (motif.requiresExplicitRelation && !relation) {
        return null;
      }

      if (motif.requiresClaimedSubject && !hasClaimedSubject) {
        return null;
      }

      const literalMatches = matchLiteralTriggers(
        motif.literalTriggers || [],
        facts
      );

      if (motif.literalOnly && !literalMatches.length) {
        return null;
      }

      let score = semanticScore(motif.vector || {}, axes);

      if ((motif.roles || []).includes(role)) {
        score += 0.16;
      }

      if ((motif.materials || []).some((material) => materials.has(material))) {
        score += 0.1;
      }

      if ((motif.lighting || []).includes(lighting)) {
        score += 0.14;
      }

      if (literalMatches.length) {
        score += 0.34;
      }

      if (
        relation &&
        motif.family === "relation"
      ) {
        score += 0.22;
      }

      if (
        scenePacket.archetype === "atelier_tableau" &&
        motif.family === "atelier"
      ) {
        score += 0.14;
      }

      if (
        scenePacket.archetype === "self_portrait" &&
        motif.family === "selfhood"
      ) {
        score += 0.18;
      }

      if (
        scenePacket.archetype === "threshold_revelation" &&
        motif.family === "threshold"
      ) {
        score += 0.18;
      }

      score += random() * 0.012;

      const mode = chooseMode(motif, literalMatches);

      return {
        id,
        family: motif.family,
        meaning: motif.meaning,
        mode,
        score: round(clamp(score)),
        provenance: {
          semantic: true,
          literalFacts: literalMatches,
          explicitRelation: Boolean(
            relation && motif.family === "relation"
          ),
          claimedSubject: Boolean(
            hasClaimedSubject && motif.family === "selfhood"
          ),
          role,
          lighting,
          source: literalMatches.length
            ? "scene_fact_plus_semantic_fit"
            : "semantic_fit"
        }
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const selected = [];
  const familyCounts = {};

  for (const candidate of candidates) {
    if (selected.length >= limit) break;

    const count = Number(familyCounts[candidate.family] || 0);

    if (count >= 3 && candidate.mode !== "literal") {
      continue;
    }

    if (candidate.score < 0.52 && candidate.mode !== "literal") {
      continue;
    }

    selected.push(candidate);
    familyCounts[candidate.family] = count + 1;
  }

  return freezeDeep({
    version: 1,
    engine: "Velastra",
    layer: "motif_atlas",
    sceneArchetype: scenePacket.archetype,
    focalMode: scenePacket.focalMode,
    motifs: selected,
    clusters: activeClusters(atlas, selected),
    law: {
      motifCannotCreateCanon: true,
      literalMotifRequiresSceneFact: true,
      relationMotifRequiresExplicitRelation: true
    }
  });
}

export function evaluateMotifExemplars({
  atlas,
  scenePackets
}) {
  return Object.entries(atlas.exemplars || {}).map(
    ([id, exemplar]) => {
      const scenePacket = scenePackets[exemplar.sceneExemplar];

      if (!scenePacket) {
        return {
          id,
          pass: false,
          checks: [{
            rule: "sceneExemplar",
            pass: false,
            actual: null,
            expected: exemplar.sceneExemplar
          }],
          selection: null
        };
      }

      const selection = selectMotifs({
        atlas,
        scenePacket,
        limit: 8,
        seed: "motif-exemplar:" + id
      });

      const ids = selection.motifs.map((motif) => motif.id);
      const checks = [];

      if (exemplar.expectAll) {
        checks.push({
          rule: "expectAll",
          pass: exemplar.expectAll.every((motif) => ids.includes(motif)),
          actual: ids,
          expected: [...exemplar.expectAll]
        });
      }

      if (exemplar.expectAny) {
        checks.push({
          rule: "expectAny",
          pass: exemplar.expectAny.some((motif) => ids.includes(motif)),
          actual: ids,
          expected: [...exemplar.expectAny]
        });
      }

      if (exemplar.forbid) {
        checks.push({
          rule: "forbid",
          pass: exemplar.forbid.every((motif) => !ids.includes(motif)),
          actual: ids,
          expected: [...exemplar.forbid]
        });
      }

      if (exemplar.literalExpectedAny) {
        const literals = selection.motifs
          .filter((motif) => motif.mode === "literal")
          .map((motif) => motif.id);

        checks.push({
          rule: "literalExpectedAny",
          pass: exemplar.literalExpectedAny.some((motif) =>
            literals.includes(motif)
          ),
          actual: literals,
          expected: [...exemplar.literalExpectedAny]
        });
      }

      return {
        id,
        pass: checks.every((check) => check.pass),
        checks,
        selection
      };
    }
  );
}

function collectFacts(scenePacket) {
  const values = [];

  (scenePacket.environment?.facts || []).forEach((fact) =>
    values.push(String(fact).toLowerCase())
  );

  (scenePacket.subjects || []).forEach((subject) => {
    if (subject.description) {
      values.push(String(subject.description).toLowerCase());
    }

    const visual = subject.visualClaim?.visual || {};
    Object.values(visual).forEach((value) => {
      if (typeof value === "string") {
        values.push(value.toLowerCase());
      }
    });
  });

  if (scenePacket.lighting?.id) {
    values.push(scenePacket.lighting.id.replaceAll("_", " "));
  }

  return values;
}

function matchLiteralTriggers(triggers, facts) {
  return triggers.filter((trigger) => {
    const needle = String(trigger).toLowerCase();

    return facts.some(
      (fact) =>
        fact === needle ||
        fact.includes(needle) ||
        needle.includes(fact)
    );
  });
}

function semanticScore(vector, axes) {
  const entries = Object.entries(vector);

  if (!entries.length) return 0.5;

  const distance =
    entries.reduce(
      (sum, [axis, target]) =>
        sum +
        Math.abs(
          Number(axes[axis] || 0) -
          Number(target)
        ),
      0
    ) / entries.length;

  return 1 - distance;
}

function chooseMode(motif, literalMatches) {
  if (
    literalMatches.length &&
    (motif.modes || []).includes("literal")
  ) {
    return "literal";
  }

  if ((motif.modes || []).includes("symbolic")) {
    return "symbolic";
  }

  return (motif.modes || [])[0] || "atmospheric";
}

function activeClusters(atlas, selected) {
  const ids = new Set(selected.map((motif) => motif.id));

  return Object.entries(atlas.clusters || {})
    .map(([id, motifs]) => {
      const present = motifs.filter((motif) => ids.has(motif));

      return {
        id,
        strength: round(
          motifs.length
            ? present.length / motifs.length
            : 0
        ),
        motifs: present
      };
    })
    .filter((cluster) => cluster.motifs.length)
    .sort((a, b) => b.strength - a.strength);
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

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function clamp(value, min = 0, max = 1) {
  const number = Number.isFinite(value) ? value : 0;
  return Math.min(max, Math.max(min, number));
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
