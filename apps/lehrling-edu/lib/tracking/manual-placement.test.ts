import { describe, it, expect, beforeEach } from "vitest";
import { ManualPlacementProvider } from "./manual-placement";
import type { Pose, TrackingTarget } from "@voai/lehrlings-core";

const samplePose: Pose = {
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  confidence: 1,
};

let provider: ManualPlacementProvider;

beforeEach(() => {
  provider = new ManualPlacementProvider();
});

describe("ManualPlacementProvider", () => {
  it('strategy is "manual"', () => {
    expect(provider.strategy).toBe("manual");
  });

  it("init returns supported: true", async () => {
    const result = await provider.init();
    expect(result.supported).toBe(true);
  });

  it("getPose returns null for unknown target", () => {
    expect(provider.getPose("nonexistent")).toBeNull();
  });

  it("setPose then getPose round-trips", () => {
    provider.setPose("brett-a", samplePose);
    expect(provider.getPose("brett-a")).toEqual(samplePose);
  });

  it("listTargets returns IDs of placed targets", () => {
    expect(provider.listTargets()).toEqual([]);
    provider.setPose("brett-a", samplePose);
    provider.setPose("brett-b", samplePose);
    expect(provider.listTargets()).toEqual(["brett-a", "brett-b"]);
  });

  it("clearPose removes target", () => {
    provider.setPose("brett-a", samplePose);
    provider.clearPose("brett-a");
    expect(provider.getPose("brett-a")).toBeNull();
  });

  it("onPose subscriber fires only after start()", async () => {
    const events: TrackingTarget[] = [];
    provider.onPose((t) => events.push(t));
    provider.setPose("brett-a", samplePose);
    expect(events).toHaveLength(0);

    await provider.start();
    provider.setPose("brett-b", samplePose);
    expect(events).toHaveLength(1);
    expect(events[0]!.id).toBe("brett-b");
    expect(events[0]!.source).toBe("manual");
  });

  it("onPose unsubscribe stops events", async () => {
    const events: TrackingTarget[] = [];
    const unsub = provider.onPose((t) => events.push(t));
    await provider.start();
    provider.setPose("brett-a", samplePose);
    expect(events).toHaveLength(1);

    unsub();
    provider.setPose("brett-b", samplePose);
    expect(events).toHaveLength(1);
  });

  it("clearPose fires null-pose event when active", async () => {
    const events: TrackingTarget[] = [];
    provider.setPose("brett-a", samplePose);
    await provider.start();
    provider.onPose((t) => events.push(t));
    provider.clearPose("brett-a");
    expect(events).toHaveLength(1);
    expect(events[0]!.pose).toBeNull();
  });

  it("stop() prevents new event delivery", async () => {
    const events: TrackingTarget[] = [];
    provider.onPose((t) => events.push(t));
    await provider.start();
    provider.setPose("brett-a", samplePose);
    expect(events).toHaveLength(1);

    await provider.stop();
    provider.setPose("brett-b", samplePose);
    expect(events).toHaveLength(1);
  });

  it("dispose clears all state", async () => {
    provider.setPose("brett-a", samplePose);
    await provider.start();
    provider.dispose();
    expect(provider.getPose("brett-a")).toBeNull();
    expect(provider.listTargets()).toHaveLength(0);
  });
});
