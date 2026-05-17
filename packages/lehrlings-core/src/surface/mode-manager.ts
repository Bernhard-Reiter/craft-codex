/**
 * ModeManager — verwaltet Mode-Switching ohne XR-Session-Restart.
 *
 * Codex-Empfehlung: explicit dispose() vor jedem Switch + requestAnimationFrame
 * Pause damit alte Texturen freigegeben sind bevor neue allokiert werden.
 */

import type {
  ModeId,
  ModeListener,
  ModeSwitchEvent,
  SurfaceContext,
  SurfaceMode,
} from "./types.js";

export class ModeManager {
  private modes = new Map<ModeId, SurfaceMode>();
  private active: SurfaceMode | null = null;
  private listeners = new Set<ModeListener>();

  register(mode: SurfaceMode): void {
    if (this.modes.has(mode.id)) {
      throw new Error(`Mode "${mode.id}" already registered`);
    }
    this.modes.set(mode.id, mode);
  }

  unregister(id: ModeId): void {
    const mode = this.modes.get(id);
    if (!mode) return;
    if (this.active?.id === id) {
      throw new Error(`Cannot unregister active mode "${id}" — switch first`);
    }
    mode.dispose();
    this.modes.delete(id);
  }

  getActive(): SurfaceMode | null {
    return this.active;
  }

  list(): ReadonlyArray<{ id: ModeId; label: string; icon: string }> {
    return Array.from(this.modes.values()).map((m) => ({
      id: m.id,
      label: m.label,
      icon: m.icon,
    }));
  }

  async switch(toId: ModeId, ctx: SurfaceContext): Promise<void> {
    const target = this.modes.get(toId);
    if (!target) throw new Error(`Mode "${toId}" not registered`);

    const start = performance.now();
    const fromId = this.active?.id ?? null;

    if (this.active) {
      await this.active.deactivate();
      this.active.dispose();
      // Codex-Empfehlung: rAF-Pause damit GPU Texturen freigibt
      await new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame !== "undefined") {
          requestAnimationFrame(() => resolve());
        } else {
          setTimeout(resolve, 16);
        }
      });
    }

    await target.activate(ctx);
    this.active = target;

    const event: ModeSwitchEvent = {
      from: fromId,
      to: toId,
      durationMs: performance.now() - start,
    };
    this.listeners.forEach((l) => l(event));
  }

  onSwitch(listener: ModeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async deactivateAll(): Promise<void> {
    if (!this.active) return;
    await this.active.deactivate();
    this.active.dispose();
    this.active = null;
  }
}
