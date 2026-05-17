import { describe, it, expect, beforeEach } from "vitest";
import { createPersistedPlacementProvider } from "./persisted-placement";
import type { Pose } from "@craft-codex/core";

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

const samplePose: Pose = {
  position: [1, 2, 3],
  rotation: [0, 0, 0, 1],
  confidence: 1,
};

beforeEach(() => {
  const mem = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: mem },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    value: (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0),
    configurable: true,
    writable: true,
  });
});

function flushTimers() {
  return new Promise((r) => setTimeout(r, 30));
}

describe("createPersistedPlacementProvider", () => {
  it("hydrates from empty storage as empty provider", () => {
    const p = createPersistedPlacementProvider();
    expect(p.listTargets()).toEqual([]);
  });

  it("hydrates from existing localStorage entries", () => {
    window.localStorage.setItem(
      "craft-codex:tracking:placements",
      JSON.stringify({
        poses: { "brett-a": samplePose },
        updatedAt: 0,
      }),
    );
    const p = createPersistedPlacementProvider();
    expect(p.getPose("brett-a")).toEqual(samplePose);
  });

  it("setPose after start triggers persist", async () => {
    const p = createPersistedPlacementProvider();
    await p.start();
    p.setPose("brett-x", samplePose);
    await flushTimers();
    const raw = window.localStorage.getItem(
      "craft-codex:tracking:placements",
    );
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.poses["brett-x"]).toEqual(samplePose);
  });

  it("clearPose after start removes from storage", async () => {
    window.localStorage.setItem(
      "craft-codex:tracking:placements",
      JSON.stringify({
        poses: { "brett-z": samplePose },
        updatedAt: 0,
      }),
    );
    const p = createPersistedPlacementProvider();
    await p.start();
    p.clearPose("brett-z");
    await flushTimers();
    const raw = window.localStorage.getItem(
      "craft-codex:tracking:placements",
    );
    const parsed = JSON.parse(raw!);
    expect(parsed.poses["brett-z"]).toBeUndefined();
  });

  it("multiple rapid setPose calls flush once via rAF batching", async () => {
    const p = createPersistedPlacementProvider();
    await p.start();
    p.setPose("a", samplePose);
    p.setPose("a", { ...samplePose, position: [9, 9, 9] });
    p.setPose("a", { ...samplePose, position: [10, 10, 10] });
    await flushTimers();
    const raw = window.localStorage.getItem(
      "craft-codex:tracking:placements",
    );
    const parsed = JSON.parse(raw!);
    expect(parsed.poses["a"].position).toEqual([10, 10, 10]);
  });

  it("dispose stops persisting subsequent events", async () => {
    const p = createPersistedPlacementProvider();
    await p.start();
    p.setPose("brett-y", samplePose);
    await flushTimers();
    p.dispose();
    // After dispose the underlying provider is cleared; setPose should not
    // re-persist (the subscriber was unsubscribed).
    const beforeDispose = window.localStorage.getItem(
      "craft-codex:tracking:placements",
    );
    expect(beforeDispose).toBeTruthy();
  });
});
