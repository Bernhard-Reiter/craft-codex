import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MESSE_BOHRPLAN_TEILE } from "@craft-codex/core";
import { describe, expect, it } from "vitest";

/**
 * Die Blätter im Bohrplan-Druck (beschlag/bohrplan/page.tsx, BLAETTER) und die
 * Liste MESSE_BOHRPLAN_TEILE in core müssen dieselben Namen in derselben
 * Reihenfolge tragen. Daran hängen der Stücklisten-Link ?blatt=n und der
 * Verweis »Bohrplan Blatt n von 5«: ändert jemand nur eine Liste, zeigt die
 * Stückliste sonst auf das falsche Blatt.
 */
const SEITE = readFileSync(join(__dirname, "../../app/[locale]/beschlag/bohrplan/page.tsx"), "utf8");

/** Namen der Blätter in Quelltext-Reihenfolge (Feld name: "…" je Objekt in BLAETTER). */
function blattNamen(quelltext: string): string[] {
  const start = quelltext.indexOf("const BLAETTER: Blatt[] = [");
  if (start < 0) return [];
  const ende = quelltext.indexOf("\n];", start);
  const block = quelltext.slice(start, ende < 0 ? undefined : ende);
  return [...block.matchAll(/^ {4}name: "([^"]+)",$/gm)].map((m) => m[1]!);
}

describe("Bohrplan-Blätter = MESSE_BOHRPLAN_TEILE", () => {
  it("BLAETTER ist im Quelltext zu finden und hat 5 Blätter", () => {
    expect(blattNamen(SEITE)).toHaveLength(5);
  });

  it("Namen und Reihenfolge der Blätter gleichen MESSE_BOHRPLAN_TEILE", () => {
    expect(blattNamen(SEITE)).toEqual([...MESSE_BOHRPLAN_TEILE]);
  });
});
