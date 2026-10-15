/**
 * Lern-Protokoll — Gerüst für den Lernbeweis (Studiendesign
 * docs/zinken/studiendesign.md).
 *
 * Grundsätze:
 * - Standardmäßig AUS. Es wird nur nach einem ausdrücklichen Opt-in auf
 *   diesem Gerät etwas gespeichert.
 * - Nur Lernereignisse: Schritt geöffnet, Frage beantwortet (richtig/falsch),
 *   Hilfestufe gewechselt. Keine Namen, keine Uhrzeit, keine Geräte-ID, keine
 *   Freitexte. Dauer nur grob, in ganzen Minuten seit dem vorigen Ereignis.
 * - Nichts verlässt das Gerät. Export nur als Datei, ausgelöst durch einen
 *   Knopfdruck. Löschen jederzeit möglich.
 * - »Lokal« heißt NICHT automatisch »anonym«. Für eine Studie mit
 *   (minderjährigen) Lehrlingen braucht es trotzdem Information und
 *   Einwilligung (siehe Studiendesign). Deshalb heißt es hier »Protokoll«
 *   und nicht »anonyme Daten«.
 */
import { SCHRITT_IDS, type Hilfestufe, type SchrittId } from "./lehrgang-typen";

/**
 * Schritt-Ids von vor der Kapitel-Liste → neue Ids. Ältere Protokolle (und
 * alte Links ?schritt=…) tragen sie noch. Umgeschrieben wird NUR beim Lesen,
 * die Ablage bleibt, wie sie ist; die Schema-Kennung bleibt /1.
 */
const ALTE_SCHRITTE: Readonly<Record<string, SchrittId>> = {
  holz: "warum",
  aufteilung: "warum",
  anreissen: "anzeichnen",
};

/** Alte Id → neue, neue Id bleibt, Unbekanntes → undefined. */
export function normalisiereSchritt(wert: string): SchrittId | undefined {
  if ((SCHRITT_IDS as readonly string[]).includes(wert)) return wert as SchrittId;
  return Object.hasOwn(ALTE_SCHRITTE, wert) ? ALTE_SCHRITTE[wert] : undefined;
}

export const PROTOKOLL_SCHEMA = "craft-codex/zinken-protokoll/1" as const;
export const PROTOKOLL_KEY = "craft-codex:zinken:protokoll:v1";
export const OPTIN_KEY = "craft-codex:zinken:protokoll:optin";
/** Obergrenze, damit das Protokoll nicht unbegrenzt wächst. */
export const PROTOKOLL_MAX = 500;

export type ProtokollEreignis =
  | { art: "schritt"; schritt: SchrittId }
  | { art: "frage"; schritt: SchrittId; frageId: string; richtig: boolean }
  | { art: "hilfe"; schritt: SchrittId; stufe: Hilfestufe };

export type ProtokollEintrag = ProtokollEreignis & {
  /** Laufende Nummer. */
  nr: number;
  /** Ganze Minuten seit dem vorigen Eintrag (grob, keine Uhrzeit). */
  minuten: number;
};

/** Minimal-Schnittstelle — im Browser localStorage, im Test eine Map. */
export interface Ablage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface Gespeichert {
  schema: typeof PROTOKOLL_SCHEMA;
  /**
   * Roh, wie abgelegt: `schritt` kann hier noch eine alte oder unbekannte Id
   * sein. Nach außen geht nur, was `normalisiert` durchlässt.
   */
  eintraege: ProtokollEintrag[];
  /** Interner Zeitpunkt des letzten Eintrags (ms) — nur für die Minuten-Differenz, wird nicht exportiert. */
  zuletzt: number | null;
}

