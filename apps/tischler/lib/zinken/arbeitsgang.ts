/**
 * Zeitplan der Arbeitsgang-Animation (Vormachen in Zeitlupe).
 * Ein Fortschritt f ∈ [0, 1] wird auf die Einzelschritte verteilt:
 * Sägen = ein Schnitt nach dem anderen, Stemmen = je Abfallstück erst die
 * Außenhälfte, dann (Brett gewendet) die Innenhälfte, Passen = Schwalbenbrett
 * gleitet über die Zinken. Rein und testbar, ohne three.js.
 */
import { saegeschnitte, hirnholzStuecke, type ZinkenTeilung } from "@craft-codex/core";

const klemme = (x: number) => Math.min(1, Math.max(0, x));

export interface Zeitplan {
  anzahlSchnitte: number;
  anzahlAbfall: number;
  /** Tiefe des Schnitts i (0 = noch nicht, 1 = bis zur Grundlinie). */
  saegen(f: number, i: number): number;
  aktiverSchnitt(f: number): number;
  /** Wie weit Hälfte h (0 außen, 1 innen) von Abfallstück i entfernt ist. */
  stemmen(f: number, i: number, h: 0 | 1): number;
  aktivesStemmen(f: number): { index: number; haelfte: 0 | 1 };
  /** Schwalbenbrett: 0 = oben, 1 = ganz eingeschoben (sanft gebremst). */
  passen(f: number): number;
}

export function zeitplan(t: ZinkenTeilung): Zeitplan {
  const n = Math.max(1, saegeschnitte(t).length);
  const m = Math.max(1, hirnholzStuecke(t).filter((s) => s.art === "abfall").length);
  return {
    anzahlSchnitte: n,
    anzahlAbfall: m,
    saegen: (f, i) => klemme((klemme(f) - i / n) * n),
    aktiverSchnitt: (f) => Math.min(n - 1, Math.floor(klemme(f) * n)),
    stemmen: (f, i, h) => {
      const slot = 2 * i + h;
      return klemme((klemme(f) - slot / (2 * m)) * 2 * m);
    },
    aktivesStemmen: (f) => {
      const slot = Math.min(2 * m - 1, Math.floor(klemme(f) * 2 * m));
      return { index: Math.floor(slot / 2), haelfte: (slot % 2) as 0 | 1 };
    },
    passen: (f) => {
      const x = klemme(f);
      return 1 - (1 - x) * (1 - x);
    },
  };
}
