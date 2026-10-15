import { describe, it, expect } from "vitest";
import { arOverlayPose, type Registrierung } from "./xr-pose";

const reg = (rmsMm: number): Registrierung => ({
  position: [0.1, 0.9, -0.4],
  quaternion: [0, 0.38268343, 0, 0.92387953],
  rmsError: rmsMm / 1000,
});

describe("arOverlayPose — Overlay nur bei brauchbarer Ausrichtung (fail-closed)", () => {
  it("gut (≤ 2 mm) in AR → registrierte Pose", () => {
    expect(arOverlayPose(true, reg(1.5))).toEqual({ position: reg(1.5).position, quaternion: reg(1.5).quaternion });
  });

  it("grenzwertig (≤ 5 mm) in AR → registrierte Pose", () => {
    expect(arOverlayPose(true, reg(4))).toEqual({ position: reg(4).position, quaternion: reg(4).quaternion });
  });

  it("neu (> 5 mm) in AR → keine Pose", () => {
    expect(arOverlayPose(true, reg(8))).toBeNull();
  });

  it("RMS nicht endlich (NaN) in AR → keine Pose", () => {
    expect(arOverlayPose(true, reg(Number.NaN))).toBeNull();
  });

  it("keine Registrierung in AR → keine Pose", () => {
    expect(arOverlayPose(true, null)).toBeNull();
  });

  it("nicht in AR → keine Pose, auch bei guter Registrierung", () => {
    expect(arOverlayPose(false, reg(1))).toBeNull();
  });
});
