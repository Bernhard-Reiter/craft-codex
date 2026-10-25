import { describe, it, expect } from "vitest";
import { asciiFold } from "./ascii-fold.js";

describe("asciiFold (uikit-1.0-Fassung)", () => {
  it("lässt Umlaute und ß STEHEN — die 1.0-Schrift kann sie", () => {
    const s = "Türblatt ausrichten, Maße prüfen, Größe wählen";
    expect(asciiFold(s)).toBe(s);
  });

  it("faltet die Bohrmaß- und Technik-Zeichen", () => {
    expect(asciiFold("Ø 25 Forstnerbohrer · ±0,8 mm")).toBe(
      "O 25 Forstnerbohrer * +/-0,8 mm",
    );
    expect(asciiFold("Maß 122 — fertig")).toBe("Maß 122 - fertig");
  });

  it("lässt reines ASCII unangetastet", () => {
    const s = "Schritt 3 von 12: TX 20, M4 x 6";
    expect(asciiFold(s)).toBe(s);
  });
});
