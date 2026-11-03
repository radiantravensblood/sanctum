export function renderScene({ room, visual, scene, objects, entities = [] }) {
  const root = document.getElementById("scene-canvas");
  if (!root) return;

  const random = createRandom((scene && scene.seed) || visual.seed || room.id);
  const effects = new Set(visual.effects || []);
  const sensation = visual.sensation || {};
  const geometry = (scene && scene.geometry) || {
    form: visual.form || "chamber",
    scale: 0.55,
    enclosure: 0.7,
    depth: 0.55,
    verticality: 0.5,
    symmetry: 0.5,
    focality: 0.5
  };

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

  renderAir(svg, scene, sensation, random);
  renderArchitecture(svg, geometry, random);
  renderMatter(svg, scene, visual, random);
  renderLight(svg, scene, effects, random);
  renderAcoustics(svg, scene, effects, random);
  renderAnomaly(svg, scene, effects, sensation, random);
  renderAuthoredMarks(svg, effects, random);
  renderObjectResidue(svg, objects, random);
  renderEntityPresence(svg, entities, room, random);

  const veil = svgElement("rect", {
    x: 0,
    y: 0,
    width: 800,
    height: 360,
    fill: "url(#room-glow)",
    opacity: String(0.18 + Number(sensation.diffusion || 0.4) * 0.3),
    class: "scene-glow"
  });
  svg.append(veil);

  root.append(svg);
}

function renderAir(svg, scene, sensation, random) {
  const humidity = scene && scene.air
    ? Number(scene.air.humidity || 0)
    : Number(sensation.wetness || 0);
  const movement = scene && scene.air
    ? Number(scene.air.movement || 0.2)
    : 0.2;
  const pressure = scene && scene.air
    ? Number(scene.air.pressure || 0.5)
    : 0.5;

  const group = svgElement("g", {
    class: "air-field",
    fill: "var(--room-glow)"
  });

  const count = Math.round(5 + humidity * 16 + pressure * 6);

  for (let index = 0; index < count; index += 1) {
    const width = 70 + random() * 210;
    const height = 8 + random() * 34;
    group.append(
      svgElement("ellipse", {
        cx: 70 + random() * 660,
        cy: 45 + random() * 265,
        rx: width,
        ry: height,
        opacity: String(0.008 + humidity * 0.018 + random() * 0.012),
        transform:
          "rotate(" +
          ((random() - 0.5) * (8 + movement * 22)) +
          " 400 180)"
      })
    );
  }

  svg.append(group);
}

