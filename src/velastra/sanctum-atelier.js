import { composeScenePacket } from "./scene-packet.js";
import { selectMotifs } from "./motifs.js";
import { compileAtelierManifest } from "./atelier.js";
import { compilePainterlyTruth } from "./painterly-truth.js";

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

  const painterlyTruth = compilePainterlyTruth({
    truthGrammar: world.velastraPainterlyTruth,
    room,
    objects
  });

  const identityFacts = [
    room.name,
    room.region || null,
    room.description || null,
    ...((visual && visual.effects) || []).map((effect) =>
      String(effect).replaceAll("_", " ")
    ),
    sceneTruth?.matter?.material || null,
    sceneTruth?.anomaly?.law
      ? String(sceneTruth.anomaly.law).replaceAll("_", " ")
      : null,
    ...(painterlyTruth.facts || [])
  ].filter(Boolean);

  const transientFacts = [
    ...(objects || [])
      .filter((object) => object?.portable === true)
      .map((object) => object.name),
    ...(entities || []).map(({ template }) =>
      template ? template.name : null
    )
  ].filter(Boolean);

  const scenePacket = composeScenePacket({
    sceneGrammar: world.velastraScene,
    visualIntent,
    archetype,
    subjects: [],
    relation: null,
    environment: {
      kind: room.id,
      facts: [...identityFacts],
      identityFacts,
      transientFacts,
      painterlyTruth
    },
    seed:
      "sanctum:" +
      room.id +
      ":" +
      String(sceneTruth?.seed || visual?.seed || room.id),
    provenance: {
      source: "sanctum_live_scene",
      room: room.id,
      assetScope: "place",
      transientPresenceExcludedFromCanonicalPainting: true
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
    styleGrammar: world.velastraStyle,
    scenePacket,
    motifSelection,
    seed: "sanctum-atelier:" + room.id
  });

  return {
    scenePacket,
    motifSelection,
    manifest,
    livePresence: {
      objects: (objects || []).map((object) => ({
        id: object.id,
        name: object.name,
        portable: Boolean(object.portable)
      })),
      entities: (entities || []).map(({ template, record }) => ({
        id: template.id,
        name: template.name,
        status: record.status || "present"
      }))
    }
  };
}
