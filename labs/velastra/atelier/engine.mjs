import { clamp, pointToPixels, regionPath, seededRandom } from './core.mjs';

function rgba(color, opacity = 1) {
  if (Array.isArray(color)) {
    const [r, g, b, a = 1] = color;
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${clamp(a * opacity)})`;
  }
  return color;
}

function mixColor(a, b, amount) {
  const t = clamp(amount);
  return [
    a[0] * (1 - t) + b[0] * t,
    a[1] * (1 - t) + b[1] * t,
    a[2] * (1 - t) + b[2] * t
  ];
}

function createLayerCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  return { canvas, ctx };
}

export class RasterAtelier {
  constructor({ display, scene, layout, events }) {
    this.display = display;
    this.display.width = scene.canvas.width;
    this.display.height = scene.canvas.height;
    this.displayCtx = display.getContext('2d');
    this.scene = scene;
    this.layout = layout;
    this.baseEvents = events.events || [];
    this.sessionEvents = [];
    this.layers = new Map();
    this.scene.layers.forEach((layer) => {
      this.layers.set(layer.id, { ...createLayerCanvas(display.width, display.height), meta: layer });
    });
    this.appliedCount = 0;
  }

  reset() {
    for (const layer of this.layers.values()) {
      layer.ctx.clearRect(0, 0, this.display.width, this.display.height);
    }
    this.appliedCount = 0;
    this.compose();
  }

  allEvents() {
    return [...this.baseEvents, ...this.sessionEvents];
  }

  replay(count = this.allEvents().length) {
    this.reset();
    const events = this.allEvents().slice(0, count);
    for (const event of events) this.applyEvent(event);
    this.appliedCount = events.length;
    this.compose();
  }

  applyEvent(event) {
    const layer = this.layers.get(event.layer);
    if (!layer) throw new Error('Unknown layer: ' + event.layer);
    const ctx = layer.ctx;
    ctx.save();
    try {
      if (event.clipRegion) this.clipRegion(ctx, event.clipRegion);
      switch (event.op) {
        case 'fill': return this.fill(ctx, event);
        case 'regionFill': return this.regionFill(ctx, event);
        case 'dab': return this.dab(ctx, event);
        case 'stroke': return this.stroke(ctx, event);
        case 'regionEdge': return this.regionEdge(ctx, event);
        case 'glaze': return this.glaze(ctx, event);
        case 'lift': return this.lift(ctx, event);
        case 'smudge': return this.smudge(layer, event);
        default: throw new Error('Unknown atelier operation: ' + event.op);
      }
    } finally {
      ctx.restore();
    }
  }

  clipRegion(ctx, id) {
    const region = this.layout.regions[id];
    if (!region) throw new Error('Unknown clip region: ' + id);
    regionPath(ctx, region, this.display.width, this.display.height);
    ctx.clip();
  }

  fill(ctx, event) {
    ctx.globalCompositeOperation = event.composite || 'source-over';
    ctx.globalAlpha = clamp(event.opacity ?? 1);
    ctx.fillStyle = rgba(event.color || [0, 0, 0], 1);
    ctx.fillRect(0, 0, this.display.width, this.display.height);
  }

  regionFill(ctx, event) {
    const region = this.layout.regions[event.region];
    if (!region) throw new Error('Unknown region: ' + event.region);
    ctx.globalCompositeOperation = event.composite || 'source-over';
    ctx.globalAlpha = clamp(event.opacity ?? 1);
    regionPath(ctx, region, this.display.width, this.display.height);
    if (event.gradient) {
      const [x0, y0] = pointToPixels(event.gradient.from, this.display.width, this.display.height);
      const [x1, y1] = pointToPixels(event.gradient.to, this.display.width, this.display.height);
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      for (const stop of event.gradient.stops) gradient.addColorStop(stop.at, rgba(stop.color));
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = rgba(event.color || [0, 0, 0], 1);
    }
    ctx.fill();
  }

  sampleLayerColor(ctx, x, y) {
    const px = Math.max(0, Math.min(this.display.width - 1, Math.round(x)));
    const py = Math.max(0, Math.min(this.display.height - 1, Math.round(y)));
    const data = ctx.getImageData(px, py, 1, 1).data;
    return data[3] > 0 ? [data[0], data[1], data[2]] : null;
  }

  paintStamp(ctx, {
    x,
    y,
    radius,
    aspect = 0.7,
    angle = 0,
    color,
    opacity = 1,
    flow = 1,
    texture = 'soft',
    wetness = 0,
    load = 1,
    grain = 0,
    random
  }) {
    const under = wetness > 0 ? this.sampleLayerColor(ctx, x, y) : null;
    const pigment = under ? mixColor(color, under, wetness * 0.58) : color;
    const alpha = clamp(opacity * flow * load);

    if (texture !== 'bristle') {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = rgba(pigment);
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * aspect, angle, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const bristles = Math.max(9, Math.round(radius * 0.72));
    const dryBreak = clamp(grain * (1 - wetness) * 0.86);
    const spread = radius * 0.72;

    for (let i = 0; i < bristles; i += 1) {
      if (random() < dryBreak) continue;
      const lateral = (random() - 0.5) * spread * 2;
      const longitudinal = (random() - 0.5) * radius * 0.32;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const bx = x + lateral * -sin + longitudinal * cos;
      const by = y + lateral * cos + longitudinal * sin;
      const width = Math.max(0.8, radius * (0.035 + random() * 0.075));
      const length = radius * (0.55 + random() * 0.9);
      const valueDrift = (random() - 0.5) * 18 * grain;
      const fiberColor = [
        clamp(pigment[0] + valueDrift, 0, 255),
        clamp(pigment[1] + valueDrift * 0.72, 0, 255),
        clamp(pigment[2] + valueDrift * 0.45, 0, 255)
      ];
      ctx.globalAlpha = alpha * (0.28 + random() * 0.58);
      ctx.fillStyle = rgba(fiberColor);
      ctx.beginPath();
      ctx.ellipse(
        bx,
        by,
        length * 0.5,
        width,
        angle + (random() - 0.5) * 0.18,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    if (wetness > 0.38) {
      ctx.globalAlpha = alpha * wetness * 0.16;
      ctx.fillStyle = rgba(pigment);
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 0.92, radius * aspect * 0.7, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  dab(ctx, event) {
    const [x, y] = pointToPixels(event.at, this.display.width, this.display.height);
    const radius = event.radius || 20;
    const aspect = event.aspect || 1;
    const random = seededRandom(this.scene.seed + ':' + event.id);
    const jitter = event.jitter || 0;
    const jx = (random() - 0.5) * jitter * radius;
    const jy = (random() - 0.5) * jitter * radius;
    ctx.globalCompositeOperation = event.composite || 'source-over';

    if (event.texture === 'bristle') {
      this.paintStamp(ctx, {
        x: x + jx,
        y: y + jy,
        radius,
        aspect,
        angle: event.rotation || 0,
        color: event.color,
        opacity: event.opacity ?? 1,
        flow: event.flow ?? 0.72,
        texture: 'bristle',
        wetness: event.wetness ?? 0,
        load: event.load ?? 1,
        grain: event.grain ?? 0.3,
        random
      });
      return;
    }

    ctx.globalAlpha = clamp(event.opacity ?? 1);
    const gradient = ctx.createRadialGradient(x + jx, y + jy, 0, x + jx, y + jy, radius);
    gradient.addColorStop(0, rgba(event.color, 1));
    gradient.addColorStop(0.72, rgba(event.color, 0.72));
    gradient.addColorStop(1, rgba(event.color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x + jx, y + jy, radius, radius * aspect, event.rotation || 0, 0, Math.PI * 2);
    ctx.fill();
  }

  stroke(ctx, event) {
    const points = event.points || [];
    if (points.length < 1) return;
    const brush = event.brush || {};
    const radius = brush.radius || event.radius || 18;
    const spacing = Math.max(2, brush.spacing || radius * 0.32);
    const opacity = clamp(brush.opacity ?? event.opacity ?? 1);
    const flow = clamp(brush.flow ?? 0.55);
    const random = seededRandom(this.scene.seed + ':' + event.id);
    const pixelPoints = points.map((point) => pointToPixels(point, this.display.width, this.display.height));
    ctx.globalCompositeOperation = event.composite || 'source-over';

    const dabAt = (x, y, progress = 0, travelAngle = brush.angle || 0) => {
      const pressure = Array.isArray(brush.pressure) && brush.pressure.length
        ? brush.pressure[Math.min(brush.pressure.length - 1, Math.floor(progress * brush.pressure.length))]
        : 1;
      const r = radius * (0.72 + pressure * 0.45);
      const jitter = (brush.jitter || 0) * r;
      const jx = (random() - 0.5) * jitter;
      const jy = (random() - 0.5) * jitter;
      this.paintStamp(ctx, {
        x: x + jx,
        y: y + jy,
        radius: r,
        aspect: brush.aspect || 0.7,
        angle: brush.followPath === false
          ? (brush.angle || 0)
          : travelAngle + (brush.angleOffset || 0) + (random() - 0.5) * (brush.angleJitter || 0.12),
        color: event.color,
        opacity: opacity * (0.76 + random() * 0.24),
        flow,
        texture: brush.texture || 'soft',
        wetness: brush.wetness ?? 0,
        load: brush.load ?? 1,
        grain: brush.grain ?? 0,
        random
      });
    };

    if (pixelPoints.length === 1) {
      dabAt(pixelPoints[0][0], pixelPoints[0][1], 0, brush.angle || 0);
      return;
    }

    let traveled = 0;
    let total = 0;
    for (let i = 1; i < pixelPoints.length; i += 1) {
      total += Math.hypot(pixelPoints[i][0] - pixelPoints[i - 1][0], pixelPoints[i][1] - pixelPoints[i - 1][1]);
    }
    for (let i = 1; i < pixelPoints.length; i += 1) {
      const [x0, y0] = pixelPoints[i - 1];
      const [x1, y1] = pixelPoints[i];
      const distance = Math.hypot(x1 - x0, y1 - y0);
      const travelAngle = Math.atan2(y1 - y0, x1 - x0);
      const steps = Math.max(1, Math.ceil(distance / spacing));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t;
        dabAt(x, y, total ? (traveled + distance * t) / total : 0, travelAngle);
      }
      traveled += distance;
    }
  }

  regionEdge(ctx, event) {
    const region = this.layout.regions[event.region];
    if (!region) throw new Error('Unknown edge region: ' + event.region);
    const points = [];

    if (region.shape === 'ellipse') {
      const segments = event.segments || [[0, 1]];
      const samples = Math.max(12, event.samples || 72);
      for (const [start, end] of segments) {
        const local = [];
        for (let i = 0; i <= samples; i += 1) {
          const t = start + (end - start) * (i / samples);
          const theta = t * Math.PI * 2;
          const rx = region.rx * this.display.width;
          const ry = region.ry * this.display.height;
          const cx = region.cx * this.display.width;
          const cy = region.cy * this.display.height;
          const x0 = Math.cos(theta) * rx;
          const y0 = Math.sin(theta) * ry;
          const rot = region.rotation || 0;
          const x = cx + x0 * Math.cos(rot) - y0 * Math.sin(rot);
          const y = cy + x0 * Math.sin(rot) + y0 * Math.cos(rot);
          local.push([x / this.display.width, y / this.display.height]);
        }
        points.push(local);
      }
    } else if (region.shape === 'polygon') {
      const polygon = region.points || [];
      const edges = event.edges || polygon.map((_, i) => i);
      for (const edgeIndex of edges) {
        const a = polygon[edgeIndex % polygon.length];
        const b = polygon[(edgeIndex + 1) % polygon.length];
        points.push([a, b]);
      }
    } else if (region.shape === 'rect') {
      const corners = [
        [region.x, region.y],
        [region.x + region.w, region.y],
        [region.x + region.w, region.y + region.h],
        [region.x, region.y + region.h]
      ];
      const edges = event.edges || [0, 1, 2, 3];
      for (const edgeIndex of edges) {
        points.push([corners[edgeIndex], corners[(edgeIndex + 1) % 4]]);
      }
    }

    for (let i = 0; i < points.length; i += 1) {
      this.stroke(ctx, {
        ...event,
        id: `${event.id}:edge:${i}`,
        op: 'stroke',
        points: points[i]
      });
    }
  }

  glaze(ctx, event) {
    ctx.globalCompositeOperation = event.composite || 'source-over';
    ctx.globalAlpha = clamp(event.opacity ?? 0.1);
    ctx.fillStyle = rgba(event.color || [255, 255, 255], 1);
    if (event.region) {
      regionPath(ctx, this.layout.regions[event.region], this.display.width, this.display.height);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, this.display.width, this.display.height);
    }
  }

  lift(ctx, event) {
    ctx.globalCompositeOperation = 'destination-out';
    const lifted = { ...event, color: [0, 0, 0], composite: 'destination-out' };
    if (event.points) this.stroke(ctx, lifted);
    else this.dab(ctx, lifted);
  }

  smudge(layer, event) {
    const points = (event.points || []).map((point) => pointToPixels(point, this.display.width, this.display.height));
    if (points.length < 2) return;
    const snapshot = document.createElement('canvas');
    snapshot.width = this.display.width;
    snapshot.height = this.display.height;
    snapshot.getContext('2d').drawImage(layer.canvas, 0, 0);
    const ctx = layer.ctx;
    const radius = event.radius || 26;
    ctx.globalAlpha = clamp(event.opacity ?? 0.22);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 1; i < points.length; i += 1) {
      const [sx, sy] = points[i - 1];
      const [dx, dy] = points[i];
      ctx.drawImage(snapshot, sx - radius, sy - radius, radius * 2, radius * 2, dx - radius, dy - radius, radius * 2, radius * 2);
    }
  }

  compose({ overlay = false } = {}) {
    const ctx = this.displayCtx;
    ctx.clearRect(0, 0, this.display.width, this.display.height);
    for (const layerSpec of this.scene.layers) {
      if (layerSpec.visible === false) continue;
      const layer = this.layers.get(layerSpec.id);
      ctx.globalAlpha = clamp(layerSpec.opacity ?? 1);
      ctx.globalCompositeOperation = layerSpec.composite || 'source-over';
      ctx.drawImage(layer.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (overlay) this.drawAuthorityOverlay(ctx);
  }

  drawAuthorityOverlay(ctx) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.font = '18px ui-monospace, SFMono-Regular, Menlo, monospace';
    for (const [id, region] of Object.entries(this.layout.regions)) {
      if (!region.inspect) continue;
      regionPath(ctx, region, this.display.width, this.display.height);
      ctx.strokeStyle = region.color || 'rgba(235,224,188,.65)';
      ctx.stroke();
      const anchor = region.labelAt || [region.x || region.cx || 0.04, region.y || region.cy || 0.06];
      const [x, y] = pointToPixels(anchor, this.display.width, this.display.height);
      ctx.fillStyle = region.color || 'rgba(235,224,188,.85)';
      ctx.fillText(id, x, y);
    }
    ctx.restore();
  }

  beginManualStroke({ layerId, color, radius, opacity, points }) {
    return {
      id: `manual-${Date.now()}-${this.sessionEvents.length + 1}`,
      op: 'stroke',
      layer: layerId,
      color,
      points,
      brush: {
        radius,
        opacity,
        flow: 0.48,
        spacing: Math.max(2, radius * 0.22),
        jitter: 0.08,
        aspect: 0.58,
        texture: 'bristle',
        wetness: 0.18,
        load: 0.82,
        grain: 0.34,
        followPath: true
      }
    };
  }

  applyManualEvent(event) {
    this.sessionEvents.push(event);
    this.applyEvent(event);
    this.appliedCount = this.allEvents().length;
    this.compose();
  }

  undoManual() {
    if (!this.sessionEvents.length) return false;
    this.sessionEvents.pop();
    this.replay(this.allEvents().length);
    return true;
  }

  exportPNG(filename = 'velastra-atelier.png') {
    this.compose();
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.display.toDataURL('image/png');
    link.click();
  }
}
