import { describe, it, expect } from "vitest";
import {
  WorkflowController,
  buildHawaCombinoLayout,
  validateLayout,
} from "@craft-codex/core";
import { HAWA_COMBINO_WORKFLOW } from "./hawa-combino-workflow.js";

const STEP_IDS = HAWA_COMBINO_WORKFLOW.steps.map((s) => s.id);

describe("Hawa-Combino-Anleitung", () => {
  it("hat zwölf Schritte mit eindeutigen IDs", () => {
    expect(HAWA_COMBINO_WORKFLOW.steps).toHaveLength(12);
    expect(new Set(STEP_IDS).size).toBe(12);
  });

  it("gibt zu jedem Schritt mindestens eine Handlungsanweisung", () => {
    for (const s of HAWA_COMBINO_WORKFLOW.steps) {
      expect(s.instructions.length, `Schritt ${s.id}`).toBeGreaterThan(0);
    }
  });

  it("nennt nur Werkzeuge, die auch auf Hawas eigener Liste stehen", () => {
    // Werkzeugkästchen der Montageanleitung, Seite 5: PZ 1;2 · SW 3;4 · TX 10/20/25
    const hawaListe = ["PZ No.1", "PZ No.2", "SW 3", "SW 4", "TX 10", "TX 20", "TX 25"];
    const codiert = new Set(
      HAWA_COMBINO_WORKFLOW.steps
        .flatMap((s) => s.tools)
        .filter((t) => /^(PZ|SW|TX)/.test(t)),
    );
    for (const t of codiert) {
      expect(hawaListe, `Werkzeug "${t}" steht nicht auf der Vorlagenliste`).toContain(t);
    }
  });

  it("läuft vorwärts durch alle Schritte", () => {
    const c = new WorkflowController(HAWA_COMBINO_WORKFLOW);
    const gesehen: string[] = [];
    for (const s of c.getSteps()) gesehen.push(s.id);
    expect(gesehen).toEqual(STEP_IDS);
  });
});

describe("Anleitung und Bohrbild passen zusammen", () => {
  const layout = buildHawaCombinoLayout(600);

  it("jede Bohrung verweist auf einen Schritt, den es gibt", () => {
    // Das ist der Integritätstest, der verhindert, dass eine Bohrung nach einer
    // Umbenennung in der Anleitung still ins Leere zeigt und nie gerendert wird.
    expect(validateLayout(layout, STEP_IDS)).toEqual([]);
  });

  it("die Bohrungen hängen am Bohr-Schritt", () => {
    expect(new Set(layout.points.map((p) => p.stepId))).toEqual(
      new Set(["E.tuer_bohren"]),
    );
  });

  it("fängt einen Verweis auf einen gelöschten Schritt", () => {
    const ohneBohrschritt = STEP_IDS.filter((id) => id !== "E.tuer_bohren");
    const issues = validateLayout(layout, ohneBohrschritt);
    expect(issues.map((i) => i.rule)).toContain("point.unknownStep");
  });

  it("der Bohr-Schritt nennt die Werkzeuge, die die Bohrungen brauchen", () => {
    const schritt = HAWA_COMBINO_WORKFLOW.steps.find((s) => s.id === "E.tuer_bohren");
    const gebraucht = new Set(layout.points.map((p) => p.tool));
    for (const w of gebraucht) {
      expect(schritt?.tools, `Werkzeug "${w}" fehlt im Schritt`).toContain(w);
    }
  });
});
