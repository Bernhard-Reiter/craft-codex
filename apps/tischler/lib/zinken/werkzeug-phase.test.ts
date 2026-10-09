import { describe, it, expect } from "vitest";
import { werkzeugFuerPhase } from "./werkzeug-phase";

// Punkt B: Die Schmiege legt die Schwalbenflanken an — sie gehört zur Schräge,
// nicht schon zum Markieren. Das Streichmaß nur im Streichmaß-Schritt.
describe("werkzeugFuerPhase", () => {
  it("Schmiege nur bei der Schräge", () => {
    expect(werkzeugFuerPhase("schraege").schmiege).toBe(true);
    expect(werkzeugFuerPhase("markieren").schmiege).toBe(false);
    expect(werkzeugFuerPhase("teile").schmiege).toBe(false);
  });
  it("Streichmaß nur im Streichmaß-Schritt", () => {
    expect(werkzeugFuerPhase("streichmass").streichmass).toBe(true);
    expect(werkzeugFuerPhase("messen").streichmass).toBe(false);
  });
});
