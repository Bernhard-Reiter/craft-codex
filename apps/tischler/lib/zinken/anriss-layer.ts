/**
 * Die Anrisslinien, die die Werkstückansicht zeigen kann (Fix #74, Gelb 4).
 * Der Typ steht in lib, damit lib nicht an der UI hängt. components/AnrissFlat
 * importiert ihn von hier und reicht ihn weiter, bestehende Importe bleiben gleich.
 */
export type AnrissLayer =
  | "baseline"
  | "flanks"
  | "tails"
  | "wastes"
  | "divisions";
