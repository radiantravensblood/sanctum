export function compileHandprint({
  handprintGrammar,
  style,
  scenePacket,
  evidence = null
}) {
  if (!handprintGrammar || !style || !scenePacket) {
    throw new Error(
      "Handprint requires handprint grammar, Virynism style, and scene packet."
    );
  }

  const built = handprintGrammar.status === "built";
  const witnessCount =
    Number(handprintGrammar.corpus?.witnessCount || 0);
  const minimum =
    Number(handprintGrammar.minimumApprovedWitnesses || 0);

  const ready = built && witnessCount >= minimum;

  const emphasis = new Set(style.emphasis || []);
  const roleCounts = handprintGrammar.corpus?.roleCounts || {};

  const relevantRoles = Object.entries(roleCounts)
    .filter(([role]) => {
      if (role === "material_hand") {
        return (
          emphasis.has("material_memory") ||
          emphasis.has("residue_before_props") ||
          emphasis.has("sacred_incompletion")
        );
      }
      if (role === "relational_light") {
        return emphasis.has("relational_light");
      }
      if (role === "spatial_depth") {
        return emphasis.has("threshold_depth");
      }
      if (role === "compositional_cadence") {
        return (
          emphasis.has("purposeful_asymmetry") ||
          emphasis.has("symbolic_restraint")
        );
      }
      if (role === "edge_behavior") {
        return emphasis.has("quiet_uncanny");
      }
      if (role === "tonal_memory") {
        return (
          emphasis.has("tonal_memory") ||
          emphasis.has("quiet_uncanny")
        );
      }
      if (role === "intimate_presence") {
        return emphasis.has("intimate_scale");
      }
      if (role === "sacred_incompletion") {
        return emphasis.has("sacred_incompletion");
      }
      return false;
    })
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([role, count]) => ({ role, count }));

  const galleryRelevant =
    evidence?.room === "gallery"
      ? [
          "sacred_incompletion",
          "material_hand",
          "compositional_cadence",
          "edge_behavior",
          "tonal_memory",
          "spatial_depth"
        ]
      : [];

  const desiredRoles = unique([
    ...relevantRoles.map((item) => item.role),
    ...galleryRelevant
  ]);

  return freezeDeep({
    version: handprintGrammar.version || 1,
    id: "viryn_handprint",
    designation:
      handprintGrammar.designation || "Virynism Handprint",
    status: handprintGrammar.status || "unknown",
    active: ready,
    fallback: ready ? null : "semantic_virynism_plus_visual_witness",
    room: scenePacket.provenance?.room || null,
    archetype: scenePacket.archetype || null,
    witnessCount,
    minimumApprovedWitnesses: minimum,
    desiredRoles,
    consensusRoles: copy(
      handprintGrammar.corpus?.consensusRoles || []
    ),
    relevantRoleCounts: relevantRoles,
    metrics: ready
      ? copy(handprintGrammar.metrics?.aggregate || {})
      : {},
    interpretation: ready
      ? copy(handprintGrammar.interpretation || {})
      : {},
    doNotInherit: copy(
      handprintGrammar.corpus?.doNotInherit || []
    ),
    provenance: copy(handprintGrammar.provenance || {}),
    laws: copy(handprintGrammar.laws || {})
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
