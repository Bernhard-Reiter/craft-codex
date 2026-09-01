import { describe, it, expect } from "vitest";
import { asciiFold } from "./ascii-fold.js";

describe("asciiFold", () => {
  it("faltet Umlaute und ß", () => {
    expect(asciiFold("Türblatt ausrichten — Maße prüfen")).toBe(
      'Tuerblatt ausrichten - Masse pruefen',
    );
  });

  it("faltet die Bohrmaß-Zeichen", () => {
    expect(asciiFold("Ø 25 Forstnerbohrer · ±0,8 mm")).toBe(
      "O 25 Forstnerbohrer * +/-0,8 mm",
    );
  });

  it("lässt reines ASCII unangetastet", () => {
    const s = "Schritt 3 von 12: TX 20, M4 x 6";
    expect(asciiFold(s)).toBe(s);
  });
});
