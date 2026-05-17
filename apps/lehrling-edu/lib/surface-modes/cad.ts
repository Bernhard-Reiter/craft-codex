import type { SurfaceMode, SurfaceContext } from "@voai/lehrlings-core";

/**
 * Ein registriertes GLB/GLTF-Modell, das die CADMode dem Viewer anbieten kann.
 */
export interface CADModelEntry {
  url: string;
  label: string;
  scale?: number;
}

export type CADModelListener = (url: string | null) => void;

/**
 * CAD-Mode (Phase C — GLTFLoader).
 *
 * Die Mode-Klasse selbst ist DOM-frei und reine Logik (Model-Registry +
 * Selection-State + Listener). Das Rendering passiert in
 * `<CADViewer mode={mode} />`, das via `useLoader(GLTFLoader, url)` das
 * aktive Modell lädt und in einem R3F-Canvas mit OrbitControls anzeigt.
 *
 * Diese Trennung macht die Mode in Vitest (Node-Env) testbar und hält
 * das `SurfaceMode`-Interface kompatibel mit Tafel/Video.
 */
export class CADMode implements SurfaceMode {
  readonly id = "cad" as const;
  readonly label = "CAD";
  readonly icon = "📐";

  private models: CADModelEntry[] = [];
  private activeModelUrl: string | null = null;
  private readonly listeners = new Set<CADModelListener>();
  private active = false;

  // ── SurfaceMode lifecycle ─────────────────────────────────────────────

  async activate(_ctx: SurfaceContext): Promise<void> {
    this.active = true;
    console.log("[CADMode] activate (GLTFLoader)");
  }

  async deactivate(): Promise<void> {
    this.active = false;
    console.log("[CADMode] deactivate");
  }

  dispose(): void {
    this.models = [];
    this.activeModelUrl = null;
    this.listeners.clear();
    this.active = false;
    console.log("[CADMode] dispose");
  }

  serializeState(): Record<string, unknown> {
    return {
      activeModelUrl: this.activeModelUrl,
      modelCount: this.models.length,
    };
  }

  // ── Public API (vom <CADViewer /> konsumiert) ─────────────────────────

  /**
   * Registriert ein GLB/GLTF-Modell. Idempotent: doppelte URLs werden
   * nicht ein zweites Mal hinzugefügt.
   */
  registerModel(entry: CADModelEntry): void {
    if (this.models.some((m) => m.url === entry.url)) {
      return;
    }
    this.models.push({ ...entry });
  }

  /**
   * Wählt das aktive Modell. `null` blendet das Modell aus.
   * Listener werden nur benachrichtigt, wenn sich der Wert tatsächlich
   * geändert hat UND die Mode aktiv ist (Konsistenz mit deactivate-Stille).
   */
  selectModel(url: string | null): void {
    if (url !== null && !this.models.some((m) => m.url === url)) {
      console.warn(
        `[CADMode] selectModel: unknown url "${url}" (not registered)`,
      );
      return;
    }
    if (url === this.activeModelUrl) return;
    this.activeModelUrl = url;
    if (this.active) {
      this.emit();
    }
  }

  /** Aktuell ausgewählte Model-URL oder `null`. */
  getActiveModelUrl(): string | null {
    return this.activeModelUrl;
  }

  /** Read-only Snapshot der registrierten Modelle. */
  listModels(): readonly CADModelEntry[] {
    return this.models;
  }

  /** Ist die Mode gerade aktiv? */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Subscribe zu Selection-Änderungen. Gibt eine Unsubscribe-Funktion
   * zurück.
   */
  onChange(listener: CADModelListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const url = this.activeModelUrl;
    for (const l of this.listeners) {
      try {
        l(url);
      } catch (err) {
        console.error("[CADMode] listener error:", err);
      }
    }
  }
}
