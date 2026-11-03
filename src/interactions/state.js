export function createInitialAccordState() {
  return {
    version: 1,
    sequence: 0,
    history: [],
    pairs: {},
    invitations: {}
  };
}

export function mergeAccordState(base, saved = {}) {
  saved = saved || {};

  return {
    ...base,
    ...saved,
    version: 1,
    sequence: Number(saved.sequence || base.sequence || 0),
    history: Array.isArray(saved.history)
      ? saved.history.slice(-120)
      : [...base.history],
    pairs: {
      ...base.pairs,
      ...(saved.pairs || {})
    },
    invitations: {
      ...base.invitations,
      ...(saved.invitations || {})
    }
  };
}
