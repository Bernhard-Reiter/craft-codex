import { describe, it, expect } from "vitest";
import { xrMasseAusSuche, xrHref, BUCH_XR } from "./xr-masse";

describe("xr-masse — Rechner-Eingaben an die AR/VR-Seite", () => {
  it("ohne Parameter: Buchbeispiel 140 × 20", () => {
    const m = xrMasseAusSuche("");
    expect(m).toMatchObject({ B: BUCH_XR.B, D: BUCH_XR.D, buch: true });
  });

  it("eigene Maße kommen an (Hin- und Rückweg)", () => {
    const href = xrHref({ B: 200, D: 22, dichte: "weit", azs: 5 });
    const m = xrMasseAusSuche(href.slice(href.indexOf("?")));
    expect(m).toEqual({ B: 200, D: 22, dichte: "weit", azs: 5, buch: false });
  });

  it("Buchmaße als Parameter zählen als Buchbeispiel", () => {
    expect(xrMasseAusSuche("?b=140&d=20").buch).toBe(true);
    expect(xrMasseAusSuche("?b=140&d=20&azs=5").buch).toBe(false);
  });

  it("ungültig oder unvollständig → Buchbeispiel, kein NaN", () => {
    for (const s of ["?b=abc&d=20", "?b=140", "?b=-5&d=20", "?b=140&d=0", "?b=&d=20"]) {
      const m = xrMasseAusSuche(s);
      expect(m.buch).toBe(true);
      expect(m.B).toBe(140);
      expect(m.D).toBe(20);
    }
  });
});
