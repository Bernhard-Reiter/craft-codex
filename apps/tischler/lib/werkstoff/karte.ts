/**
 * Materialkarte — was der Handwerker sieht, wenn er auf ein Werkstück tippt.
 *
 * Die Karten kommen aus dem Offline-Bundle (`public/werkstoff-bundle/`), das
 * `werkzeuge/projektion.py` in cody-cad erzeugt: eingefroren auf einen Katalogstand,
 * ohne Netz lesbar, ohne Betriebsdaten. Diese Datei liest und ordnet — sie rechnet nichts
 * und ergänzt nichts. Was nicht in der Karte steht, steht auch nicht auf dem Bildschirm.
 */

export type Freigabe = "annahme" | "meister" | "belegt" | "verifiziert";

export interface Unterlage {
  typ: string;
  dokument: string;
  url?: string;
  seiten?: string;
  sha256?: string;
  fingerabdruck_offen?: string;
}

export interface Richtlinie {
  schritt: string;
  parameter?: Record<string, unknown>;
  werkzeuge?: string[];
  hinweise?: string[];
}

export interface Komponentenzeile {
  rolle: string;
  id: string;
  revision: number;
  art: string;
  typ?: string;
  bezeichnung: string;
  hersteller?: string;
  artikelnr?: string | number;
  freigabe: Freigabe;
  unterlagen: Unterlage[];
  verarbeitung?: Richtlinie[];
  lagerung?: Record<string, unknown>;
  sicherheit?: { ghs?: string[]; schutz?: string[]; hinweise?: string[] };
}

export interface Luecke {
  rolle: string;
  id: string;
  typ?: string;
  dokument: string;
  grund: string;
}

export interface Materialkarte {
  schema: string;
  karteversion: number;
  werkstueck: { id: string; bezeichnung: string; flaeche_m2: number; anzahl: number; kontur: Record<string, unknown> };
  aufbau: { id: string; revision: number; bezeichnung: string };
  resolve_manifest_sha256: string;
  karte_sha256: string;
  freigabe: Freigabe;
  dicke_mm: { nominal: number; minimum?: number; maximum?: number; freigabe: Freigabe };
  gewicht_kg_m2: { wert: number; freigabe: Freigabe };
  brand: { status: string; klasse?: string | null };
  komponenten: Komponentenzeile[];
  arbeitsfolge: Array<{ nr: number; typ: string; seiten?: string[]; parameter?: Record<string, unknown>; werkzeuge?: string[]; sicherheit?: string[] }>;
  verbrauch: { flaeche_m2: number; freigabe: Freigabe; positionen: Array<{ rolle: string; wert: number; einheit: string; freigabe: Freigabe; bezeichnung: string }> };
  videos: Array<{ rolle: string; id: string; dokument: string; url: string }>;
  unterlagen_ohne_verweis: Luecke[];
  dokumente_hinweis: string;
}

export const AMPEL: Record<Freigabe, string> = {
  annahme: "#d97706",
  meister: "#0284c7",
  belegt: "#16a34a",
  verifiziert: "#15803d",
};

export const AMPEL_TEXT: Record<Freigabe, string> = {
  annahme: "Annahme — noch nicht belegt",
  meister: "vom Meister gesetzt",
  belegt: "durch Herstellerangabe belegt",
  verifiziert: "am Stück gemessen",
};

const RANG: Record<Freigabe, number> = { annahme: 0, meister: 1, belegt: 2, verifiziert: 3 };

/** Die schwächste Freigabe einer Menge — leere Menge hat keine (undefined). */
export function schwaechste(werte: Freigabe[]): Freigabe | undefined {
  return werte.length ? werte.reduce((a, b) => (RANG[b] < RANG[a] ? b : a)) : undefined;
}

/** Gruppen für die Anzeige — in der Reihenfolge, in der am Stück gearbeitet wird. */
export const GRUPPEN = [
  { schluessel: "traeger", titel: "Trägerplatte", passt: (r: string) => r === "traeger" },
  { schluessel: "belag", titel: "Belag", passt: (r: string) => r.startsWith("belag/") },
  { schluessel: "kante", titel: "Kante", passt: (r: string) => r.startsWith("kante/") },
  { schluessel: "klebstoff", titel: "Leim & Kleber", passt: (r: string) => r.startsWith("klebstoff/") },
  { schluessel: "oberflaeche", titel: "Oberfläche", passt: (r: string) => r.startsWith("oberflaeche/") || r.startsWith("system/") },
] as const;

