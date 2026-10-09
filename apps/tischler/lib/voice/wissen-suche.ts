/**
 * Werkzeug "suche_wissen" (Lienz-Demo): Treffer aus dem lokalen Korpus →
 * kompakte Antwort fuer das Sprachmodell + Quellenkarten fuer den Bildschirm.
 * Links nur, wenn sie aus dem Korpus stammen UND auf eine erlaubte Quelle
 * zeigen (das Modell setzt nie selbst URLs zusammen).
 */

import type { RAGDocument } from "@craft-codex/core";

export const ERLAUBTE_QUELLEN_HOSTS = ["www.ris.bka.gv.at", "ris.bka.gv.at"] as const;

export interface WissensQuelle {
  id: string;
  titel: string;
  quelle: string;
  url: string | null;
  amtlich: boolean;
}

export interface WissensTreffer extends WissensQuelle {
  auszug: string;
}

export interface WissensAntwort {
  ok: boolean;
  treffer: WissensTreffer[];
  hinweis?: string;
}

export const MAX_TREFFER = 3;
export const MAX_AUSZUG = 1400;

export function erlaubteUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    return (ERLAUBTE_QUELLEN_HOSTS as readonly string[]).includes(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}

function kuerzen(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const satzEnde = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return (satzEnde > max * 0.6 ? cut.slice(0, satzEnde + 1) : cut) + " …";
}

export function zuWissensAntwort(docs: ReadonlyArray<RAGDocument>): WissensAntwort {
  const treffer = docs.slice(0, MAX_TREFFER).map((d) => ({
    id: d.id,
    titel: String(d.metadata.title ?? d.id),
    quelle: String(d.metadata.source ?? ""),
    url: erlaubteUrl(d.metadata.source_url),
    amtlich: d.metadata.license === "official-document",
    auszug: kuerzen(d.text, MAX_AUSZUG),
  }));
  return treffer.length > 0
    ? { ok: true, treffer }
    : { ok: true, treffer, hinweis: "Keine passenden Stellen im Korpus gefunden." };
}
