/**
 * Zinkenteilung für den Lehrgang — die EINE Rechenquelle für Rechner, SVG,
 * 3D und AR. Kein Renderer rechnet AZS, T oder die Schräge selbst nach.
 *
 * Regel (geometrische Zinkenteilung auf der Mittellinie, nach dem
 * österreichischen Fachkunde-Lehrbuch Tischler, Kap. 4.1, in eigenen Worten):
 *   1. Schwalbenzahl AZS schätzen oder rechnen: B/(1,7·D) → eher mehr,
 *      B/(2·D) → eher weniger Schwalben. Der Lehrling legt die Zahl fest.
 *   2. Teile AZT = 3·AZS + 1.
 *   3. Teilbreite T = B/AZT. Auf der Mittellinie: Zinken = 1T, Schwalbe = 2T.
 *      Außen sitzt immer ein Randzinken (1T).
 *   4. Schräge 1:6 — auf dem Papier als Hilfsdreieck: 1T Versatz auf 6T Länge.
 *      6T ist eine Konstruktionslänge, keine Schnittlänge.
 *
 * Alle Maße in Millimetern. Gerechnet wird ungerundet; gerundet wird nur in
 * der Anzeige. Die Papier-Rechnung des Buchs (T zuerst auf 0,1 runden) liegt
 * getrennt in `papierRechnung`, damit niemand Rundung und Regel verwechselt.
 */
import {
  method1Mittellinie,
  type DovetailLayout,
} from "./construction.js";

export type TeilArt = "randzinken" | "zinken" | "schwalbe";

export interface TeilungsSegment {
  art: TeilArt;
  /** Laufende Nummer von links (0-basiert). */
  index: number;
  /** Beginn auf der Mittellinie, von der linken Brettkante (mm). */
  von: number;
  /** Ende auf der Mittellinie (mm). */
  bis: number;
  /** Breite auf der Mittellinie (mm) = 1T oder 2T. */
  breite: number;
}

export interface SchraegeInfo {
  /** Verhältnis 1:ratio. */
  ratio: number;
  /** Echter Winkel zur Faser in Grad: atan(1/ratio). 1:6 ≈ 9,46°, 1:8 ≈ 7,13°. */
  grad: number;
  /**
   * Liegt der Winkel im Gradbereich 10°–14°, den das Buch als zweite
   * Angabe nennt? Bei 1:6 NEIN (9,46°) — 1:6 und »10–14°« sind zwei
   * verschiedene Faustregeln, nicht dasselbe.
   */
  imGradBereich10bis14: boolean;
}

export interface ZinkenTeilungOptionen {
  dichte?: "dicht" | "weit";
  azs?: number;
  slopeRatio?: number;
  /** Halbverdeckt: Blattstärke als Anteil von D (Buch: 1/4). */
  blattAnteil?: number;
}

export interface ZinkenTeilung {
  layout: DovetailLayout;
  /** Faktor k in B/(k·D): 1,7 (dicht) oder 2 (weit). */
  faktor: number;
  /** Schwalbenzahl-Vorschlag aus der Formel (gerundet) — vor der Festlegung. */
  azsVorschlag: number;
  /** Hat der Lehrling die Zahl selbst festgelegt? */
  azsFestgelegt: boolean;
  segmente: TeilungsSegment[];
  /** Summe aller Segmentbreiten — muss B ergeben (Kontrolle »geht auf«). */
  summe: number;
  schraege: SchraegeInfo;
  /** Hilfsdreieck für die Schräge: versatz (1T) auf laenge (ratio·T). */
  hilfsdreieck: { versatz: number; laenge: number };
  /** Halbverdeckt: Blattstärke BL und Schwalbenlänge SL; offen: BL = 0, SL = D. */
  blatt: { BL: number; SL: number };
}

export function schraegeInfo(ratio: number): SchraegeInfo {
  const grad = (Math.atan(1 / ratio) * 180) / Math.PI;
  return { ratio, grad, imGradBereich10bis14: grad >= 10 && grad <= 14 };
}

/** Eingabefehler als Codes (Texte macht die Oberfläche, zweisprachig). */
export type ZinkenEingabeFehler =
  | "breite_ungueltig"
  | "dicke_ungueltig"
  | "dicke_zu_gross"
  | "azs_ungueltig";

export const ZINKEN_GRENZEN = {
  breiteMin: 40,
  breiteMax: 600,
  dickeMin: 8,
  dickeMax: 50,
  azsMax: 20,
} as const;

export function pruefeZinkenEingabe(
  B: number,
  D: number,
  azs?: number,
): ZinkenEingabeFehler[] {
  const f: ZinkenEingabeFehler[] = [];
  const G = ZINKEN_GRENZEN;
  if (!Number.isFinite(B) || B < G.breiteMin || B > G.breiteMax) f.push("breite_ungueltig");
  if (!Number.isFinite(D) || D < G.dickeMin || D > G.dickeMax) f.push("dicke_ungueltig");
  else if (Number.isFinite(B) && D * 2 > B) f.push("dicke_zu_gross");
  if (
    azs !== undefined &&
    (!Number.isInteger(azs) || azs < 1 || azs > G.azsMax)
  )
    f.push("azs_ungueltig");
  return f;
}

/** Segmentkette auf der Mittellinie: Randzinken, (Schwalbe, Zinken)…, Randzinken. */
export function teilungsKette(T: number, AZS: number): TeilungsSegment[] {
  const out: TeilungsSegment[] = [];
  let x = 0;
  const n = 2 * AZS + 1;
  for (let i = 0; i < n; i++) {
    const istZinken = i % 2 === 0;
    const breite = istZinken ? T : 2 * T;
    const art: TeilArt = istZinken
      ? i === 0 || i === n - 1
        ? "randzinken"
        : "zinken"
      : "schwalbe";
    out.push({ art, index: i, von: x, bis: x + breite, breite });
    x += breite;
  }
  return out;
}