export function gruppiere(
  zeilen: Komponentenzeile[],
): Array<{ titel: string; zeilen: Komponentenzeile[] }> {
  const rest = new Set(zeilen);
  const gruppen: Array<{ titel: string; zeilen: Komponentenzeile[] }> = GRUPPEN.map((g) => {
    const treffer = zeilen.filter((z) => g.passt(z.rolle));
    treffer.forEach((z) => rest.delete(z));
    return { titel: g.titel, zeilen: treffer };
  }).filter((g) => g.zeilen.length > 0);
  // Nichts verschwindet still: was in keine Gruppe passt, bekommt eine eigene.
  if (rest.size) gruppen.push({ titel: "Weitere", zeilen: [...rest] });
  return gruppen;
}

/** Die Rolle als Wort, das in der Werkstatt gesprochen wird. */
export function rolleLesbar(rolle: string): string {
  const teile = rolle.split("/");
  const wort: Record<string, string> = {
    traeger: "Trägerplatte",
    belag: "Belag",
    kante: "Kante",
    klebstoff: "Klebstoff",
    oberflaeche: "Oberfläche",
    system: "Lacksystem",
    oben: "oben",
    unten: "unten",
    vorne: "vorne",
    hinten: "hinten",
    links: "links",
    rechts: "rechts",
  };
  return teile.map((t) => wort[t] ?? t).join(" · ");
}

/** Verweise, die man antippen kann — Dokument mit Link. Ohne Link kein Eintrag. */
export function verweise(z: Komponentenzeile): Unterlage[] {
  return (z.unterlagen ?? []).filter((u) => Boolean(u.url));
}

/** Lücken dieser Zeile, damit am Stück steht, was fehlt (nicht nur, was da ist). */
export function luecken(karte: Materialkarte, z: Komponentenzeile): Luecke[] {
  return (karte.unterlagen_ohne_verweis ?? []).filter((l) => l.rolle === z.rolle);
}

export interface Bundlestand {
  stand: string;
  sha256: string;
  dateien: number;
}

export async function ladeKatalogstand(basis = "/werkstoff-bundle"): Promise<Bundlestand> {
  const r = await fetch(`${basis}/katalogstand.json`);
  if (!r.ok) throw new Error(`Katalogstand nicht lesbar (${r.status})`);
  const d = await r.json();
  return { stand: d.stand, sha256: d.sha256, dateien: (d.dateien ?? []).length };
}

export async function ladeKarte(werkstueckId: string, basis = "/werkstoff-bundle"): Promise<Materialkarte> {
  const r = await fetch(`${basis}/karten/${encodeURIComponent(werkstueckId)}.json`);
  if (!r.ok) throw new Error(`Keine Karte für ${werkstueckId} in diesem Stand (${r.status})`);
  const k = (await r.json()) as Materialkarte;
  // Kein stiller Fallback: was nicht zu diesem Werkstück gehört, wird nicht angezeigt.
  if (k.werkstueck?.id !== werkstueckId) {
    throw new Error(`Karte gehört zu ${k.werkstueck?.id}, angefragt war ${werkstueckId}`);
  }
  // Das Resolve-Manifest muss im Bundle liegen UND denselben Hash tragen. Ohne diese Prüfung
  // hieße "bekanntes Werkstück" nur: es steht in der Datei, die ich gerade gelesen habe — die
  // Karte belegte sich selbst (Review craft#42).
  //
  // Was das beweist: Karte und Manifest im Bundle gehören zusammen, und beide sind da.
  // Was es NICHT beweist: dass der Hash zum Inhalt des Manifests passt. Nachrechnen ginge nur,
  // wenn JavaScript Pythons Zahlendarstellung exakt träfe — die Manifeste enthalten Werte wie
  // `555.0`, die JS als `555` schreibt (gemessen, voai#1222). Erfundene Sicherheit wäre hier
  // schlimmer als benannte Lücke.
  const m = await fetch(`${basis}/manifeste/${encodeURIComponent(werkstueckId)}.json`);
  if (!m.ok) {
    throw new Error(
      `Karte für ${werkstueckId} ohne Resolve-Manifest im Bundle (${m.status}) — ` +
        "unbelegte Werte werden nicht angezeigt",
    );
  }
  const manifest = (await m.json()) as { resolve_manifest_sha256?: string };
  if (manifest.resolve_manifest_sha256 !== k.resolve_manifest_sha256) {
    throw new Error(
      `Karte und Manifest gehören nicht zusammen (Karte ${k.resolve_manifest_sha256?.slice(0, 12)}…, ` +
        `Manifest ${manifest.resolve_manifest_sha256?.slice(0, 12)}…)`,
    );
  }
  return k;
}
