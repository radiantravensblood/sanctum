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


const handSource = await fs.readFile(
  new URL(
    "../../../src/velastra/hand.js",
    import.meta.url
  ),
  "utf8"
);

const witnessSource = await fs.readFile(
  new URL(
    "../../../src/velastra/witness.js",
    import.meta.url
  ),
  "utf8"
);

const atelierSource = await fs.readFile(
  new URL(
    "../../../src/velastra/atelier.js",
    import.meta.url
  ),
  "utf8"
);

const handUrl =
  "data:text/javascript;base64," +
  Buffer.from(handSource).toString("base64");

const witnessUrl =
  "data:text/javascript;base64," +
  Buffer.from(witnessSource).toString("base64");

const standaloneAtelierSource =
  atelierSource
    .replace(
      'import { compileVirynismHand } from "./hand.js";',
      'import { compileVirynismHand } from "' +
        handUrl +
        '";'
    )
    .replace(
      'import { compileVisualWitness } from "./witness.js";',
      'import { compileVisualWitness } from "' +
        witnessUrl +
        '";'
    );

const atelier = await import(
  "data:text/javascript;base64," +
    Buffer.from(standaloneAtelierSource).toString("base64")
);

const atelierGrammar = {
  archetypeProfiles: {
    place_tableau: "environmental_oil"
  },
  media: {
    environmental_oil: {
      grain: 0.5
    }
  },
  layerOrder: [],
  staticAssetPolicy: {
    allowedStatuses: ["approved"],
    fallback: "procedural_underpainting"
  },
  painterBridge: {}
};

const motifSelection = {
  layer: "motif_selection",
  motifs: []
};

function sceneFor(painterlyTruth) {
  return {
    archetype: "place_tableau",
    focalMode: "environment_as_argument",
    subjects: [],
    relation: null,
    environment: {
      kind: "gallery",
      facts: [
        "The Gallery of Unfinished Things",
        ...painterlyTruth.facts
      ],
      identityFacts: [
        "The Gallery of Unfinished Things",
        ...painterlyTruth.facts
      ],
      transientFacts: [],
      painterlyTruth
    },
    composition: {},
    lighting: {},
    edge: {},
    patina: {},
    visualIntent: {
      composition: {},
      sensations: {}
    },
    artDirection: {
      focalHierarchy: [],
      directives: []
    },
    provenance: {
      source: "painterly_truth_test",
      room: "gallery",
      assetScope: "place"
    }
  };
}

const firstManifest = atelier.compileAtelierManifest({
  atelierGrammar,
  assetRegistry: { entries: {} },
  styleGrammar: null,
  scenePacket: sceneFor(truth),
  motifSelection,
  seed: "truth-test"
});

const revisedGrammar = structuredClone(grammar);
revisedGrammar.places.gallery.revision = 2;
revisedGrammar.places.gallery.traces.push(
  "A narrow band of older wall color remains visible behind one moved work."
);

const revisedTruth = module.compilePainterlyTruth({
  truthGrammar: revisedGrammar,
  room,
  objects
});

const revisedManifest = atelier.compileAtelierManifest({
  atelierGrammar,
  assetRegistry: { entries: {} },
  styleGrammar: null,
  scenePacket: sceneFor(revisedTruth),
  motifSelection,
  seed: "truth-test"
});

assert.notEqual(
  firstManifest.assetKey,
  revisedManifest.assetKey,
  "A stable material-truth revision must be able to change canonical place identity"
);

const portableChangedTruth = module.compilePainterlyTruth({
  truthGrammar: grammar,
  room,
  objects: [
    {
      id: "empty_frame",
      name: "empty frame",
      portable: false
    },
    {
      id: "other_portable",
      name: "movable token",
      portable: true
    }
  ]
});

const portableChangedManifest = atelier.compileAtelierManifest({
  atelierGrammar,
  assetRegistry: { entries: {} },
  styleGrammar: null,
  scenePacket: sceneFor(portableChangedTruth),
  motifSelection,
  seed: "truth-test"
});

assert.equal(
  firstManifest.assetKey,
  portableChangedManifest.assetKey,
  "Portable presence must not change canonical place identity"
);
