import { z } from "zod";

/**
 * Contribution schemas — Craft Codex Slice 1, Step 2.
 *
 * Validates the `content` JSONB of `craft_contributions` plus the full submit
 * payload. Deliberately local to the app (no `packages/contribution-schema`
 * before Slice 2, when Cody Studio becomes a second client).
 *
 * Reserved for later (S2/S3, NOT built yet):
 *   - `translation_group_id` — links DE↔EN contributions once cross-language
 *     curation exists. Do not add the field before that slice.
 */

/**
 * Only http(s) URLs are acceptable as sources. Zod's `.url()` alone accepts
 * `javascript:`/`data:` URIs (URL-constructor semantics) — rendered as a link
 * in the privileged Meister review UI that would be stored XSS.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** One cited source for a contribution (citation required, url/page optional). */
export const contributionSourceSchema = z.object({
  citation: z.string().trim().min(3, "citation too short"),
  url: z
    .string()
    .url()
    .refine(isHttpUrl, "only http(s) URLs are allowed")
    .optional(),
  page: z.number().int().positive().optional(),
});

/** Shape of the `content` JSONB column. */
export const contributionContentSchema = z.object({
  title: z.string().trim().min(3, "title too short").max(200),
  body_md: z.string().trim().min(20, "body too short"),
  topic: z.string().trim().min(2, "topic too short"),
  sources: z.array(contributionSourceSchema).min(1, "at least one source"),
});

/**
 * Full submit payload for a new contribution.
 * License is a HARD gate: exactly CC-BY-SA-4.0 and explicitly accepted —
 * mirrors the `license_hard` CHECK constraint in the database.
 */
export const contributionSubmitSchema = z.object({
  content: contributionContentSchema,
  trade: z.literal("tischler"),
  locale: z.literal("de-AT"),
  visibility: z.literal("open_commons"),
  license_type: z.literal("CC-BY-SA-4.0"),
  license_accepted: z.literal(true),
  terms_version: z.string().trim().min(1),
});

export type ContributionSource = z.infer<typeof contributionSourceSchema>;
export type ContributionContent = z.infer<typeof contributionContentSchema>;
export type ContributionSubmit = z.infer<typeof contributionSubmitSchema>;
