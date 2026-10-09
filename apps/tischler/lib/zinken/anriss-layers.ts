import type { AnrissLayer } from "../../components/AnrissFlat";
import type { AnreissPhase } from "./anreiss-flow";

/**
 * Progressiver Anriss-Aufbau pro Lernschritt (XR, flacher Anriss).
 * Reihenfolge wie am Werkstück: erst die Grundlinie mit dem Streichmaß,
 * dann einteilen, die Schwalbenflanken erst mit der Schmiege bei der Schräge.
 * Was einmal angerissen ist, bleibt stehen. Leere Schritte zeigen nichts.
 */
export const ANRISS_LAYERS_BY_PHASE: Record<AnreissPhase, AnrissLayer[]> = {
  messen: [],
  streichmass: ["baseline"],
  schwalbenzahl: ["baseline"],
  teile: ["baseline", "divisions"],
  markieren: ["baseline", "divisions"],
  schraege: ["baseline", "flanks", "tails", "wastes"],
  fertig: ["baseline", "flanks", "tails", "wastes"],
};
