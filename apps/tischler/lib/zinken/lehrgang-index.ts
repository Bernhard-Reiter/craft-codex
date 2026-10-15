import { LEHRGANG_DE } from "./lehrgang";
import { LEHRGANG_EN } from "./lehrgang.en";
import type { LehrgangSchritt, SchrittId } from "./lehrgang-typen";
import { normalisiereSchritt } from "./protokoll";

export function getLehrgang(locale: "de" | "en"): readonly LehrgangSchritt[] {
  return locale === "en" ? LEHRGANG_EN : LEHRGANG_DE;
}

/**
 * Schritt aus dem Query (?schritt=…) lesen. Alte Links (holz, aufteilung,
 * anreissen) landen auf dem neuen Eintrag, Unbekanntes auf dem ersten.
 */
export function schrittAusQuery(wert: string | null | undefined): SchrittId {
  return normalisiereSchritt(wert ?? "") ?? LEHRGANG_DE[0]!.id;
}
