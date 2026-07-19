import { describe, it, expect, afterAll } from "vitest";

/**
 * Live-DB integration tests for the craft_contributions state machine + RLS.
 *
 * Runs ONLY when env is provided (no secrets in CI — skipped there):
 *   CRAFT_SUPABASE_URL              e.g. https://<ref>.supabase.co
 *   CRAFT_SUPABASE_SERVICE_ROLE_KEY service role (server-side only)
 *   CRAFT_SUPABASE_ANON_KEY         anon key (RLS-restricted, the REAL path)
 *
 * RLS is tested on the REAL path: anon-key requests must see 0 rows and must
 * not be able to insert or call craft_transition. Never tested as superuser.
 */

const URL_ = process.env.CRAFT_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.CRAFT_SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY = process.env.CRAFT_SUPABASE_ANON_KEY ?? "";
const LIVE = Boolean(URL_ && SERVICE_KEY && ANON_KEY);

const createdIds: string[] = [];

interface RestResult {
  status: number;
  body: unknown;
}

async function rest(
  key: string,
  method: string,
  path: string,
  jsonBody?: unknown,
): Promise<RestResult> {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: jsonBody === undefined ? undefined : JSON.stringify(jsonBody),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep raw text */
  }
  return { status: res.status, body };
}

function errorMessage(body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    return String((body as { message: unknown }).message);
  }
  return JSON.stringify(body);
}

async function insertContribution(): Promise<{ id: string; status: string }> {
  const { status, body } = await rest(
    SERVICE_KEY,
    "POST",
    "craft_contributions",
    {
      content: {
        title: "integration-test contribution",
        body_md: "Temporary test row created by state-machine.integration.test.ts",
        topic: "test",
        sources: [{ citation: "integration test" }],
      },
      license_type: "CC-BY-SA-4.0",
      license_accepted: true,
      license_accepted_at: new Date().toISOString(),
      terms_version: "2026-07",
      author_email: "integration-test@craft-codex.local",
    },
  );
  expect(status, `insert failed: ${errorMessage(body)}`).toBe(201);
  const row = (body as Array<{ id: string; status: string }>)[0]!;
  createdIds.push(row.id);
  return row;
}

async function transition(
  key: string,
  id: string,
  from: string,
  to: string,
): Promise<RestResult> {
  return rest(key, "POST", "rpc/craft_transition", {
    p_id: id,
    p_from: from,
    p_to: to,
    p_actor: "integration-test",
    p_reason: `test ${from} -> ${to}`,
  });
}

// File-level cleanup: runs after ALL suites (the RLS suite also inserts rows).
afterAll(async () => {
  if (!LIVE) return;
  for (const id of createdIds) {
    await rest(SERVICE_KEY, "DELETE", `craft_contributions?id=eq.${id}`);
  }
});

describe.skipIf(!LIVE)("craft_transition state machine (live DB)", () => {
  it("walks the legal chain submitted -> in_review -> approved -> published", async () => {
    const row = await insertContribution();
    expect(row.status).toBe("submitted");

    const r1 = await transition(SERVICE_KEY, row.id, "submitted", "in_review");
    expect(r1.status, errorMessage(r1.body)).toBe(200);
    expect((r1.body as { status: string }).status).toBe("in_review");

    // Master approval targets the CURRENT revision (service role sets it):
    const patch = await rest(
      SERVICE_KEY,
      "PATCH",
      `craft_contributions?id=eq.${row.id}`,
      { approved_revision: 1, approved_by: "integration-test", approved_at: new Date().toISOString() },
    );
    expect(patch.status, errorMessage(patch.body)).toBe(200);

    const r2 = await transition(SERVICE_KEY, row.id, "in_review", "approved");
    expect(r2.status, errorMessage(r2.body)).toBe(200);
    expect((r2.body as { status: string }).status).toBe("approved");

    const r3 = await transition(SERVICE_KEY, row.id, "approved", "published");
    expect(r3.status, errorMessage(r3.body)).toBe(200);
    expect((r3.body as { status: string }).status).toBe("published");

    // Audit trail: every transition is recorded in review_notes.
    const notes = (r3.body as { review_notes: unknown[] }).review_notes;
    expect(notes.length).toBe(3);
  });

  it("rejects the illegal edge submitted -> published", async () => {
    const row = await insertContribution();
    const r = await transition(SERVICE_KEY, row.id, "submitted", "published");
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(errorMessage(r.body)).toContain("illegal transition");
  });

  it("rejects approval when approved_revision does not match current revision", async () => {
    const row = await insertContribution();
    const r1 = await transition(SERVICE_KEY, row.id, "submitted", "in_review");
    expect(r1.status, errorMessage(r1.body)).toBe(200);

    // approved_revision is NULL (never set) -> NULL-safe gate must fire:
    const r2 = await transition(SERVICE_KEY, row.id, "in_review", "approved");
    expect(r2.status).toBeGreaterThanOrEqual(400);
    expect(errorMessage(r2.body)).toContain("approval must target current revision");

    // Stale approved_revision (approval of an OLD revision) must also fire:
    const patch = await rest(
      SERVICE_KEY,
      "PATCH",
      `craft_contributions?id=eq.${row.id}`,
      { approved_revision: 1, revision: 2 },
    );
    expect(patch.status, errorMessage(patch.body)).toBe(200);
    const r3 = await transition(SERVICE_KEY, row.id, "in_review", "approved");
    expect(r3.status).toBeGreaterThanOrEqual(400);
    expect(errorMessage(r3.body)).toContain("approval must target current revision");
  });

  it("rejects a stale p_from (optimistic lock)", async () => {
    const row = await insertContribution();
    const r = await transition(SERVICE_KEY, row.id, "in_review", "approved");
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(errorMessage(r.body)).toContain("stale status");
  });
});

