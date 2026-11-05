import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile(
  new URL(
    "../../../src/velastra/grip.js",
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
      "../../../world/velastra-grip.json",
      import.meta.url
    ),
    "utf8"
  )
);

const scene = {
  provenance: {
    room: "gallery"
  }
};

const handprint = {
  active: true,
  facetRoles: [
    "compositional_cadence",
    "material_hand",
    "spatial_depth"
  ]
};

const provisional = module.compileGrip({
  gripGrammar: scaffold,
  handprint,
  scenePacket: scene,
  assetKey: "velastra.place_tableau.5cms46"
});

assert.equal(provisional.id, "viryn_handprint_grip");
assert.equal(provisional.active, false);
assert.equal(
  provisional.fallback,
  "provisional_observation_only"
);
assert.equal(
  Object.keys(provisional.anchors).length,
  0
);

const builtGrammar = structuredClone(scaffold);
builtGrammar.status = "reviewed_observation";
builtGrammar.renderEligible = false;
builtGrammar.dimensions = {
  anchors: {
    centerLightDelta: {
      label: "center/periphery light relationship"
    },
    darkShare: {
      label: "dark-field occupancy"
    }
  },
  freedoms: {
    tonalSpan: {
      label: "tonal-span breadth"
    }
  },
  tendencies: {
    edgeActivity: {
      label: "edge activity"
    }
  }
};
builtGrammar.roleProjection = {
  compositional_cadence: {
    anchors: ["centerLightDelta"],
    freedoms: [],
    tendencies: []
  },
  material_hand: {
    anchors: [],
    freedoms: ["tonalSpan"],
    tendencies: ["edgeActivity"]
  }
};

const active = module.compileGrip({
  gripGrammar: builtGrammar,
  handprint,
  scenePacket: scene,
  assetKey: "velastra.place_tableau.5cms46"
});

assert.equal(active.active, false);
assert.equal(active.observed, true);
assert.equal(
  active.fallback,
  "reviewed_observation_only"
);
assert.ok(active.anchors.centerLightDelta);
assert.ok(active.freedoms.tonalSpan);
assert.ok(active.tendencies.edgeActivity);
assert.deepEqual(
  [...active.activeRoles].sort(),
  ["compositional_cadence", "material_hand"]
);

const wrongRoom = module.compileGrip({
  gripGrammar: builtGrammar,
  handprint,
  scenePacket: {
    provenance: {
      room: "ceiling_storm"
    }
  },
  assetKey: "velastra.place_tableau.5cms46"
});

assert.equal(wrongRoom.active, false);
assert.equal(wrongRoom.fallback, "out_of_scope");

const wrongAsset = module.compileGrip({
  gripGrammar: builtGrammar,
  handprint,
  scenePacket: scene,
  assetKey: "velastra.place_tableau.other"
});

assert.equal(wrongAsset.active, false);
assert.equal(wrongAsset.fallback, "out_of_scope");

const noHandprint = module.compileGrip({
  gripGrammar: builtGrammar,
  handprint: {
    active: false,
    facetRoles: []
  },
  scenePacket: scene,
  assetKey: "velastra.place_tableau.5cms46"
});

assert.equal(noHandprint.active, false);
assert.equal(noHandprint.fallback, "handprint_unavailable");

console.log(
  "Handprint Grip observation contract passed:",
  active.activeRoles.join(", ")
);
