/**
 * export-core — pure mapping/serialization core of the community export.
 *
 * Craft Codex Slice 1, Step 5+6. Imported by BOTH:
 *   - scripts/export-contributions.mjs   (the CLI that talks to Supabase/git)
 *   - apps/tischler/lib/rag/corpus/community.test.ts  (determinism/leak tests)
 *
 * Everything in here is pure (no I/O, no env, no clock) so the tests can prove
 * determinism byte-for-byte and the leak tests can prove the export guard is
 * load-bearing (remove it via parameter injection -> the row appears).
 *
 * Design decisions (documented per plan "entscheide pragmatisch, dokumentiere"):
 *  - Legacy-ID collision protection lives in the vitest golden-master test
 *    (community.test.ts), NOT in this script: the legacy corpus is TypeScript
 *    and CI runs the tischler test suite on every PR — including every
 *    community export PR — so a colliding id turns the export PR red before
 *    merge. The script itself enforces slug format + in-batch uniqueness.
 *  - `validateContent` mirrors `contributionContentSchema`
 *    (apps/tischler/lib/contributions/schema.ts) in plain JS because this
 *    module must run without a TS build step. Parity between the two
 *    validators is enforced by a fixture-parity test in community.test.ts.
 *  - No `author_email` / attribution in the export (privacy): attribution
 *    only ships once an explicit opt-in field exists (Slice 2).
 */

import { createHash } from "node:crypto";

/** The hard export guard — mirrors the hardcoded REST filter of the CLI. */
export const EXPORT_GUARD = Object.freeze({
  status: "approved",
  visibility: "open_commons",
  licenseAccepted: true,
  licenseType: "CC-BY-SA-4.0",
});

export const COMMUNITY_LICENSE = "CC-BY-SA-4.0";
export const MANIFEST_SCHEMA_VERSION = 1;

/** Published slugs must be url/file-safe lowercase kebab-case. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function sha256Hex(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * JSON.stringify with recursively sorted object keys — canonical form for
 * hashing content (key order in JSONB is not guaranteed to be stable).
 */
export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** German-aware slug (ae/oe/ue/ss folding, then NFKD strip, kebab-case). */
export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/** First 8 hex chars of the canonical content hash (slug stability anchor). */
export function contentHash8(content) {
  return sha256Hex(stableStringify(content)).slice(0, 8);
}

/**
 * Deterministic published_slug: slug(topic)-slug(title)-<hash8(content)>.
 * Only used for rows whose published_slug is still NULL — once persisted to
 * the DB the stored slug wins forever (never re-derived).
 */
export function derivePublishedSlug(row) {
  const content = row?.content ?? {};
  const slug = `${slugify(content.topic ?? "")}-${slugify(content.title ?? "")}-${contentHash8(content)}`;
  if (!SLUG_RE.test(slug)) {
    throw new Error(
      `contribution ${row?.id}: derived slug ${JSON.stringify(slug)} is not a valid slug`,
    );
  }
  return slug;
}

/**
 * Plain-JS mirror of contributionContentSchema (see header for why).
 * Returns a list of problems; empty list = valid.
 */
export function validateContent(content) {
  const problems = [];
  if (content === null || typeof content !== "object" || Array.isArray(content)) {
    return ["content is not an object"];
  }
  const title = typeof content.title === "string" ? content.title.trim() : null;
  if (title === null) problems.push("title missing");
  else if (title.length < 3) problems.push("title too short");
  else if (title.length > 200) problems.push("title too long");

  const body = typeof content.body_md === "string" ? content.body_md.trim() : null;
  if (body === null) problems.push("body_md missing");
  else if (body.length < 20) problems.push("body too short");

  const topic = typeof content.topic === "string" ? content.topic.trim() : null;
  if (topic === null) problems.push("topic missing");
  else if (topic.length < 2) problems.push("topic too short");

  if (!Array.isArray(content.sources) || content.sources.length < 1) {
    problems.push("at least one source");
  } else {
    content.sources.forEach((s, i) => {
      const citation = typeof s?.citation === "string" ? s.citation.trim() : null;
      if (citation === null || citation.length < 3) {
        problems.push(`sources[${i}].citation too short`);
      }
      if (s?.url !== undefined) {
        let ok = false;
        try {
          const protocol = new URL(s.url).protocol;
          ok = protocol === "http:" || protocol === "https:";
        } catch {
          ok = false;
        }
        if (!ok) problems.push(`sources[${i}].url must be http(s)`);
      }
      if (
        s?.page !== undefined &&
        (!Number.isInteger(s.page) || s.page <= 0)
      ) {
        problems.push(`sources[${i}].page must be a positive integer`);
      }
    });
  }
  return problems;
}