export function zinkenTeilung(
  B: number,
  D: number,
  opts: ZinkenTeilungOptionen = {},
): ZinkenTeilung {
  const faktor = opts.dichte === "weit" ? 2 : 1.7;
  const vorschlag = method1Mittellinie(B, D, {
    dichte: opts.dichte,
    slopeRatio: opts.slopeRatio,
    blattAnteil: opts.blattAnteil,
  });
  const azsFestgelegt = opts.azs !== undefined;
  const layout = azsFestgelegt
    ? method1Mittellinie(B, D, {
        dichte: opts.dichte,
        slopeRatio: opts.slopeRatio,
        blattAnteil: opts.blattAnteil,
        azs: opts.azs,
      })
    : vorschlag;
  const segmente = teilungsKette(layout.T, layout.AZS);
  const summe = segmente.reduce((s, g) => s + g.breite, 0);
  const BL = opts.blattAnteil && opts.blattAnteil > 0 ? opts.blattAnteil * D : 0;
  return {
    layout,
    faktor,
    azsVorschlag: vorschlag.AZS,
    azsFestgelegt,
    segmente,
    summe,
    schraege: schraegeInfo(layout.slopeRatio),
    hilfsdreieck: { versatz: layout.T, laenge: layout.slopeRatio * layout.T },
    blatt: { BL, SL: layout.SL },
  };
}

/**
 * So rechnet das Buch auf dem Papier: T zuerst auf 0,1 mm runden, dann
 * damit weiterrechnen (B140/D20: T 10,8 → 2T 21,6 → 6T 64,8 ≈ 65).
 * Nur für die Anzeige »Papier-Rechnung«. Die Geometrie nutzt den
 * ungerundeten Wert (2T = 21,54). Der Unterschied ist kleiner als ein
 * Bleistiftstrich, aber er gehört erklärt, nicht versteckt.
 */
export function papierRechnung(t: ZinkenTeilung): {
  T: number;
  zweiT: number;
  hilfsLaenge: number;
} {
  const T = Math.round(t.layout.T * 10) / 10;
  return {
    T,
    zweiT: Math.round(2 * T * 10) / 10,
    hilfsLaenge: Math.round(t.layout.slopeRatio * T * 10) / 10,
  };
}

/** Punkt im Hirnholz des Zinkenbretts: x entlang B, z quer durch D (0 = außen, D = innen). */
export type HirnholzPunkt = readonly [x: number, z: number];

export interface HirnholzStueck {
  id: string;
  art: "zinken" | "abfall";
  /** Viereck [außen-links, außen-rechts, innen-rechts, innen-links]. */
  punkte: readonly [HirnholzPunkt, HirnholzPunkt, HirnholzPunkt, HirnholzPunkt];
}

export interface Saegeschnitt {
  id: string;
  /** Linie im Hirnholz von außen (z=0) nach innen (z=D). */
  aussen: HirnholzPunkt;
  innen: HirnholzPunkt;
  /** Auf welcher Seite der Linie liegt der Abfall (−1 = links, +1 = rechts)? */
  abfallSeite: -1 | 1;
}

/**
 * Zinken und Abfall im Hirnholz des Zinkenbretts (Zinken zuerst).
 * Auf der Mittellinie (z = D/2) gilt die Teilung 1T/2T genau; zur Außenseite
 * werden die Zinken um D/(2·ratio) je Flanke schmaler, zur Innenseite breiter.
 * Randzinken behalten die Brettkante als Außenflanke.
 * EINE Quelle für SVG, 3D und AR.
 */
export function hirnholzStuecke(t: ZinkenTeilung): HirnholzStueck[] {
  const { B, D, slopeRatio } = t.layout;
  const dx = D / 2 / slopeRatio;
  const eps = 1e-9;
  return t.segmente.map((s) => {
    const linksKante = s.von < eps;
    const rechtsKante = Math.abs(s.bis - B) < eps;
    if (s.art === "schwalbe") {
      return {
        id: `abfall-${s.index}`,
        art: "abfall" as const,
        punkte: [
          [s.von + dx, 0],
          [s.bis - dx, 0],
          [s.bis + dx, D],
          [s.von - dx, D],
        ] as const,
      };
    }
    const lA = linksKante ? 0 : s.von + dx;
    const lI = linksKante ? 0 : s.von - dx;
    const rA = rechtsKante ? B : s.bis - dx;
    const rI = rechtsKante ? B : s.bis + dx;
    return {
      id: `zinken-${s.index}`,
      art: "zinken" as const,
      punkte: [
        [lA, 0],
        [rA, 0],
        [rI, D],
        [lI, D],
      ] as const,
    };
  });
}

/** Alle Sägeschnitte am Zinkenbrett: jede Zinkenflanke, die nicht Brettkante ist. */
export function saegeschnitte(t: ZinkenTeilung): Saegeschnitt[] {
  const out: Saegeschnitt[] = [];
  for (const st of hirnholzStuecke(t)) {
    if (st.art !== "zinken") continue;
    const [aL, aR, iR, iL] = st.punkte;
    if (aL[0] > 1e-9) out.push({ id: `${st.id}-links`, aussen: aL, innen: iL, abfallSeite: -1 });
    if (Math.abs(aR[0] - t.layout.B) > 1e-9)
      out.push({ id: `${st.id}-rechts`, aussen: aR, innen: iR, abfallSeite: 1 });
  }
  return out;
}
