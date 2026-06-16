import { describe, it, expect } from "vitest";
import { SCHWALBENSCHWANZ_LEKTION, getLektion } from "./lektion";

describe("Geführte Lektion (Regie-Skript)", () => {
  it("startet mit dem Überblick (kein Anriss), nicht mit Strichen", () => {
    expect(SCHWALBENSCHWANZ_LEKTION[0]?.step).toBe("ueberblick");
  });

  it("durchläuft die fünf Handschritte in Reihenfolge", () => {
    const steps = SCHWALBENSCHWANZ_LEKTION.filter((b) => b.surface === "joint3d").map(
      (b) => b.step,
    );
    expect(steps).toEqual([
      "ueberblick",
      "anreissen",
      "saegen",
      "stemmen",
      "passen",
      "pruefen",
    ]);
  });

  it("endet mit der XR-Übergabe samt Ziel-Route", () => {
    const last = SCHWALBENSCHWANZ_LEKTION.at(-1);
    expect(last?.surface).toBe("xr");
    expect(last?.href).toBe("/dovetail/xr");
  });

  it("jeder Beat hat eine gesprochene Meister-Zeile + Label + Titel", () => {
    for (const b of getLektion()) {
      expect(b.meisterSays.length, b.id).toBeGreaterThan(20);
      expect(b.label.length, b.id).toBeGreaterThan(0);
      expect(b.titel.length, b.id).toBeGreaterThan(0);
    }
  });

  it("Beat-IDs sind eindeutig", () => {
    const ids = SCHWALBENSCHWANZ_LEKTION.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
