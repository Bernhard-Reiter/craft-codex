/**
 * Maße für die AR/VR-Seite: Der Rechner gibt sie als Suchparameter mit
 * (/zinken/xr?b=…&d=…), die XR-Seite liest sie zurück. Ungültige oder
 * fehlende Werte → Buchbeispiel 140 × 20. Die Seite zeigt immer sichtbar,
 * welche Maße gelten.
 */
import { pruefeZinkenEingabe } from "@craft-codex/core";

export const BUCH_XR = { B: 140, D: 20 } as const;

export interface XRMasse {
  B: number;
  D: number;
  dichte: "dicht" | "weit";
  /** undefined = Vorschlag der Formel. */
  azs: number | undefined;
  /** true = Buchbeispiel (keine oder ungültige eigene Maße). */
  buch: boolean;
}

const BUCH_MASSE: XRMasse = { ...BUCH_XR, dichte: "dicht", azs: undefined, buch: true };

function zahl(s: string | null): number | undefined {
  if (s === null || s.trim() === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function xrMasseAusSuche(suche: string): XRMasse {
  const q = new URLSearchParams(suche);
  const B = zahl(q.get("b"));
  const D = zahl(q.get("d"));
  if (B === undefined || D === undefined) return BUCH_MASSE;
  const azsRoh = zahl(q.get("azs"));
  const azs = azsRoh === undefined ? undefined : Math.round(azsRoh);
  if (pruefeZinkenEingabe(B, D, azs).length > 0) return BUCH_MASSE;
  const dichte = q.get("dichte") === "weit" ? "weit" : "dicht";
  const buch = B === BUCH_XR.B && D === BUCH_XR.D && dichte === "dicht" && azs === undefined;
  return { B, D, dichte, azs, buch };
}

export function xrHref(e: { B: number; D: number; dichte: "dicht" | "weit"; azs: number | undefined }): string {
  const q = new URLSearchParams({ b: String(e.B), d: String(e.D) });
  if (e.dichte === "weit") q.set("dichte", "weit");
  if (e.azs !== undefined) q.set("azs", String(e.azs));
  return `/zinken/xr?${q.toString()}`;
}
