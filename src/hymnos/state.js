export function createInitialHymnosState(world) {
  return {
    version: 1,
    sequence: 0,
    identities: cloneIdentities(
      (world.hymnos && world.hymnos.identities) || {}
    ),
    exchanges: [],
    relations: {},
    duets: {},
    rituals: {}
  };
}

export function mergeHymnosState(base, saved = {}) {
  saved = saved || {};

  return {
    ...base,
    ...saved,
    version: 1,
    sequence: Number(saved.sequence || base.sequence || 0),
    identities: {
      ...cloneIdentities(base.identities || {}),
      ...cloneIdentities(saved.identities || {})
    },
    exchanges: Array.isArray(saved.exchanges)
      ? saved.exchanges.slice(-160)
      : [...base.exchanges],
    relations: {
      ...(base.relations || {}),
      ...(saved.relations || {})
    },
    duets: {
      ...(base.duets || {}),
      ...(saved.duets || {})
    },
    rituals: {
      ...(base.rituals || {}),
      ...(saved.rituals || {})
    }
  };
}

function cloneIdentities(identities) {
  return Object.fromEntries(
    Object.entries(identities || {}).map(([id, identity]) => [
      id,
      { ...identity }
    ])
  );
}
