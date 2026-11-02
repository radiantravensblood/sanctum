export function renderScene({ room, visual, objects }) {
  const root = document.getElementById("scene-canvas");
  if (!root) return;

  const random = createRandom(visual.seed || room.id);
  const form = visual.form || "chamber";
  const effects = new Set(visual.effects || []);
  const sensation = visual.sensation || {};

  root.replaceChildren();

  const svg = svgElement("svg", {
    viewBox: "0 0 800 360",
    role: "img",
    "aria-label": "Atmospheric rendering of " + room.name,
    preserveAspectRatio: "xMidYMid slice"
  });

  const defs = svgElement("defs");
  defs.append(
    linearGradient("room-field", [
      ["0%", "var(--room-shadow)", 1],
      ["55%", "var(--room-field)", 1],
      ["100%", "var(--room-surface)", 0.92]
    ]),
    radialGradient("room-glow", [
      ["0%", "var(--room-glow)", 0.48],
      ["45%", "var(--room-accent)", 0.12],
      ["100%", "var(--room-field)", 0]
    ])
  );
  svg.append(defs);

  svg.append(
    svgElement("rect", {
      x: 0,
      y: 0,
      width: 800,
      height: 360,
      fill: "url(#room-field)"
    })
  );

  renderArchitecture(svg, form, random);
  renderMaterial(svg, visual.material, random);

  if (effects.has("borrowed_light")) renderBorrowedLight(svg, random);
  if (effects.has("rain")) renderRain(svg, random, sensation);
  if (effects.has("echo_rings")) renderEchoes(svg, random);
  if (effects.has("vines") || effects.has("leaf_haze")) renderVines(svg, random);
  if (effects.has("breathing_wall")) renderBreathingWall(svg, random);
  if (effects.has("mirror")) renderMirror(svg);
  if (effects.has("frames")) renderFrames(svg);
  if (effects.has("hearth")) renderHearth(svg, random);

  renderObjectResidue(svg, objects, random);

  const veil = svgElement("rect", {
    x: 0,
    y: 0,
    width: 800,
    height: 360,
    fill: "url(#room-glow)",
    opacity: String(0.28 + Number(sensation.diffusion || 0.4) * 0.34),
    class: "scene-glow"
  });
  svg.append(veil);

  root.append(svg);
}

function renderArchitecture(svg, form, random) {
  const group = svgElement("g", {
    class: "scene-architecture",
    fill: "none",
    stroke: "var(--room-line)",
    "stroke-width": "2"
  });

  if (form === "gallery") {
    for (let index = 0; index < 5; index += 1) {
      const x = 70 + index * 165;
      group.append(
        svgElement("path", {
          d: "M " + x + " 310 V 150 Q " + (x + 60) + " 70 " + (x + 120) + " 150 V 310",
          opacity: String(0.28 + index * 0.05)
        })
      );
    }
  } else if (form === "cistern") {
    group.append(
      svgElement("ellipse", { cx: 400, cy: 284, rx: 250, ry: 48, opacity: "0.62" }),
      svgElement("ellipse", { cx: 400, cy: 284, rx: 188, ry: 31, opacity: "0.42" }),
      svgElement("path", { d: "M 125 305 L 220 230 L 580 230 L 675 305", opacity: "0.4" })
    );
  } else if (form === "shrine") {
    group.append(
      svgElement("path", { d: "M 210 310 V 128 Q 400 42 590 128 V 310", opacity: "0.55" }),
      svgElement("circle", { cx: 400, cy: 190, r: 72, opacity: "0.42" }),
      svgElement("path", { d: "M 315 310 H 485 L 456 256 H 344 Z", opacity: "0.46" })
    );
  } else {
    group.append(
      svgElement("path", { d: "M 95 310 V 118 L 220 72 H 580 L 705 118 V 310", opacity: "0.48" }),
      svgElement("path", { d: "M 220 72 L 290 146 H 510 L 580 72", opacity: "0.26" })
    );
  }

  for (let index = 0; index < 7; index += 1) {
    const y = 318 - index * (15 + random() * 4);
    group.append(
      svgElement("line", {
        x1: 80 + index * 9,
        y1: y,
        x2: 720 - index * 9,
        y2: y,
        opacity: String(0.09 + index * 0.018)
      })
    );
  }

  svg.append(group);
}

