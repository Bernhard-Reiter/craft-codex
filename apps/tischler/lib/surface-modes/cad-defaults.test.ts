import { describe, it, expect, beforeEach, vi } from "vitest";
import { CADMode } from "./cad";
import {
  DEFAULT_DOVETAIL_CAD_MODELS,
  registerDefaultModels,
} from "./cad-defaults";

let mode: CADMode;

beforeEach(() => {
  mode = new CADMode();
});

describe("DEFAULT_DOVETAIL_CAD_MODELS", () => {
  it("contains at least 2 entries", () => {
    expect(DEFAULT_DOVETAIL_CAD_MODELS.length).toBeGreaterThanOrEqual(2);
  });

  it("each entry has url and label", () => {
    DEFAULT_DOVETAIL_CAD_MODELS.forEach((entry) => {
      expect(entry.url).toMatch(/^(https?|parametric):/);
      expect(entry.label.length).toBeGreaterThan(0);
    });
  });

  it("at least one parametric entry exists (Phase C+)", () => {
    const parametric = DEFAULT_DOVETAIL_CAD_MODELS.filter((e) =>
      e.url.startsWith("parametric:"),
    );
    expect(parametric.length).toBeGreaterThanOrEqual(1);
  });

  it("urls are unique", () => {
    const urls = DEFAULT_DOVETAIL_CAD_MODELS.map((m) => m.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("registerDefaultModels", () => {
  it("registers all defaults on empty mode", () => {
    const result = registerDefaultModels(mode, { ignoreDuplicates: true });
    expect(result.registered).toBe(DEFAULT_DOVETAIL_CAD_MODELS.length);
    expect(result.skipped).toBe(0);
    expect(mode.listModels().length).toBe(DEFAULT_DOVETAIL_CAD_MODELS.length);
  });

  it("is idempotent: second call skips all", () => {
    registerDefaultModels(mode, { ignoreDuplicates: true });
    const result = registerDefaultModels(mode, { ignoreDuplicates: true });
    expect(result.registered).toBe(0);
    expect(result.skipped).toBe(DEFAULT_DOVETAIL_CAD_MODELS.length);
    expect(mode.listModels().length).toBe(DEFAULT_DOVETAIL_CAD_MODELS.length);
  });

  it("skips already-registered URLs but registers new ones", () => {
    mode.registerModel(DEFAULT_DOVETAIL_CAD_MODELS[0]!);
    const result = registerDefaultModels(mode, { ignoreDuplicates: true });
    expect(result.registered).toBe(DEFAULT_DOVETAIL_CAD_MODELS.length - 1);
    expect(result.skipped).toBe(1);
  });

  it("logs to console.debug when skipping (default options)", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    registerDefaultModels(mode);
    registerDefaultModels(mode);
    expect(debugSpy).toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it("does not log when ignoreDuplicates is true", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    registerDefaultModels(mode, { ignoreDuplicates: true });
    registerDefaultModels(mode, { ignoreDuplicates: true });
    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it("activeModelUrl is null after register (caller decides selection)", () => {
    registerDefaultModels(mode, { ignoreDuplicates: true });
    expect(mode.getActiveModelUrl()).toBeNull();
  });
});
