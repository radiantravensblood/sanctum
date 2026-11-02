import { createSeededRandom, pick } from "./seed.js";
import { createProvenance } from "./provenance.js";
import { scopePool } from "./motif.js";
import { composeVisualProfile } from "./chroma.js";
import { composeSceneTruth } from "./scene-truth.js";
import { renderRoomLanguage } from "./language.js";

export function composeBirth({
  seed,
  realm,
  motif,
  topology,
  creationIndex,
  originRoomId,
  sourceThresholdId,
  returnDirection,
  visualGrammar,
  semanticGrammar,
  trigger = "cross_threshold"
}) {
  const random = createSeededRandom(seed + ":grammar");
  const form = pick(random, scopePool(realm.forms, motif.forms));
  const atmosphere = pick(random, scopePool(realm.atmospheres, motif.atmospheres));
  const material = pick(random, scopePool(realm.materials, motif.materials));
  const phenomenon = pick(random, scopePool(realm.phenomena, motif.phenomena));
  const objectPool = scopePool(realm.objects, motif.objects);

  const objectChance =
    typeof motif.objectChance === "number"
      ? motif.objectChance
      : typeof realm.objectChance === "number"
        ? realm.objectChance
        : 0.5;

  const objectTemplate = random() < objectChance ? pick(random, objectPool) : null;

  const roomId = [
    "genesis",
    realm.id,
    String(creationIndex).padStart(4, "0")
  ].join(".");

  const objectId = objectTemplate
    ? roomId + ".object." + objectTemplate.id
    : null;

  const provenance = createProvenance({
    seed,
    realm: realm.id,
    trigger,
    parent: sourceThresholdId
  });

  const forwardDirections = topology.frontierDirections || [];
  const nextMotifRemaining = Math.max(0, Number(motif.remaining || 1) - 1);
  const roomName = pick(
    random,
    phenomenon.nameVariants || [phenomenon.title]
  );

  const scene = composeSceneTruth({
    semanticGrammar,
    motif,
    form,
    material,
    atmosphere,
    phenomenon,
    topology: topology.type,
    seed
  });

  const language = renderRoomLanguage({
    scene,
    objectTemplate,
    returnDirection,
    forwardDirections,
    topology,
    seed
  });

  const visual = composeVisualProfile({
    visualGrammar,
    motif,
    material,
    atmosphere,
    phenomenon,
    form,
    seed,
    scene
  });

  const room = {
    id: roomId,
    name: roomName,
    region: (realm.regionName || realm.name) + " · " + motif.title,
    symbol: topology.type === "terminal" ? "·" : topology.type === "branch" ? "⌁" : "◌",
    generated: true,
    description: language.description,
    lookText: language.lookText,
    sitText: language.sitText,
    objects: objectId ? [objectId] : [],
    exits: {
      [returnDirection]: originRoomId
    },
    scene,
    visual,
    genesis: {
      seed,
      realm: realm.id,
      motif: motif.id,
      motifTitle: motif.title,
      form: form.id,
      atmosphere: atmosphere.id,
      material: material.id,
      phenomenon: phenomenon.id,
      topology: topology.type
    }
  };

  const operations = [
    {
      op: "create_room",
      id: roomId,
      value: room
    }
  ];

  if (objectTemplate) {
    operations.push({
      op: "create_object",
      id: objectId,
      room: roomId,
      value: {
        ...objectTemplate,
        id: objectId,
        templateId: objectTemplate.id,
        generated: true
      }
    });
  }

  forwardDirections.forEach((direction, index) => {
    const thresholdId = roomId + ".frontier." + String(index + 1);

    room.exits[direction] = {
      threshold: thresholdId
    };

    operations.push({
      op: "create_threshold",
      id: thresholdId,
      value: {
        id: thresholdId,
        state: "latent",
        target: null,
        mode: "frontier",
        genesisRealm: realm.id,
        motifId: nextMotifRemaining > 0 ? motif.id : null,
        motifRemaining: nextMotifRemaining,
        mutableByModel: false,
        closedText:
          realm.frontierText ||
          "Beyond this edge, the world has not been written yet."
      }
    });
  });

  operations.push({
    op: "connect_threshold",
    id: sourceThresholdId,
    target: roomId
  });

  return {
    type: "world_delta",
    kind: "birth",
    topology: topology.type,
    id: "birth:" + roomId,
    seed,
    realm: realm.id,
    motif: motif.id,
    context: {
      originRoomId,
      sourceThresholdId,
      returnDirection,
      forwardDirections,
      trigger
    },
    provenance,
    operations
  };
}

export function composeLoop({
  seed,
  realm,
  motif,
  originRoomId,
  sourceThresholdId,
  targetRoomId,
  trigger = "cross_threshold"
}) {
  return {
    type: "world_delta",
    kind: "loop",
    topology: "loop",
    id: "loop:" + sourceThresholdId,
    seed,
    realm: realm.id,
    motif: motif.id,
    context: {
      originRoomId,
      sourceThresholdId,
      trigger
    },
    provenance: createProvenance({
      seed,
      realm: realm.id,
      trigger,
      parent: sourceThresholdId
    }),
    operations: [
      {
        op: "connect_threshold",
        id: sourceThresholdId,
        target: targetRoomId
      }
    ]
  };
}
