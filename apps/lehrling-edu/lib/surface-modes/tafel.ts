import type { SurfaceMode, SurfaceContext } from "@voai/lehrlings-core";

/**
 * Ein einzelner Stroke auf der Tafel.
 *
 * `points` ist ein Array von `[x, y, pressure]`-Tupeln. Pressure ∈ [0, 1].
 * Wenn das Pointer-Event keinen Pressure-Wert liefert, fällt der Caller auf
 * `0.5` zurück (Standard für mouse/no-pressure stylus).
 */
export interface TafelStroke {
  id: string;
  points: Array<[number, number, number]>;
  color: string;
  size: number;
}

export type TafelStrokeListener = (strokes: readonly TafelStroke[]) => void;

/**
 * Tafel-Mode (Phase C — perfect-freehand).
 *
 * Die Mode-Klasse selbst ist DOM-frei und reine Logik (Stroke-Store +
 * Listener). Das Rendering passiert in `<TafelCanvas mode={mode} />`,
 * das auf die Drawing-API (`addStroke` / `clearStrokes` / `onChange`)
 * zugreift.
 *
 * Diese Trennung macht die Mode in Vitest (Node-Env) testbar und hält
 * das `SurfaceMode`-Interface kompatibel mit CAD/Video.
 */
export class TafelMode implements SurfaceMode {
  readonly id = "tafel" as const;
  readonly label = "Tafel";
  readonly icon = "📋";

  private strokes: TafelStroke[] = [];
  private readonly listeners = new Set<TafelStrokeListener>();
  private active = false;

  // ── SurfaceMode lifecycle ─────────────────────────────────────────────

  async activate(_ctx: SurfaceContext): Promise<void> {
    this.active = true;
    console.log("[TafelMode] activate (perfect-freehand)");
  }

  async deactivate(): Promise<void> {
    this.active = false;
    console.log("[TafelMode] deactivate");
  }

  dispose(): void {
    this.strokes = [];
    this.listeners.clear();
    this.active = false;
    console.log("[TafelMode] dispose");
  }

  async onVoiceCommand(command: string): Promise<void> {
    console.log("[TafelMode] voice command (stub):", command);
  }

  serializeState(): Record<string, unknown> {
    return {
      strokeCount: this.strokes.length,
      strokes: this.strokes.map((s) => ({ ...s, points: [...s.points] })),
    };
  }

  // ── Drawing-API (vom <TafelCanvas /> konsumiert) ──────────────────────

  /** Fügt einen Stroke hinzu und benachrichtigt Listener. */
  addStroke(stroke: TafelStroke): void {
    this.strokes.push(stroke);
    this.emit();
  }

  /** Löscht alle Strokes und benachrichtigt Listener. */
  clearStrokes(): void {
    if (this.strokes.length === 0) {
      // Auch leeren Clear emit-bar machen, damit UI-State (z.B. "saved"
      // Indikator) konsistent zurückgesetzt werden kann.
      this.emit();
      return;
    }
    this.strokes = [];
    this.emit();
  }

  /** Read-only Snapshot der aktuellen Strokes. */
  getStrokes(): readonly TafelStroke[] {
    return this.strokes;
  }

  /** Ist die Mode gerade aktiv? */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Subscribe zu Stroke-Änderungen. Gibt eine Unsubscribe-Funktion zurück.
   */
  onChange(listener: TafelStrokeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    // Defensive copy, damit Listener nicht den internen Array mutieren.
    const snapshot = this.strokes.slice();
    for (const l of this.listeners) {
      try {
        l(snapshot);
      } catch (err) {
        console.error("[TafelMode] listener error:", err);
      }
    }
  }
}
