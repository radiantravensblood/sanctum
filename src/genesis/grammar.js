import { createSeededRandom, pick } from "./seed.js";
import { createProvenance } from "./provenance.js";

export function composeBirth({
  seed,
  realm,
  creationIndex,
  originRoomId,
  sourceThresholdId,
  returnDirection,
  trigger = "cross_threshold"
}) {
  const random = createSeededRandom(seed);
  const form = pick(random, realm.forms);
  const atmosphere = pick(random, realm.atmospheres);
  const material = pick(random, realm.materials);
  const phenomenon = pick(random, realm.phenomena);
  const objectTemplate = pick(random, realm.objects);

  const roomId = [
    "genesis",
    realm.id,
    String(creationIndex).padStart(4, "0")
  ].join(".");

  const objectId = roomId + ".object." + objectTemplate.id;
  const nextThresholdId = roomId + ".frontier";
  const forwardDirection = realm.forwardDirection || "north";

  const provenance = createProvenance({
    seed,
    realm: realm.id,
    trigger,
    parent: sourceThresholdId
  });

  const room = {
    id: roomId,
    name: "The " + phenomenon.title,
    region: realm.regionName || realm.name,
    symbol: "◌",
    generated: true,
    description: [
      form.description,
      atmosphere.description,
      material.description,
      phenomenon.description
    ].join(" "),
    lookText:
      "The way back remains " +
      returnDirection +
      ". The " +
      objectTemplate.name +
      " is here. " +
      capitalize(forwardDirection) +
      " ends at another unwritten edge.",
    sitText: form.sitText + " " + atmosphere.description,
    objects: [objectId],
    exits: {
      [returnDirection]: originRoomId,
      [forwardDirection]: {
        threshold: nextThresholdId
      }
    },
    genesis: {
      seed,
      realm: realm.id,
      form: form.id,
      atmosphere: atmosphere.id,
      material: material.id,
      phenomenon: phenomenon.id
    }
  };

  const object = {
    ...objectTemplate,
    id: objectId,
    generated: true
  };

  const threshold = {
    id: nextThresholdId,
    state: "latent",
    target: null,
    mode: "frontier",
    genesisRealm: realm.id,
    mutableByModel: false,
    closedText: realm.frontierText || "Beyond this edge, the world has not been written yet."
  };

  return {
    type: "world_delta",
    id: "birth:" + roomId,
    seed,
    realm: realm.id,
    context: {
      originRoomId,
      sourceThresholdId,
      returnDirection,
      forwardDirection,
      trigger
    },
    provenance,
    operations: [
      {
        op: "create_room",
        id: roomId,
        value: room
      },
      {
        op: "create_object",
        id: objectId,
        room: roomId,
        value: object
      },
      {
        op: "create_threshold",
        id: nextThresholdId,
        value: threshold
      },
      {
        op: "connect_threshold",
        id: sourceThresholdId,
        target: roomId
      }
    ]
  };
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
