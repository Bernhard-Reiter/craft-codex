import { describe, it, expect, afterEach, vi } from "vitest";
import { detectXRSupport } from "./support";

const originalNavigator = globalThis.navigator;

afterEach(() => {
  Object.defineProperty(globalThis, "navigator", {
    value: originalNavigator,
    configurable: true,
    writable: true,
  });
});

function setNavigator(value: unknown) {
  Object.defineProperty(globalThis, "navigator", {
    value,
    configurable: true,
    writable: true,
  });
}

describe("detectXRSupport", () => {
  it("returns ar:false vr:false when navigator is undefined", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const r = await detectXRSupport();
    expect(r.ar).toBe(false);
    expect(r.vr).toBe(false);
    expect(r.reason).toMatch(/navigator/);
  });

  it("returns ar:false vr:false when navigator.xr missing", async () => {
    setNavigator({});
    const r = await detectXRSupport();
    expect(r.ar).toBe(false);
    expect(r.vr).toBe(false);
    expect(r.reason).toMatch(/WebXR/);
  });

  it("returns true when isSessionSupported resolves true", async () => {
    setNavigator({
      xr: {
        isSessionSupported: vi.fn(async () => true),
      },
    });
    const r = await detectXRSupport();
    expect(r.ar).toBe(true);
    expect(r.vr).toBe(true);
  });

  it("returns false when isSessionSupported throws", async () => {
    setNavigator({
      xr: {
        isSessionSupported: vi.fn(async () => {
          throw new Error("not supported");
        }),
      },
    });
    const r = await detectXRSupport();
    expect(r.ar).toBe(false);
    expect(r.vr).toBe(false);
  });

  it("partial support: ar yes, vr no", async () => {
    setNavigator({
      xr: {
        isSessionSupported: vi.fn(
          async (mode: string) => mode === "immersive-ar",
        ),
      },
    });
    const r = await detectXRSupport();
    expect(r.ar).toBe(true);
    expect(r.vr).toBe(false);
  });
});
