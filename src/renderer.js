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
import { reconstructSceneTruth } from "./genesis/scene-truth.js";
import { getRoomMemory } from "./memory/mnemosyne.js";
import { describeLocalEcho } from "./memory/language.js";
import { buildOrientation } from "./time/orientation.js";
import { getEntitiesAt } from "./entities/entities.js";
import { relationsForEntity } from "./entities/relation.js";
import { getAvailableAffordances } from "./interactions/accord.js";
import { getAvailableHymnosActs } from "./hymnos/hymnos.js";
import { getCrossRelation } from "./hymnos/relation.js";

export function render({ state, world, message, dispatch }) {
  const room = getRoom(world, state, state.location);
  const objects = getVisibleObjects(world, state);
  const inventory = getInventory(world, state);
  const entities = getEntitiesAt(world, state, state.location);
  const scene = reconstructSceneTruth(room, world);
  const orientation = buildOrientation({ state, world });
  const visual = applyRoomVisual({ room, world, state, scene, temporal: orientation && orientation.now });

  document.body.dataset.room = room.id;
  document.body.dataset.generated = isGeneratedRoom(state, room.id)
    ? "true"
    : "false";
  document.body.dataset.dayPhase =
    orientation && orientation.now ? orientation.now.local.dayPhase : "unknown";
  document.body.dataset.season =
    orientation && orientation.now ? orientation.now.local.season : "unknown";

  setText("room-region", room.region);
  setText("room-title", room.name);
  setText("room-description", room.description);
  setText("response", message || "");
  setText("scene-symbol", room.symbol || "◇");

  renderOrientation(orientation);
  renderScene({ room, visual, scene, objects, entities });
  renderEntities(entities, inventory, state, world, dispatch);
  renderElsewhere(state, world);
  renderObjects(objects, dispatch);
  renderExits(room, state, world, dispatch);
  renderInventory(inventory, dispatch);
  renderRoomMemory(state, world, room.id);
}

function renderOrientation(orientation) {
  if (!orientation || !orientation.now) return;

  const temporal = orientation.now;
  setText(
    "time-primary",
    temporal.local.weekday +
      " · " +
      temporal.local.time +
      " · " +
      temporal.local.dayPhaseLabel +
      " · " +
      temporal.local.seasonLabel
  );

  setText(
    "time-secondary",
    temporal.local.date + " — " + orientation.prose
  );
}

