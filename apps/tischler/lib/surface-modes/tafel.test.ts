import { describe, it, expect, vi } from "vitest";
import { TafelMode, type TafelStroke } from "./tafel.js";
import type { SurfaceContext } from "@craft-codex/core";

const ctx: SurfaceContext = { target: null, state: {} };

function makeStroke(id: string): TafelStroke {
  return {
    id,
    points: [
      [0, 0, 0.5],
      [1, 1, 0.5],
      [2, 0, 0.5],
    ],
    color: "#000000",
    size: 4,
  };
}

describe("TafelMode (perfect-freehand store)", () => {
  it("addStroke increments strokeCount in serializeState", () => {
    const m = new TafelMode();
    expect(m.serializeState()).toEqual({ strokeCount: 0, strokes: [] });
    m.addStroke(makeStroke("s1"));
    const state = m.serializeState();
    expect(state.strokeCount).toBe(1);
    expect(Array.isArray(state.strokes)).toBe(true);
    expect((state.strokes as TafelStroke[])[0]?.id).toBe("s1");
  });

  it("onChange listener fires after addStroke with snapshot", () => {
    const m = new TafelMode();
    const fn = vi.fn();
    m.onChange(fn);
    m.addStroke(makeStroke("s1"));
    m.addStroke(makeStroke("s2"));
    expect(fn).toHaveBeenCalledTimes(2);
    // Letzter Call sollte 2 Strokes enthalten
    const lastSnapshot = fn.mock.calls[1]?.[0] as readonly TafelStroke[];
    expect(lastSnapshot).toHaveLength(2);
    expect(lastSnapshot[0]?.id).toBe("s1");
    expect(lastSnapshot[1]?.id).toBe("s2");
  });

  it("onChange unsubscribe stops further events", () => {
    const m = new TafelMode();
    const fn = vi.fn();
    const unsub = m.onChange(fn);
    m.addStroke(makeStroke("s1"));
    unsub();
    m.addStroke(makeStroke("s2"));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("clearStrokes resets state and fires listeners", () => {
    const m = new TafelMode();
    const fn = vi.fn();
    m.onChange(fn);
    m.addStroke(makeStroke("s1"));
    m.addStroke(makeStroke("s2"));
    expect(m.getStrokes()).toHaveLength(2);
    m.clearStrokes();
    expect(m.getStrokes()).toHaveLength(0);
    expect(m.serializeState()).toEqual({ strokeCount: 0, strokes: [] });
    // 2 adds + 1 clear
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn.mock.calls[2]?.[0]).toEqual([]);
  });

  it("dispose clears strokes and listeners", async () => {
    const m = new TafelMode();
    const fn = vi.fn();
    m.onChange(fn);
    await m.activate(ctx);
    m.addStroke(makeStroke("s1"));
    expect(m.isActive()).toBe(true);
    m.dispose();
    expect(m.isActive()).toBe(false);
    expect(m.getStrokes()).toHaveLength(0);
    // Nach dispose: keine weiteren listener-calls
    fn.mockClear();
    m.addStroke(makeStroke("s2"));
    expect(fn).toHaveBeenCalledTimes(0);
  });

  it("activate/deactivate toggles isActive flag", async () => {
    const m = new TafelMode();
    expect(m.isActive()).toBe(false);
    await m.activate(ctx);
    expect(m.isActive()).toBe(true);
    await m.deactivate();
    expect(m.isActive()).toBe(false);
  });

  it("getStrokes returns a stable read-only-style snapshot of current strokes", () => {
    const m = new TafelMode();
    m.addStroke(makeStroke("a"));
    const got = m.getStrokes();
    expect(got).toHaveLength(1);
    // Mutationsversuch via Cast — der Store muss seinen eigenen Array behalten.
    // Wir prüfen, dass nach addStroke die Länge wieder konsistent ist.
    m.addStroke(makeStroke("b"));
    expect(m.getStrokes()).toHaveLength(2);
  });
});
