/**
 * Prüfung und Spiegelung von Bohrbildern.
 *
 * Der Validator ist als Build-Gate gedacht: ein Bohrbild, das ihn nicht
 * besteht, darf nicht ausgeliefert werden. Die Begründung ist nicht
 * Ordnungsliebe — nach diesen Koordinaten wird gebohrt.
 */

import type { DrillPoint, HardwareLayout } from "./types.js";

/** Toleranz für Maßketten-Summen in mm (Fließkomma-Rundung). */
const CHAIN_TOLERANCE_MM = 0.01;

export interface ValidationIssue {
  /** Kennung der Regel, die verletzt wurde. */
  rule: string;
  /** Klartext, direkt für die Fehlermeldung im Build verwendbar. */
  message: string;
}

/**
 * Prüft ein Bohrbild auf innere Widersprüche.
 *
 * @param layout   Das zu prüfende Bohrbild.
 * @param stepIds  Die Schritt-IDs der zugehörigen WorkflowDefinition. Wird sie
 *                 weggelassen, entfällt nur die Schritt-Prüfung — alle anderen
 *                 Regeln laufen weiterhin.
 * @returns Leeres Array, wenn das Bohrbild sauber ist.
 */
export function validateLayout(
  layout: HardwareLayout,
  stepIds?: readonly string[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const pointIds = new Set<string>();

  if (layout.points.length === 0) {
    issues.push({
      rule: "layout.empty",
      message: `Bohrbild "${layout.id}" enthält keine Bohrungen.`,
    });
  }

  if (layout.faceWidth <= 0) {
    issues.push({
      rule: "layout.faceWidth",
      message: `Bohrbild "${layout.id}": faceWidth muss > 0 sein (ist ${layout.faceWidth}).`,
    });
  }

  // — Bohrungen ————————————————————————————————————————————————————————————
  for (const p of layout.points) {
    if (pointIds.has(p.id)) {
      issues.push({
        rule: "point.duplicateId",
        message: `Bohrung "${p.id}" ist mehrfach vergeben.`,
      });
    }
    pointIds.add(p.id);

    if (p.diameter <= 0) {
      issues.push({
        rule: "point.diameter",
        message: `Bohrung "${p.id}": Durchmesser muss > 0 sein (ist ${p.diameter}).`,
      });
    }
    if (p.depth <= 0) {
      issues.push({
        rule: "point.depth",
        message: `Bohrung "${p.id}": Tiefe muss > 0 sein (ist ${p.depth}).`,
      });
    }
    if (p.x < 0 || p.x > layout.faceWidth) {
      issues.push({
        rule: "point.outsideFace",
        message: `Bohrung "${p.id}": x=${p.x} liegt außerhalb der Fläche (0…${layout.faceWidth}).`,
      });
    }
    if (stepIds && !stepIds.includes(p.stepId)) {
      issues.push({
        rule: "point.unknownStep",
        message: `Bohrung "${p.id}" verweist auf unbekannten Schritt "${p.stepId}".`,
      });
    }
  }

  // — Maßketten ————————————————————————————————————————————————————————————
  for (const chain of layout.chains) {
    if (chain.segments.length === 0) {
      issues.push({
        rule: "chain.empty",
        message: `Maßkette "${chain.id}" enthält keine Segmente.`,
      });
      continue;
    }

    const sum = chain.segments.reduce((acc, s) => acc + s.value, 0);
    if (Math.abs(sum - chain.total) > CHAIN_TOLERANCE_MM) {
      issues.push({
        rule: "chain.sumMismatch",
        message:
          `Maßkette "${chain.id}" geht nicht auf: Segmente ergeben ${sum} mm, ` +
          `Gesamtmaß ist ${chain.total} mm (Differenz ${(sum - chain.total).toFixed(2)} mm).`,
      });
    }

    for (const seg of chain.segments) {
      if (seg.toPointId && !pointIds.has(seg.toPointId)) {
        issues.push({
          rule: "chain.unknownPoint",
          message: `Maßkette "${chain.id}" misst auf unbekannte Bohrung "${seg.toPointId}".`,
        });
      }
    }
  }

  return issues;
}

/**
 * Wirft, wenn das Bohrbild Mängel hat. Für den Einsatz im Build.
 */
export function assertValidLayout(
  layout: HardwareLayout,
  stepIds?: readonly string[],
): void {
  const issues = validateLayout(layout, stepIds);
  if (issues.length > 0) {
    const lines = issues.map((i) => `  [${i.rule}] ${i.message}`).join("\n");
    throw new Error(`Bohrbild "${layout.id}" ist fehlerhaft:\n${lines}`);
  }
}

/**
 * Spiegelt ein Bohrbild auf die Gegen-Anschlagsrichtung.
 *
 * Gespiegelt wird ausschließlich die x-Achse an der Flächenmitte. Durchmesser,
 * Tiefe, Werkzeug und Schrittzuordnung bleiben unangetastet — eine gespiegelte
 * Bohrung ist dieselbe Bohrung an anderer Stelle, nicht eine andere Bohrung.
 *
 * Die Maßketten werden bewusst NICHT automatisch mitgespiegelt: ihre `from`-
 * Bezugskante ist Klartext für den Menschen ("ab Oberkante links"), und eine
 * maschinell umgedrehte Beschriftung wäre schlimmer als keine. Ein gespiegeltes
 * Layout trägt daher keine Ketten, bis sie jemand fachlich gesetzt hat.
 */
export function mirrorLayout(layout: HardwareLayout): HardwareLayout {
  const mirroredPoints: DrillPoint[] = layout.points.map((p) => ({
    ...p,
    x: layout.faceWidth - p.x,
  }));

  return {
    ...layout,
    id: `${layout.id}--gespiegelt`,
    anschlag: layout.anschlag === "links" ? "rechts" : "links",
    label: `${layout.label} (gespiegelt)`,
    points: mirroredPoints,
    chains: [],
  };
}
