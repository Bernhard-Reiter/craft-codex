import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { RAGDocument } from "@craft-codex/core";
import {
  getDemoCorpus,
  getDovetailCorpus,
  getRisCorpus,
  getZinkenGrundlagenCorpus,
  getZinkenKonstruktionCorpus,
} from "./index";
import { getZinkenGrundlagenCorpusEn } from "./zinken-grundlagen-corpus.en";
import { getZinkenKonstruktionCorpusEn } from "./dovetail-konstruktion-corpus.en";
import { getDovetailCorpusEn } from "./dovetail-corpus.en";
import { getCommunityCorpus } from "./community-corpus";
import communityDe from "./community/community-corpus.de.json";
import manifest from "./community/manifest.json";
import { LocalRAGProvider } from "../local-rag";
import { contributionContentSchema } from "../../contributions/schema";
import {
  buildCorpus,
  derivePublishedSlug,
  sha256Hex,
  serializeCorpus,
  buildManifest,
  serializeManifest,
  stableStringify,
  validateContent,
  SLUG_RE,
  type CommunityManifest,
  type ContributionRowLike,
} from "../../../../../scripts/lib/export-core.mjs";

const manifestData = manifest as unknown as CommunityManifest;

/**
 * Golden-Master + Schema + Determinismus + Leak-Tests fuer die
 * Community-Korpus-Schicht (Slice 1, Schritt 6).
 *
 * WICHTIG: Die Legacy-ID-Menge wird hier aus den EINZELNEN Korpus-Exporten
 * aggregiert (ohne Community-Layer) — nicht aus getDemoCorpus. So beweist
 * der Test, dass die neue Schicht den Bestand nicht veraendert.
 */

// ---------------------------------------------------------------------------
// Legacy-Aggregat (OHNE Community-Layer) — der Golden-Master-Bestand.
// ---------------------------------------------------------------------------
function legacyCorpus(locale: "de" | "en"): RAGDocument[] {
  if (locale === "en") {
    return [
      ...getZinkenGrundlagenCorpusEn(),
      ...getZinkenKonstruktionCorpusEn(),
      ...getDovetailCorpusEn(),
      ...getRisCorpus(),
    ];
  }
  return [
    ...getZinkenGrundlagenCorpus(),
    ...getZinkenKonstruktionCorpus(),
    ...getDovetailCorpus(),
    ...getRisCorpus(),
  ];
}

const communityDocs = communityDe as unknown as RAGDocument[];

// ---------------------------------------------------------------------------
// Fixtures fuer Determinismus/Leak-Tests (pure export-core Pfad).
// ---------------------------------------------------------------------------
function makeRow(overrides: Partial<ContributionRowLike> = {}): ContributionRowLike {
  return {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    status: "approved",
    visibility: "open_commons",
    license_accepted: true,
    license_type: "CC-BY-SA-4.0",
    revision: 1,
    approved_revision: 1,
    terms_version: "2026-07",
    published_slug: null,
    content: {
      title: "Anreissen mit dem Streichmass",
      body_md:
        "Ein Streichmass mit geschliffener Klinge schneidet die Holzfasern " +
        "quer zur Faser sauber durch, statt sie wie ein Bleistift nur zu " +
        "markieren. Den Anschlag immer an der Bezugsflaeche fuehren.",
      topic: "anreissen",
      sources: [{ citation: "Meister-Weisheit, muendlich ueberliefert" }],
    },
    ...overrides,
  };
}

function makeSecondRow(): ContributionRowLike {
  return makeRow({
    id: "11111111-2222-3333-4444-555555555555",
    content: {
      title: "Saegen auf der Abfallseite",
      body_md:
        "Beim Aussaegen der Zinken immer knapp NEBEN der Anrisslinie auf der " +
        "Abfallseite saegen — die Linie selbst bleibt stehen und wird beim " +
        "Verputzen die fertige Kante.",
      topic: "saegen",
      sources: [{ citation: "Werkstatt-Grundregel, Tischlerlehre" }],
    },
  });
}

