import { describe, it, expect, vi } from "vitest";
import {
  ModeManager,
  type ModeId,
  type SurfaceMode,
  type SurfaceContext,
} from "@craft-codex/core";
import { createDefaultModeManager } from "../lib/surface-modes/index.js";

/**
 * Tests fuer SurfaceModeBar + SurfacePanel.
 *
 * vitest-config in @craft-codex/tischler: environment="node" (kein jsdom). Statt
 * DOM-Rendering-Tests testen wir die *logische Schnittstelle* der Components:
 * - manager.list() Filter
 * - activeId-Lookup-Logik (was SurfacePanel intern macht)
 * - Click-Callback-Vertrag
 *
 * Pragmatisch: Component-Tests waeren mit jsdom + RTL moeglich, sind aber
 * fuer reine Tab-Bars overkill. Pure-Logic-Tests reichen fuer das Mode-Switch
 * Akzeptanz-Kriterium.
 */

interface ModeMeta {
  id: ModeId;
  label: string;
  icon: string;
}

/** Helper: replicate SurfacePanel's lookup of active mode metadata. */
function getActiveMeta(
  manager: ModeManager,
  activeId: ModeId | null,
): ModeMeta | null {
  if (!activeId) return null;
  const found = manager.list().find((m) => m.id === activeId);
  return found ?? null;
}

describe("SurfaceModeBar / SurfacePanel logic", () => {
  it("renders all three default modes (tafel/cad/video)", () => {
    const manager = createDefaultModeManager();
    const ids = manager.list().map((m) => m.id);
    expect(ids).toEqual(["tafel", "cad", "video"]);
    expect(manager.list()).toHaveLength(3);
  });

  it("each mode exposes label + icon for the bar", () => {
    const manager = createDefaultModeManager();
    for (const m of manager.list()) {
      expect(m.label).toBeTruthy();
      expect(typeof m.label).toBe("string");
      expect(m.icon).toBeTruthy();
      expect(typeof m.icon).toBe("string");
    }
  });

  it("getActiveMeta returns matching metadata when activeId is set", () => {
    const manager = createDefaultModeManager();
    const tafelMeta = getActiveMeta(manager, "tafel");
    expect(tafelMeta).not.toBeNull();
    expect(tafelMeta?.id).toBe("tafel");
    expect(tafelMeta?.label).toBe("Tafel");

    const cadMeta = getActiveMeta(manager, "cad");
    expect(cadMeta?.id).toBe("cad");
  });

  it("getActiveMeta returns null for unknown or empty activeId", () => {
    const manager = createDefaultModeManager();
    expect(getActiveMeta(manager, null)).toBeNull();
    expect(getActiveMeta(manager, "nonexistent")).toBeNull();
  });

  it("empty manager exposes empty list (empty-state branch)", () => {
    const empty = new ModeManager();
    expect(empty.list()).toHaveLength(0);
    expect(getActiveMeta(empty, "tafel")).toBeNull();
  });

  it("onSwitch callback contract: caller invokes manager.switch() with id", async () => {
    // Replicates page.tsx wiring: SurfaceModeBar fires onSwitch(id), caller
    // calls manager.switch(id, ctx). We verify the manager honours that contract.
    const manager = createDefaultModeManager();
    const ctx: SurfaceContext = { target: null, state: {} };
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

    const onSwitch = vi.fn(async (id: ModeId) => {
      await manager.switch(id, ctx);
    });

    await onSwitch("tafel");
    expect(onSwitch).toHaveBeenCalledWith("tafel");
    expect(manager.getActive()?.id).toBe("tafel");

    await onSwitch("cad");
    expect(manager.getActive()?.id).toBe("cad");
    expect(onSwitch).toHaveBeenCalledTimes(2);
  });

  it("active-highlight branch: activeId matches list entry", () => {
    // Mirrors the `isActive = m.id === activeId` decision in the bar render.
    const manager = createDefaultModeManager();
    const activeId: ModeId = "video";
    const highlights = manager.list().map((m) => ({
      id: m.id,
      isActive: m.id === activeId,
    }));
    expect(highlights.find((h) => h.isActive)?.id).toBe("video");
    expect(highlights.filter((h) => h.isActive)).toHaveLength(1);
  });

  it("custom mode registration shows up in the bar list", () => {
    class TestMode implements SurfaceMode {
      readonly id = "test-mode" as ModeId;
      readonly label = "TestLabel";
      readonly icon = "X";
      async activate(): Promise<void> {}
      async deactivate(): Promise<void> {}
      dispose(): void {}
    }
    const manager = new ModeManager();
    manager.register(new TestMode());
    const meta = getActiveMeta(manager, "test-mode");
    expect(meta?.label).toBe("TestLabel");
    expect(meta?.icon).toBe("X");
  });
});
