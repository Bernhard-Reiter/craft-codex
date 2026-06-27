/**
 * Procedural Schwalbenschwanz-Geometry.
 *
 * Berechnet Pin-Positionen + Anrisslinien mathematisch — kein Rhino-Import nötig.
 * Three.js-Mesh-Konstruktion erfolgt im Consumer (apps/tischler) damit
 * @craft-codex/core framework-agnostisch bleibt.
 *
 * Geometrie-Konvention:
 *   - Local origin: Mittelpunkt der Brettoberseite
 *   - X: Brettbreite (links/rechts)
 *   - Y: Brettstärke (oben/unten — vertical pin axis)
 *   - Z: Brettlänge (Richtung Hirnholz)
 *   - Einheit: mm (Consumer skaliert auf m für Three.js)
 */

import type { DovetailParams, DovetailStep, MarkingLine } from "./types.js";

export interface PinShape {
  /** Index 0..pinCount-1 */
  index: number;
  /** Schmale Seite (am Hirnholz) — left/right X */
  narrowLeft_mm: number;
  narrowRight_mm: number;
  /** Breite Seite (am Brettkörper) — left/right X */
  wideLeft_mm: number;
  wideRight_mm: number;
}

/**
 * Berechnet die Pin-Geometrie (X-Positionen) für einen Schwalbenschwanz.
 *
 * @example
 *   computePins({ thickness_mm: 20, width_mm: 100, ..., pinCount: 5, ratio: 6 })
 */
export function computePins(p: DovetailParams): PinShape[] {
  const { width_mm, thickness_mm, pinCount, ratio, distribution } = p;
  if (pinCount < 1) return [];

  const angleRad = Math.atan(1 / ratio);
  const flareOffset = thickness_mm * Math.tan(angleRad);

  const tailWidth = width_mm / (pinCount * 2 + 1);

  const pins: PinShape[] = [];
  for (let i = 0; i < pinCount; i++) {
    const centerX = -width_mm / 2 + tailWidth * (1 + i * 2 + 0.5);
    let dist = 0;
    if (distribution === "asymmetric_left") dist = -tailWidth * 0.3 * i;
    if (distribution === "asymmetric_right") dist = tailWidth * 0.3 * i;

    const cx = centerX + dist;
    pins.push({
      index: i,
      narrowLeft_mm: cx - tailWidth / 2,
      narrowRight_mm: cx + tailWidth / 2,
      wideLeft_mm: cx - tailWidth / 2 - flareOffset,
      wideRight_mm: cx + tailWidth / 2 + flareOffset,
    });
  }
  return pins;
}

/**
 * Generiert Anrisslinien für einen Lernschritt.
 *
 * Linien sind im lokalen Koordinatensystem von Brett A (mm).
 * Consumer rendert als THREE.LineSegments mit Hologramm-Material.
 */
