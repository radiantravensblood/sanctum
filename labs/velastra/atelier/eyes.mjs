const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function regionBounds(region, padding = 0.16) {
  let minX;
  let minY;
  let maxX;
  let maxY;

  if (region.shape === 'ellipse') {
    minX = region.cx - region.rx;
    maxX = region.cx + region.rx;
    minY = region.cy - region.ry;
    maxY = region.cy + region.ry;
  } else if (region.shape === 'polygon') {
    const xs = region.points.map(([x]) => x);
    const ys = region.points.map(([, y]) => y);
    minX = Math.min(...xs);
    maxX = Math.max(...xs);
    minY = Math.min(...ys);
    maxY = Math.max(...ys);
  } else if (region.shape === 'rect') {
    minX = region.x;
    minY = region.y;
    maxX = region.x + region.width;
    maxY = region.y + region.height;
  } else {
    throw new Error('Unsupported Eye region shape: ' + region.shape);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  return {
    x0: clamp(minX - width * padding),
    y0: clamp(minY - height * padding),
    x1: clamp(maxX + width * padding),
    y1: clamp(maxY + height * padding)
  };
}

function copyCrop(sourceCanvas, bounds, maxWidth = 420) {
  const sx = Math.floor(bounds.x0 * sourceCanvas.width);
  const sy = Math.floor(bounds.y0 * sourceCanvas.height);
  const sw = Math.max(1, Math.ceil((bounds.x1 - bounds.x0) * sourceCanvas.width));
  const sh = Math.max(1, Math.ceil((bounds.y1 - bounds.y0) * sourceCanvas.height));
  const scale = Math.min(1, maxWidth / sw);
  const output = document.createElement('canvas');
  output.width = Math.max(1, Math.round(sw * scale));
  output.height = Math.max(1, Math.round(sh * scale));
  const ctx = output.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, output.width, output.height);
  return output;
}

function copyWhole(sourceCanvas, maxWidth = 720) {
  const scale = Math.min(1, maxWidth / sourceCanvas.width);
  const output = document.createElement('canvas');
  output.width = Math.max(1, Math.round(sourceCanvas.width * scale));
  output.height = Math.max(1, Math.round(sourceCanvas.height * scale));
  output.getContext('2d', { willReadFrequently: true }).drawImage(
    sourceCanvas,
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
    0,
    0,
    output.width,
    output.height
  );
  return output;
}

function saturation(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function metricsFor(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const luminances = new Float32Array(width * height);
  let luminanceSum = 0;
  let saturationSum = 0;
  let warmthSum = 0;
  let pixels = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    luminances[p] = y;
    luminanceSum += y;
    saturationSum += saturation(r, g, b);
    warmthSum += (r - b) / 255;
    pixels += 1;
  }

  const mean = luminanceSum / pixels;
  let variance = 0;
  let edgeHits = 0;
  let edgeSamples = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const index = y * width + x;
      const value = luminances[index];
      variance += (value - mean) ** 2;

      if (x > 0 && y > 0) {
        const dx = Math.abs(value - luminances[index - 1]);
        const dy = Math.abs(value - luminances[index - width]);
        if (dx + dy > 28) edgeHits += 1;
        edgeSamples += 1;
      }
    }
  }

  const varianceScale = Math.max(1, Math.ceil(width / 2) * Math.ceil(height / 2));

  return {
    meanLuminance: Number((mean / 255).toFixed(3)),
    contrast: Number((Math.sqrt(variance / varianceScale) / 255).toFixed(3)),
    meanSaturation: Number((saturationSum / pixels).toFixed(3)),
    edgeDensity: Number((edgeSamples ? edgeHits / edgeSamples : 0).toFixed(3)),
    warmth: Number((warmthSum / pixels).toFixed(3))
  };
}

function makeView(id, label, canvas, bounds = null) {
  return {
    id,
    label,
    canvas,
    bounds,
    metrics: metricsFor(canvas)
  };
}

export function captureEyeCheckpoint({
  sourceCanvas,
  layout,
  scene,
  workflow,
  activeStage,
  validation,
  stageSources = []
}) {
  const targets = ['fire', 'cushion', 'threshold'];
  const views = [
    makeView('whole', 'Whole composition', copyWhole(sourceCanvas), {
      x0: 0, y0: 0, x1: 1, y1: 1
    })
  ];

  for (const id of targets) {
    const region = layout.regions[id];
    if (!region) continue;
    const bounds = regionBounds(region);
    views.push(makeView(id, id[0].toUpperCase() + id.slice(1), copyCrop(sourceCanvas, bounds), bounds));
  }

  const checkpointId = [
    workflow?.id || scene.id,
    activeStage?.id || 'no-stage',
    validation.fingerprints.events
  ].join('--');

  const packet = {
    protocol: 'velastra.atelier.eye.v1',
    checkpointId,
    scene: scene.id,
    workflow: workflow?.id || null,
    stage: activeStage?.id || null,
    fingerprints: validation.fingerprints,
    stageSources,
    laws: {
      measurementsAreInstrumentsNotJudgment: true,
      eyeCannotRewriteSceneTruth: true,
      eyeCannotAuthorizeNewObjects: true,
      handMustReceiveExplicitPainterlyIntention: true
    },
    sceneTruth: scene.truth,
    spatialRelations: layout.relations,
    views: views.map(({ id, label, bounds, metrics }) => ({
      id,
      label,
      bounds,
      metrics
    })),
    questions: [
      'At thumbnail scale, what reads before explanation?',
      'Which form collapses back into a mark when seen in isolation?',
      'Which edge relationships create depth, and which flatten it?',
      'Which passage has life and should be protected from correction?',
      'What single visual correction has the highest leverage for the next hand action?'
    ],
    eyeDecision: {
      observation: '',
      protect: [],
      change: [],
      doNot: [],
      nextPainterlyIntention: ''
    }
  };

  return { checkpointId, packet, views };
}

export function renderEyeCheckpoint(checkpoint, container) {
  container.replaceChildren();

  for (const view of checkpoint.views) {
    const article = document.createElement('article');
    article.className = 'eye-view';

    const heading = document.createElement('div');
    heading.className = 'eye-view-head';
    heading.innerHTML = `<strong>${view.label}</strong><span>${view.id}</span>`;

    const preview = document.createElement('div');
    preview.className = 'eye-preview';
    preview.append(view.canvas);

    const metrics = document.createElement('dl');
    metrics.className = 'eye-metrics';
    const labels = {
      meanLuminance: 'value',
      contrast: 'contrast',
      meanSaturation: 'saturation',
      edgeDensity: 'edge density',
      warmth: 'warmth'
    };

    for (const [key, label] of Object.entries(labels)) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = String(view.metrics[key]);
      metrics.append(dt, dd);
    }

    article.append(heading, preview, metrics);
    container.append(article);
  }
}

export function exportCheckpointPNG(checkpoint, filename = 'velastra-eye-checkpoint.png') {
  const whole = checkpoint.views.find((view) => view.id === 'whole');
  if (!whole) return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = whole.canvas.toDataURL('image/png');
  link.click();
}
