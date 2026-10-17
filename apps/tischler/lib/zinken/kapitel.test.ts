import { describe, it, expect } from "vitest";
import { LEHRGANG_DE } from "./lehrgang";
import { LEHRGANG_EN } from "./lehrgang.en";
import { SCHRITT_IDS } from "./lehrgang-typen";
import { buildAnreissFlow } from "./anreiss-flow";
import { buildAnreissFlowEn } from "./anreiss-flow.en";
import { SCHWALBENSCHWANZ_LEKTION } from "./lektion";
import { SCHWALBENSCHWANZ_LEKTION_EN } from "./lektion.en";

/**
 * P1 · EINE Kapitel-Liste (z-p1 v2 §3). Alle Zuordnungen hier sind die
 * Soll-Werte aus der Werkstattzeichnung — exakt, nicht nur »aufsteigend«.
 * Neue Module werden dynamisch geladen, damit ein fehlendes Modul als
 * AssertionError mit Grund erscheint und nicht als Ladefehler der Datei.
 */

async function ladeKapitel() {
  try {
    return { mod: await import("./kapitel"), fehler: undefined as unknown };
  } catch (e) {
    return { mod: undefined, fehler: e as unknown };
  }
}

const KAPITEL_SOLL = [
  "warum",
  "anzeichnen",
  "kontrolle",
  "saegen",
  "stemmen-vorbereiten",
  "stemmen",
  "schwalbenbrett-anreissen",
  "schwalbenbrett-saegen",
  "zusammenfuehren",
];

const LEHRGANG_SOLL: Record<string, string[]> = {
  warum: ["warum"],
  anzeichnen: ["anzeichnen"],
  kontrolle: ["kontrolle"],
  saegen: ["saegen"],
  stemmen: ["stemmen-vorbereiten", "stemmen"],
  passen: ["schwalbenbrett-anreissen", "schwalbenbrett-saegen", "zusammenfuehren"],
};

const ANREISS_SOLL: Record<string, string> = {
  messen: "warum",
  schwalbenzahl: "warum",
  teile: "anzeichnen",
  streichmass: "anzeichnen",
  markieren: "anzeichnen",
  schraege: "anzeichnen",
  fertig: "kontrolle",
};

const LEKTION_SOLL: Record<string, string> = {
  ueberblick: "warum",
  anreissen: "anzeichnen",
  saegen: "saegen",
  stemmen: "stemmen",
  passen: "zusammenfuehren",
  pruefen: "zusammenfuehren",
  "xr-uebergabe": "kontrolle",
};

describe("P1 · Kapitel-Liste (T1)", () => {
  it("kapitel.ts liefert genau die 9 Kapitel in Reihenfolge, DE und EN", async () => {
    const { mod, fehler } = await ladeKapitel();
    expect(fehler, `kapitel.ts nicht ladbar: ${String(fehler)}`).toBeUndefined();
    if (!mod) return;
    expect([...mod.KAPITEL_IDS]).toEqual(KAPITEL_SOLL);
    expect(mod.KAPITEL_DE.map((k) => k.id)).toEqual(KAPITEL_SOLL);
    expect(mod.KAPITEL_EN.map((k) => k.id)).toEqual(KAPITEL_SOLL);
    expect(mod.KAPITEL_DE.map((k) => k.nr)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(mod.KAPITEL_EN.map((k) => k.nr)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    mod.KAPITEL_DE.forEach((de, i) => {
      expect(mod.KAPITEL_EN[i]!.titel, de.id).not.toBe(de.titel);
      expect(de.titel.length, de.id).toBeGreaterThan(3);
    });
  });
});

describe("P1 · Lehrgang auf der Kapitel-Liste (T2)", () => {
  it("Lehrgang-Ids sind genau die sechs Einträge, SCHRITT_IDS ebenso", () => {
    expect(LEHRGANG_DE.map((s) => s.id)).toEqual(Object.keys(LEHRGANG_SOLL));
    expect(LEHRGANG_EN.map((s) => s.id)).toEqual(Object.keys(LEHRGANG_SOLL));
    expect([...SCHRITT_IDS]).toEqual(Object.keys(LEHRGANG_SOLL));
  });

  it("jeder Eintrag trägt exakt seine Kapitel (DE und EN)", () => {
    for (const liste of [LEHRGANG_DE, LEHRGANG_EN]) {
      const ist = Object.fromEntries(liste.map((s) => [s.id, s.kapitel ? [...s.kapitel] : undefined]));
      expect(ist).toEqual(LEHRGANG_SOLL);
    }
  });

  it("zusammen ergeben die Einträge jedes Kapitel genau einmal, in Reihenfolge", () => {
    const alle = LEHRGANG_DE.flatMap((s) => (s.kapitel ? [...s.kapitel] : []));
    expect(alle).toEqual(KAPITEL_SOLL);
  });

  it("nr = Nummer des ersten Kapitels des Eintrags", () => {
    expect(LEHRGANG_DE.map((s) => s.nr)).toEqual([1, 2, 3, 4, 5, 7]);
    expect(LEHRGANG_EN.map((s) => s.nr)).toEqual([1, 2, 3, 4, 5, 7]);
  });

  it("SCHRITT_IDS sind aus kapitel.ts abgeleitet (gleiche Gruppen)", async () => {
    const { mod, fehler } = await ladeKapitel();
    expect(fehler, `kapitel.ts nicht ladbar: ${String(fehler)}`).toBeUndefined();
    if (!mod) return;
    const gruppen = Object.fromEntries(
      Object.entries(mod.LEHRGANG_GRUPPEN).map(([k, v]) => [k, [...v]]),
    );
    expect(gruppen).toEqual(LEHRGANG_SOLL);
  });
});

describe("P1 · Anreiß-Ablauf und Lektion auf der Kapitel-Liste (T3)", () => {
  it("anreiss-flow DE: jede Phase exakt ihrem Kapitel zugeordnet", () => {
    const ist = Object.fromEntries(buildAnreissFlow(140, 20).schritte.map((s) => [s.id, s.kapitel]));
    expect(ist).toEqual(ANREISS_SOLL);
  });

  it("anreiss-flow EN: dieselbe Zuordnung", () => {
    const ist = Object.fromEntries(buildAnreissFlowEn(140, 20).schritte.map((s) => [s.id, s.kapitel]));
    expect(ist).toEqual(ANREISS_SOLL);
  });

  it("Lektion DE: jeder Beat exakt seinem Kapitel zugeordnet", () => {
    const ist = Object.fromEntries(SCHWALBENSCHWANZ_LEKTION.map((b) => [b.id, b.kapitel]));
    expect(ist).toEqual(LEKTION_SOLL);
  });

  it("Lektion EN: dieselbe Zuordnung", () => {
    const ist = Object.fromEntries(SCHWALBENSCHWANZ_LEKTION_EN.map((b) => [b.id, b.kapitel]));
    expect(ist).toEqual(LEKTION_SOLL);
  });
});
