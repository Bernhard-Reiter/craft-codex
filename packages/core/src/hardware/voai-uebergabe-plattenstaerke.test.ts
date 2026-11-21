import { describe, it, expect, vi } from "vitest";
import { buildVoaiStueckliste } from "./voai-uebergabe.js";

// Eigene Datei, weil vi.mock für die ganze Datei gehoben wird (die 19er-Tests in
// voai-uebergabe.test.ts bleiben unberührt). Ganzes MESSE_UNTERSCHRANK übernehmen,
// nur die Plattenstärke ändern, sonst wirft schon die Stückliste aus falschem Grund.
vi.mock("./messe-unterschrank.js", async (importOriginal) => {
  const orig = await importOriginal<typeof import("./messe-unterschrank.js")>();
  return { ...orig, MESSE_UNTERSCHRANK: { ...orig.MESSE_UNTERSCHRANK, plattenstaerke: 22 } };
});

describe("VOAI-Übergabe bei anderer Plattenstärke", () => {
  it("wirft laut, statt Werkstoff und Kanten still wegzulassen (Demo-Katalog kennt nur 19)", () => {
    expect(() => buildVoaiStueckliste(new Date("2026-11-18T12:00:00Z"))).toThrow(
      /Kein Werkstoff für Plattenstärke 22/,
    );
  });
});
