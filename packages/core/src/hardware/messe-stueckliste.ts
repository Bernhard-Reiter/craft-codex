/**
 * Stückliste für den Messe-Unterschrank (IHM Ziel 2).
 *
 * Rechnet NUR aus den Maßen in MESSE_UNTERSCHRANK, keine neuen Maße und
 * keine Preise. Namen, Reihenfolge (Pos. 1–15), Werkstoff und Annahme-Marke
 * folgen der Werkstatt-Mappe (cody-cad führt); Annahme = `annahme: true`.
 */

import { MESSE_UNTERSCHRANK } from "./messe-unterschrank.js";

export type StuecklistenZeile = {
  gruppe: "Korpus" | "Front" | "Schubkasten" | "Beschlag";
  teil: string;
  anzahl: number;
  /** Länge × Breite × Stärke in mm, leer wenn nicht belegt. */
  mass: string;
  material: string;
  annahme: boolean;
  hinweis: string;
  /** Blum-Artikelnummer bei Beschlägen (Spalte »Artikel« der Mappe). */
  artikel?: string;
};

const m = MESSE_UNTERSCHRANK;
const P = m.plattenstaerke;
const fmt = (a: number, b: number, c: number) => `${a} × ${b} × ${c}`;

export function buildMesseStueckliste(): StuecklistenZeile[] {
  const lichteBreite = m.korpus.breite - 2 * P;
  // Reihenfolge, Namen, Werkstoff und Marke (Annahme oder nicht) wie die Werkstatt-Mappe
  // (cody-cad führt, Meister 1185 G3): Pos. = Zeile, 1–11 Platten, 12–15 Beschläge.
  const korpus = `Demo-Träger ${P} roh (synthetisch)`;
  const eiche = "Eiche natur geölt";
  const sk = (name: string) => {
    const t = m.schubkastenTeile.find((x) => x.startsWith(`${name} `));
    if (!t) throw new Error(`Schubkastenteil ${name} fehlt`);
    return t.slice(name.length + 1);
  };
  const schubkasten = (name: string): StuecklistenZeile => ({
    gruppe: "Schubkasten",
    teil: `Schubkasten-${name}`,
    anzahl: 1,
    mass: sk(name),
    material: eiche,
    annahme: true,
    hinweis: "Holzschubkasten H 150 / LW 562",
  });
  const blumHinweis = "Anzahl nach Türhöhe (Annahme Blum-Faustregel, bitte bestätigen)";
  const zeilen: StuecklistenZeile[] = [
    ...(["Links", "Rechts"] as const).map(
      (seite): StuecklistenZeile => ({
        gruppe: "Korpus",
        teil: `Seite ${seite}`,
        anzahl: 1,
        mass: fmt(m.korpus.hoehe, m.korpus.tiefe, P),
        material: korpus,
        annahme: false,
        hinweis: "Korpus 600 × 850 × 575",
      }),
    ),
    {
      gruppe: "Korpus",
      teil: "Boden Unten",
      anzahl: 1,
      mass: fmt(lichteBreite, m.korpus.tiefe, P),
      material: korpus,
      annahme: false,
      hinweis: "zwischen den Seiten",
    },
    {
      gruppe: "Korpus",
      teil: "Boden Oben",
      anzahl: 1,
      mass: fmt(lichteBreite, m.korpus.tiefe, P),
      material: korpus,
      annahme: false,
      hinweis: "zwischen den Seiten, wie in der 3D-Szene",
    },
    {
      gruppe: "Korpus",
      teil: "Rückwand",
      anzahl: 1,
      mass: fmt(m.korpus.hoehe - 2 * P, lichteBreite, P),
      material: korpus,
      annahme: false,
      hinweis: "19 zwischen Seiten und Böden, wie in der 3D-Szene",
    },
    {
      gruppe: "Front",
      teil: "Tür 1 Links",
      anzahl: 1,
      mass: fmt(m.tuer.hoehe, m.tuer.breite, P),
      material: korpus,
      annahme: false,
      hinweis: "über die ganze Höhe, Schubkasten innen dahinter",
    },
    schubkasten("Seite links"),
    schubkasten("Seite rechts"),
    schubkasten("Hinterstück"),
    schubkasten("Vorderstück"),
    schubkasten("Boden"),
    {
      gruppe: "Beschlag",
      teil: "CLIP Kreuzmontageplatte 37/32, Distanz 0 mm, zum Anschrauben",
      artikel: "173L6100",
      anzahl: 2,
      mass: "",
      material: "Montageplatte",
      annahme: false,
      hinweis: `auf der linken Korpusseite · ${blumHinweis}`,
    },
    {
      gruppe: "Beschlag",
      teil: "CLIP top BLUMOTION 110° Scharnier, Topf zum Schrauben, Eckanschlag",
      artikel: "71B3550",
      anzahl: 2,
      mass: "",
      material: "Topfband",
      annahme: false,
      hinweis: `zwei Scharniere an der Tür, Anschlag links · ${blumHinweis}`,
    },
    {
      gruppe: "Beschlag",
      teil: "MOVENTO Führung, Vollauszug, 70 kg, Nennlänge 500",
      artikel: "766H5000S",
      anzahl: 1,
      mass: "",
      material: "Unterflurführung (1 Satz)",
      annahme: false,
      hinweis: "Schraubpunkte außer 37 nicht bestätigt",
    },
    {
      gruppe: "Beschlag",
      teil: "MOVENTO Kupplung, links und rechts",
      artikel: "T51.7601",
      anzahl: 1,
      mass: "",
      material: "Kupplung (1 Satz)",
      annahme: false,
      hinweis: "",
    },
  ];
  return zeilen;
}

