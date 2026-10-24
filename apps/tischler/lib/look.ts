/**
 * Welche Routen tragen den VI4-Look (VOAI Paper, Navy-Akzent)?
 *
 * Bewusst eine kleine, feste Liste: Alles, was hier nicht steht, bleibt im
 * bisherigen Craft-Codex-Look (Papier + Signalgelb). Seit Stufe 2 gehört die
 * Startseite dazu, aber nur genau "/" (kein Präfix: /dovetail usw. bleiben
 * alt). Der Knopf »Demo zurücksetzen« der Lienz-Demo bleibt dort und tut,
 * was er bisher tat.
 *
 * Pfade ohne Locale-Präfix, so wie sie `usePathname` aus i18n/navigation liefert.
 */
export const VI4_ROUTEN = ["/zinken", "/"] as const;

/**
 * VI4-Farben für 3D und XR. Three.js und uikit lesen keine CSS-Variablen,
 * deshalb stehen die zwei Werte hier noch einmal: gleich --vi4-brand und
 * --vi4-paper in app/_vi4/look.css (lib/look-xr.test.ts prüft die Gleichheit).
 * Kein Signalgelb auf den VI4-Seiten, auch nicht in der Szene.
 */
export const VI4_XR = { brand: "#2c4b7a", papier: "#ffffff" } as const;

export function istVi4Route(pfad: string | null | undefined): boolean {
  if (!pfad) return false;
  const p = pfad.length > 1 && pfad.endsWith("/") ? pfad.slice(0, -1) : pfad;
  // "/" nur exakt, sonst wäre jede Route ein Unterpfad der Startseite.
  return VI4_ROUTEN.some((r) => p === r || (r !== "/" && p.startsWith(`${r}/`)));
}