/**
 * The hard leak guard. Throws (with the row id) on ANY violation — no silent
 * skip. Pass `guard: null` to bypass (test-only parameter injection used by
 * the leak tests to prove the guard is load-bearing).
 */
export function assertRowExportable(row, guard = EXPORT_GUARD) {
  if (guard === null) return;
  const problems = [];
  if (row.status !== guard.status) {
    problems.push(`status is ${JSON.stringify(row.status)}, expected ${guard.status}`);
  }
  if (row.visibility !== guard.visibility) {
    problems.push(
      `visibility is ${JSON.stringify(row.visibility)}, expected ${guard.visibility}`,
    );
  }
  if (row.license_accepted !== guard.licenseAccepted) {
    problems.push("license_accepted is not true");
  }
  if (row.license_type !== guard.licenseType) {
    problems.push(
      `license_type is ${JSON.stringify(row.license_type)}, expected ${guard.licenseType}`,
    );
  }
  // Revision-bound approval: the Meister freigabe must target the CURRENT
  // revision. NULL/undefined never passes (=== is our IS DISTINCT FROM here).
  if (row.approved_revision !== row.revision) {
    problems.push(
      `approved_revision (${row.approved_revision}) !== revision (${row.revision})`,
    );
  }
  if (problems.length > 0) {
    throw new Error(`contribution ${row.id} not exportable: ${problems.join("; ")}`);
  }
}

/**
 * Map one exportable row onto a RAGDocument with a FIXED key order
 * (id, text, metadata{source,title,topic,license,contribution_id,terms_version})
 * so serialization is byte-stable. Deliberately NO author_email/attribution.
 */
export function toRagDocument(row) {
  const contentProblems = validateContent(row.content);
  if (contentProblems.length > 0) {
    throw new Error(
      `contribution ${row.id} content invalid: ${contentProblems.join("; ")}`,
    );
  }
  const slug = row.published_slug ?? derivePublishedSlug(row);
  if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
    throw new Error(
      `contribution ${row.id}: published_slug ${JSON.stringify(slug)} is not a valid slug`,
    );
  }
  const { title, body_md, topic } = row.content;
  return {
    id: slug,
    text: `${title.trim()}\n\n${body_md.trim()}`,
    metadata: {
      source: "community",
      title: title.trim(),
      topic: topic.trim(),
      license: COMMUNITY_LICENSE,
      contribution_id: row.id,
      terms_version: row.terms_version ?? null,
    },
  };
}

/**
 * rows -> validated, sorted RAGDocument[] (the corpus). Guard violations and
 * id collisions throw hard. Order of the input does not matter (sorted by id).
 */
export function buildCorpus(rows, { guard = EXPORT_GUARD } = {}) {
  const docs = rows.map((row) => {
    assertRowExportable(row, guard);
    return toRagDocument(row);
  });
  const seen = new Map();
  for (const doc of docs) {
    if (seen.has(doc.id)) {
      throw new Error(
        `duplicate published_slug ${JSON.stringify(doc.id)} ` +
          `(contributions ${seen.get(doc.id)} and ${doc.metadata.contribution_id})`,
      );
    }
    seen.set(doc.id, doc.metadata.contribution_id);
  }
  return [...docs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Canonical doc shape (fixed key order) — tolerant of re-parsed JSON input. */
function canonicalDoc(doc) {
  const m = doc.metadata ?? {};
  return {
    id: doc.id,
    text: doc.text,
    metadata: {
      source: m.source,
      title: m.title,
      topic: m.topic,
      license: m.license,
      contribution_id: m.contribution_id,
      terms_version: m.terms_version ?? null,
    },
  };
}

/** Corpus -> canonical file bytes (2-space indent, trailing newline). */
export function serializeCorpus(docs) {
  return `${JSON.stringify(docs.map(canonicalDoc), null, 2)}\n`;
}

/**
 * Provenance manifest. Deliberately WITHOUT a timestamp: re-running the
 * export on unchanged data must be byte-identical (reproducibility).
 */
export function buildManifest(docs, serializedCorpus) {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    locale: "de",
    license: COMMUNITY_LICENSE,
    exportedCount: docs.length,
    corpusSha256: sha256Hex(serializedCorpus),
    docs: docs.map((doc) => ({
      id: doc.id,
      contribution_id: doc.metadata.contribution_id,
      sha256: sha256Hex(stableStringify(canonicalDoc(doc))),
    })),
    contribution_ids: docs.map((doc) => doc.metadata.contribution_id),
  };
}

/** Manifest -> canonical file bytes. */
export function serializeManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
