import {
  getRoom,
  getVisibleObjects,
  getInventory,
  getThresholdState,
  getObject,
  isGeneratedRoom
} from "./world.js";

export function render({ state, world, message, dispatch }) {
  const room = getRoom(world, state, state.location);
  const objects = getVisibleObjects(world, state);
  const inventory = getInventory(world, state);

  document.body.dataset.room = room.id;
  document.body.dataset.generated = isGeneratedRoom(state, room.id) ? "true" : "false";

  setText("room-region", room.region);
  setText("room-title", room.name);
  setText("room-description", room.description);
  setText("response", message || "");
  setText("scene-symbol", room.symbol || "◇");

  renderObjects(objects, dispatch);
  renderExits(room, state, world, dispatch);
  renderInventory(inventory, dispatch);
  renderLedger(state, world);
}

function renderObjects(objects, dispatch) {
  const root = document.getElementById("object-list");
  root.replaceChildren();

  if (!objects.length) {
    root.append(empty("Nothing has been left here."));
    return;
  }

  objects.forEach((object) => {
    const card = document.createElement("div");
    card.className = "object-card";

    const name = document.createElement("span");
    name.className = "object-name";
    name.textContent = object.name;

    const actions = document.createElement("div");
    actions.className = "object-actions";
    actions.append(button("Inspect", () => dispatch("inspect", object.id)));

    if (object.portable) {
      actions.append(button("Take", () => dispatch("take", object.id)));
    }

    card.append(name, actions);
    root.append(card);
  });
}

function renderExits(room, state, world, dispatch) {
  const root = document.getElementById("exit-list");
  root.replaceChildren();

  Object.entries(room.exits || {}).forEach(([direction, exit]) => {
    const card = document.createElement("div");
    card.className = "exit-card";

    const label = document.createElement("span");
    label.className = "exit-name";

    if (typeof exit === "object" && exit.threshold) {
      const threshold = getThresholdState(world, state, exit.threshold);

      if (threshold && threshold.state === "latent") {
        label.textContent = direction + " · unwritten frontier";
      } else if (threshold && threshold.state === "open") {
        const destination = getRoom(world, state, threshold.target, { fallback: false });
        label.textContent = direction + " · " + (destination ? destination.name : "open threshold");
      } else {
        label.textContent = direction + " · unopened threshold";
      }
    } else {
      const destination = getRoom(world, state, exit, { fallback: false });
      label.textContent = direction + " · " + (destination ? destination.name : "unknown");
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

  if (!objects.length) {
    root.append(empty("Your hands are empty."));
    return;
  }

  objects.forEach((object) => {
    const card = document.createElement("div");
    card.className = "inventory-card";

    const name = document.createElement("span");
    name.textContent = object.name;

    const actions = document.createElement("div");
    actions.className = "object-actions";
    actions.append(
      button("Inspect", () => dispatch("inspect", object.id)),
      button("Leave", () => dispatch("leave", object.id))
    );

    card.append(name, actions);
    root.append(card);
  });
}

function renderLedger(state, world) {
  const root = document.getElementById("ledger");
  root.replaceChildren();

  state.ledger.slice(-8).reverse().forEach((event) => {
    const item = document.createElement("li");
    item.textContent = describeEvent(event, state, world);
    root.append(item);
  });
}

function describeEvent(event, state, world) {
  const room = event.room
    ? getRoom(world, state, event.room, { fallback: false })
    : null;
  const object = event.object
    ? getObject(world, state, event.object)
    : null;

  const roomName = room ? room.name : null;
  const objectName = object ? object.name : null;

  switch (event.action) {
    case "arrive":
      return "Arrived at the Hearth.";
    case "look":
      return "Looked around " + roomName + ".";
    case "move": {
      const destination = getRoom(world, state, event.to, { fallback: false });
      return "Moved " + event.direction + " into " + (destination ? destination.name : "the unknown") + ".";
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
      return event.from === "hearth" ? "Remained at the Hearth." : "Returned to the Hearth.";
    case "meet_threshold":
      return "Met an unopened threshold.";
    case "genesis_birth": {
      const born = getRoom(world, state, event.room, { fallback: false });
      return "Genesis gave shape to " + (born ? born.name : "a room") + ".";
    }
    case "witness":
      return roomName + " was witnessed and became canon.";
    default:
      return "Something happened quietly.";
  }
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
