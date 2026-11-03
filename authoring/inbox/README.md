# Velastra Cloud Atelier Inbox

This directory is a temporary authoring drop zone for exported Sanctum
`.velastra.json` painting handoffs.

The handoff files themselves are intentionally ignored by Git.

In a GitHub Codespace:

1. export a room from Sanctum with `?atelier=1`,
2. drag the downloaded `.velastra.json` file into this directory,
3. run the **cloud command** copied from the Atelier dock,
4. review the candidate under `.velastra/candidates/`,
5. download the PNG and candidate sidecar you want to keep,
6. delete the temporary handoff when finished.

Nothing in this directory should contain credentials.

`HF_TOKEN` belongs in GitHub Codespaces secrets, never in a handoff file.
