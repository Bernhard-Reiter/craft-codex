import { describe, it, expect, beforeEach, vi } from "vitest";
import { VideoMode, type VideoModeState } from "./video.js";
import type { SurfaceContext } from "@craft-codex/core";

const ctx: SurfaceContext = { target: null, state: {} };

describe("VideoMode (Phase C)", () => {
  let mode: VideoMode;

  beforeEach(async () => {
    mode = new VideoMode();
    await mode.activate(ctx);
  });

  it("loadSource sets currentSrc and emits to listeners", () => {
    const events: VideoModeState[] = [];
    mode.onChange((s) => events.push({ ...s }));

    mode.loadSource("https://cdn.example.com/clip.m3u8");

    expect(mode.getState().currentSrc).toBe(
      "https://cdn.example.com/clip.m3u8",
    );
    expect(mode.getState().playing).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0]?.currentSrc).toBe("https://cdn.example.com/clip.m3u8");
  });

  it("play / pause toggle state.playing and emit only on actual change", () => {
    const cb = vi.fn();
    mode.onChange(cb);

    mode.play();
    expect(mode.getState().playing).toBe(true);
    mode.play(); // no-op, already playing
    expect(cb).toHaveBeenCalledTimes(1);

    mode.pause();
    expect(mode.getState().playing).toBe(false);
    mode.pause(); // no-op
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("setPosition + setDuration fire listener while active", () => {
    const cb = vi.fn();
    mode.onChange(cb);

    mode.setPosition(12.5);
    mode.setDuration(120);

    expect(mode.getState().position).toBe(12.5);
    expect(mode.getState().duration).toBe(120);
    expect(cb).toHaveBeenCalledTimes(2);

    // Idempotent — same value should NOT emit.
    mode.setPosition(12.5);
    mode.setDuration(120);
    expect(cb).toHaveBeenCalledTimes(2);

    // Negative + non-finite values are clamped to 0.
    mode.setPosition(-5);
    expect(mode.getState().position).toBe(0);
    mode.setDuration(Number.NaN);
    expect(mode.getState().duration).toBe(0);
  });

  it("onChange returns unsubscribe function", () => {
    const cb = vi.fn();
    const unsubscribe = mode.onChange(cb);

    mode.play();
    expect(cb).toHaveBeenCalledTimes(1);

    unsubscribe();
    mode.pause();
    expect(cb).toHaveBeenCalledTimes(1); // no further calls
  });

  it("deactivate stops playback and suppresses further emissions", async () => {
    mode.loadSource("https://cdn.example.com/clip.mp4");
    mode.play();
    expect(mode.getState().playing).toBe(true);

    const cb = vi.fn();
    mode.onChange(cb);

    await mode.deactivate();

    expect(mode.getState().playing).toBe(false);
    // The pause-during-deactivate must have emitted exactly once,
    // BEFORE the active-flag flipped off.
    expect(cb).toHaveBeenCalledTimes(1);

    // After deactivate, listener stays silent — mode is inactive.
    mode.setPosition(99);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("dispose resets state and clears listeners", () => {
    const cb = vi.fn();
    mode.onChange(cb);

    mode.loadSource("https://cdn.example.com/a.m3u8");
    mode.play();
    mode.setPosition(42);
    mode.setDuration(180);
    expect(cb).toHaveBeenCalled();

    mode.dispose();

    expect(mode.serializeState()).toEqual({
      currentSrc: null,
      playing: false,
      position: 0,
      duration: 0,
    });
  });

  it("serializeState includes all four fields", () => {
    mode.loadSource("https://cdn.example.com/lesson.m3u8");
    mode.setDuration(300);
    mode.setPosition(45.2);
    mode.play();

    expect(mode.serializeState()).toEqual({
      currentSrc: "https://cdn.example.com/lesson.m3u8",
      playing: true,
      position: 45.2,
      duration: 300,
    });
  });
});
