import { composeScenePacket } from "./scene-packet.js";
import { selectMotifs } from "./motifs.js";
import { compileAtelierManifest } from "./atelier.js";

export function compileSanctumAtelier({
  state,
  world,
  room,
  sceneTruth,
  visual,
  visualIntent,
  objects = [],
  entities = []
}) {
  const archetype =
    room.id === "threshold"
      ? "threshold_revelation"
      : "place_tableau";

  const environmentFacts = [
    room.name,
    room.region || null,
    room.description || null,
    ...(objects || []).map((object) => object.name),
    ...((visual && visual.effects) || []).map((effect) =>
      String(effect).replaceAll("_", " ")
    ),
    sceneTruth?.matter?.material || null,
    sceneTruth?.anomaly?.law
      ? String(sceneTruth.anomaly.law).replaceAll("_", " ")
      : null
  ].filter(Boolean);

  const subjects = (entities || [])
    .slice(0, 3)
    .map(({ template }) => ({
      id: template.id,
      role: "resident",
      description:
        template.name +
        " · " +
        String(template.kind || "inhabitant").replaceAll("_", " ")
    }));

  const scenePacket = composeScenePacket({
    sceneGrammar: world.velastraScene,
    visualIntent,
    archetype,
    subjects,
    relation: null,
    environment: {
      kind: room.id,
      facts: environmentFacts
    },
    seed:
      "sanctum:" +
      room.id +
      ":" +
      String(sceneTruth?.seed || visual?.seed || room.id),
    provenance: {
      source: "sanctum_live_scene",
      room: room.id
    }
  });

  const motifSelection = selectMotifs({
    atlas: world.velastraMotifs,
    scenePacket,
    limit: 7,
    seed: "sanctum-motifs:" + room.id
  });

  const manifest = compileAtelierManifest({
    atelierGrammar: world.velastraAtelier,
    assetRegistry: world.velastraAssets,
    scenePacket,
    motifSelection,
    seed: "sanctum-atelier:" + room.id
  });

  return {
    scenePacket,
    motifSelection,
    manifest
  };
}
