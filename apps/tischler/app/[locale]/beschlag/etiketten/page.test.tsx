import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EtikettenPage from "./page";

/**
 * Messe-Etiketten zeigen das Material wie die Stückliste (materialAnzeige):
 * »Platte 19 mm roh« statt des Katalog-Schlüssels »Demo-Träger 19 roh (synthetisch)«.
 * Blatt b2 Material-Kette c55912e965b1, Stelle 7.
 */

vi.mock("next-intl", () => ({ useLocale: () => "de" }));
vi.mock("next/script", () => ({ default: () => null }));

afterEach(cleanup);

describe("Etiketten Messe-Unterschrank", () => {
  it("Werkstoff auf dem Etikett: Platte 19 mm roh, nirgends »synthetisch«", () => {
    const { container } = render(<EtikettenPage />);
    const werkstoffe = [...container.querySelectorAll(".werkstoff")].map((d) => d.textContent ?? "");
    expect(werkstoffe.length).toBeGreaterThan(0);
    expect(werkstoffe.some((w) => w.includes("Platte 19 mm roh"))).toBe(true);
    werkstoffe.forEach((w) => expect(w).not.toMatch(/synthetisch|Demo-Träger/));
  });
});
