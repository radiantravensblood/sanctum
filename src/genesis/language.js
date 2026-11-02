import { createSeededRandom, pick } from "./seed.js";

export function renderRoomLanguage({
  scene,
  objectTemplate,
  returnDirection,
  forwardDirections,
  topology,
  seed
}) {
  const random = createSeededRandom(seed + ":language");
  const clauses = [
    scene.language.geometry,
    scene.language.atmosphere,
    scene.language.matter,
    scene.language.anomaly
  ].filter(Boolean);

  return {
    description: clauses.join(" "),
    lookText: renderLook({
      scene,
      objectTemplate,
      returnDirection,
      forwardDirections,
      topology,
      random
    }),
    sitText: renderSit(scene, random)
  };
}

function renderLook({
  scene,
  objectTemplate,
  returnDirection,
  forwardDirections,
  topology,
  random
}) {
  const parts = [];

  parts.push(
    pick(random, [
      "The way back remains " + returnDirection + ".",
      capitalize(returnDirection) + " still returns toward known ground.",
      "You can return " + returnDirection + " without asking the room's permission."
    ])
  );

  if (objectTemplate) {
    parts.push(
      pick(random, [
        "The " + objectTemplate.name + " is here.",
        "A " + objectTemplate.name + " occupies the room without explanation.",
        "The room currently holds a " + objectTemplate.name + "."
      ])
    );
  } else {
    parts.push(
      pick(random, [
        "Nothing here appears to have been left for taking.",
        "The room offers no object simply for having arrived.",
        "There is nothing loose here that asks to be carried away."
      ])
    );
  }

  if (topology.type === "terminal") {
    parts.push(
      pick(random, [
        "Nothing beyond this room asks to be made.",
        "The path is complete here.",
        "The architecture offers no further unwritten edge."
      ])
    );
  } else if (topology.type === "branch") {
    parts.push(
      "The unwritten world waits in two directions: " +
        forwardDirections.join(" and ") +
        "."
    );
  } else if (forwardDirections.length) {
    parts.push(
      capitalize(forwardDirections[0]) +
        " ends at another unwritten edge."
    );
  }

  if (scene.senses.scent.length && random() > 0.52) {
    parts.push("The air carries " + naturalList(scene.senses.scent.slice(0, 2)) + ".");
  }

  return parts.join(" ");
}

function renderSit(scene, random) {
  const lines = [
    "You sit and let the room continue without needing anything from it.",
    "You settle into stillness long enough for the place to stop introducing itself.",
    "You sit. The architecture does not mistake your stillness for absence."
  ];

  if (scene.air.temperature > 0.65) {
    lines.push("You sit where the room's low warmth can reach you.");
  }

  if (scene.air.humidity > 0.65) {
    lines.push("You sit with damp air settling lightly against skin and fabric.");
  }

  if (scene.acoustics.reverb > 0.7) {
    lines.push("You sit until even the room's returning sounds begin to feel distant.");
  }

  return pick(random, lines);
}

function naturalList(values) {
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return values[0] + " and " + values[1];
  return values.slice(0, -1).join(", ") + ", and " + values[values.length - 1];
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
