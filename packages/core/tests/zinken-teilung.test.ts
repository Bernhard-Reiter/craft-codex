import { describe, it, expect } from "vitest";
import {
  zinkenTeilung,
  teilungsKette,
  schraegeInfo,
  papierRechnung,
  pruefeZinkenEingabe,
  hirnholzStuecke,
  saegeschnitte,
} from "../src/geometry/zinken-teilung.js";
import { method1Mittellinie } from "../src/geometry/construction.js";

// Buchbeispiel (österreichisches Fachkunde-Lehrbuch Tischler, Kap. 4.1):
// B = 140 mm, D = 20 mm. Erwartete Werte exakt gerechnet, nicht gerundet.
describe("Zinkenteilung — Buchbeispiel B 140 / D 20", () => {
  const t = zinkenTeilung(140, 20);

  it("AZS-Rohwert 140/(1,7·20) = 4,1176… → Vorschlag 4", () => {
    expect(t.layout.AZS_raw).toBeCloseTo(140 / 34, 10);
    expect(t.layout.AZS_raw).toBeCloseTo(4.12, 2);
    expect(t.azsVorschlag).toBe(4);
    expect(t.layout.AZS).toBe(4);
    expect(t.azsFestgelegt).toBe(false);
  });

  it("AZT = 3·4 + 1 = 13", () => {
    expect(t.layout.AZT).toBe(13);
  });

  it("T = 140/13 = 10,769… (Anzeige 10,8)", () => {
    expect(t.layout.T).toBeCloseTo(10.769230769, 8);
    expect(t.layout.T.toFixed(1)).toBe("10.8");
  });

  it("2T exakt 21,54 (nicht 21,6 — das ist die Papier-Rundung)", () => {
    expect(t.layout.schwalbeBreite).toBeCloseTo(21.538461538, 8);
    expect(t.layout.schwalbeBreite.toFixed(2)).toBe("21.54");
    expect(t.layout.schwalbeBreite.toFixed(1)).toBe("21.5");
  });

  it("Hilfsdreieck 6T exakt 64,6 (Buch auf Papier ≈ 65)", () => {
    expect(t.hilfsdreieck.versatz).toBeCloseTo(t.layout.T, 10);
    expect(t.hilfsdreieck.laenge).toBeCloseTo(64.615384615, 8);
  });

  it("Kette: 5 Zinken (2 Randzinken) + 4 Schwalben, geht genau auf B auf", () => {
    const arten = t.segmente.map((s) => s.art);
    expect(arten).toEqual([
      "randzinken", "schwalbe", "zinken", "schwalbe", "zinken",
      "schwalbe", "zinken", "schwalbe", "randzinken",
    ]);
    expect(t.summe).toBeCloseTo(140, 9);
    expect(t.segmente.at(-1)!.bis).toBeCloseTo(140, 9);
  });

  it("offen: BL 0, SL = D", () => {
    expect(t.blatt).toEqual({ BL: 0, SL: 20 });
  });
});

describe("Papier-Rechnung des Buchs (T zuerst auf 0,1 gerundet)", () => {
  it("T 10,8 → 2T 21,6 → 6T 64,8", () => {
    const p = papierRechnung(zinkenTeilung(140, 20));
    expect(p.T).toBe(10.8);
    expect(p.zweiT).toBe(21.6);
    expect(p.hilfsLaenge).toBe(64.8);
  });
});

describe("Variante 3 Schwalben (vom Lehrling festgelegt)", () => {
  const t = zinkenTeilung(140, 20, { azs: 3 });
  it("AZT = 3·3 + 1 = 10, T = 14", () => {
    expect(t.layout.AZS).toBe(3);
    expect(t.layout.AZT).toBe(10);
    expect(t.layout.T).toBeCloseTo(14, 10);
    expect(t.azsFestgelegt).toBe(true);
    expect(t.azsVorschlag).toBe(4);
    expect(t.summe).toBeCloseTo(140, 9);
  });
});

describe("weniger Schwalben: B/(2·D)", () => {
  it("140/(2·20) = 3,5 → Vorschlag 4 (gerundet), Faktor 2", () => {
    const t = zinkenTeilung(140, 20, { dichte: "weit" });
    expect(t.faktor).toBe(2);
    expect(t.layout.AZS_raw).toBeCloseTo(3.5, 10);
    expect(t.layout.AZS).toBe(4);
  });
  it("Referenz B 120 / D 20 weit → AZS 3, AZT 10, T 12", () => {
    const t = zinkenTeilung(120, 20, { dichte: "weit" });
    expect(t.layout.AZS).toBe(3);
    expect(t.layout.AZT).toBe(10);
    expect(t.layout.T).toBeCloseTo(12, 10);
  });
});

