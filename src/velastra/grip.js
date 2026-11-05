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

  const built = gripGrammar.status === "built";
  const renderEligible =
    gripGrammar.renderEligible === true;
  const active = Boolean(
    built &&
    renderEligible &&
    roomMatches &&
    assetMatches &&
    handprint?.active === true
  );

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
    fallback: active
      ? null
      : (
          !renderEligible
            ? "provisional_observation_only"
            : (
                !roomMatches || !assetMatches
                  ? "out_of_scope"
                  : "handprint_unavailable"
              )
        ),
    room,
    assetKey,
    scope: copy(scope),
    dimensions: {
      anchors: active
        ? copy(dimensions.anchors || {})
        : {},
      freedoms: active
        ? copy(dimensions.freedoms || {})
        : {},
      tendencies: active
        ? copy(dimensions.tendencies || {})
        : {}
    },
    anchors: active
      ? copy(dimensions.anchors || {})
      : {},
    freedoms: active
      ? copy(dimensions.freedoms || {})
      : {},
    tendencies: active
      ? copy(dimensions.tendencies || {})
      : {},
    roleProjection: active
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
