/**
 * Tracking-Provider-Abstraction.
 *
 * Drei Strategien (Codex-validiert):
 * 1. ManualPlacement — User platziert Hologramm via Raycast (PRIMARY für Demo!)
 * 2. ImageTracking — WebXR Image Tracking API (wenn verfügbar)
 * 3. Aruco — OpenCV.js auf Video-Feed (Fallback)
 */

export type TrackingStrategy = "manual" | "image" | "aruco";

export interface Pose {
  /** Position im World-Space (m) */
  position: [number, number, number];
  /** Rotation als Quaternion [x, y, z, w] */
  rotation: [number, number, number, number];
  /** 0..1 Confidence-Score */
  confidence: number;
}

export interface TrackingTarget {
  id: string;
  /** Aktuelle Pose, null wenn nicht detektiert */
  pose: Pose | null;
  /** Tracking-Strategie die diese Pose geliefert hat */
  source: TrackingStrategy;
}

export interface ITrackingProvider {
  readonly strategy: TrackingStrategy;

  /** Initialisierung (z.B. WebXR feature request, Camera-Permission) */
  init(): Promise<{ supported: boolean; reason?: string }>;

  /** Starte Tracking-Loop */
  start(): Promise<void>;

  /** Stoppe Tracking */
  stop(): Promise<void>;

  /** Hole aktuellen Pose-Snapshot (Polling) */
  getPose(targetId: string): Pose | null;

  /** Subscriber-Callback bei Pose-Updates */
  onPose(callback: (target: TrackingTarget) => void): () => void;

  dispose(): void;
}

export interface TrackingFallbackChain {
  primary: ITrackingProvider;
  fallbacks: ITrackingProvider[];
}
