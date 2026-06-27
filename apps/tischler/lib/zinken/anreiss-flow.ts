import {
  computeDovetailLayout,
  type DovetailLayout,
  type DovetailMethod,
} from "@craft-codex/core";

/**
 * Anreiss-Flow — der Meister reisst Schritt fuer Schritt am Brett an.
 *
 * Das ist eine DETERMINISTISCHE State-Machine als reine Daten (kein LLM-Flow):
 * aus Brettbreite + Brettdicke wird die echte Lehrbuch-Teilung berechnet und in
 * kleine Anreiss-Schritte zerlegt. Jeder Schritt hat genau einen Meister-Satz
 * (mit den ECHTEN Zahlen eingesetzt), die Linien, die JETZT am Brett erscheinen
 * sollen, und die Erlaubnis nachzufragen.
 *
 * Claude/Voice wird nur fuer Freitext-Rueckfragen gebraucht — der Ablauf selbst
 * ist reproduzierbar und testbar.
 */

export type AnreissPhase =
  | "messen"
  | "schwalbenzahl"
  | "teile"
  | "streichmass"
  | "markieren"
  | "schraege"
  | "fertig";

export interface AnreissSchritt {
  id: AnreissPhase;
  /** Kurzlabel fuer die Schritt-Leiste */
  label: string;
  /** Was der Meister sagt — einfache Sprache, echte Werte eingesetzt. */
  meisterSagt: string;
  /**
   * Welche Anrisslinien JETZT sichtbar werden (progressiv).
   * IDs/Praefixe matchen generateMarkings("anreissen", …):
   *  - "streichmass_brettstaerke"
   *  - "winkel_pin_" (Praefix → alle Schwalbenwinkel-Linien)
   * Leeres Array = reiner Rechen-/Mess-Schritt ohne neue Linie.
   */
  zeigeLinien: string[];
  /** Kennzahl zum Einblenden neben dem Brett (z.B. "4 Schwalben"). */
  kennzahl?: string;
  /**
   * Tafel-Anschrieb fuer diesen Schritt: die Formel(n) Zeile fuer Zeile, mit
   * echten Werten — wie der Meister sie an die Tafel schreibt, bevor er es am
   * Brett vorzeigt. Leer = reiner Brett-/Handgriff-Schritt ohne Rechnung.
   */
  tafel: string[];
  /** Lehrling darf jederzeit nachfragen. */
  frageErlaubt: boolean;
}

export interface AnreissFlow {
  layout: DovetailLayout;
  schritte: AnreissSchritt[];
}

/** Auf eine Dezimale runden, fuer gesprochene Masse ("10,8 mm"). */
function mm(x: number): string {
  return x.toFixed(1).replace(".", ",");
}

/**
 * Baut den geführten Anreiss-Flow für Methode 1 (Mittellinie).
 *
 * @param B Brettbreite in mm
 * @param D Brettdicke in mm
 */
