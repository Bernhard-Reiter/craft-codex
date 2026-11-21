import { describe, expect, it, vi } from "vitest";

// A7 (Fund-Liste 4ed51c2509ea): Hinterstück und Boden trugen 520/530 fest im
// Blatt. Ändert sich das Bohrbild im Kern, muss das Blatt die neue Breite
// drucken. Darum hier ein Kern mit anderen Breiten — das Blatt muss folgen.
vi.mock("@craft-codex/core", async (original) => {
  const echt = await original<typeof import("@craft-codex/core")>();
  return {
    ...echt,
    buildMesseHinterstueckLayout: () => ({ ...echt.buildMesseHinterstueckLayout(), faceWidth: 777 }),
    buildMesseBodenLayout: () => ({ ...echt.buildMesseBodenLayout(), faceWidth: 888 }),
  };
});

const { BLAETTER } = await import("./bohrplan-blaetter");

describe("Bohrplan-Blätter: Breite folgt dem Bohrbild (A7)", () => {
  it("Hinterstück folgt dem Kern", () => {
    expect(BLAETTER.find((b) => b.teil === "Hinterstück")?.breite).toBe(777);
  });

  it("Boden folgt dem Kern", () => {
    expect(BLAETTER.find((b) => b.teil === "Boden")?.breite).toBe(888);
  });

  it("jedes Blatt ist so breit wie sein Bohrbild", () => {
    for (const b of BLAETTER) expect(b.breite, b.name).toBe(b.layout.faceWidth);
  });
});
