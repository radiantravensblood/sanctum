import assert from "node:assert/strict";
import fs from "node:fs/promises";

const handSource = await fs.readFile(
  new URL(
    "../../../src/velastra/hand.js",
    import.meta.url
  ),
  "utf8"
);

const handModule = await import(
  "data:text/javascript;base64," +
    Buffer.from(handSource).toString("base64")
);

const style = JSON.parse(
  await fs.readFile(
    new URL(
      "../../../world/velastra-style.json",
      import.meta.url
    ),
    "utf8"
  )
);

const scene = {
  archetype: "place_tableau",
  environment: {
    kind: "gallery"
  }
};

const hand = handModule.compileVirynismHand({
  styleGrammar: style,
  scenePacket: scene
});

assert.equal(hand.id, "virynism");
assert.equal(hand.designation, "Virynism");
assert.ok(
  hand.emphasis.includes("material_memory"),
  "place tableau must emphasize material memory"
);
assert.ok(
  hand.place.directives.some((line) =>
    line.includes("process, waiting, abandonment, revision, and becoming")
  ),
  "Gallery must define unfinishedness as process rather than blank frames"
);
assert.ok(
  hand.place.avoid.includes(
    "a symmetrical lineup of tasteful empty frames"
  ),
  "Gallery must explicitly reject the first-generation failure mode"
);
assert.ok(
  hand.antiPatterns.includes("generic cinematic concept art"),
  "Virynism must reject generic concept-art polish"
);
assert.equal(
  hand.laws.styleCannotInventSemanticFacts,
  true
);
assert.equal(
  hand.laws.sceneTruthRemainsAuthoritative,
  true
);

console.log("virynism hand contract: ok");
