// Seeded randomness, so every trial can be replayed from its seed.

/** A random number generator returning values in [0, 1). */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mixSeed(...parts: number[]): number {
  let h = 0x811C9DC5;
  for (const p of parts) {
    h ^= (p >>> 0);
    h = Math.imul(h, 0x01000193);
    h ^= h >>> 15;
  }
  return h >>> 0;
}

/** Fisher–Yates shuffle, in place. */
export function shuffle<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = arr[i]!; arr[i] = arr[j]!; arr[j] = t;
  }
  return arr;
}