// ---------------------------------------------------------------------------
describe("community corpus — golden master (Bestand bleibt unangetastet)", () => {
  it("getDemoCorpus('de') enthaelt >=268 Docs und ALLE Legacy-IDs", () => {
    const legacy = legacyCorpus("de");
    const demo = getDemoCorpus("de");
    expect(legacy.length).toBeGreaterThanOrEqual(268);
    expect(demo.length).toBeGreaterThanOrEqual(268);
    const demoIds = new Set(demo.map((d) => d.id));
    for (const doc of legacy) {
      expect(demoIds.has(doc.id), `legacy id ${doc.id} missing`).toBe(true);
    }
    // Additiv, nichts ersetzt: Demo = Legacy + Community, exakt.
    expect(demo.length).toBe(legacy.length + communityDocs.length);
  });

  it("Legacy-Docs sind in getDemoCorpus inhaltlich unveraendert", () => {
    const demoById = new Map(getDemoCorpus("de").map((d) => [d.id, d]));
    for (const doc of legacyCorpus("de")) {
      expect(stableStringify(demoById.get(doc.id))).toBe(stableStringify(doc));
    }
  });

  it("getDemoCorpus('en') bleibt unveraendert (S1: Community nur DE)", () => {
    const legacy = legacyCorpus("en");
    const demo = getDemoCorpus("en");
    expect(demo.length).toBe(legacy.length);
    expect(getCommunityCorpus("en")).toEqual([]);
  });
});

describe("community corpus — Schema/Provenienz der committeten Docs", () => {
  it("jede Community-Doc erfuellt RAGDocument-Shape + Lizenz + Slug-Format", () => {
    for (const doc of communityDocs) {
      expect(typeof doc.id).toBe("string");
      expect(doc.id).toMatch(SLUG_RE);
      expect(typeof doc.text).toBe("string");
      expect(doc.text.length).toBeGreaterThan(20);
      expect(doc.metadata.source).toBe("community");
      expect(doc.metadata.license).toBe("CC-BY-SA-4.0");
      expect(typeof doc.metadata.title).toBe("string");
      expect(typeof doc.metadata.topic).toBe("string");
      expect(String(doc.metadata.contribution_id)).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    }
  });

  it("IDs eindeutig und KEINE Kollision mit Legacy-IDs", () => {
    const legacyIds = new Set(
      [...legacyCorpus("de"), ...legacyCorpus("en")].map((d) => d.id),
    );
    const seen = new Set<string>();
    for (const doc of communityDocs) {
      expect(seen.has(doc.id), `duplicate community id ${doc.id}`).toBe(false);
      seen.add(doc.id);
      expect(legacyIds.has(doc.id), `community id ${doc.id} collides with legacy`).toBe(
        false,
      );
    }
  });

  it("kein author_email / keine Attribution im Export (Datenschutz, S2-Opt-in)", () => {
    const raw = readFileSync(
      new URL("./community/community-corpus.de.json", import.meta.url),
      "utf8",
    );
    expect(raw).not.toContain("author_email");
    expect(raw).not.toContain("attribution");
    expect(raw).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });

  it("committete Datei ist byte-identisch zur kanonischen Serialisierung", () => {
    const raw = readFileSync(
      new URL("./community/community-corpus.de.json", import.meta.url),
      "utf8",
    );
    expect(raw).toBe(serializeCorpus(communityDocs as never));
  });

  it("manifest.json ist konsistent zur Korpus-Datei", () => {
    const raw = readFileSync(
      new URL("./community/community-corpus.de.json", import.meta.url),
      "utf8",
    );
    const manifestRaw = readFileSync(
      new URL("./community/manifest.json", import.meta.url),
      "utf8",
    );
    expect(manifestData.schemaVersion).toBe(1);
    expect(manifestData.license).toBe("CC-BY-SA-4.0");
    expect(manifestData.exportedCount).toBe(communityDocs.length);
    expect(manifestData.corpusSha256).toBe(sha256Hex(raw));
    expect(manifestData.docs.map((d) => d.id)).toEqual(communityDocs.map((d) => d.id));
    expect(manifestData.contribution_ids).toEqual(
      communityDocs.map((d) => d.metadata.contribution_id),
    );
    // Manifest selbst kanonisch serialisiert (byte-stabil bei Re-Run).
    expect(manifestRaw).toBe(
      serializeManifest(buildManifest(communityDocs as never, raw)),
    );
  });
});

describe("export-core — Determinismus", () => {
  it("Mapping+Serialisierung ist byte-identisch bei Re-Run und Input-Reihenfolge", () => {
    const rows = [makeRow(), makeSecondRow()];
    const a = serializeCorpus(buildCorpus(rows));
    const b = serializeCorpus(buildCorpus(rows));
    const c = serializeCorpus(buildCorpus([...rows].reverse()));
    expect(a).toBe(b);
    expect(a).toBe(c);
    // Sortiert nach id:
    const ids = (JSON.parse(a) as RAGDocument[]).map((d) => d.id);
    expect(ids).toEqual([...ids].sort());
  });

  it("derivePublishedSlug ist stabil und content-sensitiv", () => {
    const row = makeRow();
    const slug = derivePublishedSlug(row);
    expect(slug).toBe(derivePublishedSlug(makeRow()));
    expect(slug).toMatch(/^anreissen-anreissen-mit-dem-streichmass-[0-9a-f]{8}$/);
    const changed = makeRow();
    (changed.content as { body_md: string }).body_md += " Nachtrag.";
    expect(derivePublishedSlug(changed)).not.toBe(slug);
  });

  it("gesetzter published_slug wird verwendet, NIE neu generiert", () => {
    const row = makeRow({ published_slug: "anreissen-fixierter-slug-deadbeef" });
    const doc = buildCorpus([row])[0]!;
    expect(doc.id).toBe("anreissen-fixierter-slug-deadbeef");
  });

  it("Manifest-Hash identisch bei zweitem Export ohne Aenderung", () => {
    const rows = [makeRow(), makeSecondRow()];
    const run = () => {
      const docs = buildCorpus(rows);
      const ser = serializeCorpus(docs);
      return serializeManifest(buildManifest(docs, ser));
    };
    expect(run()).toBe(run());
  });
});

