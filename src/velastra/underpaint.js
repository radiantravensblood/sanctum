const SVG_NS = "http://www.w3.org/2000/svg";

export function renderAtelierUnderpainting({
  svg,
  manifest
}) {
  if (!svg || !manifest) return null;

  if (
    manifest.render?.strategy === "reviewed_static_asset" &&
    manifest.render.reviewedAsset?.path
  ) {
    return renderStaticAsset(svg, manifest);
  }

  return renderProceduralUnderpainting(svg, manifest);
}

function renderStaticAsset(svg, manifest) {
  const image = el("image", {
    x: 0,
    y: 0,
    width: 800,
    height: 360,
    href: manifest.render.reviewedAsset.path,
    preserveAspectRatio: "xMidYMid slice",
    opacity: "0.9",
    class: "velastra-reviewed-painting",
    "aria-hidden": "true"
  });

  svg.append(image);
  return image;
}

function renderProceduralUnderpainting(svg, manifest) {
  const id = safeId(manifest.assetKey);
  const random = seededRandom(manifest.assetKey);
  const medium = manifest.medium || {};
  const group = el("g", {
    class: "velastra-underpainting",
    "aria-hidden": "true"
  });

  installDefs(svg, id, medium);
  renderPigment(group, manifest, random, id);
  renderLight(group, manifest, random, id);
  renderBrushField(group, manifest, random, id);
  renderMotifTraces(group, manifest, random, id);
  renderPatina(group, manifest, random, id);
  renderVignette(group, manifest, id);

  svg.append(group);
  return group;
}

function installDefs(svg, id, medium) {
  let defs = svg.querySelector("defs");

  if (!defs) {
    defs = el("defs");
    svg.prepend(defs);
  }

  const texture = el("filter", {
    id: "velastra-texture-" + id,
    x: "-20%",
    y: "-20%",
    width: "140%",
    height: "140%"
  });
  texture.append(
    el("feTurbulence", {
      type: "fractalNoise",
      baseFrequency: String(
        0.008 + Number(medium.grain || 0.5) * 0.018
      ),
      numOctaves: "3",
      seed: String(hash(id) % 97),
      result: "noise"
    }),
    el("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "noise",
      scale: String(
        3 + Number(medium.edgeVariance || 0.5) * 9
      ),
      xChannelSelector: "R",
      yChannelSelector: "G"
    })
  );

  const soften = el("filter", {
    id: "velastra-soften-" + id,
    x: "-30%",
    y: "-30%",
    width: "160%",
    height: "160%"
  });
  soften.append(
    el("feGaussianBlur", {
      stdDeviation: String(
        5 + Number(medium.blur || 0.5) * 16
      )
    })
  );

  const grain = el("filter", {
    id: "velastra-grain-" + id,
    x: "0%",
    y: "0%",
    width: "100%",
    height: "100%"
  });
  grain.append(
    el("feTurbulence", {
      type: "fractalNoise",
      baseFrequency: "0.7",
      numOctaves: "2",
      seed: String((hash(id) + 31) % 101),
      stitchTiles: "stitch",
      result: "grain"
    }),
    el("feColorMatrix", {
      in: "grain",
      type: "saturate",
      values: "0",
      result: "mono"
    }),
    el("feComponentTransfer", {
      in: "mono",
      result: "faded"
    })
  );
  const transfer = grain.lastChild;
  transfer.append(
    el("feFuncA", {
      type: "table",
      tableValues:
        "0 " +
        String(
          0.05 + Number(medium.grain || 0.5) * 0.1
        )
    })
  );

  defs.append(texture, soften, grain);
}

function renderPigment(group, manifest, random, id) {
  const medium = manifest.medium || {};
  const count = Math.max(
    5,
    Math.round(Number(medium.pigmentLayers || 8))
  );

  const field = el("g", {
    class: "velastra-pigment-field",
    filter: "url(#velastra-soften-" + id + ")"
  });

  const fills = [
    "var(--room-field)",
    "var(--room-surface)",
    "var(--room-accent)",
    "var(--room-organic)",
    "var(--room-glow)",
    "var(--room-shadow)"
  ];

  for (let i = 0; i < count; i += 1) {
    const cx = 80 + random() * 640;
    const cy = 35 + random() * 290;
    const rx =
      80 +
      random() *
        (180 + Number(medium.brushScale || 0.7) * 220);
    const ry =
      18 +
      random() *
        (34 + Number(medium.brushScale || 0.7) * 70);

    field.append(
      el("ellipse", {
        cx,
        cy,
        rx,
        ry,
        fill: fills[i % fills.length],
        opacity: String(
          0.018 +
            random() *
              (0.035 + Number(medium.blur || 0.5) * 0.035)
        ),
        transform:
          "rotate(" +
          ((random() - 0.5) * 28) +
          " " +
          cx +
          " " +
          cy +
          ")"
      })
    );
  }

  group.append(field);
}

