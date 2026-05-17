/**
 * Master-Surface Mode-Plugin-Interface.
 *
 * Eine "Mode" ist eine austauschbare Render-Schicht auf der schwebenden Tafel:
 * Tafel (Drawing), CAD (3D-Viewer), Video, LiveCall (Phase B).
 *
 * Implementierungen leben in apps/lehrling-edu/lib/surface-modes/.
 */

export type ModeId =
  | "tafel"
  | "cad"
  | "video"
  | "livecall"
  | (string & Record<never, never>);

export interface SurfaceContext {
  /** Container-Element / Texture-Target — Consumer-spezifisch */
  target: unknown;
  /** Aktuelle Voice-Frage falls relevant */
  currentVoiceQuery?: string;
  /** Persistente Mode-State (für Mode-Switch ohne Datenverlust) */
  state: Record<string, unknown>;
}

export interface SurfaceMode {
  readonly id: ModeId;
  readonly label: string;
  readonly icon: string;

  activate(ctx: SurfaceContext): Promise<void>;
  deactivate(): Promise<void>;

  /** Speicher freigeben — Texturen, Geometries, Listener */
  dispose(): void;

  /** Optional: Voice-Command an aktive Mode delegieren */
  onVoiceCommand?(command: string, ctx: SurfaceContext): Promise<void>;

  /** Optional: Persistenten State serialisieren */
  serializeState?(): Record<string, unknown>;
}

export interface ModeSwitchEvent {
  from: ModeId | null;
  to: ModeId;
  durationMs: number;
}

export type ModeListener = (event: ModeSwitchEvent) => void;
