import { getObjectMemory } from "./mnemosyne.js";
import { getRoom } from "../world.js";
import { getEntityTemplate } from "../entities/entities.js";

export function describeObjectTrail({ state, world, objectId }) {
  const memory = getObjectMemory(state, objectId);
  const trail = uniqueRooms(memory.locations || []);

  if (!trail.length) return "";

  const named = trail
    .slice(-4)
    .map((entry) => {
      const room = getRoom(world, state, entry.room, { fallback: false });
      return room ? room.name : null;
    })
    .filter(Boolean);

  if (!named.length) return "";

  if (named.length === 1) {
    return " Its history still points back toward " + named[0] + ".";
  }

  return " Its history passes through " + naturalList(named) + ".";
}

export function describeLocalEcho(event, state, world, currentRoomId) {
  const roomName = (roomId) => {
    const room = getRoom(world, state, roomId, { fallback: false });
    return room ? room.name : "somewhere unnamed";
  };
  const entityName = (entityId) => {
    const entity = getEntityTemplate(world, entityId);
    return entity ? entity.name : "an inhabitant";
  };

  switch (event.action) {
    case "arrive":
      return "This was where the traversal began.";
    case "look":
      return "You stopped to look carefully.";
    case "sit":
      return "You sat here without asking the room for anything.";
    case "inspect":
      return "Something in this room was examined.";
    case "leave":
      return "Something was left here.";
    case "take":
      return "Something once resting here was carried away.";
    case "object_manifest":
      return "An object first entered the world here.";
    case "observe_entity":
      return "An inhabitant was noticed here.";
    case "entity_move":
      if (event.to === currentRoomId && event.from) {
        return entityName(event.entity) + " arrived from " + roomName(event.from) + ".";
      }
      if (event.from === currentRoomId && event.to) {
        return entityName(event.entity) + " departed toward " + roomName(event.to) + ".";
      }
      return entityName(event.entity) + " passed through this place.";
    case "entity_linger":
      return entityName(event.entity) + " remained here for a while.";
    case "entity_rest":
      return entityName(event.entity) + " rested here.";
    case "entity_notice_object":
      return entityName(event.entity) + " attended to something in this room.";
    case "entity_encounter":
      return entityName(event.entity) + " and " + entityName(event.otherEntity) + " shared this room long enough to notice one another.";
    case "interaction": {
      const target = entityName(event.targetEntity);
      const verb = String(event.affordance || "interaction").replaceAll("_", " ");

      if (event.outcome === "accepted") {
        return target + " accepted an invitation to " + verb + ".";
      }

      if (event.outcome === "deferred") {
        return target + " left the " + verb + " unanswered for now.";
      }

      return target + " declined the " + verb + ".";
    }
    case "entity_accompany":
      return entityName(event.entity) + " chose to travel onward in company.";
    case "interaction_boundary":
      return entityName(event.entity) + " chose not to continue through this boundary.";
    case "relation_phase": {
      const names = (event.entities || []).map(entityName);
      const subject = names.length === 2
        ? names[0] + " and " + names[1]
        : "Two inhabitants";

      if (event.toPhase === "friends") {
        return "The house has seen enough of " + subject + "'s choices to call them friends.";
      }

      if (event.toPhase === "companionate") {
        return subject + " have begun choosing one another's company with some regularity.";
      }

      if (event.toPhase === "familiar") {
        return subject + " have become familiar to one another.";
      }

      return "A relationship changed here.";
    }
    case "witness":
      return "This place was witnessed and entered canon.";
    case "genesis_birth":
      return "Genesis first gave this place shape.";
    case "genesis_loop":
      return "An unwritten edge folded back into remembered ground.";
    case "move":
      if (event.to === currentRoomId && event.from) {
        return "You arrived here from " + roomName(event.from) + ".";
      }
      if (event.from === currentRoomId && event.to) {
        return "You departed toward " + roomName(event.to) + ".";
      }
      return "A path through this place was crossed.";
    case "return":
      if (event.from === currentRoomId) {
        return "You returned from here to the Hearth.";
      }
      return "The Hearth received a return.";
    case "meet_threshold":
      return "A boundary here remained closed.";
    default:
      return "Something happened here quietly.";
  }
}

function uniqueRooms(locations) {
  const seen = new Set();
  const result = [];

  locations.forEach((entry) => {
    if (!entry.room || seen.has(entry.room)) return;
    seen.add(entry.room);
    result.push(entry);
  });

  return result;
}

function naturalList(values) {
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return values[0] + " and " + values[1];
  return values.slice(0, -1).join(", ") + ", and " + values[values.length - 1];
}