function renderLight(group, manifest, random, id) {
  const light = manifest.scene?.lighting || {};
  const bloom = Number(light.bloom || manifest.medium?.bloom || 0.4);
  const directional = Number(light.directionality || 0.5);
  const temperature = Number(light.temperature || 0.5);
  const x =
    directional > 0.66
      ? random() > 0.5
        ? 610
        : 190
      : 400;
  const y = 90 + random() * 90;

  const lightGroup = el("g", {
    class: "velastra-light-field",
    filter: "url(#velastra-soften-" + id + ")"
  });

  lightGroup.append(
    el("ellipse", {
      cx: x,
      cy: y,
      rx: 130 + bloom * 180,
      ry: 70 + bloom * 110,
      fill:
        temperature > 0.58
          ? "var(--room-glow)"
          : "var(--room-organic)",
      opacity: String(0.04 + bloom * 0.13)
    }),
    el("ellipse", {
      cx: x + (random() - 0.5) * 90,
      cy: y + 40,
      rx: 70 + bloom * 100,
      ry: 30 + bloom * 70,
      fill: "var(--room-accent)",
      opacity: String(0.018 + bloom * 0.06)
    })
  );

  group.append(lightGroup);
}

function renderBrushField(group, manifest, random, id) {
  const medium = manifest.medium || {};
  const count = Math.max(
    8,
    Math.round(Number(medium.strokeCount || 20))
  );

  const strokes = el("g", {
    class: "velastra-brush-field",
    fill: "none",
    "stroke-linecap": "round",
    filter: "url(#velastra-texture-" + id + ")"
  });

  const strokeColors = [
    "var(--room-accent)",
    "var(--room-glow)",
    "var(--room-organic)",
    "var(--room-line)"
  ];

  for (let i = 0; i < count; i += 1) {
    const x1 = 35 + random() * 730;
    const y1 = 35 + random() * 290;
    const x2 = clamp(x1 + (random() - 0.5) * 250, 10, 790);
    const y2 = clamp(y1 + (random() - 0.5) * 120, 10, 350);
    const c1x = x1 + (x2 - x1) * (0.25 + random() * 0.2);
    const c1y = y1 + (random() - 0.5) * 70;
    const c2x = x1 + (x2 - x1) * (0.65 + random() * 0.2);
    const c2y = y2 + (random() - 0.5) * 70;

    strokes.append(
      el("path", {
        d:
          "M " +
          x1 +
          " " +
          y1 +
          " C " +
          c1x +
          " " +
          c1y +
          ", " +
          c2x +
          " " +
          c2y +
          ", " +
          x2 +
          " " +
          y2,
        stroke: strokeColors[i % strokeColors.length],
        "stroke-width": String(
          0.7 +
            random() *
              (2 + Number(medium.brushScale || 0.7) * 3.2)
        ),
        opacity: String(
          0.025 +
            random() *
              (0.05 + Number(medium.edgeVariance || 0.5) * 0.07)
        )
      })
    );
  }

  group.append(strokes);
}

function renderMotifTraces(group, manifest, random, id) {
  const motifGroup = el("g", {
    class: "velastra-motif-traces",
    opacity: String(
      Number(manifest.medium?.motifOpacity || 0.3)
    )
  });

  (manifest.motifs || []).slice(0, 8).forEach((motif, index) => {
    const opacity =
      motif.mode === "literal" ? 0.26 : 0.16;
    const x = 100 + ((index * 91 + random() * 120) % 600);
    const y = 65 + ((index * 57 + random() * 90) % 225);

    renderMotif(motifGroup, motif.id, {
      x,
      y,
      opacity,
      random,
      id
    });
  });

  group.append(motifGroup);
}

