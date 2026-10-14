/**
 * Welche Routen tragen den VI4-Look (VOAI Paper, Navy-Akzent)?
 *
 * Bewusst eine kleine, feste Liste: Alles, was hier nicht steht, bleibt im
 * bisherigen Craft-Codex-Look (Papier + Signalgelb). Die Startseite gehört
 * NICHT dazu, weil die Lienz-Demo sie nutzt (»Demo zurücksetzen«).
 *
 * Pfade ohne Locale-Präfix, so wie sie `usePathname` aus i18n/navigation liefert.
 */
export const VI4_ROUTEN = ["/zinken"] as const;

export function istVi4Route(pfad: string | null | undefined): boolean {
  if (!pfad) return false;
  const p = pfad.length > 1 && pfad.endsWith("/") ? pfad.slice(0, -1) : pfad;
  return VI4_ROUTEN.some((r) => p === r || p.startsWith(`${r}/`));
}
