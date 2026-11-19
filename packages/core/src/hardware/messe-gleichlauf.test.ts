import { describe, it, expect } from "vitest";
import { buildVoaiStueckliste } from "./voai-uebergabe.js";
// Kopie der cody-cad-Messe-Datei (voai-Fixture messe-unterschrank.json, sha12 871e87925baf, 18.11.2026).
import cad from "./__fixtures__/cody-cad-messe-unterschrank.json";

type Pos = {
  typ: string;
  artikel_id: string | null;
  menge: string;
  masse_mm?: { laenge: string; breite: string; dicke: string };
};

/** Plattenmaße je Stück, Länge/Breite sortiert (Rückwand 562 × 812 = 812 × 562). */
function platten(pos: Pos[]): string[] {
  return pos
    .filter((p) => p.typ === "freiposition" && p.masse_mm)
    .flatMap((p) => {
      const { laenge, breite, dicke } = p.masse_mm!;
      const [a, b] = [Number(laenge), Number(breite)].sort((x, y) => y - x);
      return Array.from({ length: Number(p.menge) }, () => `${a}×${b}×${dicke}`);
    })
    .sort();
}

/** Blum-Artikel mit Menge (Einheit nicht: craft-codex gibt bewusst stk statt satz). */
function artikel(pos: Pos[]): string[] {
  return pos
    .filter((p) => p.typ === "artikel")
    .map((p) => `${p.artikel_id} ${p.menge}`)
    .sort();
}

describe("Gleichlauf Messe-Unterschrank: craft-codex = cody-cad", () => {
  const unsere = buildVoaiStueckliste().inhalt.positionen as Pos[];
  const ihre = cad.inhalt.positionen as Pos[];

  it("gleiche 11 Plattenstücke mit gleichen Maßen (craft-codex: Seite × 2 in einer Position)", () => {
    expect(platten(ihre)).toHaveLength(11);
    expect(platten(unsere)).toEqual(platten(ihre));
  });

  it("gleiche 4 Blum-Artikel mit gleicher Menge", () => {
    expect(artikel(ihre)).toHaveLength(4);
    expect(artikel(unsere)).toEqual(artikel(ihre));
  });
});
