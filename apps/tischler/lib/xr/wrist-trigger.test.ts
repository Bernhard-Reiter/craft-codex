import { describe, it, expect } from "vitest";
import {
  evaluateWristTrigger,
  palmNormalFromJoints,
  angleDeg,
  updateDwell,
  initialDwell,
  DEFAULT_WRIST_TRIGGER,
  type WristTriggerInput,
  type Vec3,
} from "./wrist-trigger";

describe("angleDeg", () => {
  it("0° für gleiche Richtung, 90° für senkrecht, 180° für Gegenrichtung", () => {
    expect(angleDeg([0, 1, 0], [0, 1, 0])).toBeCloseTo(0, 5);
    expect(angleDeg([1, 0, 0], [0, 1, 0])).toBeCloseTo(90, 5);
    expect(angleDeg([0, 1, 0], [0, -1, 0])).toBeCloseTo(180, 5);
  });
});

describe("palmNormalFromJoints", () => {
  it("liefert eine Einheitsnormale aus drei Joints", () => {
    const wrist: Vec3 = [0, 0, 0];
    const index: Vec3 = [0, 0, -1]; // nach vorn
    const pinky: Vec3 = [-1, 0, 0]; // nach links
    const n = palmNormalFromJoints(wrist, index, pinky, "left");
    expect(Math.hypot(...n)).toBeCloseTo(1, 5);
  });

  it("linke und rechte Hand spiegeln die Normale", () => {
    const wrist: Vec3 = [0, 0, 0];
    const index: Vec3 = [0, 0, -1];
    const pinky: Vec3 = [-1, 0, 0];
    const l = palmNormalFromJoints(wrist, index, pinky, "left");
    const r = palmNormalFromJoints(wrist, index, pinky, "right");
    expect(r).toEqual([-l[0], -l[1], -l[2]]);
  });
});

describe("evaluateWristTrigger", () => {
  // Kopf im Ursprung, Blick nach vorn (-Z). Hand vor dem Gesicht.
  const base: Omit<WristTriggerInput, "palmNormal"> = {
    palmPos: [0, -0.1, -0.4],
    headPos: [0, 0, 0],
    headForward: [0, 0, -1],
  };

  it("aktiv: Palm halb nach oben (45°) + Hand im Blick", () => {
    // Normale 45° gegen Up
    const palmNormal: Vec3 = [0, Math.SQRT1_2, -Math.SQRT1_2];
    const r = evaluateWristTrigger({ ...base, palmNormal });
    expect(r.palmUpDeg).toBeCloseTo(45, 0);
    expect(r.active).toBe(true);
  });

  it("inaktiv: VOLLE Palm-up-Haltung (0°) → OS-Gesten-Schutz greift", () => {
    const palmNormal: Vec3 = [0, 1, 0]; // exakt nach oben
    const r = evaluateWristTrigger({ ...base, palmNormal });
    expect(r.palmUpDeg).toBeCloseTo(0, 5);
    expect(r.active).toBe(false); // unter minPalmUpDeg (30°)
  });

  it("inaktiv: Handfläche zeigt nach unten (180°)", () => {
    const palmNormal: Vec3 = [0, -1, 0];
    expect(evaluateWristTrigger({ ...base, palmNormal }).active).toBe(false);
  });

  it("inaktiv: richtige Palm-Haltung, aber Hand außerhalb des Blickkegels", () => {
    const palmNormal: Vec3 = [0, Math.SQRT1_2, -Math.SQRT1_2];
    // Hand seitlich/hinter dem Kopf → großer Blickwinkel
    const r = evaluateWristTrigger({
      ...base,
      palmNormal,
      palmPos: [0.8, -0.1, 0.6],
    });
    expect(r.gazeDeg).toBeGreaterThan(DEFAULT_WRIST_TRIGGER.maxGazeDeg);
    expect(r.active).toBe(false);
  });
});

describe("updateDwell", () => {
  it("blendet erst nach dwellMs ein (kein Flackern)", () => {
    let s = initialDwell(1000);
    s = updateDwell(s, true, 1000, 250, 350); // t=0
    expect(s.shown).toBe(false);
    s = updateDwell(s, true, 1200, 250, 350); // 200ms < 250
    expect(s.shown).toBe(false);
    s = updateDwell(s, true, 1260, 250, 350); // 260ms >= 250
    expect(s.shown).toBe(true);
  });

  it("kurzer Aussetzer blendet NICHT sofort aus (Hysterese releaseMs)", () => {
    let s = { shown: true, since: 2000 };
    s = updateDwell(s, false, 2100, 250, 350); // 100ms < 350
    expect(s.shown).toBe(true);
    s = updateDwell(s, false, 2400, 250, 350); // 400ms >= 350
    expect(s.shown).toBe(false);
  });

  it("erneutes Aktivieren resettet den Release-Timer", () => {
    let s = { shown: true, since: 3000 };
    s = updateDwell(s, false, 3100, 250, 350);
    expect(s.shown).toBe(true);
    s = updateDwell(s, true, 3200, 250, 350); // wieder aktiv → bleibt sichtbar
    expect(s.shown).toBe(true);
    expect(s.since).toBe(3200);
  });
});