describe("export-core — Leak-Tests (Schaerfe: ohne Filter wird es rot)", () => {
  const leaks: Array<[string, Partial<ContributionRowLike>]> = [
    ["visibility != open_commons", { visibility: "private" }],
    ["license_accepted = false", { license_accepted: false }],
    ["approved_revision != revision", { approved_revision: 1, revision: 2 }],
    ["status != approved", { status: "in_review" }],
  ];

  for (const [name, overrides] of leaks) {
    it(`${name} -> harter Fehler mit Zeilen-ID`, () => {
      const bad = makeRow({ id: "99999999-9999-9999-9999-999999999999", ...overrides });
      expect(() => buildCorpus([makeSecondRow(), bad])).toThrowError(
        /99999999-9999-9999-9999-999999999999/,
      );
    });

    it(`${name} -> OHNE Guard (Parameter-Injection) erscheint die Zeile`, () => {
      // Beweis, dass der Guard load-bearing ist: entfernt man ihn, leakt die
      // Zeile in den Output — dieser Test wuerde ohne Filter rot werden.
      const bad = makeRow({ id: "99999999-9999-9999-9999-999999999999", ...overrides });
      const docs = buildCorpus([makeSecondRow(), bad], { guard: null });
      expect(
        docs.some(
          (d) => d.metadata.contribution_id === "99999999-9999-9999-9999-999999999999",
        ),
      ).toBe(true);
    });
  }

  it("ID-Kollision im Batch -> harter Fehler", () => {
    const a = makeRow({ published_slug: "anreissen-doppelt-cafebabe" });
    const b = makeSecondRow();
    b.published_slug = "anreissen-doppelt-cafebabe";
    expect(() => buildCorpus([a, b])).toThrowError(/duplicate published_slug/);
  });
});

describe("export-core — Validator-Paritaet mit contributionContentSchema", () => {
  const validContent = makeRow().content;
  const invalidContents: unknown[] = [
    { ...(validContent as object), title: "ab" }, // zu kurz
    { ...(validContent as object), body_md: "zu kurz" },
    { ...(validContent as object), topic: "x" },
    { ...(validContent as object), sources: [] },
    {
      ...(validContent as object),
      sources: [{ citation: "ok citation", url: "javascript:alert(1)" }],
    },
  ];

  it("beide Validatoren akzeptieren gueltigen Content", () => {
    expect(contributionContentSchema.safeParse(validContent).success).toBe(true);
    expect(validateContent(validContent)).toEqual([]);
  });

  it("beide Validatoren lehnen dieselben kaputten Fixtures ab", () => {
    for (const bad of invalidContents) {
      expect(contributionContentSchema.safeParse(bad).success).toBe(false);
      expect(validateContent(bad).length).toBeGreaterThan(0);
    }
  });
});

describe("community corpus — Offline-E2E (LocalRAG, kein Netz)", () => {
  it("Community-Fixture wird ueber getDemoCorpus + LocalRAG gefunden", async () => {
    const fixtureDoc = buildCorpus([makeRow()])[0]!;
    const rag = new LocalRAGProvider([
      ...getDemoCorpus("de"),
      fixtureDoc as unknown as RAGDocument,
    ]);
    const hits = await rag.query("Streichmass Klinge Bezugsflaeche anreissen", {
      topK: 5,
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.id === fixtureDoc.id)).toBe(true);
  });

  it("committete Community-Docs sind offline abrufbar (falls vorhanden)", async () => {
    if (communityDocs.length === 0) return; // Startzustand: leer ist ok
    const rag = new LocalRAGProvider(getDemoCorpus("de"));
    for (const doc of communityDocs) {
      const hits = await rag.query(doc.text.slice(0, 120), { topK: 10 });
      expect(hits.some((h) => h.id === doc.id), `no offline hit for ${doc.id}`).toBe(
        true,
      );
    }
  });
});