describe("halbverdeckt: Blattl = 1/4 D", () => {
  it("D 20 → BL 5, SL 15", () => {
    const t = zinkenTeilung(140, 20, { blattAnteil: 0.25 });
    expect(t.blatt.BL).toBeCloseTo(5, 10);
    expect(t.blatt.SL).toBeCloseTo(15, 10);
  });
});

describe("Schräge: echter Winkel, nicht mit »10–14°« gleichgesetzt", () => {
  it("1:6 = 9,46° — liegt NICHT im Bereich 10–14°", () => {
    const s = schraegeInfo(6);
    expect(s.grad).toBeCloseTo(9.4623, 3);
    expect(s.imGradBereich10bis14).toBe(false);
  });
  it("1:8 = 7,13°", () => {
    const s = schraegeInfo(8);
    expect(s.grad).toBeCloseTo(7.125, 3);
    expect(s.imGradBereich10bis14).toBe(false);
  });
  it("1:5 = 11,31° liegt im Bereich", () => {
    expect(schraegeInfo(5).imGradBereich10bis14).toBe(true);
  });
  it("Buchbeispiel trägt den echten Winkel", () => {
    expect(zinkenTeilung(140, 20).schraege.grad).toBeCloseTo(9.4623, 3);
  });
});

describe("Kette — Invarianten", () => {
  it.each([1, 2, 5, 9])("AZS %i: 2·AZS+1 Segmente, Zinken außen", (n) => {
    const k = teilungsKette(10, n);
    expect(k).toHaveLength(2 * n + 1);
    expect(k[0]!.art).toBe("randzinken");
    expect(k.at(-1)!.art).toBe("randzinken");
    expect(k.filter((s) => s.art === "schwalbe")).toHaveLength(n);
    expect(k.at(-1)!.bis).toBeCloseTo(10 * (3 * n + 1), 9);
  });
});

describe("Eingabeprüfung", () => {
  it("gültiges Buchbeispiel → keine Fehler", () => {
    expect(pruefeZinkenEingabe(140, 20)).toEqual([]);
  });
  it("D größer als halbe Breite", () => {
    expect(pruefeZinkenEingabe(40, 25)).toContain("dicke_zu_gross");
  });
  it("NaN und Grenzen", () => {
    expect(pruefeZinkenEingabe(Number.NaN, 20)).toContain("breite_ungueltig");
    expect(pruefeZinkenEingabe(140, 4)).toContain("dicke_ungueltig");
    expect(pruefeZinkenEingabe(140, 20, 0)).toContain("azs_ungueltig");
    expect(pruefeZinkenEingabe(140, 20, 2.5)).toContain("azs_ungueltig");
  });
});

describe("method1Mittellinie — azs-Option bleibt additiv", () => {
  it("ohne azs unverändert", () => {
    expect(method1Mittellinie(140, 20).AZS).toBe(4);
  });
  it("azs wird gerundet und mindestens 1", () => {
    expect(method1Mittellinie(140, 20, { azs: 0 }).AZS).toBe(1);
    expect(method1Mittellinie(140, 20, { azs: 5 }).AZT).toBe(16);
  });
});

describe("Hirnholz des Zinkenbretts — eine Quelle für SVG/3D/AR", () => {
  const t = zinkenTeilung(140, 20);
  const st = hirnholzStuecke(t);
  const breiteBei = (p: readonly (readonly [number, number])[], z: number) => {
    // lineare Interpolation der Viereck-Kanten (außen z=0, innen z=D)
    const f = z / 20;
    const l = p[0]![0] + (p[3]![0] - p[0]![0]) * f;
    const r = p[1]![0] + (p[2]![0] - p[1]![0]) * f;
    return r - l;
  };

  it("5 Zinken + 4 Abfallstücke", () => {
    expect(st.filter((s) => s.art === "zinken")).toHaveLength(5);
    expect(st.filter((s) => s.art === "abfall")).toHaveLength(4);
  });

  it("auf der Mittellinie: Innenzinken genau 1T, Abfall genau 2T", () => {
    const innen = st.find((s) => s.id === "zinken-2")!;
    const abfall = st.find((s) => s.id === "abfall-1")!;
    expect(breiteBei(innen.punkte, 10)).toBeCloseTo(t.layout.T, 9);
    expect(breiteBei(abfall.punkte, 10)).toBeCloseTo(2 * t.layout.T, 9);
  });

  it("Zinken innen breiter als außen: je Flanke D/6 Versatz über die Dicke, zusammen 2·D/6", () => {
    const z = st.find((s) => s.id === "zinken-2")!;
    expect(breiteBei(z.punkte, 20) - breiteBei(z.punkte, 0)).toBeCloseTo((2 * 20) / 6, 9);
  });

  it("Flankenschräge 1:6 = 9,46° zur Dickenrichtung", () => {
    const z = st.find((s) => s.id === "zinken-2")!;
    const [aL, , , iL] = z.punkte;
    const grad = (Math.atan(Math.abs(aL[0] - iL[0]) / 20) * 180) / Math.PI;
    expect(grad).toBeCloseTo(9.4623, 3);
  });

  it("Randzinken behalten die Brettkante", () => {
    expect(st[0]!.punkte[0][0]).toBe(0);
    expect(st[0]!.punkte[3][0]).toBe(0);
    expect(st.at(-1)!.punkte[1][0]).toBe(140);
  });

  it("Stücke füllen das Hirnholz lückenlos (Flächen-Summe = B·D)", () => {
    const flaeche = (p: readonly (readonly [number, number])[]) => {
      let a = 0;
      for (let i = 0; i < p.length; i++) {
        const [x1, y1] = p[i]!;
        const [x2, y2] = p[(i + 1) % p.length]!;
        a += x1 * y2 - x2 * y1;
      }
      return Math.abs(a) / 2;
    };
    const summe = st.reduce((s, x) => s + flaeche(x.punkte), 0);
    expect(summe).toBeCloseTo(140 * 20, 6);
  });

  it("8 Sägeschnitte (je 2 an 3 Innenzinken + je 1 an 2 Randzinken), Abfall immer neben dem Zinken", () => {
    const sch = saegeschnitte(t);
    expect(sch).toHaveLength(8);
    for (const s of sch) {
      expect(s.aussen[1]).toBe(0);
      expect(s.innen[1]).toBe(20);
    }
    expect(sch.find((s) => s.id === "zinken-0-rechts")!.abfallSeite).toBe(1);
    expect(sch.find((s) => s.id === "zinken-2-links")!.abfallSeite).toBe(-1);
  });
});

