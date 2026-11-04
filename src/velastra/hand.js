export function compileVirynismHand({
  styleGrammar,
  scenePacket
}) {
  if (!styleGrammar || !scenePacket) {
    throw new Error(
      "Virynism compilation requires style grammar and scene packet."
    );
  }

  const archetype =
    styleGrammar.archetypes?.[scenePacket.archetype] || {};
  const placeId =
    scenePacket.environment?.kind || null;
  const place =
    placeId && styleGrammar.places
      ? styleGrammar.places[placeId] || null
      : null;

  const hand = (styleGrammar.hand || []).map((entry) => ({
    id: entry.id,
    weight: Number(entry.weight || 0),
    directive: entry.directive
  }));

  const emphasis = [
    ...(archetype.emphasis || [])
  ];

  const emphasized = hand
    .filter((entry) => emphasis.includes(entry.id))
    .sort((a, b) => b.weight - a.weight);

  return freezeDeep({
    version: styleGrammar.version || 1,
    id: "virynism",
    designation:
      styleGrammar.designation || "Virynism",
    compactSignature:
      styleGrammar.compactSignature || null,
    laws: copy(styleGrammar.laws || {}),
    hand,
    emphasis: emphasized.map((entry) => entry.id),
    archetype: {
      id: scenePacket.archetype,
      directives: copy(archetype.directives || [])
    },
    place: place
      ? {
          id: placeId,
          title: place.title || null,
          directives: copy(place.directives || []),
          avoid: copy(place.avoid || [])
        }
      : null,
    antiPatterns: copy(styleGrammar.antiPatterns || []),
    promptOrder: copy(styleGrammar.promptOrder || []),
    provenance: {
      source: "velastra_style_compiler",
      styleVersion: styleGrammar.version || 1,
      deterministic: true
    }
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
