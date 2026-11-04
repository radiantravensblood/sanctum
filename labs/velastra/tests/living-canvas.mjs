import assert from "node:assert/strict";
import fs from "node:fs/promises";

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

const handModuleUrl =
  "data:text/javascript;base64," +
  Buffer.from(handSource).toString("base64");

const witnessModuleUrl =
  "data:text/javascript;base64," +
  Buffer.from(witnessSource).toString("base64");

const standaloneAtelierSource =
  atelierSource
    .replace(
      'import { compileVirynismHand } from "./hand.js";',
      'import { compileVirynismHand } from "' +
        handModuleUrl +
        '";'
    )
    .replace(
      'import { compileVisualWitness } from "./witness.js";',
      'import { compileVisualWitness } from "' +
        witnessModuleUrl +
        '";'
    );

const atelierModule = await import(
  "data:text/javascript;base64," +
    Buffer.from(standaloneAtelierSource).toString("base64")
);

const { compileAtelierManifest } = atelierModule;

const grammar = {
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
    fallback: "procedural_underpainting",
    requireProvenance: true,
    requireSha256: true
  },
  painterBridge: {
    protocol: "velastra.painter.v1",
    candidateStatus: "candidate",
    approvedStatus: "approved"
  }
};

const motifs = {
  layer: "motif_selection",
  motifs: []
};

function scene({
  subject = "moth",
  transient = "small brass token",
  identity = "rain without visible sky",
  scope = "place"
} = {}) {
  return {
    version: 1,
    engine: "Velastra",
    layer: "scene_packet",
    archetype: "place_tableau",
    focalMode: "environment_as_argument",
    subjects: [
      {
        id: subject,
        role: "resident",
        visualClaim: null
      }
    ],
    relation: null,
    environment: {
      kind: "ceiling_storm",
      facts: [
        "The Ceiling Storm",
        identity,
        transient
      ],
      identityFacts: [
        "The Ceiling Storm",
        identity
      ],
      transientFacts: [transient]
    },
    composition: {},
    lighting: {},
    edge: {},
    patina: {},
    visualIntent: {
      sensations: {},
      composition: {}
    },
    artDirection: {
      focalHierarchy: [],
      directives: []
    },
    provenance: {
      source: "test",
      room: "ceiling_storm",
      assetScope: scope
    }
  };
}

function compile(scenePacket, assetRegistry = { entries: {} }) {
  return compileAtelierManifest({
    atelierGrammar: grammar,
    assetRegistry,
    scenePacket,
    motifSelection: motifs,
    seed: "living-canvas-test"
  });
}

const first = compile(
  scene({
    subject: "pale_lumenmoth",
    transient: "small brass token"
  })
);

const transientChanged = compile(
  scene({
    subject: "loose_threadling",
    transient: "blue flower"
  })
);

assert.equal(
  first.assetKey,
  transientChanged.assetKey,
  "place-scoped asset key must ignore live occupants and movable objects"
);

const identityChanged = compile(
  scene({
    identity: "architecture exhibits slow respiration"
  })
);

assert.notEqual(
  first.assetKey,
  identityChanged.assetKey,
  "place-scoped asset key must change when stable place identity changes"
);

const sceneScopedA = compile(
  scene({
    subject: "pale_lumenmoth",
    scope: "scene"
  })
);

const sceneScopedB = compile(
  scene({
    subject: "loose_threadling",
    scope: "scene"
  })
);

assert.notEqual(
  sceneScopedA.assetKey,
  sceneScopedB.assetKey,
  "scene-scoped assets must continue to honor explicit subject identity"
);

const incompleteRegistry = {
  entries: {
    [first.assetKey]: {
      status: "approved",
      path: "assets/velastra/approved/test.png"
    }
  }
};

assert.equal(
  compile(scene(), incompleteRegistry).render.strategy,
  "procedural_underpainting",
  "approved status alone must not bypass provenance and hash requirements"
);

const reviewedRegistry = {
  entries: {
    [first.assetKey]: {
      status: "approved",
      path: "assets/velastra/approved/test.png",
      sha256: "deadbeef",
      provenance: {
        reviewedBy: "test"
      }
    }
  }
};

assert.equal(
  compile(scene(), reviewedRegistry).render.strategy,
  "reviewed_static_asset",
  "fully reviewed registry entries should resolve as canonical paintings"
);

console.log("living canvas contract: ok");
