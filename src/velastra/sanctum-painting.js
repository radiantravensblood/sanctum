import {
  getRoom,
  getVisibleObjects,
  isGeneratedRoom
} from "../world.js";
import { reconstructSceneTruth } from "../genesis/scene-truth.js";
import { buildOrientation } from "../time/orientation.js";
import { getEntitiesAt } from "../entities/entities.js";
import { applyRoomVisual } from "../visual/chroma.js";
import { buildVelastraPacket } from "./index.js";
import { compileSanctumAtelier } from "./sanctum-atelier.js";

export function buildCurrentSanctumPainting({
  state,
  world
}) {
  const room = getRoom(world, state, state.location);
  const objects = getVisibleObjects(world, state);
  const entities = getEntitiesAt(
    world,
    state,
    state.location
  );
  const scene = reconstructSceneTruth(room, world);
  const orientation = buildOrientation({ state, world });
  const visual = applyRoomVisual({
    room,
    world,
    state,
    scene,
    temporal:
      orientation && orientation.now
        ? orientation.now
        : null
  });
  const visualNow =
    orientation &&
    orientation.now &&
    orientation.now.now
      ? new Date(orientation.now.now)
      : new Date();

  const velastra = buildVelastraPacket({
    state,
    world,
    roomId: room.id,
    role:
      room.id === "threshold"
        ? "threshold"
        : "place",
    family: "sanctum",
    now: visualNow,
    apply: true
  });

  const atelier = compileSanctumAtelier({
    state,
    world,
    room,
    sceneTruth: scene,
    visual,
    visualIntent: velastra.intent,
    objects,
    entities
  });

  return {
    version: 1,
    room,
    generated: isGeneratedRoom(state, room.id),
    objects,
    entities,
    scene,
    orientation,
    visual,
    velastra,
    atelier
  };
}

export function composePaintingHandoff(painting) {
  if (
    !painting ||
    !painting.room ||
    !painting.atelier ||
    !painting.atelier.manifest
  ) {
    throw new Error(
      "A Sanctum painting packet is required."
    );
  }

  const manifest = painting.atelier.manifest;

  return freezeDeep({
    version: 1,
    protocol: "velastra.handoff.v1",
    assetKey: manifest.assetKey,
    room: {
      id: painting.room.id,
      name: painting.room.name,
      region: painting.room.region || null,
      description:
        painting.room.description || null,
      generated: Boolean(painting.generated)
    },
    manifest,
    runtimePresence: {
      excludedFromCanonicalPainting: true,
      objects: copy(
        painting.atelier.livePresence?.objects || []
      ),
      entities: copy(
        painting.atelier.livePresence?.entities || []
      ),
      temporal:
        painting.orientation &&
        painting.orientation.now
          ? copy(painting.orientation.now.local || {})
          : null
    },
    provenance: {
      source: "sanctum_atelier_handoff",
      sceneSource:
        manifest.provenance?.sceneSource || null,
      sameSceneTruthAsRuntime: true,
      canonicalPaintingRepresentsPlaceNotMoment: true
    }
  });
}

export function paintingHandoffFilename(handoff) {
  const roomId = safeFilename(
    handoff?.room?.id || "sanctum"
  );
  const assetKey = safeFilename(
    handoff?.assetKey || "painting"
  );

  return (
    roomId +
    "--" +
    assetKey +
    ".velastra.json"
  );
}

function safeFilename(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function copy(value) {
  if (value === undefined || value === null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function freezeDeep(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Object.isFrozen(value)
  ) {
    return value;
  }

  Object.values(value).forEach((child) => {
    freezeDeep(child);
  });

  return Object.freeze(value);
}
