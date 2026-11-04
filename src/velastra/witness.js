export function compileVisualWitness({
  witnessGrammar,
  style,
  scenePacket,
  evidence = null
}) {
  if (!witnessGrammar || !style || !scenePacket) {
    throw new Error(
      "Visual Witness requires witness grammar, Virynism style, and scene packet."
    );
  }

  const roleMap = witnessGrammar.roleMapping || {};
  const emphasis = style.emphasis || [];
  const desiredRoles = unique(
    emphasis.flatMap((id) => roleMap[id] || [])
  );

  if (
    scenePacket.archetype === "self_portrait" &&
    !desiredRoles.includes("intimate_presence")
  ) {
    desiredRoles.push("intimate_presence");
  }

  if (
    evidence?.room === "gallery" &&
    !desiredRoles.includes("sacred_incompletion")
  ) {
    desiredRoles.unshift("sacred_incompletion");
  }

  const entries = Object.entries(
    witnessGrammar.entries || {}
  ).map(([id, entry]) => ({
    id,
    ...copy(entry)
  }));

  const scored = entries
    .map((entry) => {
      const teach = entry.teach || [];
      const overlap = teach.filter((role) =>
        desiredRoles.includes(role)
      );
      return {
        ...entry,
        score: overlap.reduce((sum, role) => {
          const index = desiredRoles.indexOf(role);
          return sum + Math.max(1, desiredRoles.length - index);
        }, 0),
        matchedRoles: overlap
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      const aApproved =
        a.status === witnessGrammar.selection?.requireAssetStatus &&
        a.asset?.path &&
        a.asset?.sha256;
      const bApproved =
        b.status === witnessGrammar.selection?.requireAssetStatus &&
        b.asset?.path &&
        b.asset?.sha256;

      if (Boolean(aApproved) !== Boolean(bApproved)) {
        return bApproved ? 1 : -1;
      }

      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return String(a.id).localeCompare(String(b.id));
    });

  const max =
    Number(witnessGrammar.selection?.maxWitnessesPerRender) || 3;

  const selected = scored.slice(0, max).map((entry) => ({
    id: entry.id,
    title: entry.title,
    status: entry.status,
    score: entry.score,
    matchedRoles: entry.matchedRoles,
    teach: copy(entry.teach || []),
    doNotInherit: copy(entry.doNotInherit || []),
    notes: entry.notes || null,
    asset: copy(entry.asset || null),
    provenance: copy(entry.provenance || {})
  }));

  const approved = selected.filter((entry) =>
    entry.status === witnessGrammar.selection?.requireAssetStatus &&
    entry.asset?.path &&
    entry.asset?.sha256
  );

  return freezeDeep({
    version: witnessGrammar.version || 1,
    id: "visual_witness",
    designation:
      witnessGrammar.designation ||
      "Virynism Visual Witness Canon",
    room: scenePacket.provenance?.room || null,
    archetype: scenePacket.archetype,
    desiredRoles,
    selected,
    approved,
    active: approved.length > 0,
    fallback:
      approved.length > 0
        ? null
        : witnessGrammar.selection?.fallback ||
          "semantic_virynism_only",
    transportPolicy: copy(
      witnessGrammar.transportPolicy || {}
    ),
    laws: copy(witnessGrammar.laws || {}),
    provenance: {
      source: "velastra_visual_witness_compiler",
      registryVersion: witnessGrammar.version || 1,
      deterministic: true
    }
  });
}

function unique(values) {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
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