function renderEntities(entities, inventory, state, world, dispatch) {
  const root = document.getElementById("entity-list");
  if (!root) return;

  root.replaceChildren();

  if (!entities.length) {
    root.append(empty("No inhabitant is presently making itself obvious."));
    return;
  }

  entities.forEach(({ template, record }) => {
    const card = document.createElement("article");
    card.className = "entity-card encounter-card";

    const header = document.createElement("div");
    header.className = "entity-card-header";

    const identity = document.createElement("div");
    identity.className = "entity-identity";

    const symbol = document.createElement("span");
    symbol.className = "entity-symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = template.symbol || "·";

    const copy = document.createElement("div");
    copy.className = "entity-copy";

    const name = document.createElement("span");
    name.className = "entity-name";
    name.textContent = template.name;

    const meta = document.createElement("div");
    meta.className = "entity-meta";

    const kind = document.createElement("small");
    kind.className = "entity-kind";
    kind.textContent = template.kind.replaceAll("_", " ");

    const status = document.createElement("small");
    status.className = "entity-status";
    status.textContent = formatEntityStatus(record.status);

    meta.append(kind, status);
    copy.append(name, meta);

    const namedRelations = relationsForEntity(
      state,
      world,
      template.id
    ).filter((relation) => relation.label);

    if (namedRelations.length) {
      const note = document.createElement("small");
      note.className = "entity-relation";
      note.textContent = formatRelationNote(
        namedRelations[0],
        template.id
      );
      copy.append(note);
    }

    const crossRelation = getCrossRelation(
      state,
      "siege",
      template.id
    );

    if (
      crossRelation &&
      crossRelation.phase !== "unfamiliar"
    ) {
      const note = document.createElement("small");
      note.className = "entity-cross-relation";
      note.textContent = formatCrossRelationNote(
        crossRelation.phase
      );
      copy.append(note);
    }

    const localRitual = Object.values(
      (state.hymnos && state.hymnos.rituals) || {}
    ).find(
      (ritual) =>
        ritual.room === state.location &&
        ritual.participants.includes("siege") &&
        ritual.participants.includes(template.id)
    );

    if (localRitual) {
      const ritualNote = document.createElement("small");
      ritualNote.className = "entity-ritual";
      ritualNote.textContent =
        (localRitual.mutual ? "shared ritual · " : "recurring practice · ") +
        localRitual.act;
      copy.append(ritualNote);
    }

    identity.append(symbol, copy);

    const witness = button(
      "Observe",
      () => dispatch("observe_entity", template.id)
    );
    witness.classList.add("witness-button");

    header.append(identity, witness);

    const registers = document.createElement("div");
    registers.className = "entity-registers";

    const accordRegister = createActionRegister(
      "Accord",
      "proposal · present-tense consent",
      "accord-register"
    );

    const accord = getAvailableAffordances({
      state,
      world,
      actorId: "siege",
      targetId: template.id
    });

    (accord.affordances || [])
      .filter((entry) => entry.available)
      .forEach((entry) => {
        if (entry.id === "offer_object") {
          (entry.objects || []).slice(0, 2).forEach((object) => {
            accordRegister.actions.append(
              button(
                "Offer " + object.name,
                () =>
                  dispatch("interact", {
                    targetId: template.id,
                    affordance: "offer_object",
                    objectId: object.id
                  })
              )
            );
          });
          return;
        }

        accordRegister.actions.append(
          button(entry.label, () =>
            dispatch("interact", {
              targetId: template.id,
              affordance: entry.id
            })
          )
        );
      });

    if (!accordRegister.actions.childElementCount) {
      accordRegister.actions.append(
        empty("No Accord proposal is presently open.")
      );
    }

    const hymnosRegister = createActionRegister(
      "Hymnos",
      "relational act · different expression, same truth",
      "hymnos-register"
    );

    const hymnos = getAvailableHymnosActs({
      state,
      world,
      actorId: "siege",
      targetId: template.id
    });

    (hymnos.acts || [])
      .filter((entry) => entry.available)
      .forEach((entry) => {
        hymnosRegister.actions.append(
          button(entry.label, () =>
            dispatch("hymnos", {
              targetId: template.id,
              act: entry.id
            })
          )
        );
      });

    if (hymnos.activeDuet) {
      card.classList.add("entity-card-duet");
      hymnosRegister.actions.append(
        button("Release duet", () =>
          dispatch("hymnos_release", {
            targetId: template.id
          })
        )
      );
    }

    if (!hymnosRegister.actions.childElementCount) {
      hymnosRegister.actions.append(
        empty("No Hymnos act is presently open.")
      );
    }

    registers.append(
      accordRegister.root,
      hymnosRegister.root
    );

    card.append(header, registers);
    root.append(card);
  });
}

function createActionRegister(label, note, className) {
  const root = document.createElement("section");
  root.className = "entity-register " + className;

  const header = document.createElement("div");
  header.className = "register-heading";

  const title = document.createElement("span");
  title.className = "register-title";
  title.textContent = label;

  const law = document.createElement("small");
  law.className = "register-note";
  law.textContent = note;

  const actions = document.createElement("div");
  actions.className = "register-actions";

  header.append(title, law);
  root.append(header, actions);

  return { root, actions };
}

