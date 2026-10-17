/**
 * Grundlinie am Zinkenbrett — reine Geometrie für die 3D-Szene
 * (ZinkenWerkstueck3D).
 *
 * Am Zinkenbrett wird die Grundlinie nur auf den beiden Flächen gerissen,
 * nicht über die Kanten: gerissen wird nur, wo gesägt und gestemmt wird.
 * (Das Schwalbenbrett bekommt sie umlaufend, das zeichnet diese Funktion nicht.)
 *
 * Koordinaten wie in ZinkenWerkstueck3D (mm): x entlang der Brettbreite B,
 * y nach oben (Grundlinie bei y = 0), z quer durch die Dicke
 * (Außenfläche z = 0, Innenfläche z = D). Die Linien liegen einen Hauch vor
 * der Fläche, damit sie nicht im Holz verschwinden.
 */

export type Punkt3 = [number, number, number];

/** Abstand der Linie vor der Fläche (mm), gegen Z-Fighting. */
const VOR_DER_FLAECHE = 0.05;

/** Zwei Linien: [Außenfläche, Innenfläche], je über die ganze Breite 0..B. */
export function grundlinieZinkenbrett(B: number, D: number): [Punkt3[], Punkt3[]] {
  const aussen: Punkt3[] = [
    [0, 0, -VOR_DER_FLAECHE],
    [B, 0, -VOR_DER_FLAECHE],
  ];
  const innen: Punkt3[] = [
    [0, 0, D + VOR_DER_FLAECHE],
    [B, 0, D + VOR_DER_FLAECHE],
  ];
  return [aussen, innen];
}
