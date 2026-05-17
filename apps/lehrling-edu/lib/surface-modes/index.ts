import { ModeManager, type SurfaceMode } from "@voai/lehrlings-core";
import { TafelMode } from "./tafel.js";
import { CADMode } from "./cad.js";
import { VideoMode } from "./video.js";

export { TafelMode, CADMode, VideoMode };

export interface DefaultModeBundle {
  manager: ModeManager;
  tafel: TafelMode;
  cad: CADMode;
  video: VideoMode;
}

/**
 * Erstellt einen ModeManager + alle Phase-B-Modes und gibt typed
 * Referenzen zurueck. Caller kann Modes direkt konfigurieren
 * (z.B. cad.registerModel(...)) ohne Privat-Zugriff auf den Manager.
 */
export function createDefaultModeBundle(): DefaultModeBundle {
  const manager = new ModeManager();
  const tafel = new TafelMode();
  const cad = new CADMode();
  const video = new VideoMode();
  manager.register(tafel);
  manager.register(cad);
  manager.register(video);
  return { manager, tafel, cad, video };
}

/**
 * Backwards-compatible: gibt nur den ModeManager zurueck.
 *
 * Neuere Caller sollten `createDefaultModeBundle()` nutzen wenn sie typed
 * Zugriff auf Mode-Instanzen brauchen (z.B. registerDefaultModels(cad)).
 */
export function createDefaultModeManager(): ModeManager {
  return createDefaultModeBundle().manager;
}

export type { SurfaceMode };
