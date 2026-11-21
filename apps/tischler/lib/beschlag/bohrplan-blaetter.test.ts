import { MESSE_BOHRPLAN_TEILE } from "@craft-codex/core";
import { describe, expect, it } from "vitest";
import { BLAETTER } from "./bohrplan-blaetter";

/**
 * Die Blätter im Bohrplan-Druck (BLAETTER, genutzt von beschlag/bohrplan/page.tsx)
 * und die Liste MESSE_BOHRPLAN_TEILE in core müssen dieselben Namen in derselben
 * Reihenfolge tragen. Daran hängen der Stücklisten-Link ?blatt=n und der
 * Verweis »Bohrplan Blatt n von 5«: ändert jemand nur eine Liste, zeigt die
 * Stückliste sonst auf das falsche Blatt.
 */
describe("Bohrplan-Blätter = MESSE_BOHRPLAN_TEILE", () => {
  it("BLAETTER hat 5 Blätter", () => {
    expect(BLAETTER).toHaveLength(5);
  });

  it("Namen und Reihenfolge der Blätter gleichen MESSE_BOHRPLAN_TEILE", () => {
    expect(BLAETTER.map((b) => b.name)).toEqual([...MESSE_BOHRPLAN_TEILE]);
  });
});
