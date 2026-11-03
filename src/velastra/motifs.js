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

      let score =
        semanticScore(motif.vector || {}, axes) * 0.72;

      if ((motif.roles || []).includes(role)) {
        score += 0.08;
      }

      if ((motif.materials || []).some((material) => materials.has(material))) {
        score += 0.06;
      }

      if ((motif.lighting || []).includes(lighting)) {
        score += 0.1;
      }

      if (literalMatches.length) {
        score += 0.42;
      }

      if (
        relation &&
        motif.family === "relation"
      ) {
        score += 0.18;
      }

      score += archetypeFamilyBias(
        scenePacket.archetype,
        motif.family
      );

      score += random() * 0.006;

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

    if (candidate.score < 0.6 && candidate.mode !== "literal") {
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
    const needle = tokenize(trigger);

    return facts.some((fact) =>
      containsTokenSequence(tokenize(fact), needle)
    );
  });
}

function tokenize(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function containsTokenSequence(haystack, needle) {
  if (!needle.length || needle.length > haystack.length) {
    return false;
  }

  outer:
  for (let start = 0; start <= haystack.length - needle.length; start += 1) {
    for (let i = 0; i < needle.length; i += 1) {
      if (haystack[start + i] !== needle[i]) {
        continue outer;
      }
    }

    return true;
  }

  return false;
}

function archetypeFamilyBias(archetype, family) {
  const table = {
    self_portrait: {
      selfhood: 0.28,
      hearth: 0.04,
      memory: 0.02,
      relation: -0.08,
      atelier: -0.14,
      commons: -0.12,
      threshold: -0.08,
      ledger: -0.1,
      rain_archive: -0.1,
      gallery: -0.08
    },
    dyadic_homecoming: {
      relation: 0.3,
      selfhood: 0.04,
      commons: 0.02,
      atelier: -0.08,
      threshold: -0.08,
      ledger: -0.08,
      rain_archive: -0.08
    },
    atelier_tableau: {
      atelier: 0.28,
      commons: 0.08,
      selfhood: -0.12,
      relation: -0.06,
      threshold: -0.12,
      rain_archive: -0.12
    },
    place_tableau: {
      hearth: 0.08,
      memory: 0.08,
      rain_archive: 0.08,
      gallery: 0.06,
      commons: 0.04
    },
    threshold_revelation: {
      threshold: 0.28,
      memory: 0.08,
      gallery: 0.04,
      commons: -0.08,
      atelier: -0.08
    },
    artifact_still_life: {
      memory: 0.16,
      ledger: 0.14,
      atelier: 0.04,
      selfhood: -0.08
    }
  };

  return Number(
    (table[archetype] && table[archetype][family]) || 0
  );
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
