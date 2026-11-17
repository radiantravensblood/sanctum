export const PROTOCOL = 'velastra.atelier.raster.v1';

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number(value)));
}

export function hashString(value) {
  const text = String(value);
  let out = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    out ^= text.charCodeAt(i);
    out = Math.imul(out, 16777619);
  }
  return out >>> 0;
}

export function seededRandom(seed) {
  let state = hashString(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1000000) / 1000000;
  };
}

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(
      (key) => JSON.stringify(key) + ':' + stableStringify(value[key])
    ).join(',') + '}';
  }
  return JSON.stringify(value);
}

export function fingerprint(value) {
  return hashString(stableStringify(value)).toString(16).padStart(8, '0');
}

export function pointToPixels(point, width, height) {
  return [point[0] * width, point[1] * height];
}

export function regionPath(ctx, region, width, height) {
  ctx.beginPath();
  if (region.shape === 'rect') {
    const [x, y] = pointToPixels([region.x, region.y], width, height);
    ctx.rect(x, y, region.w * width, region.h * height);
    return;
  }
  if (region.shape === 'ellipse') {
    const [cx, cy] = pointToPixels([region.cx, region.cy], width, height);
    ctx.ellipse(cx, cy, region.rx * width, region.ry * height, region.rotation || 0, 0, Math.PI * 2);
    return;
  }
  if (region.shape === 'polygon') {
    const points = region.points || [];
    if (!points.length) throw new Error('Polygon region requires points.');
    const [x0, y0] = pointToPixels(points[0], width, height);
    ctx.moveTo(x0, y0);
    for (const point of points.slice(1)) {
      const [x, y] = pointToPixels(point, width, height);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    return;
  }
  throw new Error('Unknown region shape: ' + region.shape);
}

export function validateBundle({ scene, layout, events }) {
  const errors = [];
  if (!scene || scene.protocol !== PROTOCOL) errors.push('scene protocol mismatch');
  if (!layout || layout.protocol !== PROTOCOL) errors.push('layout protocol mismatch');
  if (!events || events.protocol !== PROTOCOL) errors.push('events protocol mismatch');

  const canvas = scene?.canvas || {};
  if (!(canvas.width > 0 && canvas.height > 0)) errors.push('invalid canvas dimensions');

  const layers = new Set((scene?.layers || []).map((layer) => layer.id));
  const regions = new Set(Object.keys(layout?.regions || {}));
  const objects = new Map((scene?.fixedObjects || []).map((object) => [object.id, object]));
  const objectEvents = new Map();
  const ids = new Set();

  for (const event of events?.events || []) {
    if (!event.id || ids.has(event.id)) errors.push('event ids must be unique');
    ids.add(event.id);
    if (!layers.has(event.layer)) errors.push(`event ${event.id} references unknown layer ${event.layer}`);
    if (event.region && !regions.has(event.region)) errors.push(`event ${event.id} references unknown region ${event.region}`);
    if (event.clipRegion && !regions.has(event.clipRegion)) errors.push(`event ${event.id} references unknown clipRegion ${event.clipRegion}`);
    if (event.objectId) {
      if (!objects.has(event.objectId)) errors.push(`event ${event.id} references unknown object ${event.objectId}`);
      objectEvents.set(event.objectId, (objectEvents.get(event.objectId) || 0) + 1);
    }
  }

  for (const object of objects.values()) {
    if ((objectEvents.get(object.id) || 0) < 1) errors.push(`fixed object ${object.id} has no paint events`);
    if (!regions.has(object.region)) errors.push(`fixed object ${object.id} references unknown region ${object.region}`);
  }

  const forbidden = new Set((scene?.forbiddenObjectKinds || []).map((value) => String(value).toLowerCase()));
  for (const object of objects.values()) {
    if (forbidden.has(String(object.kind).toLowerCase())) errors.push(`fixed object ${object.id} is forbidden by scene truth`);
  }

  return {
    valid: errors.length === 0,
    errors,
    counts: {
      layers: layers.size,
      regions: regions.size,
      fixedObjects: objects.size,
      events: events?.events?.length || 0
    },
    fingerprints: {
      scene: fingerprint(scene),
      layout: fingerprint(layout),
      events: fingerprint(events)
    }
  };
}