function renderArchitecture(svg, geometry, random) {
  const form = geometry.form || "chamber";
  const scale = clamp(Number(geometry.scale || 0.55), 0, 1);
  const enclosure = clamp(Number(geometry.enclosure || 0.7), 0, 1);
  const depth = clamp(Number(geometry.depth || 0.55), 0, 1);
  const verticality = clamp(Number(geometry.verticality || 0.5), 0, 1);
  const focality = clamp(Number(geometry.focality || 0.5), 0, 1);

  const inset = 55 + enclosure * 75;
  const floor = 322 - verticality * 16;
  const ceiling = 58 + (1 - verticality) * 52;
  const span = 800 - inset * 2;
  const center = 400;

  const group = svgElement("g", {
    class: "scene-architecture",
    fill: "none",
    stroke: "var(--room-line)",
    "stroke-width": String(1.2 + enclosure * 1.2)
  });

  if (form === "gallery") {
    const bays = Math.max(4, Math.round(4 + depth * 5));
    const bayWidth = span / bays;

    for (let index = 0; index < bays; index += 1) {
      const x = inset + index * bayWidth;
      const archHeight = 70 + verticality * 70;
      group.append(
        svgElement("path", {
          d:
            "M " +
            x +
            " " +
            floor +
            " V " +
            (floor - archHeight) +
            " Q " +
            (x + bayWidth / 2) +
            " " +
            ceiling +
            " " +
            (x + bayWidth) +
            " " +
            (floor - archHeight) +
            " V " +
            floor,
          opacity: String(0.2 + depth * 0.24 + index * 0.012)
        })
      );
    }
  } else if (form === "cistern") {
    const basinWidth = 150 + scale * 180;
    const basinHeight = 28 + depth * 34;
    group.append(
      svgElement("ellipse", {
        cx: center,
        cy: floor - 20,
        rx: basinWidth,
        ry: basinHeight,
        opacity: "0.6"
      }),
      svgElement("ellipse", {
        cx: center,
        cy: floor - 20,
        rx: basinWidth * 0.72,
        ry: basinHeight * 0.62,
        opacity: "0.36"
      }),
      svgElement("path", {
        d:
          "M " +
          inset +
          " " +
          floor +
          " L " +
          (center - basinWidth * 0.7) +
          " " +
          (floor - 70) +
          " L " +
          (center + basinWidth * 0.7) +
          " " +
          (floor - 70) +
          " L " +
          (800 - inset) +
          " " +
          floor,
        opacity: "0.32"
      })
    );
  } else if (form === "shrine") {
    const shrineWidth = 110 + scale * 120;
    const shrineHeight = 100 + verticality * 90;
    group.append(
      svgElement("path", {
        d:
          "M " +
          (center - shrineWidth) +
          " " +
          floor +
          " V " +
          (floor - shrineHeight) +
          " Q " +
          center +
          " " +
          ceiling +
          " " +
          (center + shrineWidth) +
          " " +
          (floor - shrineHeight) +
          " V " +
          floor,
        opacity: "0.5"
      }),
      svgElement("circle", {
        cx: center,
        cy: floor - shrineHeight * 0.55,
        r: 34 + focality * 48,
        opacity: String(0.2 + focality * 0.28)
      }),
      svgElement("path", {
        d:
          "M " +
          (center - 84) +
          " " +
          floor +
          " H " +
          (center + 84) +
          " L " +
          (center + 52) +
          " " +
          (floor - 58) +
          " H " +
          (center - 52) +
          " Z",
        opacity: "0.38"
      })
    );
  } else {
    const shoulder = 90 + scale * 120;
    group.append(
      svgElement("path", {
        d:
          "M " +
          inset +
          " " +
          floor +
          " V " +
          (ceiling + 50) +
          " L " +
          (center - shoulder) +
          " " +
          ceiling +
          " H " +
          (center + shoulder) +
          " L " +
          (800 - inset) +
          " " +
          (ceiling + 50) +
          " V " +
          floor,
        opacity: "0.46"
      })
    );
  }

  const perspectiveLines = Math.round(4 + depth * 7);
  for (let index = 0; index < perspectiveLines; index += 1) {
    const t = index / Math.max(1, perspectiveLines - 1);
    const y = floor - t * (70 + depth * 42);
    const pull = t * (35 + depth * 55);
    group.append(
      svgElement("line", {
        x1: inset + pull,
        y1: y,
        x2: 800 - inset - pull,
        y2: y,
        opacity: String(0.05 + t * 0.08)
      })
    );
  }

  svg.append(group);
}

function renderMatter(svg, scene, visual, random) {
  const material =
    (scene && scene.matter && scene.matter.material) ||
    visual.material ||
    "stone";
  const roughness = scene && scene.matter
    ? Number(scene.matter.roughness || 0.5)
    : 0.5;
  const reflectivity = scene && scene.matter
    ? Number(scene.matter.reflectivity || 0.3)
    : 0.3;

  const group = svgElement("g", {
    class: "scene-material",
    fill: "none",
    stroke: "var(--room-accent)"
  });

  if (material === "brass") {
    const count = Math.round(7 + reflectivity * 9);
    for (let index = 0; index < count; index += 1) {
      const x = 50 + random() * 700;
      group.append(
        svgElement("path", {
          d:
            "M " +
            x +
            " 48 Q " +
            (x + random() * 50 - 25) +
            " 170 " +
            (x + random() * 80 - 40) +
            " 330",
          "stroke-width": String(0.7 + reflectivity * 1.1),
          opacity: String(0.08 + reflectivity * 0.22 + random() * 0.08)
        })
      );
    }
  } else if (material === "glass") {
    const count = Math.round(4 + reflectivity * 5);
    for (let index = 0; index < count; index += 1) {
      group.append(
        svgElement("polygon", {
          points:
            75 + index * 92 + ",52 " +
            (122 + index * 92) + ",36 " +
            (178 + index * 92) + ",318 " +
            (118 + index * 92) + ",326",
          fill: "var(--room-glow)",
          opacity: String(0.02 + reflectivity * 0.055),
          "stroke-width": "1"
        })
      );
    }
  } else if (material === "wood") {
    const count = Math.round(8 + roughness * 10);
    for (let index = 0; index < count; index += 1) {
      const y = 80 + index * 15;
      group.append(
        svgElement("path", {
          d:
            "M 85 " +
            y +
            " Q 300 " +
            (y + random() * 12 - 6) +
            " 715 " +
            (y + random() * 7 - 3.5),
          "stroke-width": "1",
          opacity: String(0.035 + roughness * 0.075)
        })
      );
    }
  } else {
    const count = Math.round(10 + roughness * 24);
    for (let index = 0; index < count; index += 1) {
      const x = 55 + random() * 690;
      const y = 58 + random() * 250;
      group.append(
        svgElement("line", {
          x1: x,
          y1: y,
          x2: x + 10 + random() * (24 + roughness * 30),
          y2: y + random() * 4 - 2,
          "stroke-width": "1",
          opacity: String(0.025 + roughness * 0.07)
        })
      );
    }
  }

  svg.append(group);
}