/** Gruppe für die Anzeige; leer, wenn der Teilname sie schon trägt (»Schubkasten-Boden«). */
export function gruppeAnzeige(z: StuecklistenZeile): string {
  return z.teil.startsWith(z.gruppe) ? "" : z.gruppe;
}

const csvFeld = (s: string | number) => {
  const t = String(s);
  return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** CSV mit Semikolon (Excel DE), erste Zeile = Kopf. */
export function messeStuecklisteCsv(zeilen = buildMesseStueckliste()): string {
  const kopf = ["Pos.", "Gruppe", "Teil", "Artikel", "Anzahl", "Maß L × B × S (mm)", "Material", "Annahme", "Hinweis"];
  const reihen = zeilen.map((z, i) =>
    [i + 1, gruppeAnzeige(z), z.teil, z.artikel ?? "", z.anzahl, z.mass, z.material, z.annahme ? "ja" : "", z.hinweis]
      .map(csvFeld)
      .join(";"),
  );
  return [kopf.join(";"), ...reihen].join("\n") + "\n";
}

/**
 * Kantenbild eines Plattenteils: welche Kanten bekommen Kantenband.
 * l1/l2 = die zwei Kanten der Länge L (l1 = Sichtkante vorn bzw. oben),
 * b1/b2 = die zwei Kanten der Breite B.
 */
export type Kantenbild = { l1: boolean; l2: boolean; b1: boolean; b2: boolean };

export type Etikett = {
  nr: number;
  /** Zeile in der Stückliste (= Pos. in der VOAI-Vorschau). */
  pos: number;
  /** z. B. »1/2« bei zwei gleichen Teilen. */
  stueck: string;
  teil: string;
  /** L × B × S in mm */
  mass: string;
  werkstoff: string;
  kanten: Kantenbild;
  position: string;
  /**
   * Bohrungen je Art, »Art ×Anzahl« wie das Bohrbild in cody-cad (cody-cad führt,
   * Meister 1175). Ohne Bohrung: »keine Bohrung«.
   */
  bohren: string[];
  /** Maß oder Kantenbild ist Annahme. */
  annahme: boolean;
};

const K = (l1: boolean, l2: boolean, b1: boolean, b2: boolean): Kantenbild => ({ l1, l2, b1, b2 });
const VORN = K(true, false, false, false);
const RUNDUM = K(true, true, true, true);
const KEINE = K(false, false, false, false);

/**
 * Kantenbild + Position je Plattenteil. ANNAHME: in der Messe-Vorlage ist
 * kein Kantenbild belegt; hier steht die übliche Werkstatt-Wahl
 * (Korpus Vorderkante, Fronten rundum, Rückwand und Schubkastenboden ohne).
 */
type EtikettDaten = { kanten: Kantenbild; positionen: string[]; bohren?: string[][] };
const ETIKETT_DATEN: Record<string, EtikettDaten> = {
  // Bohren je Stück = cody-cad korpus.bohrbild (Messe-Unterschrank), Art ohne
  // Artikelnummer. Die Tür schlägt links an, darum Montageplatten nur links.
  "Seite Links": {
    kanten: VORN,
    positionen: ["Korpus links"],
    bohren: [["Lochreihe ×50", "MOVENTO-Schiene ×5", "Montageplatte ×4"]],
  },
  "Seite Rechts": {
    kanten: VORN,
    positionen: ["Korpus rechts"],
    bohren: [["Lochreihe ×50", "MOVENTO-Schiene ×5"]],
  },
  "Boden Unten": { kanten: VORN, positionen: ["Korpus unten"] },
  "Boden Oben": { kanten: VORN, positionen: ["Korpus oben"] },
  "Rückwand": { kanten: KEINE, positionen: ["Korpus hinten"] },
  "Tür 1 Links": {
    kanten: RUNDUM,
    positionen: ["Front, Anschlag links"],
    bohren: [["Topf ×2", "Schrauben ×4"]],
  },
  "Schubkasten-Seite links": { kanten: VORN, positionen: ["Schubkasten links"] },
  "Schubkasten-Seite rechts": { kanten: VORN, positionen: ["Schubkasten rechts"] },
  "Schubkasten-Hinterstück": {
    kanten: VORN,
    positionen: ["Schubkasten hinten"],
    bohren: [["Ø6 für MOVENTO ×2"]],
  },
  "Schubkasten-Vorderstück": { kanten: VORN, positionen: ["Schubkasten vorn"] },
  "Schubkasten-Boden": { kanten: KEINE, positionen: ["Schubkasten unten"], bohren: [["Kupplung ×4"]] },
};

const KEINE_BOHRUNG = ["keine Bohrung"];

/** Ein Etikett je Plattenteil (Beschläge und Teile ohne Maß fallen weg). */
export function buildMesseEtiketten(zeilen = buildMesseStueckliste()): Etikett[] {
  const aus: Etikett[] = [];
  for (const [zi, z] of zeilen.entries()) {
    if (z.gruppe === "Beschlag" || !z.mass) continue;
    const d = ETIKETT_DATEN[z.teil];
    for (let i = 0; i < z.anzahl; i++) {
      aus.push({
        nr: aus.length + 1,
        pos: zi + 1,
        stueck: `${i + 1}/${z.anzahl}`,
        teil: z.teil,
        mass: z.mass,
        werkstoff: z.material,
        kanten: d?.kanten ?? KEINE,
        position: d?.positionen[i] ?? d?.positionen[0] ?? "nicht belegt",
        bohren: [...(d?.bohren?.[i] ?? d?.bohren?.[0] ?? KEINE_BOHRUNG)],
        // Kantenbild ist immer Annahme (siehe ETIKETT_DATEN).
        annahme: true,
      });
    }
  }
  return aus;
}

/** Kantenbild als kurzer Text, z. B. »L1 vorn« oder »rundum«. */
export function kantenText(k: Kantenbild): string {
  const n = [k.l1 && "L1", k.l2 && "L2", k.b1 && "B1", k.b2 && "B2"].filter(Boolean);
  if (n.length === 4) return "rundum";
  if (n.length === 0) return "keine Kante";
  return n.join(" + ");
}

/**
 * Teile in der Reihenfolge der Blätter im Bohrplan-Druck (beschlag/bohrplan,
 * BLAETTER), Namen wie die Mappe.
 */
export const MESSE_BOHRPLAN_TEILE = [
  "Tür 1 Links",
  "Seite Links",
  "Seite Rechts",
  "Schubkasten-Hinterstück",
  "Schubkasten-Boden",
] as const;

/** Verweis für die Stückliste, z. B. »Bohrplan Blatt 2 von 5«; ohne Bohrplan-Blatt undefined. */
export function bohrplanBlattVerweis(teil: string): string | undefined {
  const n = MESSE_BOHRPLAN_TEILE.flatMap((t, i) => (t === teil ? [i + 1] : []));
  return n.length ? `Bohrplan Blatt ${n.join(" + ")} von ${MESSE_BOHRPLAN_TEILE.length}` : undefined;
}
