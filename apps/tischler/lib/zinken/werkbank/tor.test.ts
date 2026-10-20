import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { timingSafeEqualStrings } from "../../security/timing-safe";
import middleware, { config } from "../../../middleware";
import { GET, POST } from "../../../app/api/zinken/tor/route";
import { codeStimmt, erzeugeCookieWert, pruefeCookie, torKonfig, type TorKonfig } from "./tor";

/**
 * Werkbank S2b: das Probelauf-Tor ohne DB (Zeichnung b v9, Missbrauchsschutz; Prüfplan »Tor (S2, ohne DB; v8)«).
 * Bibliothek (Konfiguration, Code, Cookie), Tor-Route, Middleware, kein Log, eine Quelle.
 * Die Testwerte sind Muster, keine Geheimnisse. next-intl wird hier ersetzt: geprüft wird, ob
 * die Middleware an next-intl weitergibt (x-intl), nicht next-intl selbst.
 */

vi.mock("next-intl/middleware", () => ({
  default: () => () => new Response(null, { headers: { "x-intl": "1" } }),
}));
vi.mock("../../../i18n/routing", () => ({ routing: {} }));
vi.mock("../../security/timing-safe", async (importOriginal) => {
  const echt = await importOriginal<{ timingSafeEqualStrings: (a: string, b: string) => Promise<boolean> }>();
  return { ...echt, timingSafeEqualStrings: vi.fn(echt.timingSafeEqualStrings) };
});

const CODE = "c0dec0dec0dec0dec0dec0dec0dec0de";
const CODE2 = "badc0de0badc0de0badc0de0badc0de0";
const SALZ = "5a175a175a175a175a175a175a175a175a175a175a175a175a175a175a175a17";
const SALZ2 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const JETZT = Date.UTC(2026, 9, 19, 6, 0, 0);
const STUNDE = 60 * 60 * 1000;
const APP = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const NAMEN = [
  "ZINKEN_MEISTER_CODE",
  "ZINKEN_MEISTER_SALZ",
  "DEBUG",
  "NODE_DEBUG",
  "ANTHROPIC_LOG",
  "CRAFT_ADMIN_USER",
  "CRAFT_ADMIN_PASS",
] as const;

let gesichert: Record<string, string | undefined> = {};

function setzeEnv(): void {
  for (const name of NAMEN) delete process.env[name];
  process.env.ZINKEN_MEISTER_CODE = CODE;
  process.env.ZINKEN_MEISTER_SALZ = SALZ;
}

beforeEach(() => {
  gesichert = Object.fromEntries(NAMEN.map((name) => [name, process.env[name]]));
  setzeEnv();
});

afterEach(() => {
  for (const name of NAMEN) {
    const wert = gesichert[name];
    if (wert === undefined) delete process.env[name];
    else process.env[name] = wert;
  }
});

function env(extra: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return { ZINKEN_MEISTER_CODE: CODE, ZINKEN_MEISTER_SALZ: SALZ, ...extra };
}

function konfig(extra: Record<string, string | undefined> = {}): TorKonfig {
  const k = torKonfig(env(extra));
  if (!k) throw new Error("Testaufbau: Konfiguration fehlt");
  return k;
}

function gueltigesCookie(): Promise<string> {
  return erzeugeCookieWert(konfig(), Date.now());
}

function teile(wert: string): [string, string, string] {
  const [sid = "", ablauf = "", signatur = ""] = wert.split(".");
  return [sid, ablauf, signatur];
}

function form(felder: Record<string, string>): string {
  return new URLSearchParams(felder).toString();
}

function post(body: string): Promise<Response> {
  return POST(
    new Request("https://werkbank.test/api/zinken/tor", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    }),
  );
}

function anfrage(pfad: string, wert?: string, kopf: Record<string, string> = {}): NextRequest {
  const cookie: Record<string, string> = wert === undefined ? {} : { cookie: `__Host-zinken-tor=${wert}` };
  return new NextRequest(new URL(pfad, "https://werkbank.test"), { headers: { ...kopf, ...cookie } });
}

/** Ziel des rewrite (Pfad + Query) oder null. */
function umgeschrieben(res: Response): string | null {
  const ziel = res.headers.get("x-middleware-rewrite");
  if (ziel === null) return null;
  const url = new URL(ziel);
  return url.pathname + url.search;
}

/** An next-intl weitergegeben, ohne rewrite. */
function anIntl(res: Response): boolean {
  return res.headers.get("x-intl") === "1" && res.headers.get("x-middleware-rewrite") === null;
}

