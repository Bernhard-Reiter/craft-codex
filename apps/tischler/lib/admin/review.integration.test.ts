import { afterAll, describe, expect, it } from "vitest";
import {
  approveAsMeister,
  getContribution,
  listOpenContributions,
  transitionContribution,
  type ReviewConfig,
} from "./review";

/**
 * Live-DB integration test for the admin review helpers (same env contract as
 * state-machine.integration.test.ts — skipped without env, no secrets in CI):
 *   CRAFT_SUPABASE_URL, CRAFT_SUPABASE_SERVICE_ROLE_KEY
 *
 * The helpers are cut WITHOUT Next context (config injection), so the exact
 * code the admin server actions run is exercised here against the real DB.
 */

const URL_ = process.env.CRAFT_SUPABASE_URL ?? process.env.NEXT_PUBLIC_CRAFT_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.CRAFT_SUPABASE_SERVICE_ROLE_KEY ?? "";
const LIVE = Boolean(URL_ && SERVICE_KEY);

const cfg: ReviewConfig = { url: URL_, serviceRoleKey: SERVICE_KEY };
const createdIds: string[] = [];

async function insertTestContribution(): Promise<string> {
  const res = await fetch(`${URL_}/rest/v1/craft_contributions`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      content: {
        title: "admin-review integration test",
        body_md: "Temporary row created by review.integration.test.ts",
        topic: "test",
        sources: [{ citation: "integration test" }],
      },
      license_type: "CC-BY-SA-4.0",
      license_accepted: true,
      license_accepted_at: new Date().toISOString(),
      terms_version: "2026-07",
      author_email: "review-test@craft-codex.local",
    }),
  });
  const body = (await res.json()) as Array<{ id: string }>;
  expect(res.status, JSON.stringify(body)).toBe(201);
  const id = body[0]!.id;
  createdIds.push(id);
  return id;
}

afterAll(async () => {
  if (!LIVE) return;
  for (const id of createdIds) {
    await fetch(`${URL_}/rest/v1/craft_contributions?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
  }
});

describe.skipIf(!LIVE)("admin review helpers (live DB)", () => {
  it("runs the full meister flow: take in review -> approve (revision-bound)", async () => {
    const id = await insertTestContribution();

    // appears in the open list
    const open = await listOpenContributions(cfg);
    expect(open.some((r) => r.id === id)).toBe(true);

    // submitted -> in_review
    const inReview = await transitionContribution(
      cfg, id, "submitted", "in_review", "meister", "taken into review",
    );
    expect(inReview.status).toBe("in_review");

    // approve: sets approved_revision = revision, then transitions
    const approved = await approveAsMeister(cfg, id);
    expect(approved.status).toBe("approved");
    expect(approved.approved_revision).toBe(approved.revision);
    expect(approved.approved_by).toBe("meister");
    expect(approved.approved_at).toBeTruthy();

    // audit trail recorded both transitions
    expect(approved.review_notes.length).toBe(2);

    // approved rows leave the open list
    const openAfter = await listOpenContributions(cfg);
    expect(openAfter.some((r) => r.id === id)).toBe(false);
  });

  it("refuses to approve a contribution that is not in_review", async () => {
    const id = await insertTestContribution();
    await expect(approveAsMeister(cfg, id)).rejects.toThrow(/in_review/);
    // status untouched:
    const row = await getContribution(cfg, id);
    expect(row?.status).toBe("submitted");
  });

  it("request-changes and reject paths work via the state machine", async () => {
    const id = await insertTestContribution();
    await transitionContribution(cfg, id, "submitted", "in_review", "meister", "review");
    const changes = await transitionContribution(
      cfg, id, "in_review", "changes_requested", "meister", "Quelle fehlt",
    );
    expect(changes.status).toBe("changes_requested");

    const back = await transitionContribution(
      cfg, id, "changes_requested", "in_review", "meister", "back",
    );
    expect(back.status).toBe("in_review");

    const rejected = await transitionContribution(
      cfg, id, "in_review", "rejected", "meister", "fachlich falsch",
    );
    expect(rejected.status).toBe("rejected");
    expect(rejected.review_notes.at(-1)?.reason).toBe("fachlich falsch");
  });
});
