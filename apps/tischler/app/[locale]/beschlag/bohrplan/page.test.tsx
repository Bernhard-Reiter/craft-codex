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

  it("Beschlag-Zeile auf Blatt 1–3 ohne alte Teilnamen (Korpusseite, Unterschrank-Tür)", () => {
    const { container } = render(<BohrplanPage />);
    const koepfe = [...container.querySelectorAll(".druck-blatt h2")].map((h) => h.textContent ?? "");
    expect(koepfe.slice(0, 3)).toEqual([
      "Tür 1 Links · Blum CLIP top BLUMOTION 110°",
      "Seite Links · Montageplatten 173L6100 + MOVENTO 766H5000S",
      "Seite Rechts · MOVENTO 766H5000S (spiegelbildlich)",
    ]);
    koepfe.forEach((k) => expect(k).not.toMatch(/Korpusseite|Unterschrank-Tür/));
  });

  it("Druckzeile unter dem Blattkopf nennt »Status« genau 1x (kein »Entwurf · Vorschau« doppelt, Blatt b2 (4))", () => {
    const { container } = render(<BohrplanPage />);
    const zeilen = [...container.querySelectorAll(".druck-blatt > h2 + p.klein")].map((p) => p.textContent ?? "");
    expect(zeilen).toHaveLength(MAPPE_NAMEN.length);
    zeilen.forEach((z) => {
      expect(z.match(/Status/g) ?? []).toHaveLength(1);
      expect(z).not.toMatch(/Vorschau|ENTWURF/);
      expect(z).toContain("Maße vor dem Bohren nachmessen");
    });
  });
});
