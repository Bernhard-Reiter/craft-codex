import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST } from "../../app/api/v1/contributions/route";
import { GET } from "../../app/api/v1/contributions/[id]/route";

/**
 * Live-DB integration tests for the Contribution API v1 route handlers.
 * Calls the Next route handlers DIRECTLY (constructed Request objects) —
 * the real code path incl. Bearer auth, Zod, mapping, idempotency, RLS proof.
 *
 * Runs ONLY when env is provided (no secrets in CI — skipped there):
 *   CRAFT_SUPABASE_URL, CRAFT_SUPABASE_SERVICE_ROLE_KEY,
 *   CRAFT_SUPABASE_ANON_KEY, CRAFT_CONTRIB_API_TOKEN
 */

const URL_ = process.env.CRAFT_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.CRAFT_SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY = process.env.CRAFT_SUPABASE_ANON_KEY ?? "";
const API_TOKEN = process.env.CRAFT_CONTRIB_API_TOKEN ?? "";
const LIVE = Boolean(URL_ && SERVICE_KEY && ANON_KEY && API_TOKEN);

// The route's service client reads NEXT_PUBLIC_CRAFT_SUPABASE_URL LAZILY at
// request time — mirroring the test env var here (module body, before any
// handler call) is sufficient even though ESM imports are hoisted.
if (LIVE && !process.env.NEXT_PUBLIC_CRAFT_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_CRAFT_SUPABASE_URL = URL_;
}

const BASE = "http://localhost:3100/api/v1/contributions";
const createdIds: string[] = [];

function validApiPayload(): Record<string, unknown> {
  return {
    source: "cody-studio",
    sourceSessionId: `it-session-${Date.now()}`,
    trade: "tischler",
    locale: "de-AT",
    visibility: "open_commons",
    license: "CC-BY-SA-4.0",
    title: "integration-test API contribution",
    topic: "test",
    sections: [
      { type: "procedure", markdown: "Temporary row created by api-routes.integration.test.ts — safe to delete." },
      { type: "warning", markdown: "Nur ein Test, keine echte Warnung." },
    ],
    sources: [{ type: "web", citation: "integration test", url: "https://example.org/it" }],
    authorEmail: "integration-test@craft-codex.local",
    consents: { termsVersion: "2026-07", licenseAcceptedAt: new Date().toISOString() },
  };
}