export function generateMarkings(
  step: DovetailStep,
  p: DovetailParams,
): MarkingLine[] {
  const pins = computePins(p);
  const halfL = p.length_mm / 2;
  const halfW = p.width_mm / 2;
  const t = p.thickness_mm;

  const markings: MarkingLine[] = [];

  // Schritt 0 "Überblick": bewusst keine Anrisslinien — erst verstehen,
  // dann anreissen. Der Laie startet nie mit nackten Strichen.
  if (step === "ueberblick") {
    return markings;
  }

  if (step === "anreissen") {
    markings.push({
      id: "streichmass_brettstaerke",
      description: "Streichmaß auf Brettstärke (umlaufend)",
      color: "#FF3030",
      points: [
        [-halfW, 0, halfL - t],
        [halfW, 0, halfL - t],
        [halfW, -t, halfL - t],
        [-halfW, -t, halfL - t],
        [-halfW, 0, halfL - t],
      ],
    });

    // Mittellinie: auf ihr wird die Teilung abgetragen (Lehrbuch).
    markings.push({
      id: "mittellinie",
      description: "Mittellinie der Zinkenteilung",
      color: "#FF3030",
      points: [
        [-halfW, 0, halfL - t / 2],
        [halfW, 0, halfL - t / 2],
      ],
    });

    // Pro Schwalbe die VOLLE keilfoermige Kontur (Trapez) auf der Oberseite —
    // schmal an der Stirnkante (z=halfL), breit am Streichmass (z=halfL-t),
    // Flanken im Verhaeltnis 1:ratio. So sieht es aus wie die Lehrbuch-Zeichnung.
    pins.forEach((pin) => {
      markings.push({
        id: `schwalbe_pin_${pin.index}`,
        description: `Schwalbe ${pin.index + 1} (Kontur 1:${p.ratio})`,
        color: "#FF8800",
        points: [
          [pin.narrowLeft_mm, 0, halfL],
          [pin.wideLeft_mm, 0, halfL - t],
          [pin.wideRight_mm, 0, halfL - t],
          [pin.narrowRight_mm, 0, halfL],
          [pin.narrowLeft_mm, 0, halfL],
        ],
      });
    });
  }

  if (step === "saegen") {
    pins.forEach((pin) => {
      markings.push({
        id: `saege_pin_${pin.index}_left`,
        description: `Sägelinie Pin ${pin.index + 1} (links — auf Abfall-Seite)`,
        color: "#FF3030",
        points: [
          [pin.narrowLeft_mm, 0, halfL],
          [pin.wideLeft_mm, -t, halfL - t],
        ],
      });
      markings.push({
        id: `saege_pin_${pin.index}_right`,
        description: `Sägelinie Pin ${pin.index + 1} (rechts — auf Abfall-Seite)`,
        color: "#FF3030",
        points: [
          [pin.narrowRight_mm, 0, halfL],
          [pin.wideRight_mm, -t, halfL - t],
        ],
      });
    });
  }

  if (step === "stemmen") {
    markings.push({
      id: "stemm_stopp_linie",
      description:
        "Streichmaß-Linie als Stopp — bis hier stemmen, nicht tiefer",
      color: "#FF3030",
      points: [
        [-halfW, -t, halfL - t],
        [halfW, -t, halfL - t],
      ],
    });
  }

  if (step === "passen") {
    pins.forEach((pin) => {
      markings.push({
        id: `transfer_pin_${pin.index}`,
        description: `Übertragung Pin ${pin.index + 1} auf Brett B`,
        color: "#0066FF",
        points: [
          [pin.wideLeft_mm, 0, -halfL + t],
          [pin.narrowLeft_mm, 0, -halfL],
          [pin.narrowRight_mm, 0, -halfL],
          [pin.wideRight_mm, 0, -halfL + t],
        ],
      });
    });
  }

  if (step === "pruefen") {
    markings.push({
      id: "soll_geometry",
      description: "Soll-Geometrie als grünes Hologramm (perfekte Verbindung)",
      color: "#00CC00",
      points: pins.flatMap((pin) => [
        [pin.narrowLeft_mm, 0, halfL] as [number, number, number],
        [pin.narrowRight_mm, 0, halfL] as [number, number, number],
      ]),
    });
  }

  return markings;
}

/**
 * Validiert dass DovetailParams pädagogisch und technisch sinnvoll sind.
 * Nur fail-fast Sanity-Checks — feinere Validierung im Consumer.
 */
export function validateDovetailParams(p: DovetailParams): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (p.thickness_mm < 5)
    errors.push("thickness_mm < 5: Brett zu dünn für Schwalbenschwanz");
  if (p.thickness_mm > 60)
    errors.push("thickness_mm > 60: aussergewöhnlich, prüfen");
  if (p.width_mm < 30)
    errors.push("width_mm < 30: zu schmal für sinnvolle Pin-Anzahl");
  if (p.pinCount < 1) errors.push("pinCount < 1: mindestens ein Pin nötig");
  if (p.pinCount > 12)
    errors.push("pinCount > 12: pädagogisch zu komplex für MVP");
  if (p.ratio < 4)
    errors.push("ratio < 4 (steiler als 1:4): bricht bei Belastung");
  if (p.ratio > 10)
    errors.push("ratio > 10 (flacher als 1:10): hält schlecht zusammen");
  return { ok: errors.length === 0, errors };
}
