import { describe, it, expect } from "vitest";
import {
  erklaerungZeigen,
  hilfeTexte,
  rueckfall,
  start,
  weiter,
  type MeisterZustand,
} from "./meister-stufen";
import { WERKBANK_SCHRITTE_DE, type WerkbankSchrittId } from "./schritte";
import { WERKBANK_SCHRITTE_EN } from "./schritte.en";

/**
 * Werkbank S2a (Zeichnung b v9, Abschnitt 3 und 5 »Hilfestufen-Automat«):
 * feste Reihenfolge, je Klick höchstens eine Stufe mehr, erklaerung nur auf
 * eigenen Wunsch, unbekannter Schritt wirft. Rückfall bei »ohne-ki«: die
 * nächste ungezeigte Stufe, nie erklaerung, danach der Schlüssel "alle-gezeigt".
 * Jeder Test ruft start() mit einem echten Schritt auf, bevor er etwas
 * erwartet. So ist ein Platzhalter, der nur wirft, in jedem Test rot.
 */

const STUFEN = ["beobachten", "hinweis", "teilschritt", "erklaerung"] as const;
const SCHRITTE = ["bezugsflaeche", "grundlinie", "pruefen"] as const;
const FREMD = "zapfen" as string as WerkbankSchrittId;

type Aktion = (z: MeisterZustand) => MeisterZustand;
const AKTIONEN: readonly (readonly [string, Aktion])[] = [
  ["weiter", weiter],
  ["erklaerungZeigen", erklaerungZeigen],
  ["rueckfall", (z) => rueckfall(z).zustand],
];

const SPRACHEN = [
  ["de", () => WERKBANK_SCHRITTE_DE],
  ["en", () => WERKBANK_SCHRITTE_EN],
] as const;

/** n-mal »nächste Hilfe« klicken. */
function klicks(z: MeisterZustand, n: number): MeisterZustand {
  let jetzt = z;
  for (let i = 0; i < n; i++) jetzt = weiter(jetzt);
  return jetzt;
}

/** Zustand einfrieren: Wer ihn ändern will, bekommt einen TypeError. */
function einfrieren(z: MeisterZustand): MeisterZustand {
  Object.freeze(z.gezeigt);
  return Object.freeze(z);
}

