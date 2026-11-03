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

export async function copyPainterCommand(
  painting,
  brushCabinet,
  {
    brushId = null,
    transportId = null,
    target = "local"
  } = {}
) {
  const handoff = composePaintingHandoff(painting);
  const filename = paintingHandoffFilename(handoff);
  const selection = resolveBrushSelection(
    brushCabinet,
    brushId,
    transportId
  );
  const handoffPath =
    target === "cloud"
      ? "authoring/inbox/" + filename
      : "$HOME/Downloads/" + filename;

  const command = [
    "python3",
    "labs/velastra/painter/velastra_painter.py",
    "render",
    shellQuote(handoffPath),
    "--brush",
    shellQuote(selection.brushId),
    "--transport",
    shellQuote(selection.transportId)
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
    copied,
    target,
    filename,
    ...selection
  };
}

export function installAtelierDock({
  getPainting,
  brushCabinet
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
    "the model holds the brush · Velastra remains the author";

  const status = document.createElement("code");

  const brushRow = document.createElement("label");
  brushRow.className = "atelier-field";
  const brushLabel = document.createElement("span");
  brushLabel.textContent = "Brush";
  const brushSelect = document.createElement("select");
  brushSelect.setAttribute("aria-label", "Velastra brush");

  Object.entries(brushCabinet?.brushes || {}).forEach(
    ([id, brush]) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent =
        brush.label || id;
      if (id === brushCabinet.defaultBrush) {
        option.selected = true;
      }
      brushSelect.append(option);
    }
  );

  const transportRow = document.createElement("label");
  transportRow.className = "atelier-field";
  const transportLabel = document.createElement("span");
  transportLabel.textContent = "Transport";
  const transportSelect = document.createElement("select");
  transportSelect.setAttribute(
    "aria-label",
    "Velastra brush transport"
  );

  brushRow.append(brushLabel, brushSelect);
  transportRow.append(
    transportLabel,
    transportSelect
  );

  const transportNote = document.createElement("small");
  transportNote.className = "atelier-transport-note";

  const syncTransports = () => {
    const brush =
      brushCabinet?.brushes?.[brushSelect.value] || {};
    const transports = brush.transports || {};
    const previous = transportSelect.value;

    transportSelect.replaceChildren();

    Object.entries(transports).forEach(
      ([id, transport]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent =
          transportLabelText(id, transport);
        if (
          id === previous ||
          (!previous &&
            id === brushCabinet.defaultTransport) ||
          transport.recommended === true
        ) {
          option.selected = true;
        }
        transportSelect.append(option);
      }
    );

    const selected =
      transports[transportSelect.value] ||
      transports[
        brushCabinet.defaultTransport
      ] ||
      Object.values(transports)[0] ||
      {};

    transportNote.textContent =
      selected.tokenEnv
        ? "credential · " +
          selected.tokenEnv +
          " from shell environment"
        : "local authoring transport";
  };

  syncTransports();

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
    "Copy local command",
    async () => {
      const result = await copyPainterCommand(
        getPainting(),
        brushCabinet,
        {
          brushId: brushSelect.value,
          transportId: transportSelect.value,
          target: "local"
        }
      );
      status.textContent = result.copied
        ? result.brushLabel +
          " · local command copied"
        : result.command;
    }
  );

  const cloudCommandButton = button(
    "Copy cloud command",
    async () => {
      const result = await copyPainterCommand(
        getPainting(),
        brushCabinet,
        {
          brushId: brushSelect.value,
          transportId: transportSelect.value,
          target: "cloud"
        }
      );
      status.textContent = result.copied
        ? result.brushLabel +
          " · cloud command copied"
        : result.command;
    }
  );

  brushSelect.addEventListener("change", () => {
    syncTransports();
    refreshAtelierDock({
      dock,
      status,
      getPainting,
      brushCabinet,
      brushSelect,
      transportSelect
    });
  });

  transportSelect.addEventListener("change", () => {
    syncTransports();
    refreshAtelierDock({
      dock,
      status,
      getPainting,
      brushCabinet,
      brushSelect,
      transportSelect
    });
  });

  actions.append(
    exportButton,
    commandButton,
    cloudCommandButton
  );
  dock.append(
    title,
    law,
    status,
    brushRow,
    transportRow,
    transportNote,
    actions
  );
  document.body.append(dock);

  refreshAtelierDock({
    dock,
    status,
    getPainting,
    brushCabinet,
    brushSelect,
    transportSelect
  });

  return {
    dock,
    refresh: () =>
      refreshAtelierDock({
        dock,
        status,
        getPainting,
        brushCabinet,
        brushSelect,
        transportSelect
      })
  };
}

export function resolveBrushSelection(
  brushCabinet,
  brushId = null,
  transportId = null
) {
  if (
    !brushCabinet ||
    !brushCabinet.brushes
  ) {
    throw new Error(
      "Velastra Brush Cabinet is unavailable."
    );
  }

  const chosenBrush =
    brushId ||
    brushCabinet.defaultBrush;
  const brush =
    brushCabinet.brushes[chosenBrush];

  if (!brush) {
    throw new Error(
      "Unknown Velastra brush: " +
        chosenBrush
    );
  }

  const transports = brush.transports || {};
  const cabinetDefault =
    brushCabinet.defaultTransport;
  const chosenTransport =
    transportId ||
    (
      transports[cabinetDefault]
        ? cabinetDefault
        : null
    ) ||
    Object.entries(transports).find(
      ([, value]) =>
        value && value.recommended === true
    )?.[0] ||
    Object.keys(transports)[0];
  const transport =
    transports[chosenTransport];

  if (!transport) {
    throw new Error(
      "Brush " +
        chosenBrush +
        " does not support transport " +
        chosenTransport
    );
  }

  return {
    brushId: chosenBrush,
    brushLabel:
      brush.label || chosenBrush,
    model: brush.model,
    license: brush.license,
    transportId: chosenTransport,
    backend: transport.backend,
    provider: transport.provider || null,
    tokenEnv: transport.tokenEnv || null
  };
}

function refreshAtelierDock({
  dock,
  status,
  getPainting,
  brushCabinet,
  brushSelect,
  transportSelect
}) {
  const painting = getPainting();
  const manifest = painting.atelier.manifest;
  const selection = resolveBrushSelection(
    brushCabinet,
    brushSelect?.value || null,
    transportSelect?.value || null
  );

  dock.dataset.strategy =
    manifest.render.strategy;
  dock.dataset.brush =
    selection.brushId;
  dock.dataset.transport =
    selection.transportId;

  status.textContent =
    shortKey(manifest.assetKey) +
    " · " +
    selection.brushLabel +
    " · " +
    manifest.render.strategy.replaceAll("_", " ");
}

function transportLabelText(id, transport) {
  if (id === "huggingface") {
    return (
      "Hugging Face" +
      (transport.provider &&
      transport.provider !== "auto"
        ? " · " + transport.provider
        : " · auto provider")
    );
  }

  if (id === "diffusers") {
    return "Local Diffusers";
  }

  return id;
}

function shellQuote(value) {
  return (
    '"' +
    String(value || "")
      .replaceAll("\\", "\\\\")
      .replaceAll('"', '\\"') +
    '"'
  );
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
