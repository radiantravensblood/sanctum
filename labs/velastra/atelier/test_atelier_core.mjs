import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fingerprint, seededRandom, validateBundle } from './core.mjs';

const load = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const scene = await load('./scenes/hearth.scene.json');
const layout = await load('./scenes/hearth.layout.json');
const events = await load('./scenes/hearth.events.json');

const validation = validateBundle({ scene, layout, events });
assert.equal(validation.valid, true, validation.errors.join('\n'));
assert.equal(scene.fixedObjects.length, 2);
assert.equal(scene.fixedObjects.find((x) => x.id === 'fire').count, 1);
assert.equal(scene.fixedObjects.find((x) => x.id === 'cushion').count, 1);
assert.equal(scene.truth.some((fact) => fact.includes('subordinate to the room')), true);
assert.equal(layout.regions.cushion.purpose.includes('without throne grammar'), true);
assert.equal(events.events.some((event) => event.objectId === 'fire'), true);
assert.equal(events.events.some((event) => event.objectId === 'cushion'), true);

const r1 = seededRandom('atelier-0001');
const r2 = seededRandom('atelier-0001');
assert.deepEqual([r1(), r1(), r1()], [r2(), r2(), r2()]);
assert.equal(fingerprint(scene), fingerprint(JSON.parse(JSON.stringify(scene))));

console.log('Atelier 0001 core: PASS');
console.log(JSON.stringify(validation, null, 2));
