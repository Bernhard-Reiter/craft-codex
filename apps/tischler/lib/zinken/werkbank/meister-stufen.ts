import {
  WERKBANK_SCHRITT_IDS,
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
 * Zustand (Fix #74): nur der Schritt und die Zahl der gezeigten Stufen (0–4). Welche
 * Stufen das sind, leitet gezeigt() aus der festen Reihenfolge ab. Ein von außen gebauter
 * Zustand mit einer anderen Zahl wirft, er kann die erklaerung nicht freischalten.
 * Die Schritt-IDs kommen nur aus WERKBANK_SCHRITT_IDS (schritte.ts).
 *
 * Entscheidung Texte: Die Texte der Stufen stehen in hilfen (schritte.ts, schritte.en.ts),
 * hilfeTexte() holt sie dort ab. Für »Alle Hinweise gezeigt — schau ins Warum oder frag
 * deinen Ausbilder« liefert der Automat nur den Schlüssel "alle-gezeigt" und keinen Text.
 * Den Satz in de und en legt S2c in messages/<sprache>/ ab, die Klappe übersetzt ihn dort.
 */

/** Die vier Hilfestufen heißen wie die Felder von hilfen. */
export type MeisterStufe = keyof WerkbankHilfen;

/** Wie viele Stufen schon gezeigt sind: 0 = noch keine, 4 = alle samt erklaerung. */
export type MeisterAnzahl = 0 | 1 | 2 | 3 | 4;

export interface MeisterZustand {
  readonly schrittId: WerkbankSchrittId;
  /** Zahl der gezeigten Stufen, gezeigt sind immer die ersten `anzahl` der festen Reihenfolge. */
  readonly anzahl: MeisterAnzahl;
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

/** Feste Reihenfolge. Die Stufen vor der erklaerung kommen auch automatisch, erklaerung nie. */
const REIHE: readonly MeisterStufe[] = ["beobachten", "hinweis", "teilschritt", "erklaerung"];
/** So viele Stufen kommen automatisch: alle vor der erklaerung (aus REIHE abgeleitet, = 3). */
const AUTOMATISCH = REIHE.indexOf("erklaerung");

/** Die eine Fehlermeldung für einen Schritt, den es nicht gibt. */
function unbekannterSchritt(schrittId: unknown): never {
  throw new Error(`Meister-Stufen: unbekannter Schritt »${String(schrittId)}«`);
}

function pruefeSchritt(schrittId: WerkbankSchrittId): void {
  if (!(WERKBANK_SCHRITT_IDS as readonly string[]).includes(schrittId)) unbekannterSchritt(schrittId);
}

/** Prüft auch einen von außen gebauten Zustand: Schritt aus der Liste, anzahl ganzzahlig 0–4. */
function pruefeZustand(zustand: MeisterZustand): void {
  pruefeSchritt(zustand.schrittId);
  const anzahl: unknown = zustand.anzahl;
  if (typeof anzahl !== "number" || !Number.isInteger(anzahl) || anzahl < 0 || anzahl > REIHE.length) {
    throw new Error(`Meister-Stufen: ungültige Stufenzahl »${String(anzahl)}«`);
  }
}

/** Neuer Zustand mit den ersten `anzahl` Stufen. Aufrufer geben nur 1 bis REIHE.length. */
function zeige(zustand: MeisterZustand, anzahl: number): MeisterZustand {
  return { schrittId: zustand.schrittId, anzahl: anzahl as MeisterAnzahl };
}

/** Klappe für einen Schritt öffnen: noch keine Stufe gezeigt. */
export function start(schrittId: WerkbankSchrittId): MeisterZustand {
  pruefeSchritt(schrittId);
  return { schrittId, anzahl: 0 };
}

/** Die gezeigten Stufen, abgeleitet aus anzahl: immer ein Anfang der festen Reihenfolge. */
export function gezeigt(zustand: MeisterZustand): readonly MeisterStufe[] {
  pruefeZustand(zustand);
  return REIHE.slice(0, zustand.anzahl);
}

/** Klick »nächste Hilfe«: eine Stufe mehr, höchstens bis teilschritt. */
export function weiter(zustand: MeisterZustand): MeisterZustand {
  pruefeZustand(zustand);
  if (zustand.anzahl >= AUTOMATISCH) return zustand;
  return zeige(zustand, zustand.anzahl + 1);
}

/** Eigener Klick »Erklärung zeigen«: nur direkt nach teilschritt, sonst bleibt alles gleich. */
export function erklaerungZeigen(zustand: MeisterZustand): MeisterZustand {
  pruefeZustand(zustand);
  if (zustand.anzahl !== AUTOMATISCH) return zustand;
  return zeige(zustand, AUTOMATISCH + 1);
}

/** Meister antwortet »ohne-ki«: die nächste ungezeigte Stufe ohne erklaerung, sonst "alle-gezeigt". */
export function rueckfall(zustand: MeisterZustand): MeisterRueckfall {
  pruefeZustand(zustand);
  if (zustand.anzahl >= AUTOMATISCH) return { zustand, meldung: "alle-gezeigt" };
  return { zustand: zeige(zustand, zustand.anzahl + 1), meldung: null };
}

/** Die Texte der gezeigten Stufen aus hilfen, in der Sprache der übergebenen Liste. */
export function hilfeTexte(
  zustand: MeisterZustand,
  schritte: readonly WerkbankSchritt[],
): readonly MeisterHilfeText[] {
  const stufen = gezeigt(zustand);
  const schritt = schritte.find((s) => s.id === zustand.schrittId) ?? unbekannterSchritt(zustand.schrittId);
  return stufen.map((stufe) => ({ stufe, text: schritt.hilfen[stufe] }));
}
