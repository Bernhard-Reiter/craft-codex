import { WorkflowController } from "@craft-codex/core";
import { describe, expect, it } from "vitest";
import { BESCHLAEGE } from "../lib/beschlag/auswahl";
import { offenFuer, teilFuer } from "./MesseSchrank";

/** H6: jeder Messe-Schritt zeigt ein leuchtendes Teil; Tür offen nur, wenn der Kasten sonst verdeckt wäre. */
describe("MesseSchrank Markierung je Montage-Schritt (H6)", () => {
  const messe = BESCHLAEGE.find((b) => b.id === "messe");
  if (!messe) throw new Error("Messe-Vorlage fehlt in BESCHLAEGE");
  const ids = new WorkflowController(messe.workflow).getSteps().map((s) => s.id);

  it("alle 6 Messe-Schritte haben ein Teil, B4 = Tür, M2 = Schubkasten", () => {
    expect(ids).toHaveLength(6);
    expect(ids.map((id) => [id.slice(0, 2), teilFuer(id)])).toEqual([
      ["B1", "tuer"],
      ["B2", "tuer"],
      ["B3", "seite"],
      ["M1", "seite"],
      ["M2", "schubkasten"],
      ["B4", "tuer"],
    ]);
  });

  it("Tür offen + Kasten heraus nur bei M2 und B4", () => {
    expect(ids.filter(offenFuer).map((id) => id.slice(0, 2))).toEqual(["M2", "B4"]);
    expect(offenFuer(undefined)).toBe(false);
  });
});