async function post(
  body: unknown,
  opts: { token?: string | null; idempotencyKey?: string } = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = opts.token === undefined ? API_TOKEN : opts.token;
  if (token !== null) headers.Authorization = `Bearer ${token}`;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  const res = await POST(
    new Request(BASE, {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
  const parsed = (await res.json()) as Record<string, unknown>;
  const id = parsed.contributionId;
  if (typeof id === "string" && !createdIds.includes(id)) createdIds.push(id);
  return { status: res.status, body: parsed };
}

async function getStatus(
  id: string,
  token: string | null = API_TOKEN,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers: Record<string, string> = {};
  if (token !== null) headers.Authorization = `Bearer ${token}`;
  const res = await GET(new Request(`${BASE}/${id}`, { headers }), {
    params: Promise.resolve({ id }),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function serviceRest(method: string, path: string, jsonBody?: unknown): Promise<Response> {
  return fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: jsonBody === undefined ? undefined : JSON.stringify(jsonBody),
  });
}

afterAll(async () => {
  if (!LIVE) return;
  for (const id of createdIds) {
    await serviceRest("DELETE", `craft_contributions?id=eq.${id}`);
  }
});

describe.skipIf(!LIVE)("POST /api/v1/contributions (live)", () => {
  it("rejects a missing or wrong Bearer token with 401", async () => {
    const noAuth = await post(validApiPayload(), { token: null });
    expect(noAuth.status).toBe(401);
    const wrong = await post(validApiPayload(), { token: "ccapi_definitely-wrong" });
    expect(wrong.status).toBe(401);
    expect(JSON.stringify(wrong.body)).not.toContain("supabase");
  });

  it("fails CLOSED with 503 when the server has no token configured", async () => {
    const saved = process.env.CRAFT_CONTRIB_API_TOKEN;
    delete process.env.CRAFT_CONTRIB_API_TOKEN;
    try {
      const r = await post(validApiPayload());
      expect(r.status).toBe(503);
    } finally {
      process.env.CRAFT_CONTRIB_API_TOKEN = saved;
    }
  });

  it("rejects invalid JSON, unknown keys and oversized payloads", async () => {
    const badJson = await post("{not json");
    expect(badJson.status).toBe(400);
    expect(badJson.body.error).toBe("invalid_json");

    const unknownKey = await post({ ...validApiPayload(), sneaky: true });
    expect(unknownKey.status).toBe(400);
    expect(unknownKey.body.error).toBe("validation_failed");

    const huge = { ...validApiPayload(), title: "x".repeat(200_000) };
    const tooBig = await post(huge);
    expect(tooBig.status).toBe(413);
  });

  it("creates a contribution (201) and replays the SAME id for the same Idempotency-Key (200)", async () => {
    const key = crypto.randomUUID();
    const first = await post(validApiPayload(), { idempotencyKey: key });
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    expect(first.body.status).toBe("submitted");
    const id = first.body.contributionId as string;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.body.statusUrl).toBe(`/api/v1/contributions/${id}`);

    // Same key, even with different payload content → SAME contribution, no duplicate:
    const replay = await post(validApiPayload(), { idempotencyKey: key });
    expect(replay.status, JSON.stringify(replay.body)).toBe(200);
    expect(replay.body.contributionId).toBe(id);

    // Sharpness proof: exactly ONE row with this key exists.
    const rows = (await (
      await serviceRest("GET", `craft_contributions?idempotency_key=eq.${key}&select=id,source,source_session_id`)
    ).json()) as Array<{ id: string; source: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.source).toBe("cody-studio");
  });

  it("rejects an overlong Idempotency-Key with 400", async () => {
    const r = await post(validApiPayload(), { idempotencyKey: "k".repeat(101) });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("invalid_idempotency_key");
  });
});

describe.skipIf(!LIVE)("GET /api/v1/contributions/:id (live)", () => {
  it("returns workflow metadata WITHOUT content or author data", async () => {
    const created = await post(validApiPayload(), { idempotencyKey: crypto.randomUUID() });
    expect(created.status).toBe(201);
    const id = created.body.contributionId as string;

    const r = await getStatus(id);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.contributionId).toBe(id);
    expect(r.body.status).toBe("submitted");
    expect(r.body.revision).toBe(1);
    expect(r.body.approvedRevision).toBeNull();
    expect(r.body.publishedSlug).toBeNull();
    expect(r.body.gitCommit).toBeNull();
    expect(typeof r.body.createdAt).toBe("string");
    expect(typeof r.body.updatedAt).toBe("string");
    // Data minimization: no content / author fields in the response.
    const keys = Object.keys(r.body).join(",");
    expect(keys).not.toContain("content");
    expect(keys.toLowerCase()).not.toContain("email");
  });

  it("returns 404 for a random and a malformed id, 401 without token", async () => {
    const random = await getStatus(crypto.randomUUID());
    expect(random.status).toBe(404);
    const malformed = await getStatus("not-a-uuid");
    expect(malformed.status).toBe(404);
    const unauthorized = await getStatus(crypto.randomUUID(), null);
    expect(unauthorized.status).toBe(401);
  });
});

describe.skipIf(!LIVE)("user path regression: RLS rejects service-path fields (0003 policy proof)", () => {
  const email = `it-api-rls-${Date.now()}@craft-codex.local`;
  const password = `IT-${Math.random().toString(36).slice(2)}-x9!`;
  let userId = "";
  let userJwt = "";

  function userInsertPayload(): Record<string, unknown> {
    return {
      author_id: userId,
      content: {
        title: "rls-regression contribution",
        body_md: "Temporary row created by api-routes.integration.test.ts",
        topic: "test",
        sources: [{ citation: "integration test" }],
      },
      license_type: "CC-BY-SA-4.0",
      license_accepted: true,
      license_accepted_at: new Date().toISOString(),
      terms_version: "2026-07",
      author_email: email,
    };
  }

  async function userInsert(jsonBody: unknown): Promise<number> {
    const res = await fetch(`${URL_}/rest/v1/craft_contributions`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${userJwt}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(jsonBody),
    });
    if (res.status === 201) {
      const rows = (await res.json()) as Array<{ id: string }>;
      if (rows[0]) createdIds.push(rows[0].id);
    }
    return res.status;
  }

  beforeAll(async () => {
    if (!LIVE) return;
    const created = await fetch(`${URL_}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    const createdBody = (await created.json()) as { id?: string };
    userId = createdBody.id ?? "";
    const login = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    userJwt = ((await login.json()) as { access_token?: string }).access_token ?? "";
  });

  it("still allows the pristine web-path INSERT (source defaults to 'web')", async () => {
    expect(userId).toBeTruthy();
    expect(userJwt).toBeTruthy();
    expect(await userInsert(userInsertPayload())).toBe(201);
  });

  it("REJECTS an authenticated INSERT claiming source='cody-studio'", async () => {
    expect(await userInsert({ ...userInsertPayload(), source: "cody-studio" })).toBeGreaterThanOrEqual(400);
    expect(await userInsert({ ...userInsertPayload(), source: "api" })).toBeGreaterThanOrEqual(400);
  });

  it("REJECTS an authenticated INSERT with idempotency_key or source_session_id", async () => {
    expect(
      await userInsert({ ...userInsertPayload(), idempotency_key: crypto.randomUUID() }),
    ).toBeGreaterThanOrEqual(400);
    expect(
      await userInsert({ ...userInsertPayload(), source_session_id: "sneaky-session" }),
    ).toBeGreaterThanOrEqual(400);
  });

  afterAll(async () => {
    if (!LIVE || !userId) return;
    await serviceRest("DELETE", `craft_contributions?author_id=eq.${userId}`);
    await fetch(`${URL_}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
  });
});
