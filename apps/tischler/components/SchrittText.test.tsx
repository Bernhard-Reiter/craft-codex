import { afterEach, describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SchrittText } from "./SchrittText";
import { getLektion } from "../lib/zinken/lektion";
import { getLektionEn } from "../lib/zinken/lektion.en";

afterEach(cleanup);

// Punkt A: Auf /dovetail steht je Handschritt der vorhandene Meister-Text
// (titel + meisterSays aus lib/zinken/lektion.ts) — wörtlich, nichts neu erfunden.
describe("SchrittText", () => {
  for (const step of ["anreissen", "saegen", "stemmen", "passen", "pruefen"] as const) {
    it(`zeigt für ${step} Titel und Meister-Text wörtlich aus der Lektion (DE)`, () => {
      const beat = getLektion().find((b) => b.step === step)!;
      render(<SchrittText step={step} locale="de" />);
      expect(screen.getByText(beat.titel)).toBeTruthy();
      expect(screen.getByText(beat.meisterSays)).toBeTruthy();
    });
  }

  it("nimmt in EN den englischen Zwilling", () => {
    const beat = getLektionEn().find((b) => b.step === "saegen")!;
    render(<SchrittText step="saegen" locale="en" />);
    expect(screen.getByText(beat.meisterSays)).toBeTruthy();
  });

  it("zeigt im Überblick nichts (der hat seine eigene Karte)", () => {
    const { container } = render(<SchrittText step="ueberblick" locale="de" />);
    expect(container.textContent).toBe("");
  });
});
