import { LEHRGANG_DE } from "./lehrgang";
import { LEHRGANG_EN } from "./lehrgang.en";
import { SCHRITT_IDS, type LehrgangSchritt, type SchrittId } from "./lehrgang-typen";

export function getLehrgang(locale: "de" | "en"): readonly LehrgangSchritt[] {
  return locale === "en" ? LEHRGANG_EN : LEHRGANG_DE;
}

/** Schritt aus dem Query (?schritt=…) lesen — unbekannt → erster Schritt. */
export function schrittAusQuery(wert: string | null | undefined): SchrittId {
  return (SCHRITT_IDS as readonly string[]).includes(wert ?? "")
    ? (wert as SchrittId)
    : "holz";
}
