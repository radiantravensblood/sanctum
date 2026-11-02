export function applyDelta(delta, state) {
  delta.operations.forEach((operation) => {
    switch (operation.op) {
      case "create_room":
        state.genesis.generated.rooms[operation.id] = operation.value;
        state.genesis.provenance[operation.id] = {
          ...delta.provenance,
          entityType: "room"
        };
        break;

      case "create_object":
        state.genesis.generated.objects[operation.id] = operation.value;
        state.objectLocations[operation.id] = operation.room;
        state.genesis.provenance[operation.id] = {
          ...delta.provenance,
          entityType: "object"
        };
        break;

      case "create_threshold":
        state.genesis.generated.thresholds[operation.id] = operation.value;
        state.thresholdStates[operation.id] = operation.value.state;
        state.genesis.provenance[operation.id] = {
          ...delta.provenance,
          entityType: "threshold"
        };
        break;

      case "connect_threshold":
        state.thresholdStates[operation.id] = "open";
        state.thresholdTargets[operation.id] = operation.target;
        state.genesis.resolutions[operation.id] = {
          kind: delta.kind || "birth",
          topology: delta.topology || null,
          target: operation.target,
          provenance: delta.provenance
        };
        break;

      default:
        throw new Error("Unsupported Genesis operation: " + operation.op);
    }
  });

  return state;
}
