/**
 * Timing-safe Vergleichs-Helfer — gemeinsame Basis fuer Basic Auth (/admin)
 * und Bearer Auth (/api/v1). Pure Funktionen ohne Next-Kontext, laufen in
 * Edge-Middleware UND Node-Routen (Web Crypto: crypto.subtle).
 *
 * Muster: verglichen werden SHA-256-Digests (fixe Laenge, 32 Bytes) mit
 * konstantzeitigem XOR-Vergleich — kein Early-Exit auf Zeichenebene, keine
 * Laengen-Leaks des Secrets.
 */

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false; // Digests: immer 32 Bytes
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= (a[i] as number) ^ (b[i] as number);
  }
  return diff === 0;
}

export async function sha256(text: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return new Uint8Array(digest);
}

/**
 * Timing-safe Gleichheit zweier Strings ueber ihre SHA-256-Digests.
 * Beide Digests werden IMMER berechnet — keine Kurzschluss-Timing-Kante.
 */
export async function timingSafeEqualStrings(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([sha256(a), sha256(b)]);
  return constantTimeEqual(da, db);
}
