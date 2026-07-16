/**
 * Zentraler Look-Config — alle Effekt-Parameter an einem Ort, einzeln schaltbar.
 * (Sol-Brainstorm 16.07.: keine Magic Numbers über Szenen verteilen,
 *  jeder Effekt muss für A/B-Tests abschaltbar sein.)
 */
export const LOOK = {
  /* 3D-Postprocessing (im EffectComposer) */
  bloom: true,
  bloomIntensity: 0.7,
  bloomThreshold: 0.55, // unlit-Szene: nur helle Cyan/Gold-Kanten + Flash liegen darüber
  bloomSmoothing: 0.25,
  ca: true,
  caOffset: [0.00035, 0.0002] as [number, number],
  dof: false, // bewusst aus: transparente Panels + DOF = Halo-Risiko (Sol-Alternative: Fokus über Kontrast)

  /* Kamera-Gewicht */
  camPosNoise: 0.015,
  camTargetNoise: 0.03,
  camNoiseSpeed: 0.55,

  /* Film-Finish (CSS-Ebene über Canvas + HTML) */
  grain: true,
  grainOpacity: 0.05,
  vignette: true,
  letterbox: true, // 2.39:1 → 138px-Balken bei 1080p; Safe-Area beachten!
} as const;
