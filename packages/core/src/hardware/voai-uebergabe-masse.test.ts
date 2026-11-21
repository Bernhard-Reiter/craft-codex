import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { DEZIMAL_POSITIV, kantenMm, masseAusText } from "./voai-uebergabe.js";
import type { Kantenbild } from "./messe-stueckliste.js";

// W2c (K5, K18): Maße gehen nur noch streng geparst in die VOAI-Datei, sonst Abbruch.
// Jeder Abbruch-Test prüft den Meldungstext: ohne Text wäre er am alten Stand schon
// grün, weil dort der fehlende Export einen TypeError wirft (Lehre a5).
const KEIN_MASS = /Maß von T ist kein »L × B × S« in mm/;
const K = (l1: boolean, l2: boolean, b1: boolean, b2: boolean): Kantenbild => ({ l1, l2, b1, b2 });
const VORN = K(true, false, false, false);
const RUNDUM = K(true, true, true, true);

describe("masseAusText: »L × B × S« in mm, streng wie dezimal_positiv", () => {
  it("liest ein gültiges Maß als drei Dezimalstrings", () => {
    expect(masseAusText("600 × 560 × 19", "T")).toEqual({ laenge: "600", breite: "560", dicke: "19" });
  });

  it.each([
    ["ASCII-x", "600x560x19"],
    ["nur zwei Teile", "600 × 560"],
    ["vier Teile (heute still gekürzt)", "600 × 560 × 19 × 1"],
    ["keine Zahl", "abc × 560 × 19"],
    ["null", "0 × 560 × 19"],
    ["negativ", "-5 × 560 × 19"],
    ["leer", ""],
  ])("bricht ab: %s", (fall, text) => {
    expect(() => masseAusText(text, "T"), fall).toThrow(KEIN_MASS);
  });
});

describe("kantenMm: Kanten-Länge aus Maß und Kantenbild", () => {
  it("VORN zählt die Länge", () => {
    expect(kantenMm("850 × 560 × 19", VORN, "T")).toEqual({ mm: 850, dicke: "19" });
  });

  it("RUNDUM zählt zweimal Länge und Breite", () => {
    expect(kantenMm("846 × 596 × 19", RUNDUM, "T")).toEqual({ mm: 2884, dicke: "19" });
  });

  it("bricht bei NaN ab, statt die Kante still wegzulassen", () => {
    expect(() => kantenMm("NaN × 596 × 19", VORN, "T")).toThrow(KEIN_MASS);
  });

  it("bricht bei leerer Breite ab, statt still 1692 mm zu zählen", () => {
    expect(() => kantenMm("846 ×  × 19", RUNDUM, "T")).toThrow(KEIN_MASS);
  });
});

describe("DEZIMAL_POSITIV = Vertragsmuster", () => {
  it("gleicht $defs.dezimal_positiv.pattern im gepinnten Schema stueckliste/2", () => {
    const schema = JSON.parse(
      readFileSync(new URL("./__fixtures__/voai-stueckliste-2.schema.json", import.meta.url), "utf8"),
    ) as { $defs: { dezimal_positiv: { pattern: string } } };
    expect(DEZIMAL_POSITIV.source).toBe(schema.$defs.dezimal_positiv.pattern);
  });
});
