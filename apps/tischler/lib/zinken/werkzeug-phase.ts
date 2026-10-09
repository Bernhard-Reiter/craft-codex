import type { AnreissPhase } from "./anreiss-flow";

/**
 * Welches Werkzeug am Brett erscheint, je Anreiß-Schritt.
 * Streichmaß nur beim Streichmaß; die Schmiege legt die Schwalbenflanken an
 * und gehört deshalb zur Schräge (nicht schon zum Markieren).
 */
export function werkzeugFuerPhase(phase: AnreissPhase): {
  streichmass: boolean;
  schmiege: boolean;
} {
  return {
    streichmass: phase === "streichmass",
    schmiege: phase === "schraege",
  };
}
