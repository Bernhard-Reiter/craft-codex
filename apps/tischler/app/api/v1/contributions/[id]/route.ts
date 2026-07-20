import { checkBearerAuth } from "../../../../../lib/security/bearer-auth";
import { getServiceClient } from "../../../../../lib/supabase/server";

/**
 * GET /api/v1/contributions/:id — Status-Polling fuer Service-Clients.
 *
 * Gleiche Bearer-Auth wie der POST (fail-closed 503 / 401). Liefert NUR
 * Workflow-Metadaten — KEIN content, KEINE Autor-Daten (Datenminimierung:
 * der Service-Client braucht den Status, nicht den Inhalt).
 * Fehlerdetails nur ins Server-Log, nie in den Response-Body.
 */

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, body: unknown): Response {
  return Response.json(body, { status });
}

interface StatusRow {
  id: string;
  status: string;
  revision: number;
  approved_revision: number | null;
  published_slug: string | null;
  git_commit: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await checkBearerAuth(
    req.headers.get("authorization"),
    process.env.CRAFT_CONTRIB_API_TOKEN,
  );
  if (auth === "unconfigured") return json(503, { error: "service_unavailable" });
  if (auth !== "ok") return json(401, { error: "unauthorized" });

  const { id } = await ctx.params;
  // Kein Roundtrip (und keine DB-Fehlermeldung) fuer offensichtlich invalide IDs.
  if (!UUID_RE.test(id)) return json(404, { error: "not_found" });

  let db: ReturnType<typeof getServiceClient>;
  try {
    db = getServiceClient();
  } catch (e) {
    console.error("[contrib-api] service client unavailable:", e);
    return json(503, { error: "service_unavailable" });
  }

  const { data, error } = await db
    .from("craft_contributions")
    .select(
      "id,status,revision,approved_revision,published_slug,git_commit,created_at,updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[contrib-api] status lookup failed:", error.code, error.message);
    return json(500, { error: "internal_error" });
  }
  if (!data) return json(404, { error: "not_found" });

  const row = data as StatusRow;
  return json(200, {
    contributionId: row.id,
    status: row.status,
    revision: row.revision,
    approvedRevision: row.approved_revision,
    publishedSlug: row.published_slug,
    gitCommit: row.git_commit,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