export function buildAnreissFlow(
  B: number,
  D: number,
  method: DovetailMethod = "mittellinie",
): AnreissFlow {
  const L = computeDovetailLayout(B, D, method);

  const schritte: AnreissSchritt[] = [
    {
      id: "messen",
      label: "Messen",
      meisterSagt:
        `Zuerst messen wir das Brett. Die Breite ist B = ${mm(B)} Millimeter, ` +
        `die Dicke D = ${mm(D)} Millimeter. Mehr brauchen wir nicht, um die ` +
        `ganze Zinkenteilung zu berechnen. Wenn du willst, frag ruhig nach.`,
      zeigeLinien: [],
      kennzahl: `B = ${mm(B)} mm · D = ${mm(D)} mm`,
      tafel: [`Brettbreite   B = ${mm(B)} mm`, `Brettdicke    D = ${mm(D)} mm`],
      frageErlaubt: true,
    },
    {
      id: "schwalbenzahl",
      label: "Schwalbenzahl",
      meisterSagt:
        `Jetzt schaetzen wir, wie viele Schwalben aufs Brett passen. Die Formel ` +
        `ist AZS = B geteilt durch 1,7 mal D, also ${mm(B)} durch ` +
        `${mm(1.7 * D)} = ${L.AZS_raw.toFixed(2).replace(".", ",")}. ` +
        `Gerundet sind das ${L.AZS} Schwalben. Die 1,7 ist ein Daumenwert aus ` +
        `der Werkstatt — frag nach, wenn du wissen willst, warum.`,
      zeigeLinien: [],
      kennzahl: `${L.AZS} Schwalben`,
      tafel: [
        `AZS = B / (1,7 · D)`,
        `    = ${mm(B)} / ${mm(1.7 * D)}`,
        `    = ${L.AZS_raw.toFixed(2).replace(".", ",")} ≈ ${L.AZS} Schwalben`,
      ],
      frageErlaubt: true,
    },
    {
      id: "teile",
      label: "Teilen",
      meisterSagt:
        `Aus den Schwalben wird die Einteilung: AZT = AZS mal 3 plus 1 = ` +
        `${L.AZS} mal 3 plus 1 = ${L.AZT} Teile. Jedes Teil ist T = B durch AZT ` +
        `= ${mm(L.T)} Millimeter breit. Merk dir: ein Zinken ist 1 Teil ` +
        `(${mm(L.zinkenBreite)} mm), eine Schwalbe 2 Teile (${mm(L.schwalbeBreite)} mm).`,
      zeigeLinien: ["mittellinie"],
      kennzahl: `${L.AZT} Teile à ${mm(L.T)} mm`,
      tafel: [
        `AZT = AZS · 3 + 1 = ${L.AZT} Teile`,
        `T   = B / AZT = ${mm(L.T)} mm`,
        `Zinken 1T = ${mm(L.zinkenBreite)} · Schwalbe 2T = ${mm(L.schwalbeBreite)}`,
      ],
      frageErlaubt: true,
    },
    {
      id: "streichmass",
      label: "Streichmaß",
      meisterSagt:
        `Erst kommt das Streichmaß: wir reissen die Brettstärke rundherum an. ` +
        `Diese rote Linie ist deine Stemmtiefe — tiefer gehst du beim Stemmen ` +
        `nie. Schau, so läuft sie umlaufend ums Brett.`,
      zeigeLinien: ["streichmass_brettstaerke"],
      tafel: [`Stemmtiefe = Brettdicke D = ${mm(D)} mm`],
      frageErlaubt: true,
    },
    {
      id: "markieren",
      label: "Markieren",
      meisterSagt:
        `Jetzt teilen wir die Breite ein und markieren die Schwalben — ${L.AZS} ` +
        `Stück, gleichmäßig verteilt. Zinken schmal, Schwalbe doppelt so breit. ` +
        `Die Risse zeigen dir, wo später gesägt wird.`,
      zeigeLinien: ["mittellinie", "schwalbe_pin_"],
      kennzahl: `${L.AZS} Schwalben markiert`,
      tafel: [
        `Zinken  = 1 Teil  (${mm(L.zinkenBreite)} mm)`,
        `Schwalbe = 2 Teile (${mm(L.schwalbeBreite)} mm)`,
        `${L.AZS} Schwalben gleichmäßig verteilt`,
      ],
      frageErlaubt: true,
    },
    {
      id: "schraege",
      label: "Schräge",
      meisterSagt:
        `Zum Schluss die Schräge: 1 zu ${L.slopeRatio}, das sind rund ` +
        `${L.slopeDeg.toFixed(0)} Grad. Mit der Schmiege legst du jede ` +
        `Schwalbenflanke an. Steiler bricht aus, flacher hält schlechter — ` +
        `1 zu ${L.slopeRatio} ist der bewährte Mittelweg.`,
      zeigeLinien: ["mittellinie", "schwalbe_pin_"],
      kennzahl: `Schräge 1:${L.slopeRatio}`,
      tafel: [
        `Schräge = 1 : ${L.slopeRatio}  (≈ ${L.slopeDeg.toFixed(0)}°)`,
        `ZS = ${L.slopeRatio} · T = ${mm(L.ZS)} mm`,
      ],
      frageErlaubt: true,
    },
    {
      id: "fertig",
      label: "Fertig",
      meisterSagt:
        `Das Anreissen steht. Du hast ${L.AZS} Schwalben in ${L.AZT} Teilen, ` +
        `jedes ${mm(L.T)} Millimeter, mit der Schräge 1 zu ${L.slopeRatio}. ` +
        `Jetzt darf gesägt werden — immer auf der Abfallseite der Linie.`,
      zeigeLinien: ["streichmass_brettstaerke", "mittellinie", "schwalbe_pin_"],
      kennzahl: "Anriss komplett",
      tafel: [
        `${L.AZS} Schwalben · ${L.AZT} Teile à ${mm(L.T)} mm`,
        `Schräge 1 : ${L.slopeRatio}`,
        `→ bereit zum Sägen`,
      ],
      frageErlaubt: true,
    },
  ];

  return { layout: L, schritte };
}

/** Prüft, ob eine Marking-ID im aktuellen Schritt sichtbar ist (Praefix-Match). */
export function istLinieSichtbar(schritt: AnreissSchritt, markingId: string): boolean {
  return schritt.zeigeLinien.some(
    (filter) => markingId === filter || markingId.startsWith(filter),
  );
}