describe.skipIf(!LIVE)("INSERT hardening as the real authenticated path (0002)", () => {
  const email = `it-harden-${Date.now()}@craft-codex.local`;
  const password = `IT-${Math.random().toString(36).slice(2)}-x9!`;
  let userId = "";
  let userJwt = "";

  async function userRest(
    method: string,
    path: string,
    jsonBody?: unknown,
  ): Promise<RestResult> {
    const res = await fetch(`${URL_}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${userJwt}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: jsonBody === undefined ? undefined : JSON.stringify(jsonBody),
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      /* keep raw text */
    }
    return { status: res.status, body };
  }

  function basePayload(): Record<string, unknown> {
    return {
      author_id: userId,
      content: {
        title: "hardening-test contribution",
        body_md: "Temporary row created by the 0002 hardening suite",
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

  it("bootstraps a real confirmed user and signs in", async () => {
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
    expect(created.status, JSON.stringify(createdBody)).toBeLessThan(300);
    userId = createdBody.id ?? "";
    expect(userId).toBeTruthy();

    const login = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginBody = (await login.json()) as { access_token?: string };
    expect(login.status, JSON.stringify(loginBody)).toBe(200);
    userJwt = loginBody.access_token ?? "";
    expect(userJwt).toBeTruthy();
  });

  it("allows a pristine authenticated INSERT (positive real path)", async () => {
    const r = await userRest("POST", "craft_contributions", basePayload());
    expect(r.status, errorMessage(r.body)).toBe(201);
    const row = (r.body as Array<{ id: string; status: string }>)[0]!;
    createdIds.push(row.id);
    expect(row.status).toBe("submitted");
  });

  it("rejects INSERT with pre-seeded approved_revision (blocker fix proof)", async () => {
    const r = await userRest("POST", "craft_contributions", {
      ...basePayload(),
      approved_revision: 1,
    });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects INSERT with pre-seeded publish fields or non-initial revision", async () => {
    const published = await userRest("POST", "craft_contributions", {
      ...basePayload(),
      published_slug: "sneaky-slug",
    });
    expect(published.status).toBeGreaterThanOrEqual(400);

    const rev2 = await userRest("POST", "craft_contributions", {
      ...basePayload(),
      revision: 2,
    });
    expect(rev2.status).toBeGreaterThanOrEqual(400);
  });

  afterAll(async () => {
    if (!LIVE || !userId) return;
    await rest(SERVICE_KEY, "DELETE", `craft_contributions?author_id=eq.${userId}`);
    await fetch(`${URL_}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
  });
});

describe.skipIf(!LIVE)("RLS as the real path (anon key)", () => {
  it("anon SELECT returns 0 rows although rows exist", async () => {
    // Ensure at least one row exists (service role):
    await insertContribution();

    const anon = await rest(ANON_KEY, "GET", "craft_contributions?select=id");
    expect(anon.status, errorMessage(anon.body)).toBe(200);
    expect(anon.body).toEqual([]);

    // Sharpness proof: the same query WITH service role sees the row(s).
    const svc = await rest(SERVICE_KEY, "GET", "craft_contributions?select=id");
    expect(svc.status).toBe(200);
    expect((svc.body as unknown[]).length).toBeGreaterThan(0);
  });

  it("anon INSERT is rejected", async () => {
    const r = await rest(ANON_KEY, "POST", "craft_contributions", {
      content: { title: "anon should not insert", body_md: "x", topic: "t", sources: [] },
      license_type: "CC-BY-SA-4.0",
      license_accepted: true,
    });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });

  it("anon cannot call craft_transition (execute revoked)", async () => {
    const id = createdIds[0] ?? "00000000-0000-0000-0000-000000000000";
    const r = await transition(ANON_KEY, id, "submitted", "in_review");
    expect(r.status).toBeGreaterThanOrEqual(400);
  });
});
