import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as tokenPOST } from "./token/route";
import { POST as wissenPOST } from "./wissen/route";
import { POST as zugangPOST } from "../../zugang/route";
import { resetLimits } from "./_lib/guard";
import { ZUGANG_COOKIE, pruefeZugang, sicheresZiel, zugangsToken } from "../../../../lib/demo/zugang";

const BASE = "https://demo.example";
const PIN = "werkbank-2026";

async function cookie(): Promise<string> {
  return `${ZUGANG_COOKIE}=${await zugangsToken(PIN)}`;
}

function req(path: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE, ...headers },
    body: JSON.stringify(body),
  });
}

const ENV_KEYS = ["DEMO_PIN", "OPENAI_API_KEY", "OPENAI_REALTIME_MODEL"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  resetLimits();
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.restoreAllMocks();
});

describe("Zugang (fail-closed)", () => {
  it("ohne DEMO_PIN ist der Zugang ausserhalb von dev unkonfiguriert", async () => {
    expect(await pruefeZugang(undefined, { NODE_ENV: "production" })).toBe("unkonfiguriert");
    expect(await pruefeZugang(undefined, { NODE_ENV: "development" })).toBe("offen");
  });
  it("prueft das Cookie gegen den PIN", async () => {
    const env = { DEMO_PIN: PIN, NODE_ENV: "production" };
    expect(await pruefeZugang(await zugangsToken(PIN), env)).toBe("ok");
    expect(await pruefeZugang(await zugangsToken("falsch"), env)).toBe("gesperrt");
    expect(await pruefeZugang(undefined, env)).toBe("gesperrt");
  });
  it("leitet nur auf relative Ziele weiter", () => {
    expect(sicheresZiel("/de/dovetail")).toBe("/de/dovetail");
    expect(sicheresZiel("//evil.example")).toBe("/de/voice");
    expect(sicheresZiel("https://evil.example")).toBe("/de/voice");
    expect(sicheresZiel("/\\evil.example")).toBe("/de/voice");
  });
  it("POST /api/zugang setzt das Cookie nur mit richtigem Code", async () => {
    process.env.DEMO_PIN = PIN;
    expect((await zugangPOST(req("/api/zugang", { pin: "falsch" }))).status).toBe(401);
    const ok = await zugangPOST(req("/api/zugang", { pin: PIN, ziel: "/de/lernen" }));
    expect(ok.status).toBe(200);
    expect(ok.headers.get("set-cookie")).toContain(`${ZUGANG_COOKIE}=${await zugangsToken(PIN)}`);
    expect(ok.headers.get("set-cookie")).toMatch(/HttpOnly/);
    expect(await ok.json()).toEqual({ ok: true, ziel: "/de/lernen" });
  });
  it("POST /api/zugang bremst Rateversuche", async () => {
    process.env.DEMO_PIN = PIN;
    let last = 0;
    for (let i = 0; i < 11; i++) last = (await zugangPOST(req("/api/zugang", { pin: `x${i}` }))).status;
    expect(last).toBe(429);
  });
});

describe("POST /api/voice/realtime/token", () => {
  it("503 ohne konfigurierten Zugang (fail-closed)", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    expect((await tokenPOST(req("/api/voice/realtime/token", {}))).status).toBe(503);
  });
  it("401 ohne Zugangs-Cookie", async () => {
    process.env.DEMO_PIN = PIN;
    process.env.OPENAI_API_KEY = "sk-test";
    expect((await tokenPOST(req("/api/voice/realtime/token", {}))).status).toBe(401);
  });
  it("403 bei fremder Herkunft", async () => {
    process.env.DEMO_PIN = PIN;
    const r = req("/api/voice/realtime/token", {}, { origin: "https://evil.example", cookie: await cookie() });
    expect((await tokenPOST(r)).status).toBe(403);
  });
  it("503 ohne OPENAI_API_KEY", async () => {
    process.env.DEMO_PIN = PIN;
    expect((await tokenPOST(req("/api/voice/realtime/token", {}, { cookie: await cookie() }))).status).toBe(503);
  });
  it("holt den Kurzzeit-Schluessel serverseitig und gibt nur ihn heraus", async () => {
    process.env.DEMO_PIN = PIN;
    process.env.OPENAI_API_KEY = "sk-geheim";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: "ek_kurz", expires_at: 123 }), { status: 200 }),
    );
    const res = await tokenPOST(req("/api/voice/realtime/token", { thema: "zinken" }, { cookie: await cookie() }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const text = await res.text();
    expect(text).not.toContain("sk-geheim");
    expect(JSON.parse(text)).toMatchObject({ token: "ek_kurz", expiresAt: 123 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/realtime/client_secrets");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer sk-geheim");
    const sent = JSON.parse(String(init!.body));
    expect(sent.session.instructions).toContain("Zinken-Station");
  });
  it("502 wenn OpenAI ablehnt", async () => {
    process.env.DEMO_PIN = PIN;
    process.env.OPENAI_API_KEY = "sk-test";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 400 }));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect((await tokenPOST(req("/api/voice/realtime/token", {}, { cookie: await cookie() }))).status).toBe(502);
  });
  it("Kosten-Bremse: max. 6 Sitzungen je IP", async () => {
    process.env.DEMO_PIN = PIN;
    process.env.OPENAI_API_KEY = "sk-test";
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () => new Response(JSON.stringify({ value: "ek" }), { status: 200 }),
    );
    const c = await cookie();
    const codes: number[] = [];
    for (let i = 0; i < 7; i++) codes.push((await tokenPOST(req("/api/voice/realtime/token", {}, { cookie: c }))).status);
    expect(codes.slice(0, 6).every((s) => s === 200)).toBe(true);
    expect(codes[6]).toBe(429);
  });
});

describe("POST /api/voice/realtime/wissen", () => {
  it("findet Lehrplan-Stellen mit RIS-Link", async () => {
    process.env.DEMO_PIN = PIN;
    const res = await wissenPOST(
      req("/api/voice/realtime/wissen", { frage: "Lehrplan Berufsschule Tischlerei Holzverbindungen" }, { cookie: await cookie() }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; treffer: Array<{ url: string | null; amtlich: boolean }> };
    expect(data.ok).toBe(true);
    expect(data.treffer.length).toBeGreaterThan(0);
    expect(data.treffer.some((t) => t.amtlich && t.url?.startsWith("https://www.ris.bka.gv.at/"))).toBe(true);
  });
  it("lehnt leere oder zu lange Fragen ab und braucht Zugang", async () => {
    process.env.DEMO_PIN = PIN;
    const c = await cookie();
    expect((await wissenPOST(req("/api/voice/realtime/wissen", { frage: "" }, { cookie: c }))).status).toBe(400);
    expect((await wissenPOST(req("/api/voice/realtime/wissen", { frage: "x".repeat(301) }, { cookie: c }))).status).toBe(400);
    expect((await wissenPOST(req("/api/voice/realtime/wissen", { frage: "Lehrplan" }))).status).toBe(401);
  });
});