function renderMaterial(svg, material, random) {
  const group = svgElement("g", {
    class: "scene-material",
    fill: "none",
    stroke: "var(--room-accent)"
  });

  if (material === "brass") {
    for (let index = 0; index < 10; index += 1) {
      const x = 50 + random() * 700;
      group.append(
        svgElement("path", {
          d: "M " + x + " 50 Q " + (x + random() * 50 - 25) + " 170 " + (x + random() * 80 - 40) + " 330",
          "stroke-width": "1",
          opacity: String(0.12 + random() * 0.16)
        })
      );
    }
  } else if (material === "glass") {
    for (let index = 0; index < 6; index += 1) {
      group.append(
        svgElement("polygon", {
          points:
            100 + index * 105 + ",60 " +
            (150 + index * 105) + ",42 " +
            (190 + index * 105) + ",312 " +
            (135 + index * 105) + ",322",
          fill: "var(--room-glow)",
          opacity: String(0.025 + random() * 0.04),
          "stroke-width": "1"
        })
      );
    }
  } else if (material === "wood") {
    for (let index = 0; index < 12; index += 1) {
      const y = 95 + index * 18;
      group.append(
        svgElement("path", {
          d: "M 100 " + y + " Q 300 " + (y + random() * 10 - 5) + " 700 " + y,
          "stroke-width": "1",
          opacity: "0.08"
        })
      );
    }
  } else {
    for (let index = 0; index < 18; index += 1) {
      const x = 60 + random() * 680;
      const y = 65 + random() * 240;
      group.append(
        svgElement("line", {
          x1: x,
          y1: y,
          x2: x + 12 + random() * 34,
          y2: y + random() * 3 - 1.5,
          "stroke-width": "1",
          opacity: "0.07"
        })
      );
    }
  }

  svg.append(group);
}

function renderBorrowedLight(svg, random) {
  svg.append(
    svgElement("polygon", {
      points:
        (520 + random() * 60) + ",0 760,0 610,360 " + (390 + random() * 50) + ",360",
      fill: "var(--room-glow)",
      opacity: "0.16",
      class: "borrowed-light"
    })
  );
}

function renderRain(svg, random, sensation) {
  const group = svgElement("g", {
    class: "rain-field",
    stroke: "var(--room-glow)",
    "stroke-linecap": "round"
  });
  const count = Math.round(34 + Number(sensation.wetness || 0.5) * 46);

  for (let index = 0; index < count; index += 1) {
    const x = 70 + random() * 660;
    const y = -30 + random() * 360;
    const length = 16 + random() * 44;
    group.append(
      svgElement("line", {
        x1: x,
        y1: y,
        x2: x - 5,
        y2: y + length,
        opacity: String(0.08 + random() * 0.24),
        "stroke-width": String(0.7 + random() * 1.1)
      })
    );
  }

  svg.append(group);
}

function renderEchoes(svg, random) {
  const group = svgElement("g", {
    class: "echo-field",
    fill: "none",
    stroke: "var(--room-glow)"
  });

  const cx = 250 + random() * 300;
  const cy = 130 + random() * 100;
  [34, 62, 94, 132].forEach((radius, index) => {
    group.append(
      svgElement("ellipse", {
        cx,
        cy,
        rx: radius * 1.5,
        ry: radius * 0.55,
        opacity: String(0.18 - index * 0.025),
        "stroke-width": "1",
        "stroke-dasharray": index % 2 ? "5 8" : "2 10"
      })
    );
  });

  svg.append(group);
}

