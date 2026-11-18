import { validateBundle } from './core.mjs';
import { RasterAtelier } from './engine.mjs';

const PASS_INFO = {
  '0001': {
    atelier: 'Atelier 0001',
    label: '0001 · First Block-In',
    events: './scenes/hearth.events.json',
    exportName: 'hearth-atelier-0001.png'
  },
  '0002': {
    atelier: 'Atelier 0002',
    label: '0002 · Painterly Passes',
    events: './scenes/hearth.events.0002.json',
    exportName: 'hearth-atelier-0002.png'
  },
  '0003': {
    atelier: 'Atelier 0003',
    label: '0003 · Eye / Hand — Breakdown',
    workflow: './scenes/hearth.workflow.0003.json',
    exportName: 'hearth-atelier-0003-breakdown.png'
  }
};

async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
  return response.json();
}

const params = new URLSearchParams(window.location.search);
const requestedPass = params.get('pass');
const branchDefaultPass = '0003';
const passId = PASS_INFO[requestedPass] ? requestedPass : branchDefaultPass;
const pass = PASS_INFO[passId];

const [scene, layout, workflow] = await Promise.all([
  loadJSON('./scenes/hearth.scene.json'),
  loadJSON('./scenes/hearth.layout.json'),
  pass.workflow ? loadJSON(pass.workflow) : Promise.resolve(null)
]);

const activeStage = workflow
  ? workflow.stages.find((stage) => stage.status === 'active') || null
  : null;

let stagePackets = [];
let events;

if (workflow) {
  const paintStages = workflow.stages.filter(
    (stage) => stage.kind === 'paint' && ['reviewed', 'active'].includes(stage.status)
  );

  stagePackets = await Promise.all(
    paintStages.map(async (stage) => ({
      stage,
      packet: await loadJSON('./scenes/' + stage.source)
    }))
  );

  events = {
    protocol: 'velastra.atelier.raster.v1',
    scene: scene.id,
    pass: activeStage ? `0003-${activeStage.id}` : '0003',
    designation: activeStage
      ? `Eye / Hand Loop — ${activeStage.label}`
      : 'Eye / Hand Loop',
    stageSources: stagePackets.map(({ stage, packet }) => ({
      stage: stage.id,
      source: stage.source,
      status: stage.status,
      eventCount: (packet.events || []).length
    })),
    events: stagePackets.flatMap(({ packet }) => packet.events || [])
  };
} else {
  events = await loadJSON(pass.events);
}

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
const atelierTitle = document.querySelector('#atelier-title');
const colorInput = document.querySelector('#paint-color');
const sizeInput = document.querySelector('#paint-size');
const opacityInput = document.querySelector('#paint-opacity');
const sessionCount = document.querySelector('#session-count');
const status = document.querySelector('#status');
const eyeHandPanel = document.querySelector('#eye-hand-panel');
const stagePipeline = document.querySelector('#stage-pipeline');
const reviewQuestions = document.querySelector('#review-questions');
const observationNotes = document.querySelector('#observation-notes');
const observationMeta = document.querySelector('#observation-meta');
let timer = null;
let pointer = null;

for (const [id, info] of Object.entries(PASS_INFO)) {
  const option = document.createElement('option');
  option.value = id;
  option.textContent = info.label;
  passSelect.append(option);
}
passSelect.value = passId;
passLabel.textContent = activeStage
  ? `0003 · Eye / Hand — ${activeStage.label}`
  : pass.label;
atelierTitle.textContent = pass.atelier;
document.title = `${pass.atelier} · Velastra`;
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
  }, passId === '0002' ? 85 : passId === '0003' ? 120 : 110);
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
const stageSummary = stagePackets.length
  ? ' · ' + stagePackets.map(({ stage, packet }) => `${stage.id}:${(packet.events || []).length}`).join(' + ')
  : '';
validationNode.textContent = `VALID · pass ${passId} · ${validation.counts.events} events${stageSummary} · scene ${validation.fingerprints.scene} · layout ${validation.fingerprints.layout} · events ${validation.fingerprints.events}`;

if (workflow) {
  eyeHandPanel.hidden = false;
  for (const stage of workflow.stages) {
    const item = document.createElement('li');
    item.className = `stage stage-${stage.status}`;
    item.innerHTML = `<span class="stage-mark" aria-hidden="true"></span><div><strong>${stage.id.replace('_', ' · ')} · ${stage.label}</strong><span>${stage.status}</span><p>${stage.purpose}</p></div>`;
    stagePipeline.append(item);
  }

  for (const question of workflow.activeReview.questions) {
    const li = document.createElement('li');
    li.textContent = question;
    reviewQuestions.append(li);
  }

  observationMeta.textContent = `${workflow.activeReview.id} · next stage remains locked until this review is answered.`;
}

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

document.querySelector('#copy-observation').addEventListener('click', async () => {
  if (!workflow) return;
  const payload = {
    protocol: 'velastra.atelier.observation.v1',
    workflow: workflow.id,
    review: workflow.activeReview.id,
    stage: workflow.activeReview.stage,
    scene: scene.id,
    pass: passId,
    fingerprints: validation.fingerprints,
    authoredEvents: validation.counts.events,
    stageSources: events.stageSources || [],
    manualSessionEvents: atelier.sessionEvents.length,
    questions: workflow.activeReview.questions,
    notes: observationNotes.value.trim(),
    decision: 'pending_human_and_painter_review',
    nextStageLocked: true
  };
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  status.textContent = 'Observation packet copied. The next stage remains locked.';
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
const passSource = requestedPass ? `URL requested pass=${requestedPass}` : `branch default pass=${branchDefaultPass}`;
status.textContent = workflow
  ? `${activeStage ? activeStage.label : pass.label} ready. ${passSource}. Play the cumulative painting, inspect the active stage, then record what the canvas actually did.`
  : `${pass.label} ready. ${passSource}. Play the authored pass or enable Live paint.`;

window.VelastraAtelier = { atelier, scene, layout, events, validation, passId, workflow, activeStage, stagePackets };
