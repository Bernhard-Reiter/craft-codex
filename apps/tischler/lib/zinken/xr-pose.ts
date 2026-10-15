import { bewerteRegistrierung } from "./xr-registrierung";

/**
 * Pose des Werkstücks im AR-Overlay. Reine Funktion, damit sie ohne Brille
 * testbar ist. null heißt: keine Ausrichtung, die Seite nimmt den Platzhalter
 * (AR) bzw. die Zange (VR/Vorschau).
 */
export interface Registrierung {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  /** RMS-Restfehler in Metern. */
  rmsError: number;
}

export interface OverlayPose {
  position: [number, number, number];
  quaternion: [number, number, number, number];
}

/**
 * Nur in AR, nur mit Registrierung und nur bei Güte »gut« oder »grenzwertig«.
 * Eine zu ungenaue Ausrichtung (»neu«) zeichnet keine Anrisslinien an eine
 * falsche Stelle: fail-closed, das Werkstück bleibt dann am Platzhalter.
 */
export function arOverlayPose(inAR: boolean, registrierung: Registrierung | null): OverlayPose | null {
  if (!inAR || !registrierung) return null;
  if (bewerteRegistrierung(registrierung.rmsError) === "neu") return null;
  return { position: registrierung.position, quaternion: registrierung.quaternion };
}
