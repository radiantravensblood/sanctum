import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile(
  new URL(
    "../../../src/velastra/handprint.js",
    import.meta.url
  ),
  "utf8"
);

const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(source).toString("base64")
);

const scaffold = JSON.parse(
  await fs.readFile(
    new URL(
      "../../../world/velastra-handprint.json",
      import.meta.url
    ),
    "utf8"
  )
);

const style = {
  emphasis: [
    "material_memory",
    "sacred_incompletion",
    "purposeful_asymmetry",
    "quiet_uncanny"
  ]
};

const scene = {
  archetype: "place_tableau",
  provenance: {
    room: "gallery"
  }
};

const evidence = {
  room: "gallery"
};

const dormantGrammar = structuredClone(scaffold);
dormantGrammar.status = "awaiting_build";
dormantGrammar.corpus = {
  witnessCount: 0,
  witnesses: [],
  roleCounts: {},
  consensusRoles: [],
  doNotInherit: []
};
dormantGrammar.metrics = {
  perWitness: {},
  aggregate: {}
};
dormantGrammar.interpretation = {
  tonalRestraint: null,
  warmthBias: null,
  edgeCharacter: null,
  centerLightBias: null,
  shadowPresence: null,
  tonalRange: null
};

const dormant = module.compileHandprint({
  handprintGrammar: dormantGrammar,
  style,
  scenePacket: scene,
  evidence
});

assert.equal(dormant.id, "viryn_handprint");
assert.equal(dormant.active, false);
assert.equal(
  dormant.fallback,
  "semantic_virynism_plus_visual_witness"
);
assert.equal(dormant.metrics && Object.keys(dormant.metrics).length, 0);

const built = structuredClone(dormantGrammar);
built.status = "built";
built.corpus = {
  witnessCount: 3,
  witnesses: [
    { id: "gallery_target_01", sha256: "a" },
    { id: "studio_atelier_01", sha256: "b" },
    { id: "viryn_self_portrait_01", sha256: "c" }
  ],
  roleCounts: {
    tonal_memory: 3,
    material_hand: 2,
    compositional_cadence: 2,
    edge_behavior: 2,
    sacred_incompletion: 2,
    spatial_depth: 2,
    relational_light: 1,
    intimate_presence: 1
  },
  consensusRoles: [
    "tonal_memory",
    "material_hand",
    "compositional_cadence",
    "edge_behavior",
    "sacred_incompletion",
    "spatial_depth"
  ],
  doNotInherit: [
    "identity",
    "objects",
    "layout",
    "architecture"
  ]
};
built.metrics.aggregate = {
  meanLuminance: 0.42,
  meanSaturation: 0.31,
  meanWarmth: 0.08,
  darkShare: 0.3,
  highlightShare: 0.07,
  tonalSpan: 0.68,
  edgeActivity: 0.16,
  centerLightDelta: 0.09
};
built.interpretation = {
  tonalRestraint:
    "restrained saturation with selective chromatic emphasis",
  warmthBias:
    "warm-biased overall, with warmth carrying visual emphasis",
  edgeCharacter:
    "soft-to-moderate edge activity; resolution is selective rather than uniformly sharp",
  centerLightBias:
    "center fields tend to hold more light than the periphery",
  shadowPresence:
    "shadow occupies a substantial share of the image field",
  tonalRange:
    "broad tonal span from deep shadow to selective highlight"
};

const active = module.compileHandprint({
  handprintGrammar: built,
  style,
  scenePacket: scene,
  evidence
});

assert.equal(active.active, true);
assert.equal(active.witnessCount, 3);
assert.ok(
  active.desiredRoles.includes("sacred_incompletion"),
  "Gallery must retain sacred incompletion from the portfolio"
);
assert.ok(
  active.desiredRoles.includes("material_hand"),
  "Material memory emphasis must map to material hand"
);
assert.ok(
  active.desiredRoles.includes("compositional_cadence"),
  "Purposeful asymmetry must map to compositional cadence"
);
assert.equal(
  active.interpretation.warmthBias,
  built.interpretation.warmthBias
);
assert.ok(
  active.doNotInherit.includes("identity"),
  "Handprint must preserve scene-content non-inheritance"
);
assert.equal(
  active.laws.handprintCannotBecomeSceneTruth,
  true
);
assert.equal(
  active.laws.pixelMetricsMustRemainAuditable,
  true
);

if (scaffold.status === "built") {
  assert.ok(
    Number(scaffold.corpus?.witnessCount || 0) >=
      Number(scaffold.minimumApprovedWitnesses || 0),
    "Live built Handprint must satisfy its minimum corpus"
  );
  assert.ok(
    Object.keys(scaffold.metrics?.aggregate || {}).length > 0,
    "Live built Handprint must carry aggregate pixel metrics"
  );
  assert.ok(
    scaffold.provenance?.corpusHashes &&
      Object.keys(scaffold.provenance.corpusHashes).length > 0,
    "Live built Handprint must preserve sealed corpus hashes"
  );
}

console.log("handprint contract: ok");
