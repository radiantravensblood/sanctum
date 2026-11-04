export function compileVisibleEvidence({
  evidenceGrammar,
  painterlyTruth
}) {
  if (!evidenceGrammar || !painterlyTruth) {
    throw new Error(
      "Visible Evidence requires evidence grammar and Painterly Truth."
    );
  }

  const placeId = painterlyTruth.room;
  const place =
    evidenceGrammar.places?.[placeId] || null;

  if (!place) {
    return freezeDeep({
      version: evidenceGrammar.version || 1,
      id: "visible_evidence",
      designation:
        evidenceGrammar.designation ||
        "Visible Evidence Contract",
      room: placeId,
      truthRevision: painterlyTruth.revision || 0,
      minimumVisible: 0,
      identityReframe: null,
      required: [],
      compositionControls: [],
      reviewQuestions: [],
      provenance: {
        source: "velastra_evidence_compiler",
        room: placeId,
        empty: true
      },
      laws: copy(evidenceGrammar.laws || {})
    });
  }

  if (
    Number(place.truthRevision || 0) !==
    Number(painterlyTruth.revision || 0)
  ) {
    throw new Error(
      "Visible Evidence truth revision mismatch for " +
        placeId +
        ": expected " +
        String(place.truthRevision || 0) +
        ", received " +
        String(painterlyTruth.revision || 0)
    );
  }

  const knownRefs = new Set(
    (painterlyTruth.surfaces || []).map(
      (surface) => surface.id
    )
  );

  for (const requirement of place.required || []) {
    for (const ref of requirement.sourceRefs || []) {
      if (!knownRefs.has(ref)) {
        throw new Error(
          "Visible Evidence references unknown Painterly Truth source: " +
            ref
        );
      }
    }
  }

  const required = [...(place.required || [])]
    .map((entry) => ({
      id: entry.id,
      sourceRefs: [...(entry.sourceRefs || [])],
      priority: Number(entry.priority || 0),
      instruction: entry.instruction
    }))
    .sort((a, b) => b.priority - a.priority);

  const minimumVisible = Math.max(
    0,
    Math.min(
      Number(place.minimumVisible || 0),
      required.length
    )
  );

  return freezeDeep({
    version: evidenceGrammar.version || 1,
    id: "visible_evidence",
    designation:
      evidenceGrammar.designation ||
      "Visible Evidence Contract",
    room: placeId,
    truthRevision: painterlyTruth.revision || 0,
    minimumVisible,
    identityReframe: place.identityReframe || null,
    required,
    compositionControls: copy(
      place.compositionControls || []
    ),
    reviewQuestions: copy(
      place.reviewQuestions || []
    ),
    provenance: copy(
      place.provenance || {
        source: "velastra_evidence_compiler",
        room: placeId
      }
    ),
    laws: copy(evidenceGrammar.laws || {})
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
