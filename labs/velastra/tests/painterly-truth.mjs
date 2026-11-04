import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile(
  new URL(
    "../../../src/velastra/painterly-truth.js",
    import.meta.url
  ),
  "utf8"
);

const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(source).toString("base64")
);

const grammar = JSON.parse(
  await fs.readFile(
    new URL(
      "../../../world/velastra-painterly-truth.json",
      import.meta.url
    ),
    "utf8"
  )
);

const room = {
  id: "gallery",
  name: "The Gallery of Unfinished Things"
};

const objects = [
  {
    id: "empty_frame",
    name: "empty frame",
    portable: false
  },
  {
    id: "blue_flower",
    name: "pressed blue flower",
    portable: true
  }
];

const truth = module.compilePainterlyTruth({
  truthGrammar: grammar,
  room,
  objects
});

assert.equal(truth.id, "painterly_truth");
assert.equal(truth.room, "gallery");
assert.equal(truth.revision, 1);

assert.ok(
  truth.facts.some((fact) =>
    fact.includes("raw ground or underpainting")
  ),
  "Gallery must carry concrete unfinished-work material facts"
);

assert.ok(
  truth.facts.some((fact) =>
    fact.includes("nail traces")
  ),
  "Gallery must carry hanging-history traces"
);

assert.ok(
  truth.fixedObjects.some(
    (object) => object.id === "empty_frame"
  ),
  "Non-portable room objects must enter stable place truth"
);

assert.ok(
  truth.portableObjects.some(
    (object) => object.id === "blue_flower"
  ),
  "Portable objects must remain identifiable as runtime truth"
);

assert.ok(
  !truth.facts.some((fact) =>
    fact.includes("pressed blue flower")
  ),
  "Portable object names must not enter canonical painterly facts"
);

assert.equal(
  truth.laws.factsAreCanonicalSceneTruth,
  true
);

assert.equal(
  truth.laws.portableObjectsRemainRuntimeTruth,
  true
);

console.log("painterly truth contract: ok");
