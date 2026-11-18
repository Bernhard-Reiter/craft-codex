import { describe, it, expect } from "vitest";
import {
  buildMesseEtiketten,
  buildMesseStueckliste,
  kantenText,
  messeStuecklisteCsv,
} from "./messe-stueckliste.js";

describe("Stückliste Messe-Unterschrank", () => {
  const z = buildMesseStueckliste();
  const teil = (t: string) => z.find((r) => r.teil === t);

  it("Korpus und Fronten aus den Vorlagen-Maßen", () => {
    expect(teil("Seite")).toMatchObject({ anzahl: 2, mass: "850 × 575 × 19" });
    expect(teil("Unterboden")).toMatchObject({ mass: "562 × 575 × 19", annahme: true });
    expect(teil("Tür")?.mass).toBe("644 × 596 × 19");
    expect(teil("Oberboden")).toMatchObject({ mass: "562 × 575 × 19", annahme: true });
    expect(teil("Rückwand")).toMatchObject({ mass: "562 × 812 × 19", annahme: true });
    expect(teil("Schubkastenfront")).toMatchObject({ mass: "200 × 596 × 19", annahme: true });
  });

  it("Schubkastenteile sauber in Name und Maß getrennt", () => {
    expect(teil("Vorderstück")?.mass).toBe("520 × 121 × 16");
    expect(teil("Boden")?.mass).toBe("530 × 490 × 16");
  });

  it("Blum-Beschläge mit Artikelnummer, keine Preise", () => {
    const csv = messeStuecklisteCsv(z);
    expect(csv).toContain("71B3550");
    expect(csv).toContain("173L6100");
    expect(csv).toContain("766H5000S");
    expect(csv).not.toMatch(/€|EUR|Preis/i);
    expect(csv.split("\n")[0]).toMatch(/^Gruppe;Teil;Anzahl/);
  });
});

describe("Etiketten Messe-Unterschrank", () => {
  const e = buildMesseEtiketten();

  it("ein Etikett je Plattenteil, Seiten links + rechts getrennt, keine Beschläge", () => {
    // 2 Seiten + Unter/Oberboden + Rückwand + Tür + SK-Front + 5 SK-Teile = 12
    expect(e).toHaveLength(12);
    expect(e.filter((x) => x.teil === "Seite").map((x) => x.position)).toEqual([
      "Korpus links",
      "Korpus rechts",
    ]);
    expect(e.some((x) => /Blum/.test(x.teil))).toBe(false);
    expect(e.map((x) => x.nr)).toEqual(e.map((_, i) => i + 1));
    // Pos. = Zeile der Stückliste, gleiche Nummer wie in der VOAI-Vorschau.
    const zeilen = buildMesseStueckliste();
    for (const x of e) {
      expect(zeilen[x.pos - 1]!.teil).toBe(x.teil);
      expect(x.stueck).toMatch(/^\d+\/\d+$/);
    }
  });

  it("Kantenbild: Fronten rundum, Rückwand ohne, alles als Annahme", () => {
    const t = (n: string) => e.find((x) => x.teil === n)!;
    expect(kantenText(t("Tür").kanten)).toBe("rundum");
    expect(kantenText(t("Rückwand").kanten)).toBe("keine Kante");
    expect(kantenText(t("Unterboden").kanten)).toBe("L1");
    expect(e.every((x) => x.annahme)).toBe(true);
  });

  it("jedes Etikett hat eine eigene, belegte Position", () => {
    const pos = e.map((x) => x.position);
    expect(pos).not.toContain("nicht belegt");
    expect(new Set(pos).size).toBe(e.length);
  });
});