// Lage statt Summe: Die Flächen-Summe bleibt bei jeder Kippung B·D und beweist
// deshalb nicht, wo der Abfall liegt. Hier muss jede gemeinsame Flanke von
// Zinken und Abfall außen UND innen auf demselben x liegen.
describe("Hirnholz — Zinken und Abfall teilen ihre Flanken (Lage, nicht nur Summe)", () => {
  const faelle = [
    { B: 140, D: 20, opts: {} },
    { B: 200, D: 22, opts: {} },
    { B: 90, D: 18, opts: {} },
    { B: 300, D: 25, opts: { slopeRatio: 8 } },
    { B: 240, D: 20, opts: { dichte: "weit" as const } },
  ];
  for (const { B, D, opts } of faelle) {
    const st = hirnholzStuecke(zinkenTeilung(B, D, opts));
    const name = `B ${B} / D ${D}${Object.keys(opts).length ? " " + JSON.stringify(opts) : ""}`;

    it(`${name}: Nachbarn haben dieselbe Flanke außen (z=0) und innen (z=D)`, () => {
      expect(st.length).toBeGreaterThan(2);
      for (let i = 0; i + 1 < st.length; i++) {
        const links = st[i]!;
        const rechts = st[i + 1]!;
        expect(links.art).not.toBe(rechts.art);
        // rechte Außenflanke des linken Stücks = linke Außenflanke des rechten
        expect(links.punkte[1][0]).toBeCloseTo(rechts.punkte[0][0], 9);
        // rechte Innenflanke des linken Stücks = linke Innenflanke des rechten
        expect(links.punkte[2][0]).toBeCloseTo(rechts.punkte[3][0], 9);
      }
    });

    it(`${name}: keine Lücke und keine Überlappung bei z = 0, D/2, D`, () => {
      for (const z of [0, D / 2, D]) {
        const f = z / D;
        const strecken = st.map((s) => {
          const [aL, aR, iR, iL] = s.punkte;
          return [aL[0] + (iL[0] - aL[0]) * f, aR[0] + (iR[0] - aR[0]) * f] as const;
        });
        expect(strecken[0]![0]).toBeCloseTo(0, 9);
        expect(strecken.at(-1)![1]).toBeCloseTo(B, 9);
        for (let i = 0; i < strecken.length; i++) {
          expect(strecken[i]![1] - strecken[i]![0]).toBeGreaterThan(0);
          if (i > 0) expect(strecken[i]![0]).toBeCloseTo(strecken[i - 1]![1], 9);
        }
      }
    });
  }

  it("Abfall ist die Gegenform: außen breiter als innen (Zinken umgekehrt)", () => {
    const st = hirnholzStuecke(zinkenTeilung(140, 20));
    const breite = (p: (typeof st)[number]["punkte"], z: 0 | 1) =>
      z === 0 ? p[1][0] - p[0][0] : p[2][0] - p[3][0];
    for (const s of st.filter((x) => x.art === "abfall")) {
      expect(breite(s.punkte, 0) - breite(s.punkte, 1)).toBeCloseTo((2 * 20) / 6, 9);
    }
  });
});
