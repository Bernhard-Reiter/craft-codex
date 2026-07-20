import { z } from "zod";
import {
  contributionContentSchema,
  isHttpUrl,
  type ContributionContent,
} from "./schema";

/**
 * Contribution API v1 — Zod-Vertrag fuer den Service-zu-Service-Payload
 * (POST /api/v1/contributions). Cody Studio & Co. sind hier Clients, KEINE
 * Supabase-Clients — der Vertrag ist bewusst strikt (`.strict()`: unbekannte
 * Keys werden abgelehnt, nicht still verworfen), damit Vertragsdrift zwischen
 * Studio und Codex frueh knallt.
 *
 * Der Payload wird auf das bestehende `content`-JSONB-Format gemappt
 * (contributionContentSchema) — die Review-/Export-Pipeline aus Slice 1
 * bleibt unveraendert.
 */

/** Ein inhaltlicher Abschnitt; `warning` wird im Markdown sichtbar markiert. */
export const apiSectionSchema = z
  .object({
    type: z.enum(["procedure", "note", "warning"]),
    markdown: z.string().trim().min(1, "section markdown must not be empty").max(20_000),
  })
  .strict();

/**
 * Eine zitierte Quelle. `id`/`type` sind Client-Metadaten (z.B. Studio-interne
 * Evidenz-Referenzen) und werden beim Mapping bewusst NICHT persistiert —
 * gespeichert wird das bestehende contributionSourceSchema-Format
 * (citation/url/page). `url` nur http(s) — nie javascript:/data: (stored XSS
 * im privilegierten Review-UI).
 */
export const apiSourceSchema = z
  .object({
    id: z.string().trim().min(1).max(100).optional(),
    type: z.enum(["book", "web", "oral", "official"]).optional(),
    citation: z.string().trim().min(3, "citation too short").max(500),
    url: z
      .string()
      .url()
      .refine(isHttpUrl, "only http(s) URLs are allowed")
      .optional(),
    page: z.number().int().positive().optional(),
  })
  .strict();

/** Einwilligungen — Pflicht, die Lizenz-Annahme ist ein HARTES Gate. */
export const apiConsentsSchema = z
  .object({
    termsVersion: z.string().trim().min(1).max(50),
    licenseAcceptedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const contributionApiPayloadSchema = z
  .object({
    source: z.union([z.literal("cody-studio"), z.literal("api")]),
    sourceSessionId: z.string().trim().min(1).max(200).optional(),
    trade: z.literal("tischler"),
    locale: z.enum(["de-AT", "de", "en"]),
    visibility: z.literal("open_commons"),
    license: z.literal("CC-BY-SA-4.0"),
    title: z.string().trim().min(3, "title too short").max(200),
    /** Optionales Thema; Default beim Mapping: 'allgemein'. */
    topic: z.string().trim().min(2).max(100).optional(),
    sections: z.array(apiSectionSchema).min(1, "at least one section").max(100),
    sources: z.array(apiSourceSchema).min(1, "at least one source").max(50),
    /** Reserviert fuer Attribution; wird derzeit NICHT persistiert (Datenminimierung). */
    authorName: z.string().trim().min(1).max(120).optional(),
    authorEmail: z.string().email().max(320).optional(),
    consents: apiConsentsSchema,
  })
  .strict();

export type ContributionApiPayload = z.infer<typeof contributionApiPayloadSchema>;

export type ParseApiPayloadResult =
  | { ok: true; data: ContributionApiPayload }
  | { ok: false; issues: string[] };

/** Zod-Validierung des rohen API-Payloads (untrusted). */
export function parseContributionApiPayload(input: unknown): ParseApiPayloadResult {
  const parsed = contributionApiPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map(
        (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

/** Sections → ein Markdown-Body; warning-Sections bekommen ein sichtbares Prefix. */
export function sectionsToBodyMd(
  sections: ContributionApiPayload["sections"],
): string {
  return sections
    .map((s) => (s.type === "warning" ? `⚠️ ${s.markdown}` : s.markdown))
    .join("\n\n");
}

export type MapContentResult =
  | { ok: true; content: ContributionContent }
  | { ok: false; issues: string[] };

/**
 * Mappt den API-Payload auf das `content`-JSONB der craft_contributions-Zeile.
 * Das Ergebnis MUSS contributionContentSchema erfuellen — wird hier validiert,
 * nicht angenommen (z.B. koennen kurze Sections einen zu kurzen body_md ergeben).
 */
export function mapApiPayloadToContent(payload: ContributionApiPayload): MapContentResult {
  const content = {
    title: payload.title,
    body_md: sectionsToBodyMd(payload.sections),
    topic: payload.topic ?? "allgemein",
    sources: payload.sources.map((s) => ({
      citation: s.citation,
      ...(s.url ? { url: s.url } : {}),
      ...(s.page ? { page: s.page } : {}),
    })),
  };
  const parsed = contributionContentSchema.safeParse(content);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map(
        (i) => `content.${i.path.join(".") || "(root)"}: ${i.message}`,
      ),
    };
  }
  return { ok: true, content: parsed.data };
}
