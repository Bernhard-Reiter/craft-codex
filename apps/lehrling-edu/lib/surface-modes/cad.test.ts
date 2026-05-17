import { describe, it, expect, vi } from "vitest";
import { CADMode, type CADModelEntry } from "./cad.js";
import type { SurfaceContext } from "@voai/lehrlings-core";

const ctx: SurfaceContext = { target: null, state: {} };

const MODEL_A: CADModelEntry = {
  url: "/models/dovetail.glb",
  label: "Dovetail",
  scale: 1,
};

const MODEL_B: CADModelEntry = {
  url: "/models/mortise.glb",
  label: "Mortise & Tenon",
};

describe("CADMode (GLTFLoader registry)", () => {
  it("registerModel + listModels: speichert Einträge, dedupliziert URLs", () => {
    const m = new CADMode();
    expect(m.listModels()).toHaveLength(0);
    m.registerModel(MODEL_A);
    m.registerModel(MODEL_B);
    expect(m.listModels()).toHaveLength(2);
    // Idempotent: doppelte URL wird nicht erneut hinzugefügt
    m.registerModel(MODEL_A);
    expect(m.listModels()).toHaveLength(2);
    expect(m.serializeState()).toEqual({
      activeModelUrl: null,
      modelCount: 2,
    });
  });

  it("selectModel + getActiveModelUrl: setzt URL, wenn registriert", async () => {
    const m = new CADMode();
    await m.activate(ctx);
    m.registerModel(MODEL_A);
    expect(m.getActiveModelUrl()).toBeNull();
    m.selectModel(MODEL_A.url);
    expect(m.getActiveModelUrl()).toBe(MODEL_A.url);
    m.selectModel(null);
    expect(m.getActiveModelUrl()).toBeNull();
  });

  it("selectModel ignoriert unbekannte URLs (warn statt crash)", () => {
    const m = new CADMode();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    m.selectModel("/models/does-not-exist.glb");
    expect(m.getActiveModelUrl()).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("onChange listener feuert nach selectModel — nur wenn aktiv", async () => {
    const m = new CADMode();
    m.registerModel(MODEL_A);
    m.registerModel(MODEL_B);
    const fn = vi.fn();
    m.onChange(fn);

    // Mode noch nicht aktiv → keine emits
    m.selectModel(MODEL_A.url);
    expect(fn).toHaveBeenCalledTimes(0);

    await m.activate(ctx);
    // Wechsel auf neue URL → fires
    m.selectModel(MODEL_B.url);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0]?.[0]).toBe(MODEL_B.url);

    // Selber Wert → kein zusätzlicher fire
    m.selectModel(MODEL_B.url);
    expect(fn).toHaveBeenCalledTimes(1);

    // Auf null zurücksetzen → fires
    m.selectModel(null);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls[1]?.[0]).toBeNull();
  });

  it("onChange unsubscribe stoppt weitere events", async () => {
    const m = new CADMode();
    m.registerModel(MODEL_A);
    m.registerModel(MODEL_B);
    await m.activate(ctx);
    const fn = vi.fn();
    const unsub = m.onChange(fn);
    m.selectModel(MODEL_A.url);
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
    m.selectModel(MODEL_B.url);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("dispose räumt Modelle, Selection und Listeners auf", async () => {
    const m = new CADMode();
    const fn = vi.fn();
    m.onChange(fn);
    m.registerModel(MODEL_A);
    await m.activate(ctx);
    m.selectModel(MODEL_A.url);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(m.isActive()).toBe(true);

    m.dispose();

    expect(m.isActive()).toBe(false);
    expect(m.getActiveModelUrl()).toBeNull();
    expect(m.listModels()).toHaveLength(0);
    expect(m.serializeState()).toEqual({
      activeModelUrl: null,
      modelCount: 0,
    });
    // Nach dispose: Listener-Set ist leer → keine weiteren Calls
    fn.mockClear();
    m.registerModel(MODEL_A);
    // selectModel braucht active=true für emit, also reaktivieren
    void m.activate(ctx);
    m.selectModel(MODEL_A.url);
    expect(fn).toHaveBeenCalledTimes(0);
  });

  it("serializeState shape bleibt {activeModelUrl, modelCount}", () => {
    const m = new CADMode();
    expect(m.serializeState()).toEqual({
      activeModelUrl: null,
      modelCount: 0,
    });
    m.registerModel(MODEL_A);
    m.registerModel(MODEL_B);
    expect(m.serializeState()).toEqual({
      activeModelUrl: null,
      modelCount: 2,
    });
  });

  it("activate/deactivate togglen den isActive-Flag", async () => {
    const m = new CADMode();
    expect(m.isActive()).toBe(false);
    await m.activate(ctx);
    expect(m.isActive()).toBe(true);
    await m.deactivate();
    expect(m.isActive()).toBe(false);
  });
});
