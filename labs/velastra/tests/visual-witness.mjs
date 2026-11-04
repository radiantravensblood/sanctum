import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile(
  new URL(
    "../../../src/velastra/witness.js",
    import.meta.url
  ),
  "utf8"
);

const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(source).toString("base64")
);

const registry = JSON.parse(
  await fs.readFile(
    new URL(
      "../../../world/velastra-witnesses.json",
      import.meta.url
    ),
    "utf8"
  )
);

const style = {
  id: "virynism",
  emphasis: [
    "material_memory",
    "sacred_incompletion",
    "purposeful_asymmetry"
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

const dormant = module.compileVisualWitness({
  witnessGrammar: registry,
  style,
  scenePacket: scene,
  evidence
});

assert.equal(dormant.id, "visual_witness");
assert.equal(dormant.active, false);
assert.equal(dormant.fallback, "semantic_virynism_only");
assert.ok(
  dormant.selected.some(
    (entry) => entry.id === "gallery_target_01"
  ),
  "Gallery target should be nominated for sacred incompletion"
);
assert.ok(
  dormant.selected.some(
    (entry) => entry.id === "studio_atelier_01"
  ),
  "Studio witness should be nominated for material hand"
);
assert.equal(
  dormant.approved.length,
  0,
  "Named memories must remain inert until an actual asset is approved"
);

const approvedRegistry = structuredClone(registry);
approvedRegistry.entries.gallery_target_01.status = "approved";
approvedRegistry.entries.gallery_target_01.asset = {
  path: "assets/velastra/witnesses/gallery_target_01.png",
  sha256: "deadbeef",
  width: 1536,
  height: 864,
  mediaType: "image/png"
};

const active = module.compileVisualWitness({
  witnessGrammar: approvedRegistry,
  style,
  scenePacket: scene,
  evidence
});

assert.equal(active.active, true);
assert.equal(active.approved.length, 1);
assert.equal(
  active.approved[0].id,
  "gallery_target_01"
);
assert.ok(
  active.approved[0].matchedRoles.includes(
    "sacred_incompletion"
  )
);
assert.ok(
  active.approved[0].doNotInherit.includes(
    "specific frames"
  ),
  "Witness must carry explicit content non-inheritance boundaries"
);
assert.equal(
  active.laws.witnessContentAndWitnessHandMustRemainDistinct,
  true
);
assert.equal(
  active.laws.sceneContentInheritanceForbiddenByDefault,
  true
);

console.log("visual witness contract: ok");