function renderMotif(group, motif, ctx) {
  const { x, y, opacity, random } = ctx;
  const stroke = "var(--room-accent)";
  const glow = "var(--room-glow)";
  const organic = "var(--room-organic)";

  if (motif === "halo_light") {
    group.append(
      el("circle", {
        cx: x,
        cy: y,
        r: 34,
        fill: "none",
        stroke: glow,
        "stroke-width": "4",
        opacity
      }),
      el("circle", {
        cx: x,
        cy: y,
        r: 54,
        fill: "none",
        stroke,
        "stroke-width": "1",
        opacity: String(opacity * 0.7)
      })
    );
    return;
  }

  if (motif === "orbit_diagram" || motif === "constellation_marks") {
    const rings = motif === "orbit_diagram" ? 3 : 2;
    for (let i = 0; i < rings; i += 1) {
      group.append(
        el("ellipse", {
          cx: x,
          cy: y,
          rx: 28 + i * 22,
          ry: 12 + i * 10,
          fill: "none",
          stroke,
          "stroke-width": "1",
          opacity: String(opacity * (1 - i * 0.18)),
          transform:
            "rotate(" +
            ((random() - 0.5) * 22) +
            " " +
            x +
            " " +
            y +
            ")"
        })
      );
    }
    return;
  }

  if (motif === "touch_axis") {
    group.append(
      el("path", {
        d:
          "M " +
          (x - 58) +
          " " +
          (y + 20) +
          " Q " +
          x +
          " " +
          (y - 30) +
          " " +
          (x + 58) +
          " " +
          (y + 12),
        fill: "none",
        stroke: glow,
        "stroke-width": "2",
        opacity
      })
    );
    return;
  }

  if (
    motif === "handwritten_note" ||
    motif === "books_and_papers" ||
    motif === "ledger_marks"
  ) {
    const card = el("g", { opacity });
    card.append(
      el("rect", {
        x: x - 34,
        y: y - 22,
        width: 68,
        height: 44,
        rx: 2,
        fill: "var(--room-surface)",
        stroke,
        "stroke-width": "1"
      })
    );
    for (let i = 0; i < 4; i += 1) {
      card.append(
        el("line", {
          x1: x - 24,
          y1: y - 10 + i * 8,
          x2: x + 18 + random() * 12,
          y2: y - 12 + i * 8 + random() * 3,
          stroke,
          "stroke-width": "1"
        })
      );
    }
    group.append(card);
    return;
  }

  if (motif === "mapboard") {
    group.append(
      el("rect", {
        x: x - 54,
        y: y - 38,
        width: 108,
        height: 76,
        fill: "none",
        stroke,
        "stroke-width": "1",
        opacity
      })
    );
    for (let i = 0; i < 5; i += 1) {
      const nx = x - 36 + random() * 72;
      const ny = y - 22 + random() * 44;
      group.append(
        el("circle", {
          cx: nx,
          cy: ny,
          r: 3,
          fill: glow,
          opacity
        })
      );
    }
    return;
  }

  if (motif === "warm_window") {
    group.append(
      el("rect", {
        x: x - 44,
        y: y - 54,
        width: 88,
        height: 108,
        fill: glow,
        stroke,
        "stroke-width": "1",
        opacity: String(opacity * 0.45)
      }),
      el("line", {
        x1: x,
        y1: y - 54,
        x2: x,
        y2: y + 54,
        stroke,
        opacity
      }),
      el("line", {
        x1: x - 44,
        y1: y,
        x2: x + 44,
        y2: y,
        stroke,
        opacity
      })
    );
    return;
  }

  if (motif === "botanical_edge") {
    group.append(
      el("path", {
        d:
          "M " +
          (x - 55) +
          " " +
          (y + 42) +
          " C " +
          (x - 10) +
          " " +
          (y + 5) +
          ", " +
          (x + 5) +
          " " +
          (y - 35) +
          ", " +
          (x + 52) +
          " " +
          (y - 48),
        fill: "none",
        stroke: organic,
        "stroke-width": "2",
        opacity
      })
    );
    return;
  }

  if (motif === "work_surface") {
    group.append(
      el("path", {
        d:
          "M " +
          (x - 90) +
          " " +
          (y + 20) +
          " Q " +
          x +
          " " +
          (y + 2) +
          " " +
          (x + 90) +
          " " +
          (y + 20),
        fill: "none",
        stroke,
        "stroke-width": "4",
        opacity
      })
    );
    return;
  }

  if (motif === "companion_animal") {
    group.append(
      el("ellipse", {
        cx: x,
        cy: y,
        rx: 30,
        ry: 15,
        fill: organic,
        opacity: String(opacity * 0.5)
      }),
      el("circle", {
        cx: x + 23,
        cy: y - 9,
        r: 9,
        fill: organic,
        opacity: String(opacity * 0.48)
      })
    );
    return;
  }

  if (motif === "candle_practicals" || motif === "low_fire") {
    group.append(
      el("ellipse", {
        cx: x,
        cy: y + 18,
        rx: 36,
        ry: 12,
        fill: glow,
        opacity: String(opacity * 0.32)
      }),
      el("path", {
        d:
          "M " +
          (x - 9) +
          " " +
          (y + 15) +
          " Q " +
          x +
          " " +
          (y - 30) +
          " " +
          (x + 9) +
          " " +
          (y + 15) +
          " Q " +
          x +
          " " +
          (y - 2) +
          " " +
          (x - 9) +
          " " +
          (y + 15),
        fill: glow,
        opacity
      })
    );
    return;
  }

  if (
    motif === "clouded_glass" ||
    motif === "mirror_gate"
  ) {
    group.append(
      el("rect", {
        x: x - 34,
        y: y - 58,
        width: 68,
        height: 116,
        rx: motif === "mirror_gate" ? 34 : 8,
        fill: glow,
        stroke,
        "stroke-width": "1",
        opacity: String(opacity * 0.35)
      })
    );
    return;
  }

  if (motif === "thread_trace") {
    group.append(
      el("path", {
        d:
          "M " +
          (x - 65) +
          " " +
          y +
          " C " +
          (x - 25) +
          " " +
          (y - 45) +
          ", " +
          (x + 10) +
          " " +
          (y + 40) +
          ", " +
          (x + 65) +
          " " +
          (y - 8),
        fill: "none",
        stroke: glow,
        "stroke-width": "1.2",
        opacity
      })
    );
    return;
  }

  if (motif === "empty_frame" || motif === "nested_border") {
    group.append(
      el("rect", {
        x: x - 48,
        y: y - 36,
        width: 96,
        height: 72,
        fill: "none",
        stroke,
        "stroke-width": "1",
        opacity
      })
    );
    if (motif === "nested_border") {
      group.append(
        el("rect", {
          x: x - 38,
          y: y - 28,
          width: 76,
          height: 56,
          fill: "none",
          stroke: glow,
          "stroke-width": "1",
          opacity: String(opacity * 0.65)
        })
      );
    }
    return;
  }

  if (motif === "rain_without_sky") {
    for (let i = 0; i < 10; i += 1) {
      const dx = x - 45 + random() * 90;
      group.append(
        el("line", {
          x1: dx,
          y1: y - 45 + random() * 20,
          x2: dx - 4,
          y2: y + 25 + random() * 32,
          stroke: glow,
          "stroke-width": "1",
          opacity: String(opacity * 0.7)
        })
      );
    }
    return;
  }

  if (motif === "service_cup") {
    group.append(
      el("path", {
        d:
          "M " +
          (x - 24) +
          " " +
          (y - 12) +
          " H " +
          (x + 18) +
          " V " +
          (y + 18) +
          " Q " +
          x +
          " " +
          (y + 30) +
          " " +
          (x - 18) +
          " " +
          (y + 18) +
          " Z",
        fill: "none",
        stroke,
        "stroke-width": "1.5",
        opacity
      }),
      el("path", {
        d:
          "M " +
          (x + 18) +
          " " +
          (y - 2) +
          " Q " +
          (x + 38) +
          " " +
          y +
          " " +
          (x + 24) +
          " " +
          (y + 14),
        fill: "none",
        stroke,
        opacity
      })
    );
  }
}

