import { describe, expect, it } from "vitest";
import {
  WIKI_HOST,
  WIKI_LIZENZ,
  WIKI_MAX_AUSZUG,
  WIKI_LINK_HOSTS,
  WIKI_MAX_ANTWORT,
  artikelUrl,
  auszugUrl,
  sucheWikipedia,
  suchUrl,
} from "./wikipedia-suche";
import { WERKZEUG_ROUTEN } from "./realtime-client";
import { ERLAUBTE_QUELLEN_HOSTS, erlaubteUrl } from "./wissen-suche";
import { WIKIPEDIA_TOOL_NAME, WISSEN_TOOL_NAME, buildClientSecretRequest, realtimeInstructions } from "./realtime-config";

function antwort(json: unknown, status = 200): Response {
  return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
}

function fakeFetch(...antworten: Response[]) {
  const urls: string[] = [];
  const inits: Array<RequestInit | undefined> = [];
  const f = async (url: string, init?: RequestInit) => {
    urls.push(url);
    inits.push(init);
    const r = antworten.shift();
    if (!r) throw new Error("zu viele Abrufe");
    return r;
  };
  return { f, urls, inits };
}

const SUCHE = { query: { search: [{ title: "Eiche" }] } };
const AUSZUG = { query: { pages: [{ title: "Eichen", extract: "Die Eichen sind eine Pflanzengattung." }] } };

describe("wikipedia_suche", () => {
  it("fragt nur de.wikipedia.org ab, genau 2 Abrufe, mit Timeout-Signal und ohne Weiterleitung", async () => {
    const { f, urls, inits } = fakeFetch(antwort(SUCHE), antwort(AUSZUG));
    const a = await sucheWikipedia("Eiche Holz", f);
    expect(urls).toHaveLength(2);
    for (const u of urls) expect(new URL(u).hostname).toBe(WIKI_HOST);
    expect(new URL(urls[0]!).searchParams.get("srsearch")).toBe("Eiche Holz");
    expect(new URL(urls[1]!).searchParams.get("titles")).toBe("Eiche");
    expect(new URL(urls[1]!).searchParams.get("explaintext")).toBe("1");
    for (const i of inits) {
      expect(i?.signal).toBeInstanceOf(AbortSignal);
      expect(i?.redirect).toBe("error");
    }
    expect(a.ok).toBe(true);
    expect(a.treffer).toHaveLength(1);
  });

  it("liefert Titel, Artikel-Link und Lizenz CC BY-SA 4.0 sichtbar mit", async () => {
    const { f } = fakeFetch(antwort(SUCHE), antwort(AUSZUG));
    const t = (await sucheWikipedia("Eiche", f)).treffer[0]!;
    expect(t.art).toBe("wikipedia");
    expect(t.amtlich).toBe(false);
    expect(t.lizenz).toBe(WIKI_LIZENZ);
    expect(t.quelle).toContain("Wikipedia, Artikel »Eichen«");
    expect(t.quelle).toContain("CC BY-SA 4.0");
    expect(t.url).toBe("https://de.wikipedia.org/wiki/Eichen");
    expect(t.auszug).toBe("Die Eichen sind eine Pflanzengattung.");
  });

  it("baut die Artikel-URL kodiert aus dem Titel (kein fremder Host moeglich)", () => {
    expect(artikelUrl("Schwalbenschwanz (Holzverbindung)")).toBe(
      "https://de.wikipedia.org/wiki/Schwalbenschwanz_(Holzverbindung)",
    );
    expect(new URL(artikelUrl("//evil.example/x")).hostname).toBe(WIKI_HOST);
    expect(new URL(artikelUrl("https://evil.example")).hostname).toBe(WIKI_HOST);
    expect(new URL(suchUrl("x")).hostname).toBe(WIKI_HOST);
    expect(new URL(auszugUrl("x")).hostname).toBe(WIKI_HOST);
  });

  it("ohne Suchtreffer: kein zweiter Abruf, ehrlicher Hinweis", async () => {
    const { f, urls } = fakeFetch(antwort({ query: { search: [] } }));
    const a = await sucheWikipedia("xyzzy", f);
    expect(urls).toHaveLength(1);
    expect(a.treffer).toHaveLength(0);
    expect(a.hinweis).toMatch(/Kein passender Wikipedia-Artikel/);
  });

  it("fehlende Seite oder HTTP-Fehler → leer bzw. Fehler", async () => {
    const leer = fakeFetch(antwort(SUCHE), antwort({ query: { pages: [{ title: "Eiche", missing: true }] } }));
    expect((await sucheWikipedia("Eiche", leer.f)).treffer).toHaveLength(0);
    const kaputt = fakeFetch(antwort({}, 503));
    await expect(sucheWikipedia("Eiche", kaputt.f)).rejects.toThrow("wikipedia_503");
  });

  it("verwirft uebergrosse Antworten", async () => {
    const riesig = new Response("x".repeat(WIKI_MAX_ANTWORT + 1), { status: 200 });
    const { f } = fakeFetch(riesig);
    await expect(sucheWikipedia("Eiche", f)).rejects.toThrow("wikipedia_zu_gross");
  });

  it("Wikipedia-Links laufen ueber erlaubteUrl mit eigener Allowlist, RIS-Allowlist bleibt eng", () => {
    expect(erlaubteUrl("https://de.wikipedia.org/wiki/Eiche", WIKI_LINK_HOSTS)).toBe("https://de.wikipedia.org/wiki/Eiche");
    expect(erlaubteUrl("https://en.wikipedia.org/wiki/Oak", WIKI_LINK_HOSTS)).toBeNull();
    expect(erlaubteUrl("http://de.wikipedia.org/wiki/Eiche", WIKI_LINK_HOSTS)).toBeNull();
    expect(erlaubteUrl("https://de.wikipedia.org/wiki/Eiche")).toBeNull();
    expect([...ERLAUBTE_QUELLEN_HOSTS]).toEqual(["www.ris.bka.gv.at", "ris.bka.gv.at"]);
  });

  it("kuerzt lange Einleitungen", async () => {
    const lang = "Satz eins ist hier. ".repeat(200);
    const { f } = fakeFetch(antwort(SUCHE), antwort({ query: { pages: [{ title: "Eiche", extract: lang }] } }));
    const t = (await sucheWikipedia("Eiche", f)).treffer[0]!;
    expect(t.auszug.length).toBeLessThanOrEqual(WIKI_MAX_AUSZUG + 2);
  });
});

