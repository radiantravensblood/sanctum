export function getGenesisLaws(world) {
  return world.genesis && world.genesis.laws ? world.genesis.laws : {};
}

export function getGenesisLimits(world) {
  return world.genesis && world.genesis.limits
    ? world.genesis.limits
    : {
        roomsPerBirth: 1,
        objectsPerBirth: 1,
        thresholdsPerBirth: 1
      };
}
