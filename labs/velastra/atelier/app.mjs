import { validateBundle } from './core.mjs';
import { RasterAtelier } from './engine.mjs';

const PASS_INFO = {
  '0001': {
    label: '0001 · First Block-In',
    events: './scenes/hearth.events.json',
    exportName: 'hearth-atelier-0001.png'
  },
  '0002': {
    label: '0002 · Painterly Passes',
    events: './scenes/hearth.events.0002.json',
    exportName: 'hearth-atelier-0002.png'
  }
};

async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
  return response.json();
}

const params = new URLSearchParams(window.location.search);
const requestedPass = params.get('pass');
const passId = PASS_INFO[requestedPass] ? requestedPass : '0002';
const pass = PASS_INFO[passId];

const [scene, layout, events] = await Promise.all([
  loadJSON('./scenes/hearth.scene.json'),
  loadJSON('./scenes/hearth.layout.json'),
  loadJSON(pass.events)
]);

const validation = validateBundle({ scene, layout, events });
if (!validation.valid) throw new Error('Atelier bundle invalid: ' + validation.errors.join('; '));

const canvas = document.querySelector('#atelier-canvas');
const atelier = new RasterAtelier({ display: canvas, scene, layout, events });
const slider = document.querySelector('#timeline');
const eventLabel = document.querySelector('#event-label');
const playButton = document.querySelector('#play');
const overlayToggle = document.querySelector('#authority-overlay');
const liveToggle = document.querySelector('#live-paint');
const layerSelect = document.querySelector('#paint-layer');
const passSelect = document.querySelector('#pass-select');
const passLabel = document.querySelector('#pass-label');
const colorInput = document.querySelector('#paint-color');
const sizeInput = document.querySelector('#paint-size');
const opacityInput = document.querySelector('#paint-opacity');
const sessionCount = document.querySelector('#session-count');
const status = document.querySelector('#status');
let timer = null;
let pointer = null;

for (const [id, info] of Object.entries(PASS_INFO)) {
  const option = document.createElement('option');
  option.value = id;
  option.textContent = info.label;
  passSelect.append(option);
}
passSelect.value = passId;
passLabel.textContent = pass.label;
passSelect.addEventListener('change', () => {
  const url = new URL(window.location.href);
  url.searchParams.set('pass', passSelect.value);
  window.location.assign(url);
});

function refreshTimeline() {
  slider.max = String(atelier.allEvents().length);
  slider.value = String(Math.min(Number(slider.value || 0), atelier.allEvents().length));
  sessionCount.textContent = String(atelier.sessionEvents.length);
}

function redraw(count = Number(slider.value)) {
  atelier.replay(count);
  atelier.compose({ overlay: overlayToggle.checked });
  eventLabel.textContent = `${count} / ${atelier.allEvents().length}`;
}

function stopPlayback() {
  if (timer) clearInterval(timer);
  timer = null;
  playButton.textContent = 'Play';
}

function startPlayback() {
  stopPlayback();
  let index = Number(slider.value);
  if (index >= atelier.allEvents().length) index = 0;
  playButton.textContent = 'Pause';
  timer = setInterval(() => {
    index += 1;
    slider.value = String(index);
    redraw(index);
    if (index >= atelier.allEvents().length) stopPlayback();
  }, passId === '0002' ? 85 : 110);
}

for (const layer of scene.layers) {
  const option = document.createElement('option');
  option.value = layer.id;
  option.textContent = layer.label || layer.id;
  layerSelect.append(option);
}
layerSelect.value = 'detail';

const facts = document.querySelector('#scene-facts');
for (const fact of scene.truth) {
  const li = document.createElement('li');
  li.textContent = fact;
  facts.append(li);
}

const objects = document.querySelector('#fixed-objects');
for (const object of scene.fixedObjects) {
  const li = document.createElement('li');
  li.textContent = `${object.count} × ${object.kind} → ${object.region}`;
  objects.append(li);
}

const regions = document.querySelector('#regions');
for (const [id, region] of Object.entries(layout.regions)) {
  const li = document.createElement('li');
  li.textContent = `${id}: ${region.purpose}`;
  regions.append(li);
}

const validationNode = document.querySelector('#validation');
validationNode.textContent = `VALID · pass ${passId} · ${validation.counts.events} events · scene ${validation.fingerprints.scene} · layout ${validation.fingerprints.layout} · events ${validation.fingerprints.events}`;

slider.addEventListener('input', () => {
  stopPlayback();
  redraw(Number(slider.value));
});
playButton.addEventListener('click', () => timer ? stopPlayback() : startPlayback());
document.querySelector('#reset').addEventListener('click', () => {
  stopPlayback();
  slider.value = '0';
  redraw(0);
});
document.querySelector('#finish').addEventListener('click', () => {
  stopPlayback();
  slider.value = String(atelier.allEvents().length);
  redraw(atelier.allEvents().length);
});
overlayToggle.addEventListener('change', () => atelier.compose({ overlay: overlayToggle.checked }));
document.querySelector('#export').addEventListener('click', () => atelier.exportPNG(pass.exportName));
document.querySelector('#undo').addEventListener('click', () => {
  if (atelier.undoManual()) {
    refreshTimeline();
    slider.value = String(atelier.allEvents().length);
    redraw(atelier.allEvents().length);
  }
});
document.querySelector('#copy-session').addEventListener('click', async () => {
  const payload = JSON.stringify({
    protocol: scene.protocol,
    scene: scene.id,
    pass: passId,
    events: atelier.sessionEvents
  }, null, 2);
  await navigator.clipboard.writeText(payload);
  status.textContent = 'Session event JSON copied.';
});

function pointFromPointer(event) {
  const rect = canvas.getBoundingClientRect();
  return [
    (event.clientX - rect.left) / rect.width,
    (event.clientY - rect.top) / rect.height
  ];
}

canvas.addEventListener('pointerdown', (event) => {
  if (!liveToggle.checked) return;
  canvas.setPointerCapture(event.pointerId);
  pointer = { id: event.pointerId, points: [pointFromPointer(event)] };
});
canvas.addEventListener('pointermove', (event) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const point = pointFromPointer(event);
  const previous = pointer.points[pointer.points.length - 1];
  pointer.points.push(point);
  const preview = atelier.beginManualStroke({
    layerId: layerSelect.value,
    color: hexToRgb(colorInput.value),
    radius: Number(sizeInput.value),
    opacity: Number(opacityInput.value),
    points: [previous, point]
  });
  preview.id += '-preview-' + pointer.points.length;
  atelier.applyEvent(preview);
  atelier.compose({ overlay: overlayToggle.checked });
});
canvas.addEventListener('pointerup', (event) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const manual = atelier.beginManualStroke({
    layerId: layerSelect.value,
    color: hexToRgb(colorInput.value),
    radius: Number(sizeInput.value),
    opacity: Number(opacityInput.value),
    points: pointer.points
  });
  pointer = null;
  atelier.sessionEvents.push(manual);
  refreshTimeline();
  slider.value = String(atelier.allEvents().length);
  redraw(atelier.allEvents().length);
});
canvas.addEventListener('pointercancel', () => {
  pointer = null;
  redraw(atelier.allEvents().length);
});

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const number = Number.parseInt(value, 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

refreshTimeline();
slider.value = '0';
redraw(0);
status.textContent = `${pass.label} ready. Play the authored pass or enable Live paint.`;
window.VelastraAtelier = { atelier, scene, layout, events, validation, passId };
