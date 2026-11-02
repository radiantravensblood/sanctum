import { createSeededRandom, pick } from "./seed.js";

export function composeSceneTruth({
  semanticGrammar,
  motif,
  form,
  material,
  atmosphere,
  phenomenon,
  topology,
  seed
}) {
  const formTruth = semanticGrammar.forms[form.id] || {};
  const materialTruth = semanticGrammar.materials[material.id] || {};
  const atmosphereTruth = semanticGrammar.atmospheres[atmosphere.id] || {};
  const phenomenonTruth = semanticGrammar.phenomena[phenomenon.id] || {};
  const random = createSeededRandom(seed + ":scene-truth");

  const scent = unique([
    ...(atmosphereTruth.scent || []),
    ...(phenomenonTruth.scent || [])
  ]);

  const touch = unique([...(materialTruth.touch || [])]);

  return {
    version: semanticGrammar.version || 1,
    seed,
    motif: {
      id: motif.id,
      title: motif.title
    },
    topology,
    geometry: {
      form: form.id,
      ...(formTruth.geometry || {})
    },
    matter: {
      material: material.id,
      ...(materialTruth.matter || {})
    },
    air: {
      atmosphere: atmosphere.id,
      ...(atmosphereTruth.air || {})
    },
    acoustics: {
      ...(atmosphereTruth.acoustics || {})
    },
    light: {
      ...(phenomenonTruth.light || {})
    },
    anomaly: {
      phenomenon: phenomenon.id,
      ...(phenomenonTruth.anomaly || {})
    },
    senses: {
      scent,
      touch
    },
    language: {
      geometry: pick(random, formTruth.phrases || [form.description]),
      atmosphere: pick(random, atmosphereTruth.phrases || [atmosphere.description]),
      matter: pick(random, materialTruth.phrases || [material.description]),
      anomaly: pick(random, phenomenonTruth.phrases || [phenomenon.description])
    }
  };
}

export function reconstructSceneTruth(room, world) {
  if (room.scene) return room.scene;
  if (!room.genesis) return null;

  const realm = world.realms[room.genesis.realm];
  if (!realm) return null;

  const motif = (realm.motifs || []).find((item) => item.id === room.genesis.motif);
  const form = (realm.forms || []).find((item) => item.id === room.genesis.form);
  const material = (realm.materials || []).find((item) => item.id === room.genesis.material);
  const atmosphere = (realm.atmospheres || []).find((item) => item.id === room.genesis.atmosphere);
  const phenomenon = (realm.phenomena || []).find((item) => item.id === room.genesis.phenomenon);

  if (!motif || !form || !material || !atmosphere || !phenomenon) return null;

  return composeSceneTruth({
    semanticGrammar: world.semanticGrammar,
    motif,
    form,
    material,
    atmosphere,
    phenomenon,
    topology: room.genesis.topology,
    seed: room.genesis.seed
  });
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}
