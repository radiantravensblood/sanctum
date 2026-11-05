export function compileGrip({
  gripGrammar,
  handprint,
  scenePacket,
  assetKey = null,
  evidence = null
}) {
  if (!gripGrammar || !scenePacket) {
    throw new Error(
      "Grip requires Grip grammar and scene packet."
    );
  }

  const room =
    scenePacket.provenance?.room ||
    evidence?.room ||
    null;

  const scope = gripGrammar.scope || {};
  const scopedRooms = scope.rooms || [];
  const roomMatches =
    !scopedRooms.length ||
    (room && scopedRooms.includes(room));

  const scopedAssetKeys = scope.assetKeys || [];
  const assetMatches =
    !scopedAssetKeys.length ||
    (assetKey && scopedAssetKeys.includes(assetKey));

  const reviewed =
    gripGrammar.status === "reviewed_observation";
  const provisional =
    gripGrammar.status === "provisional_pending_human_review";
  const inScope = Boolean(
    roomMatches &&
    assetMatches &&
    handprint?.active === true
  );
  const observed = Boolean(
    inScope && (reviewed || provisional)
  );
  const renderEligible = false;
  const active = false;

  const facetRoles = new Set(
    handprint?.facetRoles || []
  );
  const projection =
    gripGrammar.roleProjection || {};
  const activeRoles = Object.keys(projection)
    .filter((role) => facetRoles.has(role));

  const dimensions = gripGrammar.dimensions || {};

  return freezeDeep({
    version: gripGrammar.version || 1,
    id: "viryn_handprint_grip",
    designation:
      gripGrammar.designation ||
      "Virynism Handprint Grip",
    status: gripGrammar.status || "unknown",
    renderEligible,
    active,
    observed,
    fallback:
      !inScope
        ? (
            !roomMatches || !assetMatches
              ? "out_of_scope"
              : "handprint_unavailable"
          )
        : (
            reviewed
              ? "reviewed_observation_only"
              : "provisional_observation_only"
          ),
    room,
    assetKey,
    scope: copy(scope),
    dimensions: {
      anchors: observed
        ? copy(dimensions.anchors || {})
        : {},
      freedoms: observed
        ? copy(dimensions.freedoms || {})
        : {},
      tendencies: observed
        ? copy(dimensions.tendencies || {})
        : {}
    },
    anchors: observed
      ? copy(dimensions.anchors || {})
      : {},
    freedoms: observed
      ? copy(dimensions.freedoms || {})
      : {},
    tendencies: observed
      ? copy(dimensions.tendencies || {})
      : {},
    roleProjection: observed
      ? Object.fromEntries(
          activeRoles.map((role) => [
            role,
            copy(projection[role])
          ])
        )
      : {},
    activeRoles,
    sourceTrial: copy(
      gripGrammar.sourceTrial || {}
    ),
    diagnostics: copy(
      gripGrammar.diagnostics || {}
    ),
    laws: copy(gripGrammar.laws || {}),
    provenance: copy(
      gripGrammar.provenance || {}
    )
  });
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
