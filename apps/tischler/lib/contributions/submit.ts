import {
  contributionSubmitSchema,
  type ContributionSubmit,
} from "./schema";

/**
 * Submit-Helfer fuer /beitragen — pure Funktionen, ohne Next-Kontext,
 * damit die Server-Action-Validierung als Unit testbar bleibt.
 */

/** Version der Einwilligungs-/Lizenzbedingungen, die der Submit erfasst. */
export const TERMS_VERSION = "2026-07";

/** Themen-Auswahl im Formular (Werte = content.topic; Labels via i18n). */
export const CONTRIBUTION_TOPICS = [
  "allgemein",
  "holzverbindungen",
  "zinken",
  "oberflaeche",
  "werkzeuge",
  "holzkunde",
  "sicherheit",
] as const;

export type ContributionTopic = (typeof CONTRIBUTION_TOPICS)[number];

export type ParseSubmitResult =
  | { ok: true; data: ContributionSubmit }
  | { ok: false; issues: string[] };

/**
 * Zod-Validierung des rohen Submit-Payloads (aus dem Client — untrusted).
 * Die Server-Action akzeptiert NUR, was hier durchkommt; das Lizenz-Gate
 * (license_accepted === true, CC-BY-SA-4.0) ist Teil des Schemas und wird
 * zusaetzlich von der RLS-INSERT-Policy in Postgres erzwungen.
 */
export function parseContributionSubmit(input: unknown): ParseSubmitResult {
  const parsed = contributionSubmitSchema.safeParse(input);
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

export interface SubmitFormInput {
  title: string;
  body_md: string;
  topic: string;
  sources: Array<{ citation: string; url: string; page: string }>;
  licenseAccepted: boolean;
}

/**
 * Baut aus rohen Formularwerten den Submit-Payload: trimmt, laesst leere
 * optionale Felder weg (z.B. url: "" wuerde an z.string().url() scheitern)
 * und parst `page` zu einer positiven Ganzzahl.
 */
export function buildSubmitPayload(form: SubmitFormInput): unknown {
  return {
    content: {
      title: form.title.trim(),
      body_md: form.body_md.trim(),
      topic: form.topic.trim(),
      sources: form.sources
        .filter((s) => s.citation.trim().length > 0 || s.url.trim().length > 0)
        .map((s) => {
          const url = s.url.trim();
          const page = Number.parseInt(s.page.trim(), 10);
          return {
            citation: s.citation.trim(),
            ...(url ? { url } : {}),
            ...(Number.isInteger(page) && page > 0 ? { page } : {}),
          };
        }),
    },
    trade: "tischler",
    locale: "de-AT",
    visibility: "open_commons",
    license_type: "CC-BY-SA-4.0",
    // Bewusst KEIN Zwangs-true: false muss an Schema + RLS scheitern.
    license_accepted: form.licenseAccepted,
    terms_version: TERMS_VERSION,
  };
}
