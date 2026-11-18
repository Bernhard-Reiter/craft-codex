import { describe, it, expect } from "vitest";
import { buildMesseStueckliste, messeStuecklisteCsv } from "./messe-stueckliste.js";

describe("Stückliste Messe-Unterschrank", () => {
  const z = buildMesseStueckliste();
  const teil = (t: string) => z.find((r) => r.teil === t);

  it("Korpus und Fronten aus den Vorlagen-Maßen", () => {
    expect(teil("Seite")).toMatchObject({ anzahl: 2, mass: "850 × 575 × 19" });
    expect(teil("Unterboden")).toMatchObject({ mass: "562 × 575 × 19", annahme: true });
    expect(teil("Tür")?.mass).toBe("644 × 596 × 19");
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
