import type {
  ITrackingProvider,
  Pose,
  TrackingStrategy,
  TrackingTarget,
} from "@voai/lehrlings-core";

/**
 * Manual-Placement Tracking-Provider.
 *
 * User platziert Targets via Drag-Gizmos statt automatischer Detection.
 * Funktioniert IMMER (kein WebXR, keine Camera, kein OpenCV) — daher
 * primaere Strategie fuer den Demo-Fall (Codex-Empfehlung).
 *
 * NICHT als React-Component — pure TypeScript Klasse, frei testbar.
 */
export class ManualPlacementProvider implements ITrackingProvider {
  readonly strategy: TrackingStrategy = "manual";

  private poses = new Map<string, Pose>();
  private callbacks = new Set<(target: TrackingTarget) => void>();
  private active = false;

  async init(): Promise<{ supported: boolean; reason?: string }> {
    return { supported: true };
  }

  async start(): Promise<void> {
    this.active = true;
  }

  async stop(): Promise<void> {
    this.active = false;
  }

  getPose(targetId: string): Pose | null {
    return this.poses.get(targetId) ?? null;
  }

  /**
   * User-Action: setze Pose fuer ein Target.
   *
   * Notification an Subscriber nur wenn `active === true` (start() gelaufen).
   * Vor start() darf man Default-Posen seeden ohne Side-Effects.
   */
  setPose(targetId: string, pose: Pose): void {
    this.poses.set(targetId, pose);
    if (!this.active) return;
    const target: TrackingTarget = { id: targetId, pose, source: "manual" };
    this.callbacks.forEach((cb) => cb(target));
  }

  clearPose(targetId: string): void {
    if (!this.poses.delete(targetId)) return;
    if (!this.active) return;
    const target: TrackingTarget = {
      id: targetId,
      pose: null,
      source: "manual",
    };
    this.callbacks.forEach((cb) => cb(target));
  }

  listTargets(): string[] {
    return Array.from(this.poses.keys());
  }

  onPose(callback: (target: TrackingTarget) => void): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  dispose(): void {
    this.poses.clear();
    this.callbacks.clear();
    this.active = false;
  }
}
