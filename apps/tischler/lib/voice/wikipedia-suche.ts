/**
 * Werkzeug "wikipedia_suche" (Lienz-Demo): Live-Abruf aus der deutschen
 * Wikipedia ueber die MediaWiki-API. Fester Host (de.wikipedia.org), max. 2
 * Abrufe je Frage (Suche → Einleitung), je 5 s Timeout, nur Text, keine Bilder.
 * Lizenz CC BY-SA 4.0 → Titel, Link zum Artikel und Lizenzhinweis gehen mit
 * an den Bildschirm. Die URL baut der Server aus dem Artikeltitel, nie aus
 * Modell- oder Nutzereingaben.
 */

import { erlaubteUrl, type WissensAntwort, type WissensTreffer } from "./wissen-suche";

export const WIKI_HOST = "de.wikipedia.org";
/** Eigene Allowlist fuer Wikipedia-Links (die RIS-Allowlist bleibt unberuehrt). */
export const WIKI_LINK_HOSTS = [WIKI_HOST] as const;
/** Obergrenze fuer eine API-Antwort (Zeichen); alles darueber wird verworfen. */
export const WIKI_MAX_ANTWORT = 200_000;
export const WIKI_LIZENZ = "CC BY-SA 4.0";
export const WIKI_TIMEOUT_MS = 5000;
export const WIKI_MAX_AUSZUG = 1200;
const API = `https://${WIKI_HOST}/w/api.php`;
const USER_AGENT = "CraftCodex-Lienz-Demo/1.0 (https://github.com/cybercraft-institute/craft-codex)";

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export function suchUrl(frage: string): string {
  const p = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: frage,
    srlimit: "1",
    srnamespace: "0",
    format: "json",
    formatversion: "2",
  });
  return `${API}?${p.toString()}`;
}

export function auszugUrl(titel: string): string {
  const p = new URLSearchParams({
    action: "query",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    redirects: "1",
    titles: titel,
    format: "json",
    formatversion: "2",
  });
  return `${API}?${p.toString()}`;
}

export function artikelUrl(titel: string): string {
  return `https://${WIKI_HOST}/wiki/${encodeURIComponent(titel.replace(/ /g, "_"))}`;
}

function kuerzen(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const satzEnde = cut.lastIndexOf(". ");
  return (satzEnde > max * 0.6 ? cut.slice(0, satzEnde + 1) : cut) + " …";
}

export function titelAusSuche(json: unknown): string | null {
  const t = (json as { query?: { search?: Array<{ title?: unknown }> } })?.query?.search?.[0]?.title;
  return typeof t === "string" && t.length > 0 && t.length <= 300 ? t : null;
}

export function auszugAusAntwort(json: unknown): { titel: string; text: string } | null {
  const page = (json as { query?: { pages?: Array<{ title?: unknown; extract?: unknown; missing?: unknown }> } })
    ?.query?.pages?.[0];
  if (!page || page.missing || typeof page.title !== "string" || typeof page.extract !== "string") return null;
  const text = page.extract.trim();
  return text.length > 0 ? { titel: page.title, text } : null;
}

export function zuWikiTreffer(titel: string, text: string): WissensTreffer {
  return {
    id: `wikipedia:${titel}`,
    titel: `Wikipedia: ${titel}`,
    quelle: `Wikipedia, Artikel »${titel}« · Lizenz ${WIKI_LIZENZ}`,
    url: erlaubteUrl(artikelUrl(titel), WIKI_LINK_HOSTS),
    amtlich: false,
    art: "wikipedia",
    lizenz: WIKI_LIZENZ,
    auszug: kuerzen(text, WIKI_MAX_AUSZUG),
  };
}

async function holeJson(f: FetchLike, url: string): Promise<unknown> {
  const r = await f(url, {
    headers: { "user-agent": USER_AGENT, accept: "application/json" },
    signal: AbortSignal.timeout(WIKI_TIMEOUT_MS),
    redirect: "error",
  });
  if (!r.ok) throw new Error(`wikipedia_${r.status}`);
  const text = await r.text();
  if (text.length > WIKI_MAX_ANTWORT) throw new Error("wikipedia_zu_gross");
  return JSON.parse(text) as unknown;
}

/** Genau 2 Abrufe: Suche (1 Treffer) → Einleitung als Klartext. */
export async function sucheWikipedia(frage: string, f: FetchLike = fetch): Promise<WissensAntwort> {
  const titel = titelAusSuche(await holeJson(f, suchUrl(frage)));
  if (!titel) return { ok: true, treffer: [], hinweis: "Kein passender Wikipedia-Artikel gefunden." };
  const a = auszugAusAntwort(await holeJson(f, auszugUrl(titel)));
  if (!a) return { ok: true, treffer: [], hinweis: "Kein passender Wikipedia-Artikel gefunden." };
  return { ok: true, treffer: [zuWikiTreffer(a.titel, a.text)] };
}