function renderElsewhere(state, world) {
  const root = document.getElementById("whereabouts");
  if (!root) return;

  root.replaceChildren();

  const elsewhere = (world.entities.entities || [])
    .map((template) => ({
      template,
      record:
        state.entities &&
        state.entities.records &&
        state.entities.records[template.id]
    }))
    .filter(
      ({ record }) =>
        record &&
        record.location &&
        record.location !== state.location
    );

  if (!elsewhere.length) {
    root.append(
      empty("No other inhabitant leaves a current trace elsewhere in the known house.")
    );
    return;
  }

  elsewhere.forEach(({ template, record }) => {
    const card = document.createElement("div");
    card.className = "whereabouts-card";

    const symbol = document.createElement("span");
    symbol.className = "whereabouts-symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = template.symbol || "·";

    const copy = document.createElement("div");
    copy.className = "whereabouts-copy";

    const name = document.createElement("span");
    name.className = "whereabouts-name";
    name.textContent = template.name;

    const room = getRoom(
      world,
      state,
      record.location,
      { fallback: false }
    );

    const trace = document.createElement("small");
    trace.className = "whereabouts-trace";
    trace.textContent =
      "known elsewhere · " +
      (room ? room.name : "somewhere unnamed") +
      " · " +
      formatEntityStatus(record.status);

    copy.append(name, trace);

    const relation = getCrossRelation(
      state,
      "siege",
      template.id
    );

    if (
      relation &&
      relation.phase !== "unfamiliar"
    ) {
      const relationNote = document.createElement("small");
      relationNote.className = "whereabouts-relation";
      relationNote.textContent =
        formatCrossRelationNote(relation.phase);
      copy.append(relationNote);
    }

    card.append(symbol, copy);
    root.append(card);
  });
}

function formatRelationNote(relation, entityId) {
  const otherIndex = relation.entities[0] === entityId ? 1 : 0;
  const otherName = relation.names[otherIndex] || "another inhabitant";

  if (relation.phase === "friends") {
    return "friends with " + otherName;
  }

  if (relation.phase === "companionate") {
    return "often chooses the company of " + otherName;
  }

  return "familiar with " + otherName;
}

function formatCrossRelationNote(phase) {
  if (phase === "friends") {
    return "friends with you";
  }

  if (phase === "companionate") {
    return "often chooses relation with you";
  }

  return "familiar with you";
}

function formatEntityStatus(status) {
  const labels = {
    present: "present",
    wandering: "wandering",
    lingering: "lingering",
    resting: "resting",
    attending_object: "attending",
    in_company: "in company",
    nearby: "nearby",
    sharing_space: "sharing space",
    considering_company: "considering company",
    accompanying: "accompanying",
    keeping_distance: "keeping distance"
  };

  return labels[status] || "present";
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

function renderRoomMemory(state, world, roomId) {
  const root = document.getElementById("ledger");
  root.replaceChildren();

  const memory = getRoomMemory(state, roomId);
  const echoes = [...memory.echoes].reverse();

  if (!echoes.length) {
    root.append(empty("This room has not learned any echoes yet."));
    return;
  }

  const latest = echoes.slice(0, 6);
  const earlier = echoes.slice(6);

  latest.forEach((event) => {
    const item = document.createElement("li");
    item.textContent = describeLocalEcho(event, state, world, roomId);
    root.append(item);
  });

  if (earlier.length) {
    const archiveItem = document.createElement("li");
    archiveItem.className = "ledger-archive-item";

    const archive = document.createElement("details");
    archive.className = "ledger-archive";

    const summary = document.createElement("summary");
    summary.textContent =
      "Earlier echoes · " + earlier.length;

    const list = document.createElement("ol");
    list.className = "ledger ledger-earlier";

    earlier.forEach((event) => {
      const item = document.createElement("li");
      item.textContent = describeLocalEcho(
        event,
        state,
        world,
        roomId
      );
      list.append(item);
    });

    archive.append(summary, list);
    archiveItem.append(archive);
    root.append(archiveItem);
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
