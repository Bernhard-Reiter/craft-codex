/**
 * AR-Registrierung des echten Zinkenbretts (3 Punkte, Quest 3).
 *
 * Bezugsrahmen = der Inhalt von ZinkenWerkstueckInhalt (Meter): x entlang B
 * (Mitte = 0), y nach oben (0 = Grundlinie, D = Hirnholz), z quer durch die
 * Dicke (Mitte = 0, Außenfläche = −D/2).
 *
 * Die drei Punkte liegen alle auf der AUSSENFLÄCHE und spannen ein großes
 * Dreieck auf (nicht kollinear, weit auseinander):
 *   1 = obere linke Ecke (Hirnholz/Außenfläche/linke Kante)
 *   2 = obere rechte Ecke
 *   3 = Marke auf der linken Kante, ABSTAND_P3 mm unter dem Hirnholz
 *       (vorher mit Winkel und Bleistift anzeichnen)
 */
import type { Vec3 } from "@craft-codex/core";

export const ABSTAND_P3_MM = 100;
const MM = 0.001;

export function zinkenModellPunkte(B: number, D: number): [Vec3, Vec3, Vec3] {
  const z = (-D / 2) * MM;
  return [
    [(-B / 2) * MM, D * MM, z],
    [(B / 2) * MM, D * MM, z],
    [(-B / 2) * MM, (D - ABSTAND_P3_MM) * MM, z],
  ];
}

export type RegistrierGuete = "gut" | "grenzwertig" | "neu";

/**
 * Bewertung des Restfehlers. Grenze »gut« = 2 mm (Plan, vorläufig, am Gerät
 * zu messen — Quest-Tracking ist keine Messtechnik). Über 5 mm: neu ausrichten.
 */
export function bewerteRegistrierung(rmsMeter: number): RegistrierGuete {
  const mm = rmsMeter * 1000;
  if (!Number.isFinite(mm)) return "neu";
  if (mm <= 2) return "gut";
  if (mm <= 5) return "grenzwertig";
  return "neu";
}
