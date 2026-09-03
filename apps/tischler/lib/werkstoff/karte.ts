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
  dicke_mm: {
    nominal: number;
    minimum?: number;
    maximum?: number;
    freigabe: Freigabe;
    /** Schichten, die NICHT in der Summe stecken — mit Grund. Ohne sie liest sich die Zahl
     *  vollständiger, als sie ist, und nach ihr werden Nut und Band ausgelegt. */
    ausgeschlossen?: Array<{ komponente: string; rolle: string; grund: string }>;
  };
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
/** Ein Arbeitsschritt, wie ihn der Handwerker liest: Nummer, was zu tun ist, und die Werte. */
export interface Arbeitsschritt {
  nr: number;
  titel: string;
  werte: Array<{ was: string; wert: string }>;
  werkzeuge: string[];
  sicherheit: string[];
}

const SCHRITT_TITEL: Record<string, string> = {
  furnieren: "Furnieren",
  kante: "Kante anleimen",
  schleifen: "Schleifen",
  zwischenschliff: "Zwischenschliff",
  auftragen: "Lack auftragen",
  trocknen: "Trocknen",
  pressen: "Pressen",
  zuschnitt: "Zuschnitt",
};

/** Parameternamen, wie sie in der Werkstatt heißen — nicht wie sie im JSON stehen. */
const WERT_TITEL: Record<string, string> = {
  auftrag_g_m2: "Leimauftrag",
  auftragsmenge_g_m2: "Auftragsmenge",
  beanspruchungsgruppe: "Beanspruchung",
  dicke_mm: "Dicke",
  endhaerte_min: "Endhärte nach",
  glanzgrad: "Glanzgrad",
  holzfeuchte_prozent: "Holzfeuchte",
  kantenart: "Kantenart",
  kleber: "Kleber",
  korn: "Korn",
  korn_max: "Korn (max.)",
  presszeit_min: "Presszeit",
  pressdruck_n_cm2: "Pressdruck",
  schleifbar_min: "Schleifbar nach",
  stapelbar_min: "Stapelbar nach",
  temperatur_c: "Temperatur",
  vor: "Vor dem Schritt",
};

/** Minuten menschlich: 2880 min sagt keinem etwas, 2 Tage schon. */
function dauer(minuten: number): string {
  if (minuten < 60) return `${minuten} min`;
  if (minuten < 60 * 24) {
    const h = minuten / 60;
    return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
  }
  const t = minuten / (60 * 24);
  return `${Number.isInteger(t) ? t : t.toFixed(1)} Tage`;
}

function wertText(name: string, wert: unknown): string {
  // Die Zeiten kommen als Zeichenkette mit Einheit ("2880 min"), nicht als Zahl — das
  // Datenpaket trägt Wert und Einheit zusammen. Beide Formen umrechnen: 2880 min liest
  // niemand als zwei Tage, und danach wird die Werkstatt geplant.
  if (name.endsWith("_min")) {
    if (typeof wert === "number") return dauer(wert);
    const m = typeof wert === "string" && wert.match(/^\s*(\d+(?:[.,]\d+)?)\s*min\s*$/i);
    if (m && m[1]) return dauer(Number(m[1].replace(",", ".")));
  }
  if (typeof wert === "number") {
    const einheit = name.endsWith("_g_m2")
      ? " g/m²"
      : name.endsWith("_mm")
        ? " mm"
        : name.endsWith("_c")
          ? " °C"
          : name.endsWith("_prozent")
            ? " %"
            : name.endsWith("_n_cm2")
              ? " N/cm²"
              : "";
    return `${wert}${einheit}`;
  }
  if (wert && typeof wert === "object") {
    return Object.entries(wert as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  }
  return String(wert);
}

/**
 * Die Arbeitsfolge lesbar machen. Sie stand bisher in jeder Karte und wurde nie angezeigt —
 * dabei ist sie der Teil, für den der Handwerker das Panel aufmacht: Leimauftrag, Presszeit,
 * Korn, Trocknungszeiten. Ohne sie zeigt die Karte, WORAUS das Teil besteht, aber nicht, WIE
 * es gebaut wird (Review craft#42, Runde 2).
 */
export function arbeitsfolge(k: Materialkarte): Arbeitsschritt[] {
  return [...(k.arbeitsfolge ?? [])]
    .sort((a, b) => a.nr - b.nr)
    .map((s) => ({
      nr: s.nr,
      titel: SCHRITT_TITEL[s.typ] ?? s.typ.replace(/_/g, " "),
      werte: Object.entries(s.parameter ?? {})
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([name, v]) => ({ was: WERT_TITEL[name] ?? name.replace(/_/g, " "), wert: wertText(name, v) }))
        .sort((a, b) => a.was.localeCompare(b.was, "de")),
      werkzeuge: s.werkzeuge ?? [],
      sicherheit: s.sicherheit ?? [],
    }));
}

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
  const manifest = (await m.json()) as {
    resolve_manifest_sha256?: string;
    werkstueck?: { id?: string };
  };
  // Erst die Form, dann die Gleichheit. Ein Vergleich allein war fail-open: fehlt das Feld auf
  // BEIDEN Seiten, ist `undefined !== undefined` falsch — und die Karte käme durch, obwohl
  // nichts belegt wurde. »Leer« heißt hier Messfehler, nicht gleich (Review craft#42, Runde 2).
  const HEX64 = /^[0-9a-f]{64}$/;
  for (const [wo, wert] of [
    ["Karte", k.resolve_manifest_sha256],
    ["Manifest", manifest.resolve_manifest_sha256],
  ] as const) {
    if (!HEX64.test(wert ?? "")) {
      throw new Error(
        `${wo} für ${werkstueckId} ohne gültigen Manifest-Hash — ohne ihn ist nichts belegt`,
      );
    }
  }
  if (manifest.resolve_manifest_sha256 !== k.resolve_manifest_sha256) {
    throw new Error(
      `Karte und Manifest gehören nicht zusammen (Karte ${k.resolve_manifest_sha256?.slice(0, 12)}…, ` +
        `Manifest ${manifest.resolve_manifest_sha256?.slice(0, 12)}…)`,
    );
  }
  // Und der Werkstückbezug direkt, nicht nur über den Hash: sonst hinge er allein daran, dass
  // zwei Dateien denselben Hash tragen — ein Manifest unter falschem Dateinamen käme durch.
  if (manifest.werkstueck?.id !== werkstueckId) {
    throw new Error(
      `Manifest gehört zu ${manifest.werkstueck?.id ?? "keinem Werkstück"}, angefragt war ${werkstueckId}`,
    );
  }
  return k;
}