function lies(ablage: Ablage): Gespeichert {
  try {
    const roh = ablage.getItem(PROTOKOLL_KEY);
    if (!roh) return { schema: PROTOKOLL_SCHEMA, eintraege: [], zuletzt: null };
    const p = JSON.parse(roh) as Partial<Gespeichert>;
    if (p.schema !== PROTOKOLL_SCHEMA || !Array.isArray(p.eintraege)) {
      return { schema: PROTOKOLL_SCHEMA, eintraege: [], zuletzt: null };
    }
    return {
      schema: PROTOKOLL_SCHEMA,
      eintraege: p.eintraege,
      zuletzt: typeof p.zuletzt === "number" ? p.zuletzt : null,
    };
  } catch {
    return { schema: PROTOKOLL_SCHEMA, eintraege: [], zuletzt: null };
  }
}

/** Beim Lesen: alte Schritt-Ids auf die neuen, Unbekanntes fällt weg. */
function normalisiert(eintraege: readonly ProtokollEintrag[]): ProtokollEintrag[] {
  const out: ProtokollEintrag[] = [];
  for (const e of eintraege) {
    if (!e || typeof e !== "object") continue;
    const schritt = normalisiereSchritt(String(e.schritt));
    if (schritt) out.push({ ...e, schritt });
  }
  return out;
}

export function istOptIn(ablage: Ablage): boolean {
  try {
    return ablage.getItem(OPTIN_KEY) === "ja";
  } catch {
    return false;
  }
}

/** Opt-in setzen. Ein Opt-out löscht das Protokoll sofort mit. */
export function setzeOptIn(ablage: Ablage, an: boolean): void {
  try {
    if (an) {
      ablage.setItem(OPTIN_KEY, "ja");
    } else {
      ablage.removeItem(OPTIN_KEY);
      ablage.removeItem(PROTOKOLL_KEY);
    }
  } catch {
    /* Speicher gesperrt (privates Fenster) — dann gibt es eben kein Protokoll. */
  }
}

/** Ein Ereignis anhängen. Ohne Opt-in passiert NICHTS. */
export function protokolliere(
  ablage: Ablage,
  ereignis: ProtokollEreignis,
  jetztMs: number = Date.now(),
): boolean {
  if (!istOptIn(ablage)) return false;
  const g = lies(ablage);
  const minuten =
    g.zuletzt === null ? 0 : Math.max(0, Math.round((jetztMs - g.zuletzt) / 60000));
  const nr = (g.eintraege.at(-1)?.nr ?? 0) + 1;
  const eintraege = [...g.eintraege, { ...ereignis, nr, minuten }].slice(-PROTOKOLL_MAX);
  try {
    ablage.setItem(
      PROTOKOLL_KEY,
      JSON.stringify({ schema: PROTOKOLL_SCHEMA, eintraege, zuletzt: jetztMs }),
    );
    return true;
  } catch {
    return false;
  }
}

export function ladeEintraege(ablage: Ablage): ProtokollEintrag[] {
  return normalisiert(lies(ablage).eintraege);
}

export function loescheProtokoll(ablage: Ablage): void {
  try {
    ablage.removeItem(PROTOKOLL_KEY);
  } catch {
    /* nichts zu tun */
  }
}

/** Export als JSON-Text (ohne internen Zeitpunkt). */
export function exportiereProtokoll(ablage: Ablage): string {
  const eintraege = normalisiert(lies(ablage).eintraege);
  return JSON.stringify({ schema: PROTOKOLL_SCHEMA, eintraege }, null, 2);
}

/** Kurzauswertung für die Anzeige: Fragen richtig/gesamt je Schritt. */
export function auswertung(
  eintraege: readonly ProtokollEintrag[],
): Partial<Record<SchrittId, { richtig: number; gesamt: number }>> {
  const out: Partial<Record<SchrittId, { richtig: number; gesamt: number }>> = {};
  for (const e of eintraege) {
    if (e.art !== "frage") continue;
    const s = (out[e.schritt] ??= { richtig: 0, gesamt: 0 });
    s.gesamt += 1;
    if (e.richtig) s.richtig += 1;
  }
  return out;
}
