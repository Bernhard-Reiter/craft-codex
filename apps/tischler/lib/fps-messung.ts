/**
 * P6-Spike »Holz auf der Quest«: Bildraten-Messung über eine feste Dauer.
 *
 * Reine Logik, ohne React und ohne three, damit sie im Test läuft. Die Szene
 * ruft je Frame `nimmFrame` mit der Frame-Zeit in ms auf. Dabei wird nichts
 * neu angelegt: Der Puffer ist ein Float32Array fester Größe, das einmal beim
 * Anlegen der Messung entsteht. Ausgewertet wird erst am Ende (`auswerten`),
 * dort wird einmal eine Kopie sortiert.
 *
 * Kennzahlen:
 * - Mittelwert = Frames / Messzeit (Summe der Frame-Zeiten)
 * - 1%-Low = 1000 / Mittel der langsamsten 1 % der Frame-Zeiten (mindestens 1 Frame)
 * - Minimum = 1000 / längste Frame-Zeit
 * - Urteil: Mittelwert, auf eine Nachkommastelle gerundet (so wie er angezeigt
 *   wird), ≥ ZIEL_HZ → »ok«, sonst »nicht-ok«. Gerundet, damit Anzeige und
 *   Urteil nie widersprechen (»72,0 fps · NICHT OK« gibt es nicht).
 */

/** Zielbildrate der Quest 3 (Plan v2, P6/P8). */
export const ZIEL_HZ = 72;
/** Messdauer: 60 s. */
export const MESS_DAUER_MS = 60_000;
/** Puffergröße: so viele Frames je Sekunde passen höchstens hinein. */
export const MAX_HZ = 240;
/** Wie oft die Anzeige (Tafel, Seite) neue Werte bekommt. */
export const UI_TAKT_MS = 1_000;

export type MessZustand = "bereit" | "laeuft" | "fertig";
export type Urteil = "ok" | "nicht-ok" | "keine-daten";

export interface FpsMessung {
  readonly dauerMs: number;
  /** Frame-Zeiten in ms; nur die ersten `anzahl` Einträge gelten. */
  readonly deltas: Float32Array;
  anzahl: number;
  summeMs: number;
  zustand: MessZustand;
}

export interface Auswertung {
  frames: number;
  dauerS: number;
  mittelFps: number;
  low1Fps: number;
  minFps: number;
  urteil: Urteil;
}

export function neueMessung(dauerMs: number = MESS_DAUER_MS, maxHz: number = MAX_HZ): FpsMessung {
  return {
    dauerMs,
    deltas: new Float32Array(Math.ceil((dauerMs / 1000) * maxHz)),
    anzahl: 0,
    summeMs: 0,
    zustand: "bereit",
  };
}

/** Setzt zurück und startet. Der Puffer bleibt derselbe. */
export function starteMessung(m: FpsMessung): void {
  m.anzahl = 0;
  m.summeMs = 0;
  m.zustand = "laeuft";
}

/** Bricht ab (z. B. Ende der XR-Sitzung): zurück auf »bereit«, Werte verworfen. */
export function brichMessungAb(m: FpsMessung): void {
  m.anzahl = 0;
  m.summeMs = 0;
  m.zustand = "bereit";
}

/**
 * Nimmt eine Frame-Zeit auf. Gibt `true` zurück, genau wenn die Messung mit
 * diesem Frame fertig wurde (Dauer erreicht oder Puffer voll). Außerhalb einer
 * laufenden Messung und bei ungültigen Werten (≤ 0, NaN, ∞) passiert nichts.
 */
export function nimmFrame(m: FpsMessung, deltaMs: number): boolean {
  if (m.zustand !== "laeuft") return false;
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return false;
  m.deltas[m.anzahl] = deltaMs;
  m.anzahl += 1;
  m.summeMs += deltaMs;
  if (m.summeMs >= m.dauerMs || m.anzahl >= m.deltas.length) {
    m.zustand = "fertig";
    return true;
  }
  return false;
}

export function laufendeSekunden(m: FpsMessung): number {
  return m.summeMs / 1000;
}

/** Bildrate aus Frames und Zeit (Live-Anzeige); 0 ohne Zeit. */
export function fpsAus(frames: number, ms: number): number {
  return ms > 0 ? (frames * 1000) / ms : 0;
}

export function rundeEineStelle(x: number): number {
  return Math.round(x * 10) / 10;
}

export function urteilFuer(mittelFps: number, frames: number): Urteil {
  if (frames === 0) return "keine-daten";
  return rundeEineStelle(mittelFps) >= ZIEL_HZ ? "ok" : "nicht-ok";
}

export function auswerten(m: FpsMessung): Auswertung {
  const n = m.anzahl;
  if (n === 0 || m.summeMs <= 0) {
    return { frames: 0, dauerS: 0, mittelFps: 0, low1Fps: 0, minFps: 0, urteil: "keine-daten" };
  }
  // Einmal am Ende: Kopie aufsteigend sortieren, die langsamsten stehen hinten.
  const sortiert = m.deltas.slice(0, n).sort();
  const k = Math.max(1, Math.floor(n / 100));
  let schlecht = 0;
  for (let i = n - k; i < n; i++) schlecht += sortiert[i] ?? 0;
  const mittelFps = fpsAus(n, m.summeMs);
  return {
    frames: n,
    dauerS: m.summeMs / 1000,
    mittelFps,
    low1Fps: 1000 / (schlecht / k),
    minFps: 1000 / (sortiert[n - 1] ?? 1),
    urteil: urteilFuer(mittelFps, n),
  };
}
