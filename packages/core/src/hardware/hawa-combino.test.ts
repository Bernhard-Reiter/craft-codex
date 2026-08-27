import { describe, it, expect } from "vitest";
import { buildHawaCombinoLayout } from "./hawa-combino.js";
import {
  validateLayout,
  mirrorLayout,
  mayRenderDrillPoints,
  openQuestions,
} from "./validate.js";

/** Türblattbreite der Referenzmessung. */
const TB = 600;

describe("Hawa Combino — Bohrbild", () => {
  const l = buildHawaCombinoLayout(TB);

  it("besteht den Validator", () => {
    expect(validateLayout(l)).toEqual([]);
  });

  it("hat sechs Bohrungen mit eindeutigen IDs", () => {
    expect(l.points).toHaveLength(6);
    expect(new Set(l.points.map((p) => p.id)).size).toBe(6);
  });

  it("führt genau eine Topfbohrung Ø25 T10", () => {
    const toepfe = l.points.filter((p) => p.diameter === 25);
    expect(toepfe).toHaveLength(1);
    expect(toepfe[0]?.depth).toBe(10);
    expect(toepfe[0]?.id).toBe("fuehr.topf");
  });

  it("führt fünf Vorbohrungen Ø3 T3", () => {
    const vor = l.points.filter((p) => p.diameter === 3);
    expect(vor).toHaveLength(5);
    expect(vor.every((p) => p.depth === 3)).toBe(true);
  });

  it("bemaßt die oberen Bohrungen ab Oberkante, die unteren ab Unterkante", () => {
    const oben = l.points.filter((p) => p.id.startsWith("lauf."));
    const unten = l.points.filter((p) => p.id.startsWith("fuehr."));
    expect(oben.every((p) => p.yRef === "oberkante")).toBe(true);
    expect(unten.every((p) => p.yRef === "unterkante")).toBe(true);
  });

  it("setzt die Topfbohrung auf die belegten Maße 120 / 104", () => {
    const topf = l.points.find((p) => p.id === "fuehr.topf");
    expect(topf?.x).toBe(120);
    expect(topf?.y).toBe(104);
  });

  it("nennt Quelle und Gegenquelle", () => {
    expect(l.source.document).toBe("788.2000.310");
    expect(l.source.page).toBe(8);
    expect(l.source.crosscheck).toContain("DGH-M2022");
  });

  it("gilt für Linksanschlag", () => {
    expect(l.anschlag).toBe("links");
  });
});

describe("Hawa Combino — Maßketten gehen auf", () => {
  const l = buildHawaCombinoLayout(TB);

  it.each([
    ["oben.x", 207],
    ["oben.y", 47],
    ["unten.x", 153],
    ["unten.y", 109],
  ])("Kette %s summiert auf %i mm", (id, total) => {
    const chain = l.chains.find((c) => c.id === id);
    expect(chain).toBeDefined();
    const sum = chain!.segments.reduce((a, s) => a + s.value, 0);
    expect(sum).toBe(total);
    expect(chain!.total).toBe(total);
  });

  it("misst nur auf Bohrungen, die es gibt", () => {
    const ids = new Set(l.points.map((p) => p.id));
    for (const c of l.chains) {
      for (const s of c.segments) {
        if (s.toPointId) expect(ids.has(s.toPointId)).toBe(true);
      }
    }
  });
});

describe("Hawa Combino — Prüfstand", () => {
  const l = buildHawaCombinoLayout(TB);

  it("ist ein Entwurf, kein geprüftes Bohrbild", () => {
    expect(l.status).toBe("entwurf");
  });

  it("zeigt deshalb keine Bohrpunkte", () => {
    expect(mayRenderDrillPoints(l)).toBe(false);
  });

  it("benennt die drei offenen Zuordnungen", () => {
    const offen = openQuestions(l);
    expect(offen.map((o) => o.pointId).sort()).toEqual([
      "fuehr.d",
      "fuehr.e",
      "lauf.a",
    ]);
  });

  it("lässt sich nicht heimlich auf geprüft setzen", () => {
    const issues = validateLayout({ ...l, status: "geprueft" });
    expect(issues.filter((i) => i.rule === "layout.offenTrotzGeprueft")).toHaveLength(3);
  });

  it("die Topfbohrung trägt keine offene Frage", () => {
    expect(l.points.find((p) => p.id === "fuehr.topf")?.offen).toBeUndefined();
  });
});

describe("Hawa Combino — Spiegelung auf Rechtsanschlag", () => {
  const l = buildHawaCombinoLayout(TB);
  const r = mirrorLayout(l);

  it("dreht den Anschlag", () => {
    expect(r.anschlag).toBe("rechts");
  });

  it("spiegelt x an der Türblattbreite", () => {
    expect(r.points.find((p) => p.id === "fuehr.topf")?.x).toBe(TB - 120);
    expect(r.points.find((p) => p.id === "lauf.b")?.x).toBe(TB - 207);
  });

  it("lässt Bohrmaße und Schrittzuordnung unangetastet", () => {
    const topf = r.points.find((p) => p.id === "fuehr.topf");
    expect(topf?.diameter).toBe(25);
    expect(topf?.depth).toBe(10);
    expect(topf?.stepId).toBe("E.tuer_bohren");
    expect(topf?.yRef).toBe("unterkante");
  });

  it("besteht den Validator auch gespiegelt", () => {
    expect(validateLayout(r)).toEqual([]);
  });
});

describe("Hawa Combino — Umrechnung für den Renderer", () => {
  it("113 mm sind 0,113 m", () => {
    const l = buildHawaCombinoLayout(TB);
    const a = l.points.find((p) => p.id === "lauf.a");
    expect((a!.x / 1000).toFixed(3)).toBe("0.113");
  });

  it("skaliert mit der Türblattbreite, ohne die Kantenmaße zu verändern", () => {
    const schmal = buildHawaCombinoLayout(500);
    const breit = buildHawaCombinoLayout(900);
    // Die Bohrungen hängen an den Kanten, nicht an der Breite.
    expect(schmal.points.map((p) => p.x)).toEqual(breit.points.map((p) => p.x));
    // Gespiegelt macht die Breite dann sehr wohl den Unterschied.
    expect(mirrorLayout(schmal).points[0]?.x).not.toBe(
      mirrorLayout(breit).points[0]?.x,
    );
  });
});