function quelle(pfad: string): string {
  return readFileSync(resolve(APP, pfad), "utf8");
}

describe("Probelauf-Tor: Konfiguration", () => {
  it("CODE 32 Hex und SALZ 64 Hex öffnen das Tor, Groß/Klein egal", () => {
    expect(torKonfig(env())).toEqual({ code: CODE, salz: SALZ });
    expect(
      torKonfig(env({ ZINKEN_MEISTER_CODE: CODE.toUpperCase(), ZINKEN_MEISTER_SALZ: SALZ.toUpperCase() })),
    ).toEqual({ code: CODE, salz: SALZ });
  });

  it("CODE oder SALZ fehlt oder ist leer → zu", () => {
    const faelle: Record<string, string | undefined>[] = [
      env({ ZINKEN_MEISTER_CODE: undefined }),
      env({ ZINKEN_MEISTER_SALZ: undefined }),
      env({ ZINKEN_MEISTER_CODE: "" }),
      env({ ZINKEN_MEISTER_SALZ: "" }),
      {},
    ];
    expect(faelle.map((f) => torKonfig(f))).toEqual([null, null, null, null, null]);
  });

  it("CODE ≠ 32 Hex oder SALZ ≠ 64 Hex → zu", () => {
    const faelle = [
      env({ ZINKEN_MEISTER_CODE: CODE.slice(1) }),
      env({ ZINKEN_MEISTER_CODE: `${CODE}0` }),
      env({ ZINKEN_MEISTER_CODE: `g${CODE.slice(1)}` }),
      env({ ZINKEN_MEISTER_CODE: ` ${CODE.slice(1)}` }),
      env({ ZINKEN_MEISTER_CODE: `${CODE.slice(0, 16)} ${CODE.slice(17)}` }),
      env({ ZINKEN_MEISTER_SALZ: SALZ.slice(1) }),
      env({ ZINKEN_MEISTER_SALZ: `${SALZ}a` }),
      env({ ZINKEN_MEISTER_SALZ: `z${SALZ.slice(1)}` }),
      env({ ZINKEN_MEISTER_SALZ: CODE }),
    ];
    expect(faelle.map((f) => torKonfig(f))).toEqual(faelle.map(() => null));
  });

  it("Debug-Env DEBUG, NODE_DEBUG oder ANTHROPIC_LOG gesetzt → zu", () => {
    const faelle = [
      env({ DEBUG: "1" }),
      env({ NODE_DEBUG: "http,fetch" }),
      env({ ANTHROPIC_LOG: "debug" }),
      env({ DEBUG: "" }),
    ];
    expect(faelle.map((f) => torKonfig(f))).toEqual([null, null, null, null]);
    expect(torKonfig(env({ DEBUG: undefined }))).not.toBeNull();
  });
});

describe("Probelauf-Tor: Code", () => {
  it("Leerzeichen und Groß/Klein im Code sind egal", async () => {
    const k = konfig();
    const varianten = [
      CODE.toUpperCase(),
      ` ${CODE.slice(0, 8)} ${CODE.slice(8, 16)}\t${CODE.slice(16, 24)}\n${CODE.slice(24)} `,
      CODE.replace(/(.{4})/g, "$1 ").toUpperCase(),
    ];
    const ergebnisse: boolean[] = [];
    for (const v of varianten) ergebnisse.push(await codeStimmt(v, k));
    expect(ergebnisse).toEqual([true, true, true]);
  });

  it("falscher Code ist falsch", async () => {
    const k = konfig();
    expect(await codeStimmt(CODE2, k)).toBe(false);
    expect(await codeStimmt(`${CODE.slice(0, 31)}f`, k)).toBe(false);
  });

  it("Code anderer Länge ist einfach falsch, ohne Ausnahme", async () => {
    const k = konfig();
    const eingaben = ["", "0", CODE.slice(0, 31), `${CODE}0`, CODE + CODE, "x".repeat(10000), "ä€😀"];
    const ergebnisse: boolean[] = [];
    for (const e of eingaben) ergebnisse.push(await codeStimmt(e, k));
    expect(ergebnisse).toEqual(eingaben.map(() => false));
  });

  it("der Vergleich läuft über timingSafeEqualStrings (sha256-Digests) aus lib/security/timing-safe", async () => {
    const k = konfig();
    const spion = vi.mocked(timingSafeEqualStrings);
    spion.mockClear();
    expect(await codeStimmt(CODE, k)).toBe(true);
    expect(await codeStimmt(CODE2, k)).toBe(false);
    expect(spion.mock.calls).toEqual([
      [CODE, CODE],
      [CODE2, CODE],
    ]);
  });
});

