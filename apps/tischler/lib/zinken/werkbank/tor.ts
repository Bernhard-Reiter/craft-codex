/**
 * Werkbank S2b: das Probelauf-Tor ohne DB (Zeichnung b v9, Missbrauchsschutz).
 * Reine Funktionen ohne Next-Kontext, nur Web Crypto.
 *
 * S2b ROT: nur Typen und Funktionsköpfe. Jede Funktion wirft, darum sind die Tor-Tests rot.
 * Das Tor folgt im nächsten Commit.
 */

export interface TorKonfig {
  readonly code: string;
  readonly salz: string;
}

export type TorEnv = Readonly<Record<string, string | undefined>>;

const ROT = "S2b ROT: Tor noch nicht gebaut";

export function torKonfig(env: TorEnv): TorKonfig | null {
  throw new Error(`${ROT} (torKonfig, ${Object.keys(env).length > 0})`);
}

export function codeStimmt(eingabe: string, konfig: TorKonfig): Promise<boolean> {
  throw new Error(`${ROT} (codeStimmt, ${eingabe.length}, ${konfig.code.length})`);
}

export function erzeugeCookieWert(konfig: TorKonfig, jetztMs: number): Promise<string> {
  throw new Error(`${ROT} (erzeugeCookieWert, ${konfig.code.length}, ${jetztMs})`);
}

export function pruefeCookie(wert: string | undefined, konfig: TorKonfig | null, jetztMs: number): Promise<boolean> {
  throw new Error(`${ROT} (pruefeCookie, ${wert?.length}, ${konfig === null}, ${jetztMs})`);
}
