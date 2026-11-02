import {
  getRoom,
  getVisibleObjects,
  getInventory,
  getThresholdState,
  getObject,
  isGeneratedRoom
} from "./world.js";
import { applyRoomVisual } from "./visual/chroma.js";
import { renderScene } from "./visual/scene.js";

export function render({ state, world, message, dispatch }) {
  const room = getRoom(world, state, state.location);
  const objects = getVisibleObjects(world, state);
  const inventory = getInventory(world, state);
  const visual = applyRoomVisual({ room, world, state });

  document.body.dataset.room = room.id;
  document.body.dataset.generated = isGeneratedRoom(state, room.id)
    ? "true"
    : "false";

  setText("room-region", room.region);
  setText("room-title", room.name);
  setText("room-description", room.description);
  setText("response", message || "");
  setText("scene-symbol", room.symbol || "◇");

  renderScene({ room, visual, objects });
  renderObjects(objects, dispatch);
  renderExits(room, state, world, dispatch);
  renderInventory(inventory, dispatch);
  renderLedger(state, world);
}

function renderObjects(objects, dispatch) {
  const root = document.getElementById("object-list");
  root.replaceChildren();

  const groups = groupObjects(objects);

  if (!groups.length) {
    root.append(empty("Nothing has been left here."));
    return;
  }

  groups.forEach((group) => {
    const representative = group.items[0];
    const card = document.createElement("div");
    card.className = "object-card";

    const label = objectLabel(group);

    const actions = document.createElement("div");
    actions.className = "object-actions";
    actions.append(
      button("Inspect", () => dispatch("inspect", representative.id))
    );

    if (representative.portable) {
      actions.append(
        button("Take", () => dispatch("take", representative.id))
      );
    }

    card.append(label, actions);
    root.append(card);
  });
}

function renderExits(room, state, world, dispatch) {
  const root = document.getElementById("exit-list");
  root.replaceChildren();

  const exits = Object.entries(room.exits || {});

  if (!exits.length) {
    root.append(
      empty(
        "This place is complete. There is nowhere else it asks you to go."
      )
    );
    return;
  }

  exits.forEach(([direction, exit]) => {
    const card = document.createElement("div");
    card.className = "exit-card";

    const label = document.createElement("span");
    label.className = "exit-name";

    if (typeof exit === "object" && exit.threshold) {
      const threshold = getThresholdState(world, state, exit.threshold);

      if (threshold && threshold.state === "latent") {
        label.textContent = direction + " · unwritten frontier";
      } else if (threshold && threshold.state === "open") {
        const destination = getRoom(world, state, threshold.target, {
          fallback: false
        });
        label.textContent =
          direction +
          " · " +
          (destination ? destination.name : "open threshold");
      } else {
        label.textContent = direction + " · unopened threshold";
      }
    } else {
      const destination = getRoom(world, state, exit, { fallback: false });
      label.textContent =
        direction + " · " + (destination ? destination.name : "unknown");
    }

    card.append(
      label,
      button("Move " + direction, () => dispatch("move", direction))
    );

    root.append(card);
  });
}

function renderInventory(objects, dispatch) {
  const root = document.getElementById("inventory");
  root.replaceChildren();

  const groups = groupObjects(objects);

  if (!groups.length) {
    root.append(empty("Your hands are empty."));
    return;
  }

  groups.forEach((group) => {
    const representative = group.items[0];
    const card = document.createElement("div");
    card.className = "inventory-card";

    const label = objectLabel(group);

    const actions = document.createElement("div");
    actions.className = "object-actions";
    actions.append(
      button("Inspect", () => dispatch("inspect", representative.id)),
      button(
        group.items.length > 1 ? "Leave one" : "Leave",
        () => dispatch("leave", representative.id)
      )
    );

    card.append(label, actions);
    root.append(card);
  });
}

function renderLedger(state, world) {
  const root = document.getElementById("ledger");
  root.replaceChildren();

  state.ledger
    .slice(-9)
    .reverse()
    .forEach((event) => {
      const item = document.createElement("li");
      item.textContent = describeEvent(event, state, world);
      root.append(item);
    });
}

function describeEvent(event, state, world) {
  const room = event.room
    ? getRoom(world, state, event.room, { fallback: false })
    : null;
  const object = event.object ? getObject(world, state, event.object) : null;

  const roomName = room ? room.name : null;
  const objectName = object ? object.name : null;

  switch (event.action) {
    case "arrive":
      return "Arrived at the Hearth.";
    case "look":
      return "Looked around " + roomName + ".";
    case "move": {
      const destination = getRoom(world, state, event.to, {
        fallback: false
      });
      return (
        "Moved " +
        event.direction +
        " into " +
        (destination ? destination.name : "the unknown") +
        "."
      );
    }
    case "inspect":
      return "Inspected the " + objectName + ".";
    case "take":
      return "Took the " + objectName + ".";
    case "leave":
      return "Left the " + objectName + " in " + roomName + ".";
    case "sit":
      return "Sat in " + roomName + ".";
    case "return":
      return event.from === "hearth"
        ? "Remained at the Hearth."
        : "Returned to the Hearth.";
    case "meet_threshold":
      return "Met an unopened threshold.";
    case "genesis_loop": {
      const destination = getRoom(world, state, event.to, {
        fallback: false
      });
      return (
        "Genesis folded the frontier back toward " +
        (destination ? destination.name : "known ground") +
        "."
      );
    }
    case "genesis_birth": {
      const born = getRoom(world, state, event.room, { fallback: false });
      const name = born ? born.name : "a room";

      if (event.topology === "terminal") {
        return "Genesis completed a path at " + name + ".";
      }

      if (event.topology === "branch") {
        return "Genesis branched the frontier through " + name + ".";
      }

      return "Genesis gave shape to " + name + ".";
    }
    case "witness":
      return roomName + " was witnessed and became canon.";
    default:
      return "Something happened quietly.";
  }
}

function groupObjects(objects) {
  const groups = new Map();

  objects.forEach((object) => {
    const key =
      object.templateId ||
      [
        object.name,
        object.portable ? "portable" : "fixed",
        object.inspectText
      ].join("|");

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        name: object.name,
        items: []
      });
    }

    groups.get(key).items.push(object);
  });

  return Array.from(groups.values());
}

function objectLabel(group) {
  const wrapper = document.createElement("div");
  wrapper.className = "object-label";

  const name = document.createElement("span");
  name.className = "object-name";
  name.textContent =
    group.name + (group.items.length > 1 ? " ×" + group.items.length : "");

  wrapper.append(name);

  if (group.items.length > 1) {
    const meta = document.createElement("small");
    meta.className = "object-meta";
    meta.textContent = group.items.length + " distinct histories";
    wrapper.append(meta);
  }

  return wrapper;
}

function button(label, onClick) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "action-button";
  element.textContent = label;
  element.addEventListener("click", onClick);
  return element;
}

function empty(text) {
  const element = document.createElement("p");
  element.className = "empty-state";
  element.textContent = text;
  return element;
}

function setText(id, value) {
  document.getElementById(id).textContent = value || "";
}
