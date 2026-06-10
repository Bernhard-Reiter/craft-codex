/**
 * GET /api/voice/health — capability probe for the client voice factory.
 * Reports which server-side providers are configured (never leaks key values).
 */

import { capabilities } from "../_lib/server-voice";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json({ ok: true, ...capabilities() });
}