function renderLight(svg, scene, effects, random) {
  const light = (scene && scene.light) || null;

  if (light && light.source === "impossible_directional") {
    const direction = random() > 0.5 ? "right" : "left";
    const topA = direction === "right" ? 520 + random() * 60 : 40;
    const topB = direction === "right" ? 790 : 260 + random() * 40;
    const bottomA = direction === "right" ? 390 + random() * 50 : 0;
    const bottomB = direction === "right" ? 610 : 380 + random() * 60;

    svg.append(
      svgElement("polygon", {
        points:
          topA +
          ",0 " +
          topB +
          ",0 " +
          bottomB +
          ",360 " +
          bottomA +
          ",360",
        fill: "var(--room-glow)",
        opacity: String(0.07 + Number(light.intensity || 0.5) * 0.15),
        class: "borrowed-light"
      })
    );
    return;
  }

  if (effects.has("borrowed_light")) {
    svg.append(
      svgElement("polygon", {
        points: "540,0 760,0 610,360 420,360",
        fill: "var(--room-glow)",
        opacity: "0.14",
        class: "borrowed-light"
      })
    );
  }
}

function renderAcoustics(svg, scene, effects, random) {
  const acoustics = (scene && scene.acoustics) || null;
  const shouldEcho =
    (acoustics && Number(acoustics.reverb || 0) > 0.68) ||
    effects.has("echo_rings");

  if (!shouldEcho) return;

  const reverb = acoustics ? Number(acoustics.reverb || 0.7) : 0.7;
  const delay = acoustics ? Number(acoustics.delay || 0.4) : 0.4;

  const group = svgElement("g", {
    class: "echo-field",
    fill: "none",
    stroke: "var(--room-glow)"
  });

  const cx = 250 + random() * 300;
  const cy = 120 + random() * 110;
  const rings = Math.round(3 + reverb * 3);

  for (let index = 0; index < rings; index += 1) {
    const radius = 28 + index * (26 + delay * 15);
    group.append(
      svgElement("ellipse", {
        cx,
        cy,
        rx: radius * (1.3 + reverb * 0.35),
        ry: radius * (0.4 + delay * 0.2),
        opacity: String(Math.max(0.045, 0.19 - index * 0.026)),
        "stroke-width": "1",
        "stroke-dasharray": index % 2 ? "5 8" : "2 10"
      })
    );
  }

  svg.append(group);
}

function renderAnomaly(svg, scene, effects, sensation, random) {
  const law =
    scene && scene.anomaly
      ? scene.anomaly.law
      : null;

  if (law === "precipitation_without_visible_source" || effects.has("rain")) {
    renderRain(svg, scene, sensation, random);
  }

  if (law === "architecture_exhibits_slow_respiration" || effects.has("breathing_wall")) {
    renderBreathingWall(svg, scene, random);
  }
}

function renderRain(svg, scene, sensation, random) {
  const humidity = scene && scene.air
    ? Number(scene.air.humidity || 0.6)
    : Number(sensation.wetness || 0.6);
  const locality = scene && scene.anomaly
    ? Number(scene.anomaly.locality || 0.6)
    : 0.6;
  const intensity = scene && scene.anomaly
    ? Number(scene.anomaly.intensity || 0.7)
    : 0.7;

  const group = svgElement("g", {
    class: "rain-field",
    stroke: "var(--room-glow)",
    "stroke-linecap": "round"
  });

  const count = Math.round(26 + humidity * 34 + intensity * 24);
  const width = 260 + locality * 380;
  const start = 400 - width / 2;

  for (let index = 0; index < count; index += 1) {
    const x = start + random() * width;
    const y = -35 + random() * 360;
    const length = 14 + random() * (26 + intensity * 26);

    group.append(
      svgElement("line", {
        x1: x,
        y1: y,
        x2: x - 4,
        y2: y + length,
        opacity: String(0.06 + random() * (0.12 + intensity * 0.16)),
        "stroke-width": String(0.6 + random() * 1.1)
      })
    );
  }

  svg.append(group);
}

