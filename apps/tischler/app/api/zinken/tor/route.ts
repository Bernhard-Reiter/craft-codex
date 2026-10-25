import { codeStimmt, erzeugeCookieWert, torKonfig, torSetCookie } from "../../../../lib/zinken/werkbank/tor";

/**
 * Tor-Route der Werkbank (Zeichnung b v9, Missbrauchsschutz; Schnitt S2b, ohne DB).
 * Nur POST. Der Body ist ein Formular (application/x-www-form-urlencoded) mit `code` und
 * `sprache` (de|en), so geht das Code-Feld ohne JavaScript. Antwort immer 303 zurück auf die
 * Werkbank, im Body nur `{ ergebnis }` (ok | falsch | zu), immer `Cache-Control: no-store`.
 * Nur bei ok kommt das Cookie. Kein Log: der Code und der Cookie-Wert sind Geheimnisse.
 * Runtime: Node (Vorgabe). lib/security/timing-safe nutzt Web Crypto und liefe auch auf der Edge.
 */
export const dynamic = "force-dynamic";

/** Mehr als ein Formular mit 32 Zeichen Code braucht es nicht. Längeres ist einfach falsch (Bytes, vor dem Lesen begrenzt). */
const MAX_BODY = 1024;

type Ergebnis = "ok" | "falsch" | "zu";

function antwort(ergebnis: Ergebnis, sprache: "de" | "en", cookie?: string): Response {
  const headers = new Headers({
    Location: `/${sprache}/zinken/werkbank${ergebnis === "ok" ? "" : `?tor=${ergebnis}`}`,
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  });
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(JSON.stringify({ ergebnis }), { status: 303, headers });
}

/**
 * Liest den Body höchstens bis `max` Bytes. Zu groß (laut Content-Length oder beim Lesen) → null,
 * ohne den Rest zu lesen. Die Bytes werden einmal am Ende dekodiert (Mehrbyte-Zeichen an Stückgrenzen).
 */
async function leseBegrenzt(req: Request, max: number): Promise<string | null> {
  const laenge = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(laenge) && laenge > max) return null;
  if (!req.body) return "";
  const leser = req.body.getReader();
  const stuecke: Uint8Array[] = [];
  let summe = 0;
  for (;;) {
    const { done, value } = await leser.read();
    if (done) break;
    summe += value.byteLength;
    if (summe > max) {
      await leser.cancel().catch(() => {});
      return null;
    }
    stuecke.push(value);
  }
  const alles = new Uint8Array(summe);
  let pos = 0;
  for (const stueck of stuecke) {
    alles.set(stueck, pos);
    pos += stueck.byteLength;
  }
  return new TextDecoder().decode(alles);
}

export async function POST(req: Request): Promise<Response> {
  let roh: string | null = "";
  try {
    roh = await leseBegrenzt(req, MAX_BODY);
  } catch {
    roh = "";
  }
  const felder = new URLSearchParams(roh ?? "");
  const sprache = felder.get("sprache") === "en" ? "en" : "de";
  const konfig = torKonfig(process.env);
  if (!konfig) return antwort("zu", sprache);
  if (roh === null) return antwort("falsch", sprache);
  if (!(await codeStimmt(felder.get("code") ?? "", konfig))) return antwort("falsch", sprache);
  return antwort("ok", sprache, torSetCookie(await erzeugeCookieWert(konfig, Date.now())));
}

/** Der Code kommt nie in eine URL: GET gibt es nicht. */
export function GET(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
}