describe("Werkzeug-Verdrahtung", () => {
  it("Session bietet beide Werkzeuge an, RIS geht in der Persona vor Wikipedia", () => {
    const body = buildClientSecretRequest({ locale: "de", thema: "allgemein" }) as {
      session: { tools: Array<{ name: string }> };
    };
    expect(body.session.tools.map((t) => t.name)).toEqual([WISSEN_TOOL_NAME, WIKIPEDIA_TOOL_NAME]);
    const p = realtimeInstructions("de", "allgemein");
    expect(p).toContain("laut Wikipedia");
    expect(p).toContain("Das RIS geht immer vor");
  });

  it("Client leitet nur bekannte Werkzeuge an feste Routen", () => {
    expect(WERKZEUG_ROUTEN[WISSEN_TOOL_NAME]).toBe("/api/voice/realtime/wissen");
    expect(WERKZEUG_ROUTEN[WIKIPEDIA_TOOL_NAME]).toBe("/api/voice/realtime/wikipedia");
    expect(Object.keys(WERKZEUG_ROUTEN)).toHaveLength(2);
    expect(Object.prototype.hasOwnProperty.call(WERKZEUG_ROUTEN, "__proto__")).toBe(false);
  });
});

describe("BIC.at nur als Link", () => {
  it("Karte verlinkt BIC.at im neuen Fenster und holt keine Inhalte", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync(new URL("../../components/MeisterLiveCard.tsx", import.meta.url), "utf8");
    const m = src.match(/const BIC_LEHRBERUF_URL = "([^"]+)"/);
    expect(m).not.toBeNull();
    expect(new URL(m![1]!).hostname).toBe("www.bic.at");
    expect(src).toMatch(/href=\{BIC_LEHRBERUF_URL\} target="_blank" rel="noopener noreferrer"/);
    expect(src).not.toMatch(/fetch\([^)]*bic\.at/);
  });
});
