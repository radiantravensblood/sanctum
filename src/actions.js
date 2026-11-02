import { appendEvent } from "./state.js";
import { getRoom, getThresholdState, getVisibleObjects, getInventory } from "./world.js";

export function performAction({ verb, target = null, state, world }) {
  const room = getRoom(world, state.location);

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

    case "return":
      return returnHome(state, world);

    default:
      return result(state, "The Sanctum does not know that verb yet.");
  }
}

function move(direction, state, world) {
  const room = getRoom(world, state.location);
  const exit = room.exits && room.exits[direction];

  if (!exit) {
    return result(state, "There is no way through in that direction.");
  }

  if (typeof exit === "object" && exit.threshold) {
    const threshold = getThresholdState(world, state, exit.threshold);

    if (!threshold) {
      return result(state, "Something about this boundary is unreadable.");
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
  const targetRoom = world.rooms[targetRoomId];
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

  return result(state, targetRoom.description);
}

function inspect(objectId, state, world) {
  const visible = [
    ...getVisibleObjects(world, state),
    ...getInventory(world, state)
  ].some((object) => object.id === objectId);

  const object = world.objects[objectId];

  if (!object || !visible) {
    return result(state, "That is not presently within reach.");
  }

  appendEvent(state, {
    action: "inspect",
    object: objectId,
    room: state.location
  });

  return result(state, object.inspectText);
}

function take(objectId, state, world) {
  const object = world.objects[objectId];

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
  const object = world.objects[objectId];

  if (!object || state.objectLocations[objectId] !== "inventory") {
    return result(state, "You are not carrying that.");
  }

  state.objectLocations[objectId] = state.location;

  appendEvent(state, {
    action: "leave",
    object: objectId,
    room: state.location
  });

  return result(state, "You leave the " + object.name + " here. The room accepts it without comment.");
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

  return result(state, getRoom(world, "hearth").description);
}

function result(state, message) {
  return { state, message };
}
