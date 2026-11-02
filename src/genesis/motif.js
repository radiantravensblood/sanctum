import { createSeededRandom, pick } from "./seed.js";

export function resolveMotif({ threshold, realm, seed }) {
  const inheritedRemaining = Number(threshold.motifRemaining || 0);

  if (threshold.motifId && inheritedRemaining > 0) {
    const inherited = (realm.motifs || []).find(
      (motif) => motif.id === threshold.motifId
    );

    if (inherited) {
      return {
        ...inherited,
        remaining: inheritedRemaining,
        inherited: true
      };
    }
  }

  const random = createSeededRandom(seed + ":motif");
  const motif = pick(random, realm.motifs || []);

  if (!motif) {
    return {
      id: "unbound",
      title: realm.name,
      remaining: 1,
      inherited: false
    };
  }

  return {
    ...motif,
    remaining: resolveExtent(motif.extent, random),
    inherited: false
  };
}

export function scopePool(pool, allowedIds) {
  if (!Array.isArray(allowedIds) || !allowedIds.length) return pool;

  const scoped = pool.filter((item) => allowedIds.includes(item.id));
  return scoped.length ? scoped : pool;
}

function resolveExtent(extent, random) {
  if (Array.isArray(extent) && extent.length >= 2) {
    const min = Math.max(1, Number(extent[0]) || 1);
    const max = Math.max(min, Number(extent[1]) || min);
    return min + Math.floor(random() * (max - min + 1));
  }

  return Math.max(1, Number(extent) || 3);
}
