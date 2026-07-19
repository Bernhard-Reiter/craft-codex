/**
 * Type declarations for export-core.mjs — consumed by the vitest suite
 * (apps/tischler/lib/rag/corpus/community.test.ts). Keep in sync with the
 * runtime module; the shape is intentionally small and stable.
 */

export interface ExportGuard {
  status: string;
  visibility: string;
  licenseAccepted: boolean;
  licenseType: string;
}

export interface ContributionRowLike {
  id: string;
  status: string;
  visibility: string;
  license_accepted: boolean;
  license_type: string;
  revision: number;
  approved_revision: number | null;
  terms_version?: string | null;
  published_slug?: string | null;
  content: unknown;
}

export interface CommunityDoc {
  id: string;
  text: string;
  metadata: {
    source: "community";
    title: string;
    topic: string;
    license: string;
    contribution_id: string;
    terms_version: string | null;
  };
}

export interface CommunityManifest {
  schemaVersion: number;
  locale: string;
  license: string;
  exportedCount: number;
  corpusSha256: string;
  docs: Array<{ id: string; contribution_id: string; sha256: string }>;
  contribution_ids: string[];
}

export declare const EXPORT_GUARD: Readonly<ExportGuard>;
export declare const COMMUNITY_LICENSE: "CC-BY-SA-4.0";
export declare const MANIFEST_SCHEMA_VERSION: number;
export declare const SLUG_RE: RegExp;

export declare function sha256Hex(text: string): string;
export declare function stableStringify(value: unknown): string;
export declare function slugify(value: string): string;
export declare function contentHash8(content: unknown): string;
export declare function derivePublishedSlug(row: ContributionRowLike): string;
export declare function validateContent(content: unknown): string[];
export declare function assertRowExportable(
  row: ContributionRowLike,
  guard?: Readonly<ExportGuard> | null,
): void;
export declare function toRagDocument(row: ContributionRowLike): CommunityDoc;
export declare function buildCorpus(
  rows: ContributionRowLike[],
  options?: { guard?: Readonly<ExportGuard> | null },
): CommunityDoc[];
export declare function serializeCorpus(docs: CommunityDoc[]): string;
export declare function buildManifest(
  docs: CommunityDoc[],
  serializedCorpus: string,
): CommunityManifest;
export declare function serializeManifest(manifest: CommunityManifest): string;
