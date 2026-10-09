import { describe, it, expect } from "vitest";
import de from "../../messages/de/dovetail.json";
import en from "../../messages/en/dovetail.json";

// Punkt E: Das Bild im Überblick zeigt zwei Bretter ohne sichtbare Zinken
// (Mesh-Fix erst nach Lienz). Das Badge darf kein fertiges Werkstück versprechen.
describe("Überblick-Badge ist ehrlich", () => {
  it("DE verspricht kein fertiges Werkstück", () => {
    expect(de.stageBadge).not.toMatch(/fertig/i);
    expect(de.stageBadge).toBe("Zwei Bretter · noch keine Anrisse");
  });
  it("EN verspricht kein fertiges Werkstück", () => {
    expect(en.stageBadge).not.toMatch(/finished/i);
    expect(en.stageBadge).toBe("Two boards · no layout lines yet");
  });
});