describe("Probelauf-Tor: Cookie", () => {
  it("Cookie-Wert hat die Form sid.ablauf.signatur, Ablauf = Serverzeit + 12 h, sid zufällig", async () => {
    const k = konfig();
    const a = await erzeugeCookieWert(k, JETZT);
    const b = await erzeugeCookieWert(k, JETZT);
    expect(a).toMatch(/^[0-9a-f]{32}\.[0-9]+\.[0-9a-f]{64}$/);
    expect(Number(teile(a)[1])).toBe(Math.floor(JETZT / 1000) + 12 * 60 * 60);
    expect(teile(a)[0]).not.toBe(teile(b)[0]);
  });

  it("gültiges Cookie wird angenommen", async () => {
    const k = konfig();
    const wert = await erzeugeCookieWert(k, JETZT);
    expect(await pruefeCookie(wert, k, JETZT + 1000)).toBe(true);
    expect(await pruefeCookie(wert, k, JETZT + 12 * STUNDE - 1000)).toBe(true);
  });

  it("falsche Signatur oder verlängerter Ablauf ohne neue Signatur → abgelehnt", async () => {
    const k = konfig();
    const wert = await erzeugeCookieWert(k, JETZT);
    const [sid, ablauf, signatur] = teile(wert);
    const gekippt = signatur.slice(0, -1) + (signatur.endsWith("0") ? "1" : "0");
    const fremdesSalz = await erzeugeCookieWert({ code: CODE, salz: SALZ2 }, JETZT);
    const faelle = [
      `${sid}.${ablauf}.${gekippt}`,
      `${sid}.${Number(ablauf) + 3600}.${signatur}`,
      `${"0".repeat(32)}.${ablauf}.${signatur}`,
      fremdesSalz,
    ];
    const ergebnisse: boolean[] = [];
    for (const f of faelle) ergebnisse.push(await pruefeCookie(f, k, JETZT + 1000));
    expect(ergebnisse).toEqual([false, false, false, false]);
  });

  it("abgelaufenes Cookie wird abgelehnt", async () => {
    const k = konfig();
    const wert = await erzeugeCookieWert(k, JETZT);
    expect(await pruefeCookie(wert, k, JETZT + 12 * STUNDE)).toBe(false);
    expect(await pruefeCookie(wert, k, JETZT + 12 * STUNDE + 1000)).toBe(false);
    expect(await pruefeCookie(wert, k, JETZT + 48 * STUNDE)).toBe(false);
  });

  it("nach Code-Wechsel ist das alte Cookie ungültig", async () => {
    const alt = konfig();
    const wert = await erzeugeCookieWert(alt, JETZT);
    const neu = konfig({ ZINKEN_MEISTER_CODE: CODE2 });
    expect(await pruefeCookie(wert, neu, JETZT + 1000)).toBe(false);
    expect(await pruefeCookie(wert, alt, JETZT + 1000)).toBe(true);
  });

  it("kaputte Cookie-Werte werden abgelehnt, ohne Ausnahme", async () => {
    const k = konfig();
    const wert = await erzeugeCookieWert(k, JETZT);
    const [sid, ablauf, signatur] = teile(wert);
    const faelle = [
      "",
      ".",
      "..",
      "a.b.c",
      `${sid}.${ablauf}`,
      `${wert}.x`,
      wert.toUpperCase(),
      ` ${wert}`,
      `${sid}.-1.${signatur}`,
      `${sid}.${ablauf}.${signatur.slice(2)}`,
      undefined,
    ];
    const ergebnisse: boolean[] = [];
    for (const f of faelle) ergebnisse.push(await pruefeCookie(f, k, JETZT + 1000));
    expect(ergebnisse).toEqual(faelle.map(() => false));
  });

  it("ohne Konfiguration ist kein Cookie gültig", async () => {
    const wert = await erzeugeCookieWert(konfig(), JETZT);
    expect(await pruefeCookie(wert, null, JETZT + 1000)).toBe(false);
    expect(await pruefeCookie(wert, torKonfig(env({ ZINKEN_MEISTER_SALZ: undefined })), JETZT + 1000)).toBe(false);
  });

  it("die Signatur wird mit crypto.subtle.verify geprüft, nie mit ===", async () => {
    const k = konfig();
    const wert = await erzeugeCookieWert(k, JETZT);
    const spion = vi.spyOn(crypto.subtle, "verify");
    try {
      expect(await pruefeCookie(wert, k, JETZT + 1000)).toBe(true);
      expect(spion).toHaveBeenCalledTimes(1);
    } finally {
      spion.mockRestore();
    }
  });
});