describe("Werkbank S2a — Hilfestufen-Automat", () => {
  it("start zeigt für jeden der drei Schritte noch keine Stufe", () => {
    for (const id of SCHRITTE) {
      expect(start(id)).toEqual({ schrittId: id, gezeigt: [] });
    }
  });

  it("start mit unbekanntem Schritt wirft einen Fehler", () => {
    expect(start("bezugsflaeche").schrittId).toBe("bezugsflaeche");
    expect(() => start(FREMD)).toThrow(/unbekannter Schritt/);
  });

  it("weiter zeigt je Klick genau eine Stufe mehr, in der festen Reihenfolge", () => {
    const z1 = weiter(start("grundlinie"));
    const z2 = weiter(z1);
    const z3 = weiter(z2);
    expect(z1).toEqual({ schrittId: "grundlinie", gezeigt: ["beobachten"] });
    expect(z2).toEqual({ schrittId: "grundlinie", gezeigt: ["beobachten", "hinweis"] });
    expect(z3).toEqual({ schrittId: "grundlinie", gezeigt: ["beobachten", "hinweis", "teilschritt"] });
  });

  it("weiter zeigt nie die erklaerung, auch nach vielen Klicks", () => {
    const z = klicks(start("pruefen"), 10);
    expect(z.gezeigt).toEqual(["beobachten", "hinweis", "teilschritt"]);
    expect(z.gezeigt).not.toContain("erklaerung");
  });

  it("erklaerungZeigen vor teilschritt ändert nichts (kein Sprung)", () => {
    for (let n = 0; n < 3; n++) {
      const z = klicks(start("bezugsflaeche"), n);
      expect(erklaerungZeigen(z).gezeigt, `nach ${n} Klicks`).toEqual(STUFEN.slice(0, n));
    }
  });

  it("erklaerungZeigen nach teilschritt zeigt die erklaerung, danach ändert kein Klick etwas", () => {
    const z4 = erklaerungZeigen(klicks(start("grundlinie"), 3));
    expect(z4).toEqual({ schrittId: "grundlinie", gezeigt: [...STUFEN] });
    expect(erklaerungZeigen(z4)).toEqual(z4);
    expect(weiter(z4)).toEqual(z4);
  });

  it("die Übergänge ändern den alten Zustand nicht", () => {
    for (let n = 0; n <= 3; n++) {
      const alt = einfrieren(klicks(start("pruefen"), n));
      const vorher = [...alt.gezeigt];
      weiter(alt);
      erklaerungZeigen(alt);
      rueckfall(alt);
      hilfeTexte(alt, WERKBANK_SCHRITTE_DE);
      expect(alt.gezeigt, `nach ${n} Klicks`).toEqual(vorher);
      expect(alt.schrittId).toBe("pruefen");
    }
  });

  it("rueckfall zeigt die nächste noch nicht gezeigte Stufe und meldet dabei nichts", () => {
    const r1 = rueckfall(start("bezugsflaeche"));
    const r2 = rueckfall(r1.zustand);
    const r3 = rueckfall(r2.zustand);
    expect(r1).toEqual({ zustand: { schrittId: "bezugsflaeche", gezeigt: ["beobachten"] }, meldung: null });
    expect(r2).toEqual({ zustand: { schrittId: "bezugsflaeche", gezeigt: ["beobachten", "hinweis"] }, meldung: null });
    expect(r3).toEqual({
      zustand: { schrittId: "bezugsflaeche", gezeigt: ["beobachten", "hinweis", "teilschritt"] },
      meldung: null,
    });
  });

  it("rueckfall nach Klicks nimmt die nächste ungezeigte Stufe, nicht wieder beobachten", () => {
    const r = rueckfall(klicks(start("grundlinie"), 2));
    expect(r.zustand.gezeigt).toEqual(["beobachten", "hinweis", "teilschritt"]);
    expect(r.meldung).toBeNull();
  });

  it("rueckfall gibt nie die erklaerung, auch wenn er oft kommt", () => {
    let z = start("pruefen");
    for (let i = 0; i < 6; i++) z = rueckfall(z).zustand;
    expect(z.gezeigt).toEqual(["beobachten", "hinweis", "teilschritt"]);
    expect(z.gezeigt).not.toContain("erklaerung");
  });

  it("rueckfall nach allen drei Stufen liefert den Schlüssel alle-gezeigt und keinen Text", () => {
    const z3 = klicks(start("bezugsflaeche"), 3);
    expect(rueckfall(z3)).toEqual({ zustand: z3, meldung: "alle-gezeigt" });
    const z4 = erklaerungZeigen(z3);
    expect(rueckfall(z4)).toEqual({ zustand: z4, meldung: "alle-gezeigt" });
  });

  it("unbekannter Schritt im Zustand: weiter, erklaerungZeigen und rueckfall werfen", () => {
    const kaputt: MeisterZustand = { ...start("pruefen"), schrittId: FREMD };
    expect(() => weiter(kaputt)).toThrow(/unbekannter Schritt/);
    expect(() => erklaerungZeigen(kaputt)).toThrow(/unbekannter Schritt/);
    expect(() => rueckfall(kaputt)).toThrow(/unbekannter Schritt/);
  });

  it("jede Aktion zeigt höchstens eine Stufe mehr, erklaerung nur über erklaerungZeigen", () => {
    // Alle Folgen aus 5 Aktionen (3 hoch 5 = 243), jeder Schritt der Folge wird geprüft.
    const pruefe = (alt: MeisterZustand, tiefe: number): void => {
      if (tiefe === 0) return;
      for (const [name, aktion] of AKTIONEN) {
        const neu = aktion(alt);
        expect([0, 1], name).toContain(neu.gezeigt.length - alt.gezeigt.length);
        expect(neu.gezeigt, name).toEqual(STUFEN.slice(0, neu.gezeigt.length));
        expect(neu.schrittId, name).toBe(alt.schrittId);
        if (neu.gezeigt.includes("erklaerung") && !alt.gezeigt.includes("erklaerung")) {
          expect(name).toBe("erklaerungZeigen");
        }
        pruefe(neu, tiefe - 1);
      }
    };
    pruefe(start("grundlinie"), 5);
  });

  it.each(SPRACHEN)("%s: hilfeTexte liefert die Texte der gezeigten Stufen aus hilfen", (_l, liste) => {
    expect(liste()).toHaveLength(3);
    for (const s of liste()) {
      const z0 = start(s.id);
      expect(hilfeTexte(z0, liste()), s.id).toEqual([]);
      expect(hilfeTexte(weiter(z0), liste()), s.id).toEqual([{ stufe: "beobachten", text: s.hilfen.beobachten }]);
      const z4 = erklaerungZeigen(klicks(z0, 3));
      expect(hilfeTexte(z4, liste()), s.id).toEqual(STUFEN.map((stufe) => ({ stufe, text: s.hilfen[stufe] })));
    }
  });

  it("hilfeTexte wirft, wenn der Schritt nicht in der übergebenen Liste steht", () => {
    const z = weiter(start("pruefen"));
    const ohne = WERKBANK_SCHRITTE_DE.filter((s) => s.id !== "pruefen");
    expect(ohne).toHaveLength(2);
    expect(() => hilfeTexte(z, ohne)).toThrow(/unbekannter Schritt/);
  });
});
