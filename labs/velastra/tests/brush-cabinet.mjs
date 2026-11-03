import assert from "node:assert/strict";
import fs from "node:fs/promises";

const cabinet = JSON.parse(
  await fs.readFile(
    new URL(
      "../../../world/velastra-brushes.json",
      import.meta.url
    ),
    "utf8"
  )
);

const authoring = await fs.readFile(
  new URL(
    "../../../src/velastra/authoring.js",
    import.meta.url
  ),
  "utf8"
);

assert.equal(
  cabinet.defaultBrush,
  "z_image_turbo",
  "Z-Image Turbo should be the default named brush"
);

assert.equal(
  cabinet.defaultTransport,
  "huggingface",
  "remote provider transport should be the default authoring path"
);

for (const [id, brush] of Object.entries(cabinet.brushes || {})) {
  assert.ok(brush.model, id + " must name a concrete model");
  assert.ok(brush.license, id + " must record a license");
  assert.ok(
    Object.keys(brush.transports || {}).length,
    id + " must expose at least one transport"
  );
}

const defaultBrush = cabinet.brushes[cabinet.defaultBrush];
const defaultTransport =
  defaultBrush.transports[cabinet.defaultTransport];

assert.equal(
  defaultBrush.model,
  "Tongyi-MAI/Z-Image-Turbo"
);
assert.equal(defaultBrush.license, "apache-2.0");
assert.equal(defaultTransport.backend, "huggingface");
assert.equal(defaultTransport.provider, "fal-ai");
assert.equal(defaultTransport.tokenEnv, "HF_TOKEN");

assert.ok(
  !authoring.includes("YOUR_MODEL_ID"),
  "Atelier authoring must not emit placeholder model IDs"
);
assert.ok(
  authoring.includes('"--brush"'),
  "Atelier command must carry a named brush"
);
assert.ok(
  authoring.includes('"--transport"'),
  "Atelier command must carry a named transport"
);

console.log("brush cabinet contract: ok");