function renderVines(svg, random) {
  const group = svgElement("g", {
    class: "vine-field",
    fill: "none",
    stroke: "var(--room-organic)",
    "stroke-linecap": "round"
  });

  for (let index = 0; index < 6; index += 1) {
    const startX = index % 2 === 0 ? 0 : 800;
    const direction = startX === 0 ? 1 : -1;
    const y = 70 + random() * 240;
    group.append(
      svgElement("path", {
        d:
          "M " +
          startX +
          " " +
          y +
          " C " +
          (startX + direction * 90) +
          " " +
          (y - 50) +
          ", " +
          (startX + direction * 130) +
          " " +
          (y + 40) +
          ", " +
          (startX + direction * (190 + random() * 90)) +
          " " +
          (y - 20 + random() * 40),
        opacity: "0.26",
        "stroke-width": String(1 + random())
      })
    );
  }

  svg.append(group);
}

function renderBreathingWall(svg, random) {
  const x = random() > 0.5 ? 115 : 685;
  svg.append(
    svgElement("path", {
      d: "M " + x + " 82 Q " + (x + 25) + " 180 " + x + " 300",
      fill: "none",
      stroke: "var(--room-organic)",
      "stroke-width": "8",
      opacity: "0.1",
      class: "breathing-wall"
    })
  );
}

function renderMirror(svg) {
  svg.append(
    svgElement("rect", {
      x: 330,
      y: 62,
      width: 140,
      height: 236,
      rx: 70,
      fill: "var(--room-glow)",
      opacity: "0.06",
      stroke: "var(--room-accent)",
      "stroke-width": "2"
    })
  );
}

function renderFrames(svg) {
  const group = svgElement("g", {
    fill: "none",
    stroke: "var(--room-accent)",
    opacity: "0.22"
  });

  [130, 310, 510].forEach((x, index) => {
    group.append(
      svgElement("rect", {
        x,
        y: 88 + index * 14,
        width: 115,
        height: 145 - index * 8,
        "stroke-width": "2"
      })
    );
  });

  svg.append(group);
}

function renderHearth(svg, random) {
  svg.append(
    svgElement("ellipse", {
      cx: 400,
      cy: 286,
      rx: 110,
      ry: 25,
      fill: "var(--room-accent)",
      opacity: "0.08"
    }),
    svgElement("path", {
      d: "M 360 290 Q 400 190 440 290 Q 405 252 400 290 Q 390 245 360 290",
      fill: "var(--room-glow)",
      opacity: "0.38",
      class: "hearth-flame"
    })
  );
}

function renderObjectResidue(svg, objects, random) {
  const portable = objects.filter((object) => object.portable);
  if (!portable.length) return;

  const group = svgElement("g", {
    class: "object-residue",
    fill: "var(--room-accent)",
    opacity: "0.52"
  });

  portable.slice(0, 8).forEach((object, index) => {
    const x = 310 + index * 26 + random() * 14;
    const y = 298 - random() * 14;
    group.append(
      svgElement("circle", {
        cx: x,
        cy: y,
        r: object.templateId === "brass_token" ? 6 : 3
      })
    );
  });

  svg.append(group);
}

function linearGradient(id, stops) {
  const gradient = svgElement("linearGradient", {
    id,
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "100%"
  });
  stops.forEach(([offset, color, opacity]) => {
    gradient.append(
      svgElement("stop", {
        offset,
        "stop-color": color,
        "stop-opacity": String(opacity)
      })
    );
  });
  return gradient;
}

function radialGradient(id, stops) {
  const gradient = svgElement("radialGradient", { id });
  stops.forEach(([offset, color, opacity]) => {
    gradient.append(
      svgElement("stop", {
        offset,
        "stop-color": color,
        "stop-opacity": String(opacity)
      })
    );
  });
  return gradient;
}

function svgElement(tag, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });
  return element;
}

function createRandom(seed) {
  let value = hashString(seed);
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(input) {
  let hash = 2166136261;
  const value = String(input || "sanctum");
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
