import assert from "node:assert/strict";
import fs from "node:fs/promises";

const evidenceSource = await fs.readFile(
  new URL(
    "../../../src/velastra/evidence.js",
    import.meta.url
  ),
  "utf8"
);

const evidenceModule = await import(
  "data:text/javascript;base64," +
    Buffer.from(evidenceSource).toString("base64")
);

const evidenceGrammar = JSON.parse(
  await fs.readFile(
    new URL(
      "../../../world/velastra-evidence.json",
      import.meta.url
    ),
    "utf8"
  )
);

const truthGrammar = JSON.parse(
  await fs.readFile(
    new URL(
      "../../../world/velastra-painterly-truth.json",
      import.meta.url
    ),
    "utf8"
  )
);

const cabinet = JSON.parse(
  await fs.readFile(
    new URL(
      "../../../world/velastra-brushes.json",
      import.meta.url
    ),
    "utf8"
  )
);

const galleryTruth = {
  version: truthGrammar.version,
  id: "painterly_truth",
  designation: truthGrammar.designation,
  room: "gallery",
  revision: truthGrammar.places.gallery.revision,
  surfaces: truthGrammar.places.gallery.surfaces,
  traces: truthGrammar.places.gallery.traces,
  spatialFacts: truthGrammar.places.gallery.spatialFacts,
  absences: truthGrammar.places.gallery.absences,
  fixedObjects: [],
  portableObjects: []
};

const evidence = evidenceModule.compileVisibleEvidence({
  evidenceGrammar,
  painterlyTruth: galleryTruth
});

assert.equal(evidence.id, "visible_evidence");
assert.equal(evidence.room, "gallery");
assert.equal(evidence.truthRevision, 1);
assert.equal(evidence.minimumVisible, 3);
assert.equal(evidence.required.length, 4);
assert.ok(
  evidence.identityReframe.includes(
    "must not read as a conventional museum"
  ),
  "Gallery evidence must counter the finished-museum prior positively"
);
assert.ok(
  evidence.required.some((item) =>
    item.instruction.includes("raw ground or underpainting")
  ),
  "Gallery evidence must require visibly unfinished material"
);
assert.ok(
  evidence.compositionControls.some((item) =>
    item.instruction.includes("must remain one element")
  ),
  "Empty-frame shorthand must be explicitly subordinated"
);

assert.throws(
  () =>
    evidenceModule.compileVisibleEvidence({
      evidenceGrammar,
      painterlyTruth: {
        ...galleryTruth,
        revision: 2
      }
    }),
  /truth revision mismatch/,
  "Evidence must fail closed when Painterly Truth has moved"
);

for (const [id, brush] of Object.entries(cabinet.brushes || {})) {
  assert.ok(
    brush.controlContract,
    id + " must declare a control contract"
  );
  assert.equal(
    brush.controlContract.evidenceStrategy,
    "positive_mandatory",
    id + " must keep visible evidence in the positive channel"
  );
}

const turbo = cabinet.brushes.z_image_turbo.controlContract;
assert.equal(turbo.negativePrompt.supported, false);
assert.equal(turbo.guidance.supported, false);
assert.equal(turbo.guidance.expected, 0);
assert.equal(turbo.promptBudget.safeTargetTokens, 420);
assert.equal(turbo.diversity, "low");

const qwen = cabinet.brushes.qwen_image.controlContract;
assert.equal(qwen.negativePrompt.supportedByBasePipeline, true);
assert.equal(qwen.guidance.supportedByBasePipeline, true);
assert.equal(qwen.negativePrompt.providerTransport, "best_effort");

console.log("brush contract + visible evidence: ok");
