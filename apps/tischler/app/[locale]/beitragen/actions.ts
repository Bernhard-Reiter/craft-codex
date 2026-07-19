"use server";

import { parseContributionSubmit, TERMS_VERSION } from "../../../lib/contributions/submit";
import { getUserScopedClient } from "../../../lib/supabase/server";

/**
 * Server-Action: Beitrag einreichen.
 *
 * Der INSERT laeuft ALS DER USER (anon key + User-JWT) — die RLS-INSERT-Policy
 * ist der Waechter (author_id = auth.uid(), status='submitted', Lizenz-Gate,
 * jungfraeuliche Zeile). Bewusst KEIN Service-Role-Client auf diesem Pfad.
 */

export interface SubmitContributionResult {
  ok: boolean;
  id?: string;
  status?: string;
  /** Fehlerklasse fuer i18n: "auth" | "validation" | "server" */
  error?: "auth" | "validation" | "server";
  issues?: string[];
}

export async function submitContribution(
  accessToken: string,
  input: unknown,
): Promise<SubmitContributionResult> {
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    return { ok: false, error: "auth" };
  }

  const parsed = parseContributionSubmit(input);
  if (!parsed.ok) {
    return { ok: false, error: "validation", issues: parsed.issues };
  }

  let supabase;
  try {
    supabase = getUserScopedClient(accessToken);
  } catch {
    // Supabase nicht konfiguriert — kein Leak von Details an den Client.
    return { ok: false, error: "server" };
  }

  // Token serverseitig verifizieren; author_id kommt aus dem VERIFIZIERTEN
  // User, nie aus dem Client-Payload.
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return { ok: false, error: "auth" };
  }
  const user = userData.user;

  const { data, error } = await supabase
    .from("craft_contributions")
    .insert({
      author_id: user.id,
      author_email: user.email ?? null,
      content: parsed.data.content,
      trade: parsed.data.trade,
      locale: parsed.data.locale,
      visibility: parsed.data.visibility,
      license_type: parsed.data.license_type,
      license_accepted: parsed.data.license_accepted,
      license_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
    })
    .select("id,status")
    .single();

  if (error || !data) {
    return { ok: false, error: "server" };
  }
  return { ok: true, id: data.id as string, status: data.status as string };
}
