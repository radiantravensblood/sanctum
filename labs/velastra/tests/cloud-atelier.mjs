import assert from "node:assert/strict";
import fs from "node:fs/promises";

const devcontainer = JSON.parse(
  await fs.readFile(
    new URL(
      "../../../.devcontainer/devcontainer.json",
      import.meta.url
    ),
    "utf8"
  )
);

const gitignore = await fs.readFile(
  new URL("../../../.gitignore", import.meta.url),
  "utf8"
);

const authoring = await fs.readFile(
  new URL(
    "../../../src/velastra/authoring.js",
    import.meta.url
  ),
  "utf8"
);

assert.equal(
  devcontainer.secrets?.HF_TOKEN?.description?.includes(
    "Inference Providers"
  ),
  true,
  "Codespaces should recommend HF_TOKEN for provider inference"
);

assert.ok(
  String(devcontainer.postCreateCommand || "").includes(
    "requirements-provider.txt"
  ),
  "Codespace must install the lightweight provider dependencies"
);

assert.ok(
  gitignore.includes(
    "authoring/inbox/*.velastra.json"
  ),
  "Cloud handoffs must stay out of Git history"
);

assert.ok(
  authoring.includes('target === "cloud"'),
  "Atelier must distinguish cloud authoring commands"
);

assert.ok(
  authoring.includes(
    '"authoring/inbox/" + filename'
  ),
  "Cloud command must point at the ephemeral inbox"
);

assert.ok(
  authoring.includes('".venv/bin/python"'),
  "Cloud command must use the Codespace-isolated Python environment"
);

assert.ok(
  String(devcontainer.postCreateCommand || "").includes(
    "python3 -m venv .venv"
  ),
  "Codespace must create an isolated authoring environment"
);

assert.ok(
  !JSON.stringify(devcontainer).includes("hf_"),
  "devcontainer must not contain a token value"
);

console.log("cloud atelier contract: ok");
