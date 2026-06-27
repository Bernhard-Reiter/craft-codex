/**
 * Wrist-Menü-Trigger — reine, hardware-unabhängige Logik.
 *
 * Entscheidet aus Hand-/Kopf-Geometrie, ob das am Handgelenk verankerte Menü
 * sichtbar sein soll: der Lehrling dreht die Handfläche zu sich und schaut hin
 * (wie bei Meta Quest / visionOS Hand-Menüs).
 *
 * BEWUSST framework-frei (Vec3 = Tupel, keine three-Imports) → vollständig
 * unit-testbar OHNE Headset. Die XR-Komponente liest die echten Joint-Posen und
 * füttert nur Zahlen hier rein. (Codex lieferte dazu nur ein ungetestetes
 * Code-Skelett — hier ist es getestete Logik.)
 *
 * OS-Gesten-Schutz: bei VOLLER Palm-up-Haltung (Winkel < minPalmUpDeg) NICHT
 * auslösen, sonst kollidiert es mit der Quest-System-Geste (Handfläche nach oben
 * → OS-Menü). Darum ein Fenster [minPalmUpDeg, maxPalmUpDeg], nicht "je flacher
 * desto besser".
 */

export type Vec3 = readonly [number, number, number];

export interface WristTriggerConfig {
  /** Untere Grenze Palm-up-Winkel (Grad). Darunter = OS-Geste, NICHT auslösen. */
  minPalmUpDeg: number;
  /** Obere Grenze Palm-up-Winkel (Grad). Darüber = Hand hängt/zeigt weg. */
  maxPalmUpDeg: number;
  /** Max. Blickabweichung: Hand muss im Sichtkegel liegen (Grad). */
  maxGazeDeg: number;
}

export const DEFAULT_WRIST_TRIGGER: WristTriggerConfig = {
  minPalmUpDeg: 30,
  maxPalmUpDeg: 75,
  maxGazeDeg: 40,
};

export interface WristTriggerInput {
  /** Normale der Handfläche (Einheitsvektor, zeigt aus der Innenfläche heraus). */
  palmNormal: Vec3;
  /** Weltposition der Handfläche/des Handgelenks. */
  palmPos: Vec3;
  /** Weltposition des Kopfes. */
  headPos: Vec3;
  /** Blickrichtung des Kopfes (Einheitsvektor). */
  headForward: Vec3;
}

const RAD2DEG = 180 / Math.PI;
const WORLD_UP: Vec3 = [0, 1, 0];

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function length(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

export function normalize(a: Vec3): Vec3 {
  const l = length(a);
  if (l < 1e-9) return [0, 0, 0];
  return [a[0] / l, a[1] / l, a[2] / l];
}

/** Winkel zwischen zwei Vektoren in Grad (0..180). */
export function angleDeg(a: Vec3, b: Vec3): number {
  const na = normalize(a);
  const nb = normalize(b);
  const d = Math.max(-1, Math.min(1, dot(na, nb)));
  return Math.acos(d) * RAD2DEG;
}

/**
 * Schätzt die Palm-Normale aus drei WebXR-Hand-Joints (es gibt KEIN 'palm'-Joint
 * im Standard). Normale = (Wrist→Index) × (Wrist→Pinky), Vorzeichen so gewählt,
 * dass sie aus der Handinnenfläche zeigt (für beide Hände korrekt über die
 * Händigkeit). Reine Geometrie → testbar.
 */
export function palmNormalFromJoints(
  wrist: Vec3,
  indexMetacarpal: Vec3,
  pinkyMetacarpal: Vec3,
  handedness: "left" | "right",
): Vec3 {
  const v1 = sub(indexMetacarpal, wrist);
  const v2 = sub(pinkyMetacarpal, wrist);
  const n = normalize(cross(v1, v2));
  // Linke und rechte Hand spiegeln die Joint-Reihenfolge → Vorzeichen drehen,
  // damit die Normale immer aus der Innenfläche zeigt.
  return handedness === "left" ? n : [-n[0], -n[1], -n[2]];
}

export interface WristTriggerEval {
  active: boolean;
  palmUpDeg: number;
  gazeDeg: number;
}

/**
 * Rohe (zeitlose) Trigger-Bedingung: Handfläche im Palm-up-Fenster UND Hand im
 * Sichtkegel. Den Dwell (Haltezeit) macht der separate Tracker.
 */
export function evaluateWristTrigger(
  input: WristTriggerInput,
  config: WristTriggerConfig = DEFAULT_WRIST_TRIGGER,
): WristTriggerEval {
  const palmUpDeg = angleDeg(input.palmNormal, WORLD_UP);
  const toHand = sub(input.palmPos, input.headPos);
  const gazeDeg = angleDeg(toHand, input.headForward);

  const inPalmWindow =
    palmUpDeg >= config.minPalmUpDeg && palmUpDeg <= config.maxPalmUpDeg;
  const inGaze = gazeDeg <= config.maxGazeDeg;

  return { active: inPalmWindow && inGaze, palmUpDeg, gazeDeg };
}

/**
 * Dwell-/Hysterese-Tracker: das Menü erscheint erst, wenn die Bedingung
 * `dwellMs` lang gehalten wird (verhindert Flackern), und verschwindet erst nach
 * `releaseMs` ohne Bedingung. Rein funktional mit injizierter Zeit → testbar.
 */
export interface DwellState {
  shown: boolean;
  /** Zeitpunkt, seit dem die Bedingung ununterbrochen aktiv/inaktiv ist. */
  since: number;
}

export function initialDwell(nowMs = 0): DwellState {
  return { shown: false, since: nowMs };
}

export function updateDwell(
  state: DwellState,
  active: boolean,
  nowMs: number,
  dwellMs = 250,
  releaseMs = 350,
): DwellState {
  if (state.shown) {
    // Sichtbar → bei anhaltendem Wegfall nach releaseMs ausblenden.
    if (active) return { shown: true, since: nowMs };
    if (nowMs - state.since >= releaseMs) return { shown: false, since: nowMs };
    return state;
  }
  // Versteckt → bei anhaltender Bedingung nach dwellMs einblenden.
  if (!active) return { shown: false, since: nowMs };
  if (nowMs - state.since >= dwellMs) return { shown: true, since: nowMs };
  return state;
}
