import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BohrplanPage from "./page";

/**
 * Ein Nummernkreis auf den Messe-Papieren: der Bohrplan nennt je Blatt den Teilnamen
 * wörtlich wie die Werkstatt-Mappe (cody-cad), keine eigene »Pos.«-Nummer.
 * Namen aus der Mappe: c-wache/uiux/namensliste-bohrplan-r1.md 82c25328c033 (Mappe d30ddd90).
 */

vi.mock("next-intl", () => ({ useLocale: () => "de" }));
vi.mock("next/script", () => ({ default: () => null }));

const MAPPE_NAMEN = ["Tür 1 Links", "Seite Links", "Seite Rechts", "Schubkasten-Hinterstück", "Schubkasten-Boden"];

afterEach(cleanup);

describe("Bohrplan Messe-Unterschrank", () => {
  it("jedes Druckblatt nennt den Teilnamen der Mappe, nirgends »Pos.«", () => {
    const { container } = render(<BohrplanPage />);
    const koepfe = [...container.querySelectorAll(".druck-blatt h2")].map((h) => h.textContent ?? "");
    expect(koepfe).toHaveLength(MAPPE_NAMEN.length);
    MAPPE_NAMEN.forEach((name, i) => {
      const kopf = koepfe[i] ?? "";
      expect(kopf.startsWith(name)).toBe(true);
      expect(kopf).not.toContain(`${name} · ${name}`);
    });
    expect(container.textContent).not.toMatch(/Pos\.\s*\d/);
  });
});
