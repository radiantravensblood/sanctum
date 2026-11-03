import { getRoom, getThresholdState } from "../world.js";
import { getRoomMemory } from "../memory/mnemosyne.js";
import { getTemporalContext } from "./chronos.js";

export function buildOrientation({
  state,
  world,
  now = new Date()
}) {
  const room = getRoom(world, state, state.location, { fallback: false });
  if (!room) return null;

  const temporal = getTemporalContext({
    state,
    world,
    roomId: room.id,
    now
  });
  const memory = getRoomMemory(state, room.id);
  const exits = Object.entries(room.exits || {});
  const unwritten = exits.filter(([, exit]) => {
    if (typeof exit !== "object" || !exit.threshold) return false;
    const threshold = getThresholdState(world, state, exit.threshold);
    return threshold && threshold.state === "latent" && threshold.mode === "frontier";
  });
  const consent = exits.filter(([, exit]) => {
    if (typeof exit !== "object" || !exit.threshold) return false;
    const threshold = getThresholdState(world, state, exit.threshold);
    return threshold && threshold.requires && threshold.requires.length;
  });

  return {
    version: 1,
    now: temporal,
    location: {
      id: room.id,
      name: room.name,
      region: room.region
    },
    memory: {
      localEchoes: memory.echoes.length,
      sittings: memory.sittings,
      activeAnchors: Object.values(memory.anchors || {}).filter(
        (anchor) => state.objectLocations[anchor.object] === room.id
      ).length
    },
    thresholds: {
      unwritten: unwritten.map(([direction, exit]) => ({
        direction,
        threshold: exit.threshold
      })),
      consent: consent.map(([direction, exit]) => {
        const threshold = getThresholdState(world, state, exit.threshold);
        return {
          direction,
          threshold: threshold.id,
          state: threshold.state,
          requires: threshold.requires
        };
      })
    },
    prose: describeOrientation({
      room,
      temporal,
      memory,
      unwrittenCount: unwritten.length
    })
  };
}

function describeOrientation({
  room,
  temporal,
  memory,
  unwrittenCount
}) {
  const fragments = [
    temporal.local.weekday +
      " · " +
      temporal.local.dayPhaseLabel +
      " · " +
      temporal.local.seasonLabel,
    temporal.session.absence.label,
    "You are in " + room.name + "."
  ];

  if (memory.echoes.length > 5) {
    fragments.push("This place carries a familiar density of echoes.");
  } else if (memory.echoes.length > 0) {
    fragments.push("This place remembers a little of what has happened here.");
  } else {
    fragments.push("This place is still nearly unmarked.");
  }

  if (unwrittenCount === 1) {
    fragments.push("One unwritten edge remains nearby.");
  } else if (unwrittenCount > 1) {
    fragments.push(unwrittenCount + " unwritten edges remain nearby.");
  }

  return fragments.join(" ");
}
