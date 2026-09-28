/** Deterministic PRNG so procedural decoration (book spines, planks) is identical on every render. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clockAngles(hour: number, minute: number): { hourDeg: number; minuteDeg: number } {
  return {
    hourDeg: ((hour % 12) + minute / 60) * 30,
    minuteDeg: minute * 6,
  };
}
