import { describe, it, expect, beforeEach } from "vitest";
import {
  loadSession,
  saveSession,
  loadProgress,
  saveProgress,
  loadModes,
  saveModes,
  loadPlacements,
  savePlacement,
  clearPlacement,
  clearAllPlacements,
} from "./local";
import { DEFAULT_DOVETAIL_PARAMS, type Pose } from "@craft-codex/core";

class MemoryStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(k: string): string | null {
    return this.store.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.store.set(k, String(v));
  }
  removeItem(k: string): void {
    this.store.delete(k);
  }
  key(i: number): string | null {
    return Array.from(this.store.keys())[i] ?? null;
  }
}

beforeEach(() => {
  const mem = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: mem },
    configurable: true,
    writable: true,
  });
});

describe("local storage", () => {
  it("session round-trip", () => {
    expect(loadSession()).toBeNull();
    saveSession({
      params: DEFAULT_DOVETAIL_PARAMS,
      step: "saegen",
      updatedAt: 0,
    });
    const loaded = loadSession();
    expect(loaded).not.toBeNull();
    expect(loaded!.step).toBe("saegen");
    expect(loaded!.params.pinCount).toBe(DEFAULT_DOVETAIL_PARAMS.pinCount);
    expect(loaded!.updatedAt).toBeGreaterThan(0);
  });

  it("progress round-trip", () => {
    expect(loadProgress()).toBeNull();
    saveProgress({
      anreissen: { step: "anreissen", completed: true },
      saegen: { step: "saegen", completed: false },
      stemmen: { step: "stemmen", completed: false },
      passen: { step: "passen", completed: false },
      pruefen: { step: "pruefen", completed: false },
    });
    const loaded = loadProgress();
    expect(loaded).not.toBeNull();
    expect(loaded!.anreissen.completed).toBe(true);
    expect(loaded!.saegen.completed).toBe(false);
  });

  it("modes round-trip", () => {
    saveModes({ activeMode: "tafel", modeStates: { tafel: { foo: 1 } } });
    const loaded = loadModes();
    expect(loaded).not.toBeNull();
    expect(loaded!.activeMode).toBe("tafel");
    expect(loaded!.modeStates.tafel).toEqual({ foo: 1 });
  });

  it("malformed JSON returns null gracefully", () => {
    (window.localStorage as Storage).setItem(
      "craft-codex:dovetail:session",
      "{not-valid-json",
    );
    expect(loadSession()).toBeNull();
  });

  it("schreibt fehlertolerant: wirft setItem (Quota/privat), kein Crash", () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: {
          getItem: () => null,
          setItem: () => {
            throw new Error("QuotaExceededError");
          },
          removeItem: () => {},
          key: () => null,
          clear: () => {},
          length: 0,
        },
      },
      configurable: true,
      writable: true,
    });
    expect(() =>
      saveSession({ params: DEFAULT_DOVETAIL_PARAMS, step: "anreissen", updatedAt: 0 }),
    ).not.toThrow();
    expect(loadSession()).toBeNull();
  });

  describe("placements", () => {
    const samplePose: Pose = {
      position: [1, 2, 3],
      rotation: [0, 0, 0, 1],
      confidence: 1,
    };

    it("loadPlacements returns null when empty", () => {
      expect(loadPlacements()).toBeNull();
    });

    it("savePlacement + loadPlacements round-trip", () => {
      savePlacement("brett-a", samplePose);
      const loaded = loadPlacements();
      expect(loaded).not.toBeNull();
      expect(loaded!.poses["brett-a"]).toEqual(samplePose);
      expect(loaded!.updatedAt).toBeGreaterThan(0);
    });

    it("savePlacement merges into existing entries", () => {
      savePlacement("a", samplePose);
      savePlacement("b", { ...samplePose, position: [9, 9, 9] });
      const loaded = loadPlacements();
      expect(Object.keys(loaded!.poses)).toEqual(
        expect.arrayContaining(["a", "b"]),
      );
    });

    it("clearPlacement removes single entry", () => {
      savePlacement("a", samplePose);
      savePlacement("b", samplePose);
      clearPlacement("a");
      const loaded = loadPlacements();
      expect(loaded!.poses["a"]).toBeUndefined();
      expect(loaded!.poses["b"]).toEqual(samplePose);
    });

    it("clearAllPlacements wipes the bag", () => {
      savePlacement("a", samplePose);
      clearAllPlacements();
      const loaded = loadPlacements();
      expect(loaded!.poses).toEqual({});
    });
  });
});