function renderPatina(group, manifest, random, id) {
  const patina = manifest.scene?.patina || {};
  const wear = Number(patina.wear || 0.3);
  const imperfection = Number(
    patina.imperfection || 0.4
  );

  const marks = el("g", {
    class: "velastra-patina",
    fill: "none",
    stroke: "var(--room-line)"
  });

  const count = Math.round(8 + wear * 24);

  for (let i = 0; i < count; i += 1) {
    const x = 20 + random() * 760;
    const y = 20 + random() * 320;
    marks.append(
      el("line", {
        x1: x,
        y1: y,
        x2:
          x +
          (random() - 0.5) *
            (15 + imperfection * 55),
        y2:
          y +
          (random() - 0.5) *
            (4 + imperfection * 14),
        "stroke-width": String(0.5 + random()),
        opacity: String(0.02 + wear * 0.055)
      })
    );
  }

  const grain = el("rect", {
    x: 0,
    y: 0,
    width: 800,
    height: 360,
    fill: "var(--room-ink)",
    opacity: String(
      0.015 + Number(manifest.medium?.grain || 0.5) * 0.035
    ),
    filter: "url(#velastra-grain-" + id + ")"
  });

  group.append(marks, grain);
}

function renderVignette(group, manifest, id) {
  const opacity =
    0.04 + Number(manifest.medium?.vignette || 0.5) * 0.12;

  const vignette = el("rect", {
    x: 0,
    y: 0,
    width: 800,
    height: 360,
    fill: "none",
    stroke: "var(--room-shadow)",
    "stroke-width": "56",
    opacity: String(opacity),
    class: "velastra-vignette"
  });

  group.append(vignette);
}

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);

  Object.entries(attrs).forEach(([key, value]) => {
    node.setAttribute(key, String(value));
  });

  return node;
}

function safeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
}

function seededRandom(seed) {
  let state = hash(seed) || 1;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1000000) / 1000000;
  };
}

function hash(value) {
  const text = String(value);
  let out = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    out ^= text.charCodeAt(i);
    out = Math.imul(out, 16777619);
  }

  return out >>> 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
