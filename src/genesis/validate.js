import { getGenesisLaws, getGenesisLimits } from "./laws.js";
import { getRoom, getThresholdState } from "../world.js";

const ALLOWED_OPERATIONS = new Set([
  "create_room",
  "create_object",
  "create_threshold",
  "connect_threshold"
]);

export function validateDelta(delta, state, world) {
  const errors = [];
  const laws = getGenesisLaws(world);
  const limits = getGenesisLimits(world);

  if (!delta || delta.type !== "world_delta") {
    return { allowed: false, errors: ["Genesis only accepts a world_delta."] };
  }

  const operations = Array.isArray(delta.operations) ? delta.operations : [];
  const counts = countOperations(operations);
  const proposedRooms = new Set(
    operations
      .filter((operation) => operation.op === "create_room")
      .map((operation) => operation.id)
  );

  if ((counts.create_room || 0) > limits.roomsPerBirth) {
    errors.push("Birth exceeds the room limit.");
  }

  if ((counts.create_object || 0) > limits.objectsPerBirth) {
    errors.push("Birth exceeds the object limit.");
  }

  if ((counts.create_threshold || 0) > limits.thresholdsPerBirth) {
    errors.push("Birth exceeds the threshold limit.");
  }

  operations.forEach((operation) => {
    if (!ALLOWED_OPERATIONS.has(operation.op)) {
      errors.push("Unsupported operation: " + operation.op);
      return;
    }

    if (operation.op === "create_room") {
      const existing = getRoom(world, state, operation.id, { fallback: false });
      if (existing) errors.push("Room already exists: " + operation.id);

      if (laws.returnPathRequired) {
        const exits =
          operation.value && operation.value.exits
            ? Object.values(operation.value.exits)
            : [];

        const hasReturn = exits.some(
          (exit) => exit === delta.context.originRoomId
        );

        if (!hasReturn) errors.push("Generated room has no return path.");
      }
    }

    if (operation.op === "create_object") {
      if (
        world.objects[operation.id] ||
        state.genesis.generated.objects[operation.id]
      ) {
        errors.push("Object already exists: " + operation.id);
      }
    }

    if (operation.op === "create_threshold") {
      if (
        world.thresholds[operation.id] ||
        state.genesis.generated.thresholds[operation.id]
      ) {
        errors.push("Threshold already exists: " + operation.id);
      }

      if (!operation.value || operation.value.mode !== "frontier") {
        errors.push("Genesis may only create frontier thresholds.");
      }
    }

    if (operation.op === "connect_threshold") {
      const threshold = getThresholdState(world, state, operation.id);

      if (!threshold) {
        errors.push("Source threshold does not exist.");
        return;
      }

      if (laws.generationRequiresFrontier && threshold.mode !== "frontier") {
        errors.push("Genesis cannot materialize through a non-frontier threshold.");
      }

      if (threshold.requires && threshold.requires.length) {
        errors.push("Genesis cannot rewrite a consent-bearing threshold.");
      }

      if (threshold.target || threshold.state === "open") {
        errors.push("The source threshold has already become real.");
      }

      const existingTarget = getRoom(world, state, operation.target, {
        fallback: false
      });

      if (!existingTarget && !proposedRooms.has(operation.target)) {
        errors.push("Genesis cannot connect to a room that does not exist.");
      }

      if (
        delta.kind === "loop" &&
        laws.loopsOnlyToCanon &&
        !state.genesis.canonical[operation.target]
      ) {
        errors.push("A loop may only resolve toward witnessed canon.");
      }
    }
  });

  if (laws.generatedThingsNeedProvenance && !delta.provenance) {
    errors.push("Generated reality requires provenance.");
  }

  return {
    allowed: errors.length === 0,
    errors
  };
}

function countOperations(operations) {
  return operations.reduce((counts, operation) => {
    counts[operation.op] = (counts[operation.op] || 0) + 1;
    return counts;
  }, {});
}
