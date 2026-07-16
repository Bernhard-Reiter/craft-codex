/**
 * Deterministischer 1D-Value-Noise — kohärent, seedbar, ohne Math.random.
 * Remotion-Regel: Jeder Frame muss bei jedem Render identisch sein.
 * Akzeptiert fractional time (Motion-Blur-Subframes bleiben stetig).
 */
const hash = (n: number) => {
  const x = Math.sin(n) * 43758.5453123;
  return x - Math.floor(x);
};

/** Glatter Noise in [-1, 1]; ein Generator-Seed pro Effekt-Kanal. */
export const noise1d = (t: number, seed = 0): number => {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f); // smoothstep
  const a = hash(i * 127.1 + seed * 311.7);
  const b = hash((i + 1) * 127.1 + seed * 311.7);
  return (a + (b - a) * u) * 2 - 1;
};
