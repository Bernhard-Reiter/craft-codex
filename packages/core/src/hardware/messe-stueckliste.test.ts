import { describe, it, expect } from "vitest";
import {
  bohrplanBlattVerweis,
  buildMesseEtiketten,
  buildMesseStueckliste,
  gruppeAnzeige,
  kantenText,
  messeStuecklisteCsv,
} from "./messe-stueckliste.js";

describe("Stückliste Messe-Unterschrank", () => {
  const z = buildMesseStueckliste();
  const teil = (t: string) => z.find((r) => r.teil === t);

  it("Korpus und Fronten aus den Vorlagen-Maßen", () => {
    expect(teil("Seite Links")).toMatchObject({ anzahl: 1, mass: "850 × 575 × 19" });
    expect(teil("Seite Rechts")).toMatchObject({ anzahl: 1, mass: "850 × 575 × 19" });
    expect(teil("Boden Unten")).toMatchObject({ mass: "562 × 575 × 19", annahme: false });
    expect(teil("Tür 1 Links")?.mass).toBe("846 × 596 × 19");
    expect(teil("Boden Oben")).toMatchObject({ mass: "562 × 575 × 19", annahme: false });
    expect(teil("Rückwand")).toMatchObject({ mass: "812 × 562 × 19", annahme: false });
    expect(z.filter((r) => r.hinweis?.includes("3D-Szene"))).toEqual([]);
    expect(teil("Schubkastenfront")).toBeUndefined();
  });

  it("Pos. 1–15, Name, Stk und Marke wörtlich wie die Werkstatt-Mappe (G3)", () => {
    // Soll: Mappe d30ddd90 S.1 = Angebot F (Pos. 12–15), C-Soll-Datei soll-stueckliste-mappe-g3.md 875fa1c519a8.
    const soll: [string, number, boolean][] = [
      ["Seite Links", 1, false],
      ["Seite Rechts", 1, false],
      ["Boden Unten", 1, false],
      ["Boden Oben", 1, false],
      ["Rückwand", 1, false],
      ["Tür 1 Links", 1, false],
      ["Schubkasten-Seite links", 1, true],
      ["Schubkasten-Seite rechts", 1, true],
      ["Schubkasten-Hinterstück", 1, true],
      ["Schubkasten-Vorderstück", 1, true],
      ["Schubkasten-Boden", 1, true],
      ["CLIP Kreuzmontageplatte 37/32, Distanz 0 mm, zum Anschrauben", 2, false],
      ["CLIP top BLUMOTION 110° Scharnier, Topf zum Schrauben, Eckanschlag", 2, false],
      ["MOVENTO Führung, Vollauszug, 70 kg, Nennlänge 500", 1, false],
      ["MOVENTO Kupplung, links und rechts", 1, false],
    ];
    expect(z.map((r) => [r.teil, r.anzahl, r.annahme])).toEqual(soll);
    expect(z.filter((r) => r.gruppe === "Beschlag").map((r) => r.artikel)).toEqual([
      "173L6100", "71B3550", "766H5000S", "T51.7601",
    ]);
    expect(z.slice(0, 6).every((r) => r.material === "Demo-Träger 19 roh (synthetisch)")).toBe(true);
    expect(z.slice(6, 11).every((r) => r.material === "Eiche natur geölt")).toBe(true);
    expect(z.map((r) => gruppeAnzeige(r))).not.toContain("Schubkasten");
    expect(messeStuecklisteCsv(z)).not.toMatch(/demo-aufbau/);
  });

  it("Messe-Ansicht ohne Werkstatt-Wörter (C-Befund G1)", () => {
    expect(z.map((r) => r.hinweis).join(" ")).not.toMatch(/cody-cad|Meister|Bernhard|\.json/);
  });

  it("Schubkastenteile sauber in Name und Maß getrennt", () => {
    expect(teil("Schubkasten-Vorderstück")?.mass).toBe("520 × 121 × 16");
    expect(teil("Schubkasten-Boden")?.mass).toBe("530 × 490 × 16");
  });

  it("Blum-Beschläge mit Artikelnummer, keine Preise", () => {
    const csv = messeStuecklisteCsv(z);
    expect(csv).toContain("71B3550");
    expect(csv).toContain("173L6100");
    expect(csv).toContain("766H5000S");
    expect(csv).not.toMatch(/€|EUR|Preis/i);
    expect(csv.split("\n")[0]).toMatch(/^Pos\.;Gruppe;Teil;Artikel;Anzahl/);
  });
});

