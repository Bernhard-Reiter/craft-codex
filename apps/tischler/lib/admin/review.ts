import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ContributionContent } from "../contributions/schema";

/**
 * Admin-Review-Helfer — Service-Role-Pfad hinter Basic Auth.
 *
 * Bewusst OHNE Next-Kontext geschnitten (Config-Injection statt Env-Zugriff
 * im Funktionskern), damit der Approve-Flow als Integrationstest gegen die
 * Live-DB laeuft. Statuswechsel gehen AUSSCHLIESSLICH ueber craft_transition
 * (security definer, nur service_role) — nie ueber direkte UPDATEs.
 */

export interface ReviewConfig {
  url: string;
  serviceRoleKey: string;
}

/** Liest die Config aus Env — wirft fail-loud, wenn sie fehlt (lazy, nie top-level). */
export function reviewConfigFromEnv(): ReviewConfig {
  const url =
    process.env.NEXT_PUBLIC_CRAFT_SUPABASE_URL ?? process.env.CRAFT_SUPABASE_URL;
  const serviceRoleKey = process.env.CRAFT_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing admin review env (NEXT_PUBLIC_CRAFT_SUPABASE_URL / CRAFT_SUPABASE_SERVICE_ROLE_KEY)",
    );
  }
  return { url, serviceRoleKey };
}

function serviceClient(cfg: ReviewConfig): SupabaseClient {
  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface ReviewNote {
  at: string;
  actor: string;
  from: string;
  to: string;
  reason: string | null;
}

export interface ContributionRow {
  id: string;
  status: string;
  trade: string;
  locale: string;
  visibility: string;
  author_email: string | null;
  revision: number;
  content: ContributionContent;
  license_type: string;
  license_accepted: boolean;
  license_accepted_at: string | null;
  terms_version: string | null;
  approved_revision: number | null;
  approved_by: string | null;
  approved_at: string | null;
  review_notes: ReviewNote[];
  created_at: string;
  updated_at: string;
}

const ROW_COLUMNS =
  "id,status,trade,locale,visibility,author_email,revision,content,license_type," +
  "license_accepted,license_accepted_at,terms_version,approved_revision,approved_by," +
  "approved_at,review_notes,created_at,updated_at";

/** Offene Beitraege fuer die Review-Liste (submitted/in_review/changes_requested). */
export async function listOpenContributions(cfg: ReviewConfig): Promise<ContributionRow[]> {
  const { data, error } = await serviceClient(cfg)
    .from("craft_contributions")
    .select(ROW_COLUMNS)
    .in("status", ["submitted", "in_review", "changes_requested"])
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listOpenContributions failed: ${error.message}`);
  return (data ?? []) as unknown as ContributionRow[];
}

export async function getContribution(
  cfg: ReviewConfig,
  id: string,
): Promise<ContributionRow | null> {
  const { data, error } = await serviceClient(cfg)
    .from("craft_contributions")
    .select(ROW_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getContribution failed: ${error.message}`);
  return (data as unknown as ContributionRow) ?? null;
}

/** Statuswechsel ueber die SQL-Statusmaschine (optimistic lock via `from`). */
export async function transitionContribution(
  cfg: ReviewConfig,
  id: string,
  from: string,
  to: string,
  actor: string,
  reason: string,
): Promise<ContributionRow> {
  const { data, error } = await serviceClient(cfg).rpc("craft_transition", {
    p_id: id,
    p_from: from,
    p_to: to,
    p_actor: actor,
    p_reason: reason,
  });
  if (error) throw new Error(`craft_transition ${from} -> ${to} failed: ${error.message}`);
  return data as unknown as ContributionRow;
}

/**
 * Meister-Freigabe: setzt ERST approved_revision = aktuelle revision
 * (+ approved_by/approved_at) per Service-Role-PATCH, DANN den Statuswechsel
 * in_review -> approved via craft_transition. Die Statusmaschine erzwingt,
 * dass die Freigabe die AKTUELLE Revision trifft.
 */
export async function approveAsMeister(
  cfg: ReviewConfig,
  id: string,
  actor = "meister",
): Promise<ContributionRow> {
  const row = await getContribution(cfg, id);
  if (!row) throw new Error(`contribution ${id} not found`);
  if (row.status !== "in_review") {
    throw new Error(`approve requires status in_review, got ${row.status}`);
  }

  const { error: patchError } = await serviceClient(cfg)
    .from("craft_contributions")
    .update({
      approved_revision: row.revision,
      approved_by: actor,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    // Guard gegen Race: nur patchen, wenn die Revision unveraendert ist.
    .eq("revision", row.revision)
    .eq("status", "in_review");
  if (patchError) throw new Error(`approve patch failed: ${patchError.message}`);

  return transitionContribution(cfg, id, "in_review", "approved", actor, "master approval");
}
