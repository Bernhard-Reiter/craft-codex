import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createDefaultModeManager,
  TafelMode,
  CADMode,
  VideoMode,
} from "./index";
import type { SurfaceContext } from "@craft-codex/core";

const ctx: SurfaceContext = { target: null, state: {} };

beforeEach(() => {
  if (typeof globalThis.requestAnimationFrame === "undefined") {
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      value: (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0),
      configurable: true,
      writable: true,
    });
  }
  if (typeof globalThis.performance === "undefined") {
    Object.defineProperty(globalThis, "performance", {
      value: { now: () => Date.now() },
      configurable: true,
      writable: true,
    });
  }
});

describe("createDefaultModeManager", () => {
  it("registers tafel + cad + video", () => {
    const mm = createDefaultModeManager();
    const ids = mm.list().map((m) => m.id);
    expect(ids).toContain("tafel");
    expect(ids).toContain("cad");
    expect(ids).toContain("video");
  });

  it("can switch tafel → cad → video without error", async () => {
    const mm = createDefaultModeManager();
    await mm.switch("tafel", ctx);
    expect(mm.getActive()?.id).toBe("tafel");
    await mm.switch("cad", ctx);
    expect(mm.getActive()?.id).toBe("cad");
    await mm.switch("video", ctx);
    expect(mm.getActive()?.id).toBe("video");
  });

  it("dispose is called on previous mode during switch", async () => {
    const mm = createDefaultModeManager();
    await mm.switch("tafel", ctx);
    const tafel = mm.getActive() as TafelMode;
    const disposeSpy = vi.spyOn(tafel, "dispose");
    await mm.switch("cad", ctx);
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it("onSwitch listener fires with correct event", async () => {
    const mm = createDefaultModeManager();
    const events: Array<{ from: string | null; to: string }> = [];
    mm.onSwitch((e) => events.push({ from: e.from, to: e.to }));
    await mm.switch("tafel", ctx);
    await mm.switch("video", ctx);
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ from: null, to: "tafel" });
    expect(events[1]).toEqual({ from: "tafel", to: "video" });
  });
});

describe("individual modes", () => {
  it("TafelMode serializeState returns strokeCount + empty strokes", async () => {
    const m = new TafelMode();
    await m.activate(ctx);
    expect(m.serializeState()).toEqual({ strokeCount: 0, strokes: [] });
  });

  it("CADMode serializeState returns activeModelUrl + modelCount", () => {
    const m = new CADMode();
    expect(m.serializeState()).toEqual({
      activeModelUrl: null,
      modelCount: 0,
    });
  });

  it("VideoMode dispose resets state", async () => {
    const m = new VideoMode();
    await m.activate(ctx);
    m.dispose();
    expect(m.serializeState()).toEqual({
      currentSrc: null,
      playing: false,
      position: 0,
      duration: 0,
    });
  });
});