function renderBreathingWall(svg, scene, random) {
  const locality = scene && scene.anomaly
    ? Number(scene.anomaly.locality || 0.5)
    : 0.5;
  const x = random() > 0.5 ? 105 : 695;
  const width = 5 + locality * 8;

  svg.append(
    svgElement("path", {
      d: "M " + x + " 72 Q " + (x + 26) + " 180 " + x + " 306",
      fill: "none",
      stroke: "var(--room-organic)",
      "stroke-width": String(width),
      opacity: "0.1",
      class: "breathing-wall"
    })
  );
}

function renderAuthoredMarks(svg, effects, random) {
  if (effects.has("vines") || effects.has("leaf_haze")) {
    renderVines(svg, random);
  }

  if (effects.has("mirror")) {
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

  if (effects.has("frames")) {
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

  if (effects.has("hearth")) {
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

function renderEntityPresence(svg, entities, room, random) {
  if (!entities.length) return;

  const group = svgElement("g", {
    class: "entity-presence",
    "aria-hidden": "true"
  });

  entities.forEach(({ template, record }, index) => {
    const entityRandom = createRandom(
      room.id + ":" + template.id + ":" + String(index)
    );
    const x = 110 + entityRandom() * 580;
    const y = 78 + entityRandom() * 190;
    const shape = template.visual && template.visual.shape;

    if (shape === "moth") {
      const moth = svgElement("g", {
        class: "entity-moth entity-state-" + (record.status || "present"),
        transform: "translate(" + x + " " + y + ")"
      });

      moth.append(
        svgElement("ellipse", {
          cx: -7,
          cy: 0,
          rx: 10,
          ry: 5,
          fill: "var(--room-glow)",
          opacity: "0.18",
          transform: "rotate(-28)"
        }),
        svgElement("ellipse", {
          cx: 7,
          cy: 0,
          rx: 10,
          ry: 5,
          fill: "var(--room-glow)",
          opacity: "0.18",
          transform: "rotate(28)"
        }),
        svgElement("circle", {
          cx: 0,
          cy: 1,
          r: 2.4,
          fill: "var(--room-ink)",
          opacity: "0.46"
        })
      );

      group.append(moth);
      return;
    }

    if (shape === "brassling") {
      const brassling = svgElement("g", {
        class: "entity-brassling entity-state-" + (record.status || "present"),
        transform: "translate(" + x + " " + (250 + entityRandom() * 45) + ")",
        stroke: "var(--room-accent)",
        fill: "none",
        opacity: "0.46",
        "stroke-width": "1.6",
        "stroke-linecap": "round"
      });

      brassling.append(
        svgElement("ellipse", {
          cx: 0,
          cy: 0,
          rx: 13,
          ry: 7,
          fill: "var(--room-accent)",
          opacity: "0.08"
        }),
        svgElement("line", { x1: -8, y1: 5, x2: -12, y2: 13 }),
        svgElement("line", { x1: -2, y1: 6, x2: -3, y2: 14 }),
        svgElement("line", { x1: 5, y1: 6, x2: 7, y2: 14 }),
        svgElement("line", { x1: 10, y1: 4, x2: 14, y2: 12 }),
        svgElement("circle", {
          cx: 8,
          cy: -1,
          r: 1.5,
          fill: "var(--room-glow)",
          stroke: "none"
        })
      );

      group.append(brassling);
      return;
    }

    const threadling = svgElement("path", {
      class: "entity-threadling entity-state-" + (record.status || "present"),
      d:
        "M " +
        (x - 22) +
        " " +
        y +
        " C " +
        (x - 4) +
        " " +
        (y - 18) +
        ", " +
        (x + 10) +
        " " +
        (y + 18) +
        ", " +
        (x + 26) +
        " " +
        (y - 2) +
        " C " +
        (x + 12) +
        " " +
        (y - 12) +
        ", " +
        (x - 10) +
        " " +
        (y + 14) +
        ", " +
        (x - 22) +
        " " +
        y,
      fill: "none",
      stroke: "var(--room-ink)",
      opacity: "0.22",
      "stroke-width": "1.2",
      "stroke-linecap": "round"
    });

    group.append(threadling);
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
