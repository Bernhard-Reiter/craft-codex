import { describe, it, expect } from "vitest";
import { ANRISS_LAYERS_BY_PHASE } from "./anriss-layers";
import { buildAnreissFlow } from "./anreiss-flow";

// Punkt B (Bernhard »A-E OK«): Streichmaß vor dem Teilen, Flanken erst bei der Schräge.
describe("ANRISS_LAYERS_BY_PHASE (XR, flacher Anriss)", () => {
  const reihenfolge = buildAnreissFlow(140, 20).schritte.map((s) => s.id);

  it("hat für jede Phase des Flows einen Eintrag", () => {
    for (const id of reihenfolge) expect(ANRISS_LAYERS_BY_PHASE[id]).toBeDefined();
  });

  it("die Grundlinie (Streichmaß) erscheint VOR den Teilungsmarken und bleibt danach stehen", () => {
    const iBase = reihenfolge.findIndex((id) => ANRISS_LAYERS_BY_PHASE[id].includes("baseline"));
    const iDiv = reihenfolge.findIndex((id) => ANRISS_LAYERS_BY_PHASE[id].includes("divisions"));
    expect(iBase).toBeGreaterThanOrEqual(0);
    expect(iDiv).toBeGreaterThan(iBase);
    for (const id of reihenfolge.slice(iBase)) {
      expect(ANRISS_LAYERS_BY_PHASE[id]).toContain("baseline");
    }
  });

  it("Markieren zeigt noch keine Flanken und keine Abfallflächen", () => {
    expect(ANRISS_LAYERS_BY_PHASE.markieren).not.toContain("flanks");
    expect(ANRISS_LAYERS_BY_PHASE.markieren).not.toContain("wastes");
    expect(ANRISS_LAYERS_BY_PHASE.markieren).toContain("divisions");
  });

  it("die Schräge bringt die Flanken", () => {
    expect(ANRISS_LAYERS_BY_PHASE.schraege).toContain("flanks");
    expect(ANRISS_LAYERS_BY_PHASE.fertig).toContain("flanks");
  });
});
