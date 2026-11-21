import { describe, it, expect, vi, afterEach } from "vitest";
import { buildVoaiStueckliste } from "./voai-uebergabe.js";

// Eigene Datei, weil vi.mock für die ganze Datei gehoben wird (Muster wie
// voai-uebergabe-plattenstaerke.test.ts). Beide Mocks lesen denselben Schalter,
// je Test ist genau ein Fall an, sonst gilt das Original. afterEach setzt ihn zurück,
// damit der Ausgang nicht von der Reihenfolge abhängt.
const schalter = vi.hoisted(() => ({ fall: "" as "" | "boden" | "kante" }));

vi.mock("./messe-unterschrank.js", async (importOriginal) => {
  const orig = await importOriginal<typeof import("./messe-unterschrank.js")>();
  const m = orig.MESSE_UNTERSCHRANK;
  return {
    ...orig,
    MESSE_UNTERSCHRANK: {
      ...m,
      get schubkastenTeile() {
        return schalter.fall === "boden"
          ? m.schubkastenTeile.map((t) => (t.startsWith("Boden ") ? "Boden 530x490x16" : t))
          : m.schubkastenTeile;
      },
    },
  };
});

vi.mock("./messe-stueckliste.js", async (importOriginal) => {
  const orig = await importOriginal<typeof import("./messe-stueckliste.js")>();
  return {
    ...orig,
    buildMesseEtiketten: (...a: Parameters<typeof orig.buildMesseEtiketten>) => {
      const e = orig.buildMesseEtiketten(...a);
      return schalter.fall === "kante"
        ? e.map((x) => (x.teil === "Schubkasten-Seite links" ? { ...x, kanten: { ...x.kanten, l1: true } } : x))
        : e;
    },
  };
});

afterEach(() => {
  schalter.fall = "";
});

const JETZT = new Date("2026-11-21T00:00:00Z");

describe("VOAI-Übergabe bricht laut ab statt still zu verlieren (W2c)", () => {
  it("Kante an einem Teil ohne Aufbau (Schubkasten Eiche) bricht ab, wie cody-cad keine Regel hat", () => {
    schalter.fall = "kante";
    expect(() => buildVoaiStueckliste(JETZT)).toThrow(/Kante an Schubkasten-Seite links ohne Aufbau/);
  });

  it("falsches Maß am Schubkasten-Boden (ohne Kante) bricht in position() ab", () => {
    schalter.fall = "boden";
    expect(() => buildVoaiStueckliste(JETZT)).toThrow(/Maß von Schubkasten-Boden ist kein/);
  });
});
