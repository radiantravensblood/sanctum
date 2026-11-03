import { appendEvent } from "./state.js";
import {
  getRoom,
  getObject,
  getThresholdState,
  getVisibleObjects,
  getInventory,
  isGeneratedRoom
} from "./world.js";
import { crossFrontier } from "./genesis/genesis.js";
import { markWitnessed } from "./genesis/provenance.js";
import { describeObjectTrail } from "./memory/language.js";
import { describeEntity, getEntityRecord, rememberEntity } from "./entities/entities.js";
import { proposeInteraction, resolveAcceptedCompany } from "./interactions/accord.js";

export function performAction({ verb, target = null, state, world }) {
  const room = getRoom(world, state, state.location);

  switch (verb) {
    case "look":
      appendEvent(state, { action: "look", room: room.id });
      return result(state, room.lookText || room.description);

    case "move":
      return move(target, state, world);

    case "inspect":
      return inspect(target, state, world);

    case "take":
      return take(target, state, world);

    case "leave":
      return leave(target, state, world);

    case "sit":
      appendEvent(state, { action: "sit", room: room.id });
      return result(state, room.sitText || "You sit. The room remains.");

    case "observe_entity":
      return observeEntity(target, state, world);

    case "interact":
      return interact(target, state, world);

    case "return":
      return returnHome(state, world);

    default:
      return result(state, "The Sanctum does not know that verb yet.");
  }
}

function move(direction, state, world) {
  const room = getRoom(world, state, state.location);
  const exit = room.exits && room.exits[direction];

  if (!exit) {
    return result(state, "There is no way through in that direction.");
  }

  if (typeof exit === "object" && exit.threshold) {
    let threshold = getThresholdState(world, state, exit.threshold);

    if (!threshold) {
      return result(state, "Something about this boundary is unreadable.");
    }

    if (threshold.state === "latent" && threshold.mode === "frontier") {
      const birth = crossFrontier({
        threshold,
        direction,
        state,
        world
      });

      if (!birth.allowed) {
        return result(state, birth.message);
      }

      threshold = getThresholdState(world, state, exit.threshold);
    }

    if (threshold.state !== "open" || !threshold.target) {
      appendEvent(state, {
        action: "meet_threshold",
        room: room.id,
        threshold: threshold.id
      });
      return result(state, threshold.closedText);
    }

    return enterRoom(threshold.target, direction, state, world);
  }

  return enterRoom(exit, direction, state, world);
}

function enterRoom(targetRoomId, direction, state, world) {
  const targetRoom = getRoom(world, state, targetRoomId, { fallback: false });

  if (!targetRoom) {
    return result(state, "The path has no stable destination.");
  }

  const from = state.location;
  state.location = targetRoomId;
  state.visits[targetRoomId] = (state.visits[targetRoomId] || 0) + 1;

  appendEvent(state, {
    action: "move",
    from,
    to: targetRoomId,
    direction
  });

  if (isGeneratedRoom(state, targetRoomId) && markWitnessed(state, targetRoomId)) {
    appendEvent(state, {
      action: "witness",
      room: targetRoomId
    });
  }

  const company = resolveAcceptedCompany({
    state,
    world,
    actorId: "siege",
    from,
    to: targetRoomId,
    direction
  });

  const companyText = company.messages.length
    ? " " + company.messages.join(" ")
    : "";

  return result(state, targetRoom.description + companyText);
}

function inspect(objectId, state, world) {
  const visible = [
    ...getVisibleObjects(world, state),
    ...getInventory(world, state)
  ].some((object) => object.id === objectId);

  const object = getObject(world, state, objectId);

  if (!object || !visible) {
    return result(state, "That is not presently within reach.");
  }

  appendEvent(state, {
    action: "inspect",
    object: objectId,
    room: state.location
  });

  return result(
    state,
    object.inspectText + describeObjectTrail({ state, world, objectId })
  );
}

function take(objectId, state, world) {
  const object = getObject(world, state, objectId);

  if (!object || state.objectLocations[objectId] !== state.location) {
    return result(state, "That is not here to take.");
  }

  if (!object.portable) {
    return result(state, "It belongs to this place.");
  }

  state.objectLocations[objectId] = "inventory";

  appendEvent(state, {
    action: "take",
    object: objectId,
    from: state.location
  });

  return result(state, "You take the " + object.name + ". Nothing marks the act as progress.");
}

function leave(objectId, state, world) {
  const object = getObject(world, state, objectId);

  if (!object || state.objectLocations[objectId] !== "inventory") {
    return result(state, "You are not carrying that.");
  }

  state.objectLocations[objectId] = state.location;

  appendEvent(state, {
    action: "leave",
    object: objectId,
    room: state.location
  });

  return result(
    state,
    "You leave the " + object.name + " here. The room accepts it without comment."
  );
}

function observeEntity(entityId, state, world) {
  const record = getEntityRecord(state, entityId);

  if (!record || record.location !== state.location) {
    return result(state, "Whatever you noticed is no longer here.");
  }

  record.lastObservedAt = new Date().toISOString();

  rememberEntity(record, {
    at: record.lastObservedAt,
    action: "observed",
    room: state.location,
    by: "siege"
  });

  appendEvent(state, {
    action: "observe_entity",
    room: state.location,
    entity: entityId
  });

  return result(
    state,
    describeEntity({
      world,
      state,
      entityId
    })
  );
}

function interact(spec, state, world) {
  if (!spec || !spec.targetId || !spec.affordance) {
    return result(state, "The interaction proposal is incomplete.");
  }

  const outcome = proposeInteraction({
    state,
    world,
    actorId: "siege",
    targetId: spec.targetId,
    affordance: spec.affordance,
    objectId: spec.objectId || null
  });

  return result(state, outcome.message);
}

function returnHome(state, world) {
  if (state.location === "hearth") {
    appendEvent(state, { action: "return", from: "hearth", to: "hearth" });
    return result(state, "You are already at the Hearth.");
  }

  const from = state.location;
  state.location = "hearth";
  state.visits.hearth = (state.visits.hearth || 0) + 1;

  appendEvent(state, {
    action: "return",
    from,
    to: "hearth"
  });

  return result(state, getRoom(world, state, "hearth").description);
}

function result(state, message) {
  return { state, message };
}
