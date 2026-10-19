import type { WerkbankHilfen, WerkbankSchritt, WerkbankSchrittId } from "./schritte";

/**
 * Werkbank S2a: der Hilfestufen-Automat der Meister-Klappe (Zeichnung b v9, Abschnitt 3).
 * Reine Funktionen, kein Server, kein React. Jeder Übergang gibt einen neuen Zustand
 * zurück und ändert den alten nicht.
 *
 * S2a ROT: nur Typen und Funktionsköpfe. Jede Funktion wirft, darum sind alle Tests rot.
 * Der Automat folgt im nächsten Commit.
 */

/** Die vier Hilfestufen heißen wie die Felder von hilfen. */
export type MeisterStufe = keyof WerkbankHilfen;

export interface MeisterZustand {
  readonly schrittId: WerkbankSchrittId;
  /** Die schon gezeigten Stufen, immer ein Anfang der festen Reihenfolge. */
  readonly gezeigt: readonly MeisterStufe[];
}

export interface MeisterRueckfall {
  readonly zustand: MeisterZustand;
  /** "alle-gezeigt": keine Stufe mehr übrig. Der Text dazu kommt aus messages (S2c). */
  readonly meldung: "alle-gezeigt" | null;
}

export interface MeisterHilfeText {
  readonly stufe: MeisterStufe;
  readonly text: string;
}

const ROT = "S2a ROT: Automat noch nicht gebaut";

export function start(schrittId: WerkbankSchrittId): MeisterZustand {
  throw new Error(`${ROT} (${schrittId})`);
}

export function weiter(zustand: MeisterZustand): MeisterZustand {
  throw new Error(`${ROT} (${zustand.schrittId})`);
}

export function erklaerungZeigen(zustand: MeisterZustand): MeisterZustand {
  throw new Error(`${ROT} (${zustand.schrittId})`);
}

export function rueckfall(zustand: MeisterZustand): MeisterRueckfall {
  throw new Error(`${ROT} (${zustand.schrittId})`);
}

export function hilfeTexte(
  zustand: MeisterZustand,
  schritte: readonly WerkbankSchritt[],
): readonly MeisterHilfeText[] {
  throw new Error(`${ROT} (${zustand.schrittId}, ${schritte.length})`);
}
