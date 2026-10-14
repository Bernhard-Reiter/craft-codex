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

// ALTE Logik aus page.tsx (Stand 9ea1017), nur herausgezogen, damit der Test ROT zeigt.
export function arOverlayPose(inAR: boolean, registrierung: Registrierung | null): OverlayPose | null {
  return inAR && registrierung
    ? { position: registrierung.position, quaternion: registrierung.quaternion }
    : null;
}
