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

/** Mehr als ein Formular mit 32 Zeichen Code braucht es nicht. Längeres ist einfach falsch. */
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

export async function POST(req: Request): Promise<Response> {
  let roh = "";
  try {
    roh = await req.text();
  } catch {
    roh = "";
  }
  const felder = new URLSearchParams(roh.length <= MAX_BODY ? roh : "");
  const sprache = felder.get("sprache") === "en" ? "en" : "de";
  const konfig = torKonfig(process.env);
  if (!konfig) return antwort("zu", sprache);
  if (roh.length > MAX_BODY) return antwort("falsch", sprache);
  if (!(await codeStimmt(felder.get("code") ?? "", konfig))) return antwort("falsch", sprache);
  return antwort("ok", sprache, torSetCookie(await erzeugeCookieWert(konfig, Date.now())));
}

/** Der Code kommt nie in eine URL: GET gibt es nicht. */
export function GET(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
}
