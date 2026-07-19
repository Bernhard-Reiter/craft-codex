import type { RAGDocument } from "@craft-codex/core";
import type { CorpusLocale } from "./index";
import communityDe from "./community/community-corpus.de.json";

/**
 * Community-Korpus — Schicht 4 des Demo-Korpus (Slice 1, Schritt 6).
 *
 * Inhalt kommt AUSSCHLIESSLICH aus dem deterministischen Export-Skript
 * (`scripts/export-contributions.mjs`): nur approved + open_commons +
 * license_accepted + revisionsgebundene Freigabe. Statischer JSON-Import →
 * Next bündelt die Daten, die App bleibt offline-fähig (keine
 * Supabase-Laufzeit-Dependency im RAG-Pfad).
 *
 * S1: nur DE. Provenienz je Doc: metadata.contribution_id + license
 * (CC-BY-SA-4.0), Hashes in `community/manifest.json`.
 */
export function getCommunityCorpus(locale: CorpusLocale): RAGDocument[] {
  if (locale !== "de") return []; // S1: nur DE
  return communityDe as unknown as RAGDocument[];
}
