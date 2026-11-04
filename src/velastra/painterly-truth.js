export function compilePainterlyTruth({
  truthGrammar,
  room,
  objects = []
}) {
  if (!truthGrammar || !room) {
    throw new Error(
      "Painterly Truth requires a truth grammar and room."
    );
  }

  const place =
    truthGrammar.places?.[room.id] || null;

  const fixedObjects = (objects || [])
    .filter((object) => object && object.portable === false)
    .map((object) => ({
      id: object.id,
      name: object.name
    }));

  const portableObjects = (objects || [])
    .filter((object) => object && object.portable === true)
    .map((object) => ({
      id: object.id,
      name: object.name
    }));

  const facts = [];

  if (place) {
    for (const surface of place.surfaces || []) {
      for (const fact of surface.facts || []) {
        facts.push(String(fact));
      }
    }

    for (const fact of place.traces || []) {
      facts.push(String(fact));
    }

    for (const fact of place.spatialFacts || []) {
      facts.push(String(fact));
    }

    for (const fact of place.absences || []) {
      facts.push(String(fact));
    }
  }

  for (const object of fixedObjects) {
    facts.push(
      "Fixed room object: " + object.name + "."
    );
  }

  return freezeDeep({
    version: truthGrammar.version || 1,
    id: "painterly_truth",
    designation:
      truthGrammar.designation || "Painterly Truth",
    room: room.id,
    revision: place?.revision || 0,
    facts: unique(facts),
    surfaces: copy(place?.surfaces || []),
    traces: copy(place?.traces || []),
    spatialFacts: copy(place?.spatialFacts || []),
    absences: copy(place?.absences || []),
    fixedObjects,
    portableObjects,
    provenance: copy(
      place?.provenance || {
        source: "room_object_truth",
        room: room.id
      }
    ),
    laws: copy(truthGrammar.laws || {})
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
