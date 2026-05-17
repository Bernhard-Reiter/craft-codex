import type { SurfaceMode, SurfaceContext } from "@craft-codex/core";

/**
 * Video-Mode (Phase C).
 *
 * Pure-logic playback state. Rendering + HLS-Wiring leben in
 * components/VideoPlayer.tsx. 3D-Texture (VideoTexture auf Plane)
 * folgt in Phase D.
 */
export interface VideoModeState {
  /** Quelle (HLS .m3u8 oder MP4 / sonstige browser-native URLs) */
  currentSrc: string | null;
  /** Soll-Zustand: spielt das Video gerade ab? */
  playing: boolean;
  /** Aktuelle Position in Sekunden */
  position: number;
  /** Gesamtdauer in Sekunden — vom Player nach loadedmetadata gesetzt */
  duration: number;
}

export type VideoModeListener = (state: VideoModeState) => void;

const initialState = (): VideoModeState => ({
  currentSrc: null,
  playing: false,
  position: 0,
  duration: 0,
});

export class VideoMode implements SurfaceMode {
  readonly id = "video" as const;
  readonly label = "Video";
  readonly icon = "🎬";

  private state: VideoModeState = initialState();
  private readonly listeners = new Set<VideoModeListener>();
  private active = false;

  // ---------- SurfaceMode lifecycle ----------

  async activate(_ctx: SurfaceContext): Promise<void> {
    this.active = true;
  }

  async deactivate(): Promise<void> {
    if (this.state.playing) {
      this.state = { ...this.state, playing: false };
      this.emit();
    }
    this.active = false;
  }

  dispose(): void {
    this.state = initialState();
    this.listeners.clear();
    this.active = false;
  }

  serializeState(): Record<string, unknown> {
    return { ...this.state };
  }

  // ---------- Public API ----------

  /** Lade neue Quelle. Setzt Position/Duration zurück, stoppt Playback. */
  loadSource(url: string): void {
    this.state = {
      currentSrc: url,
      playing: false,
      position: 0,
      duration: 0,
    };
    this.emit();
  }

  play(): void {
    if (this.state.playing) return;
    this.state = { ...this.state, playing: true };
    this.emit();
  }

  pause(): void {
    if (!this.state.playing) return;
    this.state = { ...this.state, playing: false };
    this.emit();
  }

  setPosition(seconds: number): void {
    const clamped = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
    if (this.state.position === clamped) return;
    this.state = { ...this.state, position: clamped };
    this.emit();
  }

  setDuration(seconds: number): void {
    const clamped = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
    if (this.state.duration === clamped) return;
    this.state = { ...this.state, duration: clamped };
    this.emit();
  }

  getState(): Readonly<VideoModeState> {
    return this.state;
  }

  /** Subscribe; returns unsubscribe function. */
  onChange(cb: VideoModeListener): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  // ---------- internal ----------

  private emit(): void {
    if (!this.active) return;
    for (const cb of this.listeners) {
      try {
        cb(this.state);
      } catch (err) {
        // Listener-Fehler dürfen den Mode nicht killen.
        console.error("[VideoMode] listener error", err);
      }
    }
  }
}
