import { checkBearerAuth } from "../../../../lib/security/bearer-auth";
import {
  mapApiPayloadToContent,
  parseContributionApiPayload,
} from "../../../../lib/contributions/api-schema";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * POST /api/v1/contributions — versionierter Service-Intake (Cody Studio u.a.).
 *
 * Auth:   Authorization: Bearer <CRAFT_CONTRIB_API_TOKEN> (timing-safe,
 *         fail-closed: ohne Server-Env → 503, falsches Token → 401).
 * Idempotenz: Idempotency-Key-Header (optional, empfohlen). Gleicher Key →
 *         200 mit der BESTEHENDEN Contribution, nie ein Duplikat. Races auf
 *         den partial-unique Index (23505) werden nachgelesen.
 * Fehler: Nur generische Codes im Response-Body — Details ausschliesslich
 *         ins Server-Log (Memory-Lehre: api-error-leak).
 *
 * Der User-Pfad (/beitragen) bleibt unveraendert der RLS-Pfad; dieser
 * Service-Pfad laeuft als service_role und wird durch Token + Zod +
 * Status-'submitted'-Vorgabe begrenzt.
 */

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 100_000; // 100 KB — simpler Rate-/Abuse-Schutz
const MAX_IDEMPOTENCY_KEY_CHARS = 100;

function json(status: number, body: unknown): Response {
  return Response.json(body, { status });
}

interface ContributionRef {
  id: string;
  status: string;
}

function refBody(row: ContributionRef): {
  contributionId: string;
  status: string;
  statusUrl: string;
} {
  return {
    contributionId: row.id,
    status: row.status,
    statusUrl: `/api/v1/contributions/${row.id}`,
  };
}

export async function POST(req: Request): Promise<Response> {
  const auth = await checkBearerAuth(
    req.headers.get("authorization"),
    process.env.CRAFT_CONTRIB_API_TOKEN,
  );
  if (auth === "unconfigured") return json(503, { error: "service_unavailable" });
  if (auth !== "ok") return json(401, { error: "unauthorized" });

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return json(413, { error: "payload_too_large" });
  }

  const idempotencyHeader = req.headers.get("idempotency-key");
  let idempotencyKey: string | null = null;
  if (idempotencyHeader !== null) {
    idempotencyKey = idempotencyHeader.trim();
    if (
      idempotencyKey.length === 0 ||
      idempotencyKey.length > MAX_IDEMPOTENCY_KEY_CHARS
    ) {
      return json(400, { error: "invalid_idempotency_key" });
    }
  }

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(raw);
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const parsed = parseContributionApiPayload(rawJson);
  if (!parsed.ok) return json(400, { error: "validation_failed", issues: parsed.issues });

  const mapped = mapApiPayloadToContent(parsed.data);
  if (!mapped.ok) return json(400, { error: "validation_failed", issues: mapped.issues });

  let db: ReturnType<typeof getServiceClient>;
  try {
    db = getServiceClient();
  } catch (e) {
    console.error("[contrib-api] service client unavailable:", e);
    return json(503, { error: "service_unavailable" });
  }

  // Idempotenz-Vorpruefung: bestehende Zeile mit gleichem Key → 200, kein Duplikat.
  if (idempotencyKey) {
    const { data: existing, error } = await db
      .from("craft_contributions")
      .select("id,status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (error) {
      console.error("[contrib-api] idempotency lookup failed:", error.code, error.message);
      return json(500, { error: "internal_error" });
    }
    if (existing) return json(200, refBody(existing as ContributionRef));
  }

  const payload = parsed.data;
  const { data: inserted, error: insertError } = await db
    .from("craft_contributions")
    .insert({
      status: "submitted",
      trade: payload.trade,
      locale: payload.locale,
      visibility: payload.visibility,
      source: payload.source,
      source_session_id: payload.sourceSessionId ?? null,
      idempotency_key: idempotencyKey,
      author_email: payload.authorEmail ?? null,
      content: mapped.content,
      license_type: payload.license,
      license_accepted: true,
      license_accepted_at: payload.consents.licenseAcceptedAt,
      terms_version: payload.consents.termsVersion,
    })
    .select("id,status")
    .single();

  if (insertError) {
    // Race auf den partial-unique idempotency_key-Index: nachlesen, 200.
    if (insertError.code === "23505" && idempotencyKey) {
      const { data: existing, error: rereadError } = await db
        .from("craft_contributions")
        .select("id,status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (!rereadError && existing) return json(200, refBody(existing as ContributionRef));
      console.error(
        "[contrib-api] idempotency reread after 23505 failed:",
        rereadError?.code,
        rereadError?.message,
      );
      return json(500, { error: "internal_error" });
    }
    console.error("[contrib-api] insert failed:", insertError.code, insertError.message);
    return json(500, { error: "internal_error" });
  }

  return json(201, refBody(inserted as ContributionRef));
}
