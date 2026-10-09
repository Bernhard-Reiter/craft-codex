/**
 * Lienz-Demo, Punkt 12: Ein Knopf auf der Startseite heißt so wie das Ziel in der
 * Navigation. Vorher führte "Werkstatt öffnen" nach /dovetail, das in der Navigation
 * "Frei bauen" heißt, während /werkstatt dort "Lektion" heißt.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DE = join(__dirname, "..", "..", "messages", "de");
const lies = (f: string) => JSON.parse(readFileSync(join(DE, f), "utf8"));

describe("Startseite: Knopf-Texte passen zur Navigation (DE)", () => {
  const home = lies("home.json");
  const nav = lies("common.json").header.nav;

  it("Knopf zu /dovetail heißt wie der Navigationspunkt", () => {
    expect(home.ctaWorkshop).toBe(nav.freeBuild);
    // pieces[1] verlinkt /dovetail (PIECE_HREFS in app/[locale]/page.tsx)
    expect(home.pieces[1].cta).toBe(nav.freeBuild);
  });

  it("Stimme verspricht nicht, ohne Netz zu sprechen", () => {
    expect(home.pieces[2].body).not.toMatch(
      /gesprochen, auch komplett ohne Netz/,
    );
  });
});
