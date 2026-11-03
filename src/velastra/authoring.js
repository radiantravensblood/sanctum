import {
  composePaintingHandoff,
  paintingHandoffFilename
} from "./sanctum-painting.js";

export function downloadPaintingHandoff(painting) {
  const handoff = composePaintingHandoff(painting);
  const filename = paintingHandoffFilename(handoff);
  const blob = new Blob(
    [JSON.stringify(handoff, null, 2) + "\n"],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);

  return {
    filename,
    assetKey: handoff.assetKey,
    handoff
  };
}

export async function copyPainterCommand(painting) {
  const handoff = composePaintingHandoff(painting);
  const filename = paintingHandoffFilename(handoff);
  const command = [
    "python3",
    "labs/velastra/painter/velastra_painter.py",
    "render",
    '"$HOME/Downloads/' + filename + '"',
    "--backend",
    "diffusers",
    "--model",
    "<model-id>"
  ].join(" ");

  let copied = false;

  if (
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {
    try {
      await navigator.clipboard.writeText(command);
      copied = true;
    } catch {
      copied = false;
    }
  }

  return {
    command,
    copied
  };
}

export function installAtelierDock({
  getPainting
}) {
  const params = new URLSearchParams(
    window.location.search
  );

  if (params.get("atelier") !== "1") {
    return null;
  }

  const dock = document.createElement("aside");
  dock.className = "atelier-dock";
  dock.setAttribute(
    "aria-label",
    "Velastra authoring tools"
  );

  const title = document.createElement("strong");
  title.textContent = "Atelier";

  const law = document.createElement("small");
  law.textContent =
    "the painting remembers the place · the runtime carries the moment";

  const status = document.createElement("code");

  const actions = document.createElement("div");
  actions.className = "atelier-dock-actions";

  const exportButton = button(
    "Export painting packet",
    () => {
      const result = downloadPaintingHandoff(
        getPainting()
      );
      status.textContent =
        "exported · " +
        shortKey(result.assetKey);
    }
  );

  const commandButton = button(
    "Copy painter command",
    async () => {
      const result = await copyPainterCommand(
        getPainting()
      );
      status.textContent = result.copied
        ? "command copied"
        : result.command;
    }
  );

  actions.append(exportButton, commandButton);
  dock.append(title, law, status, actions);
  document.body.append(dock);

  refreshAtelierDock({
    dock,
    status,
    getPainting
  });

  return {
    dock,
    refresh: () =>
      refreshAtelierDock({
        dock,
        status,
        getPainting
      })
  };
}

function refreshAtelierDock({
  dock,
  status,
  getPainting
}) {
  const painting = getPainting();
  const manifest = painting.atelier.manifest;

  dock.dataset.strategy =
    manifest.render.strategy;
  status.textContent =
    shortKey(manifest.assetKey) +
    " · " +
    manifest.render.strategy.replaceAll("_", " ");
}

function shortKey(value) {
  const text = String(value || "");
  return text.length > 34
    ? text.slice(0, 31) + "…"
    : text;
}

function button(label, onClick) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.addEventListener("click", onClick);
  return element;
}
