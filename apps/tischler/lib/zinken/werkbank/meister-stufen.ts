import {
  WERKBANK_SCHRITTE_DE,
  type WerkbankHilfen,
  type WerkbankSchritt,
  type WerkbankSchrittId,
} from "./schritte";

/**
 * Werkbank S2a: der Hilfestufen-Automat der Meister-Klappe (Zeichnung b v9, Abschnitt 3).
 * Reine Funktionen, kein Server, kein React. Jeder Übergang gibt einen neuen Zustand
 * zurück und ändert den alten nicht.
 *
 * Regeln:
 * - Die Stufen kommen in fester Reihenfolge: beobachten → hinweis → teilschritt → erklaerung.
 * - Jeder Klick zeigt höchstens eine Stufe mehr.
 * - weiter() zeigt nie die erklaerung. Die gibt es nur über erklaerungZeigen(),
 *   also auf ausdrücklichen Wunsch, und erst wenn teilschritt schon gezeigt ist.
 * - Ein unbekannter Schritt wirft einen Fehler.
 * - rueckfall() gilt, wenn der Meister »ohne-ki« antwortet: Es kommt die nächste noch
 *   nicht gezeigte Stufe aus beobachten, hinweis, teilschritt, nie die erklaerung.
 *   Sind alle drei gezeigt, kommt die Meldung "alle-gezeigt".
 *
 * Entscheidung Texte: Die Texte der Stufen stehen in hilfen (schritte.ts, schritte.en.ts),
 * hilfeTexte() holt sie dort ab. Für »Alle Hinweise gezeigt — schau ins Warum oder frag
 * deinen Ausbilder« liefert der Automat nur den Schlüssel "alle-gezeigt" und keinen Text.
 * Den Satz in de und en legt S2c in messages/<sprache>/ ab, die Klappe übersetzt ihn dort.
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

/** Feste Reihenfolge. Die ersten drei Stufen kommen auch automatisch, erklaerung nie. */
const REIHE: readonly MeisterStufe[] = ["beobachten", "hinweis", "teilschritt", "erklaerung"];
const AUTOMATISCH = 3;

function pruefen(schrittId: WerkbankSchrittId): void {
  if (!WERKBANK_SCHRITTE_DE.some((s) => s.id === schrittId)) {
    throw new Error(`Meister-Stufen: unbekannter Schritt »${String(schrittId)}«`);
  }
}

/** Neuer Zustand mit den ersten `anzahl` Stufen der Reihenfolge. */
function zeige(zustand: MeisterZustand, anzahl: number): MeisterZustand {
  return { schrittId: zustand.schrittId, gezeigt: REIHE.slice(0, anzahl) };
}

/** Klappe für einen Schritt öffnen: noch keine Stufe gezeigt. */
export function start(schrittId: WerkbankSchrittId): MeisterZustand {
  pruefen(schrittId);
  return { schrittId, gezeigt: [] };
}

/** Klick »nächste Hilfe«: eine Stufe mehr, höchstens bis teilschritt. */
export function weiter(zustand: MeisterZustand): MeisterZustand {
  pruefen(zustand.schrittId);
  if (zustand.gezeigt.length >= AUTOMATISCH) return zustand;
  return zeige(zustand, zustand.gezeigt.length + 1);
}

/** Eigener Klick »Erklärung zeigen«: nur direkt nach teilschritt, sonst bleibt alles gleich. */
export function erklaerungZeigen(zustand: MeisterZustand): MeisterZustand {
  pruefen(zustand.schrittId);
  if (zustand.gezeigt.length !== AUTOMATISCH) return zustand;
  return zeige(zustand, AUTOMATISCH + 1);
}

/** Meister antwortet »ohne-ki«: die nächste ungezeigte Stufe ohne erklaerung, sonst "alle-gezeigt". */
export function rueckfall(zustand: MeisterZustand): MeisterRueckfall {
  pruefen(zustand.schrittId);
  if (zustand.gezeigt.length >= AUTOMATISCH) return { zustand, meldung: "alle-gezeigt" };
  return { zustand: zeige(zustand, zustand.gezeigt.length + 1), meldung: null };
}

/** Die Texte der gezeigten Stufen aus hilfen, in der Sprache der übergebenen Liste. */
export function hilfeTexte(
  zustand: MeisterZustand,
  schritte: readonly WerkbankSchritt[],
): readonly MeisterHilfeText[] {
  const schritt = schritte.find((s) => s.id === zustand.schrittId);
  if (!schritt) {
    throw new Error(`Meister-Stufen: unbekannter Schritt »${String(zustand.schrittId)}«`);
  }
  return zustand.gezeigt.map((stufe) => ({ stufe, text: schritt.hilfen[stufe] }));
}