describe("Probelauf-Tor: Tor-Route", () => {
  it("GET → 405, nur POST", () => {
    const res = GET();
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("POST");
  });

  it("richtiger Code → 303 auf die Werkbank, Cookie __Host-zinken-tor mit genau HttpOnly, Secure, Path=/, SameSite=Strict, Max-Age 12 h", async () => {
    const res = await post(form({ code: ` ${CODE.toUpperCase().replace(/(.{8})/g, "$1 ")}`, sprache: "en" }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/en/zinken/werkbank");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ ergebnis: "ok" });
    const [paar = "", ...attribute] = (res.headers.get("set-cookie") ?? "").split(";").map((s) => s.trim());
    expect(paar.startsWith("__Host-zinken-tor=")).toBe(true);
    expect([...attribute].sort()).toEqual(["HttpOnly", "Max-Age=43200", "Path=/", "SameSite=Strict", "Secure"]);
    const wert = paar.slice("__Host-zinken-tor=".length);
    expect(await pruefeCookie(wert, torKonfig(process.env), Date.now())).toBe(true);
  });

  it("falscher Code → 303 zurück zum Code-Feld, kein Cookie", async () => {
    const res = await post(form({ code: CODE2, sprache: "de" }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/de/zinken/werkbank?tor=falsch");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ ergebnis: "falsch" });
  });

  it("Code anderer Länge, leer, ohne Feld oder übergroß → falsch, kein Cookie, keine Ausnahme", async () => {
    const bodies = [
      form({ code: "" }),
      form({ code: CODE.slice(0, 31) }),
      form({ code: `${CODE}0` }),
      form({ code: "x".repeat(5000) }),
      form({ sprache: "de" }),
      "",
      "%%%kaputt=%",
      `${form({ code: CODE })}&rest=${"x".repeat(2000)}`,
    ];
    const ergebnisse: [number, string | null, string][] = [];
    for (const body of bodies) {
      const res = await post(body);
      const { ergebnis } = (await res.json()) as { ergebnis: string };
      ergebnisse.push([res.status, res.headers.get("set-cookie"), ergebnis]);
    }
    expect(ergebnisse).toEqual(bodies.map(() => [303, null, "falsch"]));
  });

  it("CODE oder SALZ fehlt oder falsches Format → zu, kein Cookie, auch mit richtigem Code", async () => {
    const faelle: [string, string | undefined][] = [
      ["ZINKEN_MEISTER_SALZ", undefined],
      ["ZINKEN_MEISTER_CODE", undefined],
      ["ZINKEN_MEISTER_CODE", CODE.slice(1)],
      ["ZINKEN_MEISTER_SALZ", `${SALZ}0`],
    ];
    const ergebnisse: [string, number, string | null, string, string | null][] = [];
    for (const [name, wert] of faelle) {
      setzeEnv();
      if (wert === undefined) delete process.env[name];
      else process.env[name] = wert;
      const res = await post(form({ code: CODE, sprache: "de" }));
      const { ergebnis } = (await res.json()) as { ergebnis: string };
      ergebnisse.push([name, res.status, res.headers.get("set-cookie"), ergebnis, res.headers.get("location")]);
    }
    expect(ergebnisse).toEqual(faelle.map(([name]) => [name, 303, null, "zu", "/de/zinken/werkbank?tor=zu"]));
  });

  it("Debug-Env gesetzt → zu, kein Cookie", async () => {
    const faelle: [string, string][] = [
      ["DEBUG", "1"],
      ["NODE_DEBUG", "http"],
      ["ANTHROPIC_LOG", "debug"],
    ];
    const ergebnisse: [string, string | null, string][] = [];
    for (const [name, wert] of faelle) {
      setzeEnv();
      process.env[name] = wert;
      const res = await post(form({ code: CODE }));
      const { ergebnis } = (await res.json()) as { ergebnis: string };
      ergebnisse.push([name, res.headers.get("set-cookie"), ergebnis]);
    }
    expect(ergebnisse).toEqual(faelle.map(([name]) => [name, null, "zu"]));
  });

  it("Body-Grenze vor dem Lesen: ein langer Body ohne Content-Length wird nach höchstens zwei Stücken abgebrochen", async () => {
    let gezogen = 0;
    const strom = new ReadableStream<Uint8Array>({
      pull(steuer) {
        if (gezogen >= 64) {
          steuer.close();
          return;
        }
        gezogen += 1;
        steuer.enqueue(new Uint8Array(1024).fill(0x61));
      },
    });
    const res = await POST(
      new Request("https://werkbank.test/api/zinken/tor", { method: "POST", body: strom, duplex: "half" } as RequestInit),
    );
    expect(res.headers.get("location")).toBe("/de/zinken/werkbank?tor=falsch");
    expect(gezogen).toBeLessThanOrEqual(2);
  });

  it("Body-Grenze vor dem Lesen: Content-Length über der Grenze → falsch, der Body wird nicht angefasst", async () => {
    // highWaterMark 0: der Strom zieht nicht von sich aus vor, jeder Zug käme also von der Route.
    // Nach 64 Stücken endet der Strom, damit eine Route, die doch liest, sauber scheitert statt zu hängen.
    let gezogen = 0;
    const strom = new ReadableStream<Uint8Array>(
      {
        pull(steuer) {
          if (gezogen >= 64) {
            steuer.close();
            return;
          }
          gezogen += 1;
          steuer.enqueue(new Uint8Array(1024));
        },
      },
      { highWaterMark: 0 },
    );
    const req = new Request("https://werkbank.test/api/zinken/tor", {
      method: "POST",
      headers: { "content-length": "999999" },
      body: strom,
      duplex: "half",
    } as RequestInit);
    const res = await POST(req);
    expect(res.headers.get("location")).toBe("/de/zinken/werkbank?tor=falsch");
    expect(gezogen).toBe(0);
    expect(req.bodyUsed).toBe(false);
  });

  it("Body-Grenze: genau 1024 Bytes mit richtigem Code → ok, 1025 Bytes → falsch", async () => {
    const kern = form({ code: CODE, sprache: "de" });
    const genau = `${kern}&x=${"y".repeat(1024 - kern.length - 3)}`;
    expect(new TextEncoder().encode(genau).byteLength).toBe(1024);
    const ergebnisse: (string | null)[] = [];
    for (const body of [genau, `${genau}y`]) ergebnisse.push((await post(body)).headers.get("location"));
    expect(ergebnisse).toEqual(["/de/zinken/werkbank", "/de/zinken/werkbank?tor=falsch"]);
  });

  it("Tor zu geht vor falsch: ohne Env auch bei zu großem Body → zu", async () => {
    delete process.env.ZINKEN_MEISTER_CODE;
    const res = await post(form({ code: CODE, rest: "x".repeat(2048) }));
    expect(res.headers.get("location")).toBe("/de/zinken/werkbank?tor=zu");
  });

  it("Mehrbyte-Zeichen an der Stückgrenze werden richtig gelesen (roher UTF-8-Body, Leerzeichen U+3000 im Code)", async () => {
    const bytes = new TextEncoder().encode(`code=${CODE.slice(0, 16)}\u3000${CODE.slice(16)}&sprache=de`);
    const teilung = "code=".length + 16 + 1;
    expect([...bytes.slice(teilung - 1, teilung + 2)]).toEqual([0xe3, 0x80, 0x80]);
    const stuecke = [bytes.slice(0, teilung), bytes.slice(teilung)];
    const strom = new ReadableStream<Uint8Array>({
      pull(steuer) {
        const stueck = stuecke.shift();
        if (stueck) steuer.enqueue(stueck);
        else steuer.close();
      },
    });
    const res = await POST(
      new Request("https://werkbank.test/api/zinken/tor", { method: "POST", body: strom, duplex: "half" } as RequestInit),
    );
    expect(res.headers.get("location")).toBe("/de/zinken/werkbank");
  });

  it("unbekannte Sprache führt auf /de, nie auf eine fremde Adresse", async () => {
    const sprachen = ["fr", "//evil.example", "https://evil.example", "EN", ""];
    const ziele: (string | null)[] = [];
    for (const sprache of sprachen) ziele.push((await post(form({ code: CODE, sprache }))).headers.get("location"));
    expect(ziele).toEqual(sprachen.map(() => "/de/zinken/werkbank"));
  });
});

describe("Probelauf-Tor: Middleware", () => {
  it("/de und /en/zinken/werkbank ohne Cookie → Code-Feld per rewrite, noindex, no-store, Query bleibt", async () => {
    expect(torKonfig(process.env)).not.toBeNull();
    const antworten = [
      await middleware(anfrage("/de/zinken/werkbank")),
      await middleware(anfrage("/en/zinken/werkbank")),
      await middleware(anfrage("/de/zinken/werkbank?tor=falsch")),
    ];
    expect(antworten.map(umgeschrieben)).toEqual(["/de/zinken/tor", "/en/zinken/tor", "/de/zinken/tor?tor=falsch"]);
    expect(antworten.map((r) => [r.headers.get("cache-control"), r.headers.get("x-robots-tag"), r.headers.get("x-intl")])).toEqual(
      antworten.map(() => ["no-store", "noindex, nofollow", null]),
    );
  });

  it("Unterpfade, Schrägstrich am Ende, doppelte Schrägstriche und kodierte Pfade liegen auch hinter dem Tor", async () => {
    expect(torKonfig(process.env)).not.toBeNull();
    const pfade = [
      "/de/zinken/werkbank/",
      "/de/zinken/werkbank/schritt/2",
      "/de//zinken/werkbank",
      "/de/zinken/%77erkbank",
      "/en/zinken/werkbank%2Fx",
    ];
    const ziele: (string | null)[] = [];
    for (const p of pfade) ziele.push(umgeschrieben(await middleware(anfrage(p))));
    expect(ziele).toEqual(["/de/zinken/tor", "/de/zinken/tor", "/de/zinken/tor", "/de/zinken/tor", "/en/zinken/tor"]);
  });

  it("gültiges Cookie → weiter an next-intl, kein rewrite", async () => {
    const wert = await gueltigesCookie();
    const pfade = ["/de/zinken/werkbank", "/en/zinken/werkbank", "/de/zinken/werkbank/schritt/2"];
    const weiter: boolean[] = [];
    for (const p of pfade) weiter.push(anIntl(await middleware(anfrage(p, wert))));
    expect(weiter).toEqual([true, true, true]);
  });

  it("Cookie mit falscher Signatur, abgelaufen oder nach Code-Wechsel → Code-Feld", async () => {
    const jetzt = Date.now();
    const wert = await erzeugeCookieWert(konfig(), jetzt);
    const [sid, ablauf, signatur] = teile(wert);
    const faelle = [
      `${sid}.${ablauf}.${signatur.slice(0, -1)}${signatur.endsWith("0") ? "1" : "0"}`,
      await erzeugeCookieWert(konfig(), jetzt - 13 * STUNDE),
      await erzeugeCookieWert(konfig({ ZINKEN_MEISTER_CODE: CODE2 }), jetzt),
    ];
    const ziele: (string | null)[] = [];
    for (const f of faelle) ziele.push(umgeschrieben(await middleware(anfrage("/de/zinken/werkbank", f))));
    expect(ziele).toEqual(["/de/zinken/tor", "/de/zinken/tor", "/de/zinken/tor"]);
    expect(anIntl(await middleware(anfrage("/de/zinken/werkbank", wert)))).toBe(true);
  });

  it("CODE/SALZ fehlt oder Debug-Env gesetzt → Code-Feld, auch mit sonst gültigem Cookie", async () => {
    const wert = await gueltigesCookie();
    const ziele: (string | null)[] = [];
    delete process.env.ZINKEN_MEISTER_SALZ;
    ziele.push(umgeschrieben(await middleware(anfrage("/de/zinken/werkbank", wert))));
    setzeEnv();
    delete process.env.ZINKEN_MEISTER_CODE;
    ziele.push(umgeschrieben(await middleware(anfrage("/de/zinken/werkbank", wert))));
    setzeEnv();
    process.env.DEBUG = "1";
    ziele.push(umgeschrieben(await middleware(anfrage("/de/zinken/werkbank", wert))));
    setzeEnv();
    expect(ziele).toEqual(["/de/zinken/tor", "/de/zinken/tor", "/de/zinken/tor"]);
    expect(anIntl(await middleware(anfrage("/de/zinken/werkbank", wert)))).toBe(true);
  });

  it("alte Seiten bleiben offen: /de/zinken, /en/zinken, /de/zinken/xr, /de/zinken/werkbankx, /de, Code-Feld", async () => {
    const wert = await gueltigesCookie();
    const pfade = ["/de/zinken", "/en/zinken", "/de/zinken/xr", "/de/zinken/werkbankx", "/de", "/de/zinken/tor"];
    const offen: [string, boolean, boolean][] = [];
    for (const p of pfade) {
      offen.push([p, anIntl(await middleware(anfrage(p))), anIntl(await middleware(anfrage(p, wert)))]);
    }
    expect(offen).toEqual(pfade.map((p) => [p, true, true]));
  });

  it("/admin bleibt bei Basic Auth: ohne Env 401, mit Zugang weiter, das Tor-Cookie ändert nichts", async () => {
    const wert = await gueltigesCookie();
    const ohneEnv = await middleware(anfrage("/admin", wert));
    expect(ohneEnv.status).toBe(401);
    expect(ohneEnv.headers.get("www-authenticate")).toContain("Basic");
    process.env.CRAFT_ADMIN_USER = "werkstatt";
    process.env.CRAFT_ADMIN_PASS = "nur-ein-testwert";
    const mit = await middleware(
      anfrage("/admin/beitraege", undefined, { authorization: `Basic ${btoa("werkstatt:nur-ein-testwert")}` }),
    );
    expect([mit.status, mit.headers.get("x-middleware-next"), mit.headers.get("x-middleware-rewrite")]).toEqual([
      200,
      "1",
      null,
    ]);
    const falsch = await middleware(anfrage("/admin", wert, { authorization: `Basic ${btoa("werkstatt:nein")}` }));
    expect(falsch.status).toBe(401);
  });

  it("Transportformen /de/zinken/werkbank.rsc, …/werkbank.segments/… und /en/zinken/werkbank/x.rsc ohne Cookie → Code-Feld", async () => {
    expect(torKonfig(process.env)).not.toBeNull();
    const pfade = [
      "/de/zinken/werkbank.rsc",
      "/de/zinken/werkbank.segments/zinken/werkbank/__PAGE__.segment.rsc",
      "/en/zinken/werkbank/x.rsc",
    ];
    const ziele: (string | null)[] = [];
    for (const p of pfade) ziele.push(umgeschrieben(await middleware(anfrage(p))));
    expect(ziele).toEqual(["/de/zinken/tor", "/de/zinken/tor", "/en/zinken/tor"]);
  });

  it("Groß/Klein egal: /de/zinken/Werkbank, /DE/zinken/werkbank, /EN/zinken/WERKBANK → Code-Feld, Sprache klein", async () => {
    expect(torKonfig(process.env)).not.toBeNull();
    const pfade = ["/de/zinken/Werkbank", "/DE/zinken/werkbank", "/EN/zinken/WERKBANK"];
    const ziele: (string | null)[] = [];
    for (const p of pfade) ziele.push(umgeschrieben(await middleware(anfrage(p))));
    expect(ziele).toEqual(["/de/zinken/tor", "/de/zinken/tor", "/en/zinken/tor"]);
  });

  it("kaputte Kodierung unter /de|en/zinken/ → Code-Feld (fail-closed), anderswo wie bisher an next-intl", async () => {
    expect(torKonfig(process.env)).not.toBeNull();
    const pfade = ["/de/zinken/werkbank%E0", "/EN/zinken/%E0%A4"];
    const ziele: (string | null)[] = [];
    for (const p of pfade) ziele.push(umgeschrieben(await middleware(anfrage(p))));
    expect(ziele).toEqual(["/de/zinken/tor", "/en/zinken/tor"]);
    expect(anIntl(await middleware(anfrage("/de/%E0")))).toBe(true);
  });

  it("Grenze: /de/zinken/werkbankx und /de/zinken/werkbank-alt liegen nicht hinter dem Tor", async () => {
    expect(torKonfig(process.env)).not.toBeNull();
    const pfade = ["/de/zinken/werkbankx", "/de/zinken/werkbank-alt"];
    const offen: boolean[] = [];
    for (const p of pfade) offen.push(anIntl(await middleware(anfrage(p))));
    expect(offen).toEqual([true, true]);
  });

  it("Pfade mit Punkt außerhalb der Werkbank gehen unverändert weiter, nicht an next-intl", async () => {
    const pfade = ["/de/zinken/werkbankx.rsc", "/de/zinken.rsc", "/de/zinken/xr.rsc"];
    const weiter: [boolean, string | null][] = [];
    for (const p of pfade) {
      const res = await middleware(anfrage(p));
      weiter.push([anIntl(res), res.headers.get("x-middleware-next")]);
    }
    expect(weiter).toEqual(pfade.map(() => [false, "1"]));
  });

  // Der Helfer von Next prüft nur den Rohpfad und ist damit strenger als `next start` (das zusätzlich den
  // dekodierten Pfad prüft und // zusammenfasst). Vercels eigenes Routing bildet er nicht ab.
  const PFADFORMEN = [
    "/de/zinken/werkbank",
    "/de/zinken/werkbank/x",
    "/de/zinken/werkbank.rsc",
    "/de/zinken/werkbank/x.rsc",
    "/DE/zinken/werkbank",
    "/de/Zinken/Werkbank",
    "/de/zinken/werkbank%2Ex",
    "/de/zinken/%77erkbank",
    "/de/ZINKEN/werkbank.segments/x.segment.rsc",
    "/DE/zinken/werkbank.rsc",
    "/de/zinken/%77erkbank.rsc",
    "/de//zinken/werkbank.rsc",
    "/de/zinken",
    "/de/zinken/xr",
  ];
  const NICHT_ANFASSEN = ["/_next/static/chunks/a.js", "/favicon.ico", "/api/zinken/tor", "/bilder/a.png"];

  it("Matcher: jede Pfadform unter zinken erreicht die Middleware (echter Next-Matcher)", () => {
    const nichtGetroffen = PFADFORMEN.filter((url) => !unstable_doesMiddlewareMatch({ config, url }));
    expect(nichtGetroffen).toEqual([]);
  });

  it("Matcher: API, Next-Interna und Dateien bleiben draußen; die erste Zeile ist unverändert", () => {
    const getroffen = NICHT_ANFASSEN.filter((url) => unstable_doesMiddlewareMatch({ config, url }));
    expect(getroffen).toEqual([]);
    expect(([] as string[]).concat(config.matcher)[0]).toBe("/((?!api|_next|_vercel|.*\\..*).*)");
  });
});

describe("Probelauf-Tor: kein Log, eine Quelle", () => {
  it("Tor-Route und Middleware schreiben nichts auf die Konsole, die Antwort trägt weder Code noch Cookie-Wert", async () => {
    const wert = await gueltigesCookie();
    const methoden = ["log", "info", "warn", "error", "debug", "trace"] as const;
    const spione = methoden.map((m) => vi.spyOn(console, m).mockImplementation(() => undefined));
    try {
      const texte: string[] = [];
      const ok = await post(form({ code: CODE }));
      texte.push(await ok.text());
      texte.push(await (await post(form({ code: CODE2 }))).text());
      delete process.env.ZINKEN_MEISTER_SALZ;
      texte.push(await (await post(form({ code: CODE }))).text());
      setzeEnv();
      GET();
      await middleware(anfrage("/de/zinken/werkbank", wert));
      await middleware(anfrage("/de/zinken/werkbank", `${wert}0`));
      await middleware(anfrage("/de/zinken/werkbank"));
      const neu = (ok.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
      for (const t of texte) {
        expect(t).not.toContain(CODE);
        expect(t).not.toContain(wert);
        expect(t).not.toContain(neu.slice("__Host-zinken-tor=".length) || "LEER");
      }
      expect(spione.map((s) => s.mock.calls.length)).toEqual(methoden.map(() => 0));
    } finally {
      for (const s of spione) s.mockRestore();
    }
  });

  it("Quelltext von tor.ts, Tor-Route, Middleware und Code-Feld ohne console-Aufruf und ohne logger", () => {
    const dateien = [
      "lib/zinken/werkbank/tor.ts",
      "app/api/zinken/tor/route.ts",
      "middleware.ts",
      "app/[locale]/zinken/tor/page.tsx",
    ];
    const funde = dateien.filter((d) => /\bconsole\s*\.\s*[a-z]|\blogger\s*\.\s*[a-z]|lib\/logger/.test(quelle(d)));
    expect(funde).toEqual([]);
  });

  it("Env-Namen, Cookie-Name und Ablaufzahl stehen nur in tor.ts, nicht in Route, Middleware oder Code-Feld", () => {
    const dateien = ["app/api/zinken/tor/route.ts", "middleware.ts", "app/[locale]/zinken/tor/page.tsx"];
    const funde = dateien.filter((d) => /ZINKEN_MEISTER_|__Host-|zinken-tor|43200|60 \* 60/.test(quelle(d)));
    expect(funde).toEqual([]);
  });

  it("der Namensraum werkbank wird in i18n/request.ts geladen", () => {
    expect(quelle("i18n/request.ts")).toMatch(/const NAMESPACES = \[[^\]]*"werkbank",/);
  });
});