describe("Etiketten Messe-Unterschrank", () => {
  const e = buildMesseEtiketten();

  it("ein Etikett je Plattenteil, Seiten links + rechts getrennt, keine Beschläge", () => {
    // 2 Seiten + Unter/Oberboden + Rückwand + Tür + 5 SK-Teile = 11 (Innenschubkasten, keine SK-Front)
    expect(e).toHaveLength(11);
    expect(e.filter((x) => x.teil.startsWith("Seite ")).map((x) => x.position)).toEqual([
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

  it("Bohren wie cody-cad-Bohrbild: 5 Teile gebohrt, 6 ohne", () => {
    const b = (teil: string, pos?: string) =>
      e.find((x) => x.teil === teil && (!pos || x.position === pos))!.bohren;
    expect(b("Seite Links", "Korpus links")).toEqual([
      "Lochreihe ×50",
      "MOVENTO-Schiene ×5",
      "Montageplatte ×4",
    ]);
    expect(b("Seite Rechts", "Korpus rechts")).toEqual(["Lochreihe ×50", "MOVENTO-Schiene ×5"]);
    expect(b("Tür 1 Links")).toEqual(["Topf ×2", "Schrauben ×4"]);
    expect(b("Schubkasten-Hinterstück")).toEqual(["Ø6 für MOVENTO ×2"]);
    expect(b("Schubkasten-Boden")).toEqual(["Kupplung ×4"]);
    const keine = e.filter((x) => x.bohren.join() === "keine Bohrung").map((x) => x.teil);
    expect(keine).toHaveLength(6);
    expect(keine).toContain("Rückwand");
  });

  it("Kantenbild: Fronten rundum, Rückwand ohne, alles als Annahme", () => {
    const t = (n: string) => e.find((x) => x.teil === n)!;
    expect(kantenText(t("Tür 1 Links").kanten)).toBe("rundum");
    expect(kantenText(t("Rückwand").kanten)).toBe("keine Kante");
    expect(kantenText(t("Boden Unten").kanten)).toBe("L1");
    expect(e.every((x) => x.annahme)).toBe(true);
  });

  it("jedes Etikett hat eine eigene, belegte Position", () => {
    const pos = e.map((x) => x.position);
    expect(pos).not.toContain("nicht belegt");
    expect(new Set(pos).size).toBe(e.length);
  });

  it("jedes gebohrte Teil verweist auf sein Bohrplan-Blatt, ungebohrte nicht", () => {
    const verweise = Object.fromEntries(
      buildMesseStueckliste().flatMap((r) => {
        const v = bohrplanBlattVerweis(r.teil);
        return v ? [[r.teil, v]] : [];
      }),
    );
    expect(verweise).toEqual({
      "Tür 1 Links": "Bohrplan Blatt 1 von 5",
      "Seite Links": "Bohrplan Blatt 2 von 5",
      "Seite Rechts": "Bohrplan Blatt 3 von 5",
      "Schubkasten-Hinterstück": "Bohrplan Blatt 4 von 5",
      "Schubkasten-Boden": "Bohrplan Blatt 5 von 5",
    });
    const gebohrt = new Set(
      buildMesseEtiketten()
        .filter((e) => e.bohren.join() !== "keine Bohrung")
        .map((e) => e.teil),
    );
    expect(new Set(Object.keys(verweise))).toEqual(gebohrt);
  });
});
