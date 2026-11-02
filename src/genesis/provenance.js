export function createProvenance({
  seed,
  realm,
  trigger,
  parent,
  createdAt = new Date().toISOString()
}) {
  return {
    origin: "genesis",
    authorship: "system",
    seed,
    realm,
    trigger,
    parent,
    createdAt,
    witnessed: false,
    canonical: false,
    revision: 1
  };
}

export function markWitnessed(state, entityId) {
  const record = state.genesis.provenance[entityId];
  if (!record || record.witnessed) return false;

  record.witnessed = true;
  record.canonical = true;
  record.witnessedAt = new Date().toISOString();

  state.genesis.witnessed[entityId] = true;
  state.genesis.canonical[entityId] = true;

  return true;
}
