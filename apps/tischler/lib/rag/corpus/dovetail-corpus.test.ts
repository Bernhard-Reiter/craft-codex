import { describe, it, expect } from "vitest";
import {
  DOVETAIL_CORPUS,
  OPEN_CORE_LICENSES,
  getDovetailCorpus,
  getDovetailCorpusByTopic,
  getDovetailCorpusByLicense,
  type DovetailLicense,
} from "./dovetail-corpus";
import { LocalRAGProvider } from "../local-rag";
import { KeywordTopicGuard } from "../topic-guard";

const ATTRIBUTION_REQUIRED_LICENSES = new Set<DovetailLicense>([
  "CC-BY-SA-4.0",
  "CC-BY-4.0",
  "official-document",
]);

describe("DOVETAIL_CORPUS shape", () => {
  it("has at least 40 documents", () => {
    expect(DOVETAIL_CORPUS.length).toBeGreaterThanOrEqual(40);
  });

  it("every document has unique id", () => {
    const ids = DOVETAIL_CORPUS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every document has non-empty text >= 80 chars", () => {
    DOVETAIL_CORPUS.forEach((doc) => {
      expect(doc.text.length).toBeGreaterThanOrEqual(80);
    });
  });

  it("every document has metadata.source attribution", () => {
    DOVETAIL_CORPUS.forEach((doc) => {
      expect(doc.metadata.source).toBeTruthy();
      expect(typeof doc.metadata.source).toBe("string");
    });
  });

  it("every document has a metadata.license string", () => {
    DOVETAIL_CORPUS.forEach((doc) => {
      expect(doc.metadata.license).toBeTruthy();
      expect(typeof doc.metadata.license).toBe("string");
    });
  });

  it("every CC-BY-SA / CC-BY / official-document doc has non-empty attribution", () => {
    DOVETAIL_CORPUS.forEach((doc) => {
      const lic = doc.metadata.license as DovetailLicense | undefined;
      if (lic && ATTRIBUTION_REQUIRED_LICENSES.has(lic)) {
        expect(
          doc.metadata.attribution,
          `doc ${doc.id} (license=${lic}) needs attribution`,
        ).toBeTruthy();
        expect(typeof doc.metadata.attribution).toBe("string");
        expect((doc.metadata.attribution as string).length).toBeGreaterThan(5);
      }
    });
  });

  it("Wikipedia chunks point to canonical source_url", () => {
    const wikiDocs = DOVETAIL_CORPUS.filter(
      (d) => d.metadata.license === "CC-BY-SA-4.0",
    );
    expect(wikiDocs.length).toBeGreaterThanOrEqual(4);
    wikiDocs.forEach((doc) => {
      expect(doc.metadata.source_url).toMatch(/de\.wikipedia\.org/);
    });
  });

  it("Lehrplan AT chunks point to RIS source_url", () => {
    const ris = DOVETAIL_CORPUS.filter(
      (d) => d.metadata.license === "official-document",
    );
    expect(ris.length).toBeGreaterThanOrEqual(2);
    ris.forEach((doc) => {
      expect(doc.metadata.source_url).toMatch(/ris\.bka\.gv\.at/);
    });
  });

  it("covers expected core topics", () => {
    const topics = new Set(
      DOVETAIL_CORPUS.map((d) => d.metadata.topic).filter(Boolean),
    );
    expect(topics.has("anreissen")).toBe(true);
    expect(topics.has("saegen")).toBe(true);
    expect(topics.has("stemmen")).toBe(true);
    expect(topics.has("passen")).toBe(true);
    expect(topics.has("pruefen")).toBe(true);
    expect(topics.has("uebersicht")).toBe(true);
  });

  it("covers extended topics (werkzeug, holzkunde, sicherheit)", () => {
    const topics = new Set(
      DOVETAIL_CORPUS.map((d) => d.metadata.topic).filter(Boolean),
    );
    expect(topics.has("werkzeug")).toBe(true);
    expect(topics.has("holzkunde")).toBe(true);
    expect(topics.has("sicherheit")).toBe(true);
  });

  it("covers at least 9 distinct topics", () => {
    const topics = new Set(
      DOVETAIL_CORPUS.map((d) => d.metadata.topic).filter(Boolean),
    );
    expect(topics.size).toBeGreaterThanOrEqual(9);
  });
});

describe("getDovetailCorpus", () => {
  it("returns a fresh copy (mutating result doesnt affect base)", () => {
    const a = getDovetailCorpus();
    a[0]!.text = "MUTATED";
    const b = getDovetailCorpus();
    expect(b[0]!.text).not.toBe("MUTATED");
  });

  it("returns same length as DOVETAIL_CORPUS", () => {
    expect(getDovetailCorpus().length).toBe(DOVETAIL_CORPUS.length);
  });
});

describe("getDovetailCorpusByTopic", () => {
  it("filters to anreissen-only docs", () => {
    const docs = getDovetailCorpusByTopic(["anreissen"]);
    expect(docs.length).toBeGreaterThan(0);
    docs.forEach((d) => expect(d.metadata.topic).toBe("anreissen"));
  });

  it("multi-topic union returns all matching", () => {
    const docs = getDovetailCorpusByTopic(["stemmen", "saegen"]);
    expect(docs.length).toBeGreaterThan(0);
    docs.forEach((d) => {
      expect(["stemmen", "saegen"]).toContain(d.metadata.topic);
    });
  });

  it("unknown topic returns empty", () => {
    expect(getDovetailCorpusByTopic(["quantenphysik"])).toEqual([]);
  });

  it("each core topic has at least 2 docs", () => {
    const cores = ["anreissen", "saegen", "stemmen", "passen", "pruefen"];
    cores.forEach((t) => {
      expect(
        getDovetailCorpusByTopic([t]).length,
        `topic=${t}`,
      ).toBeGreaterThanOrEqual(2);
    });
  });
});

describe("getDovetailCorpusByLicense", () => {
  it("filters to own-paraphrase only", () => {
    const docs = getDovetailCorpusByLicense(["own-paraphrase"]);
    expect(docs.length).toBeGreaterThan(0);
    docs.forEach((d) => expect(d.metadata.license).toBe("own-paraphrase"));
  });

  it("multi-license union returns all matching", () => {
    const docs = getDovetailCorpusByLicense([
      "CC-BY-SA-4.0",
      "official-document",
    ]);
    expect(docs.length).toBeGreaterThan(0);
    docs.forEach((d) => {
      expect(["CC-BY-SA-4.0", "official-document"]).toContain(
        d.metadata.license,
      );
    });
  });

  it("unknown license returns empty", () => {
    const docs = getDovetailCorpusByLicense([
      "barlieb-licensed" as DovetailLicense,
    ]);
    expect(docs).toEqual([]);
  });

  it("OPEN_CORE_LICENSES selects ALL current docs (no proprietary)", () => {
    const docs = getDovetailCorpusByLicense(OPEN_CORE_LICENSES);
    expect(docs.length).toBe(DOVETAIL_CORPUS.length);
  });

  it("returns fresh copies (no mutation propagation)", () => {
    const a = getDovetailCorpusByLicense(["own-paraphrase"]);
    if (a[0]) a[0].text = "MUTATED";
    const b = getDovetailCorpusByLicense(["own-paraphrase"]);
    expect(b[0]!.text).not.toBe("MUTATED");
  });
});

describe("integration with LocalRAGProvider", () => {
  it("query for 'Streichmass Anrisslinie' surfaces anriss-streichmass", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query("Streichmass Anrisslinie umlaufend");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toBe("anriss-streichmass");
  });

  it("query for 'Schwalbenwinkel Hartholz' surfaces schwalbenwinkel-ratio", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query("Schwalbenwinkel Hartholz Eiche");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toBe("schwalbenwinkel-ratio");
  });

  it("query for 'Stemmeisen schaerfen' surfaces stemmeisen-auswahl or stemmen-pflege-honung", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query("Stemmeisen Schliff Wassersteine");
    expect(hits.length).toBeGreaterThan(0);
    expect(["stemmeisen-auswahl", "stemmen-pflege-honung"]).toContain(
      hits[0]!.id,
    );
  });

  it("query for 'Glanzstellen Anpassen' surfaces passen-glanzstellen-diagnose", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query("Glanzstellen Diagnose Anpassen Reibung");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toBe("passen-glanzstellen-diagnose");
  });

  it("query for 'Ryoba Dozuki Saege' surfaces saegen-ryoba-vs-dozuki", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query("Ryoba Dozuki japanische Saege");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toBe("saegen-ryoba-vs-dozuki-vs-gestellsaege");
  });

  it("query for 'Holzhammer Klueppel Gewicht' surfaces stemmen-holzhammer-auswahl", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query("Holzhammer Klueppel Gewicht stemmen");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toBe("stemmen-holzhammer-auswahl");
  });

  it("query for 'Esche elastisch stossfest' surfaces holzkunde-harthoelzer", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query("Esche elastisch stossfest Verriegelung");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toBe("holzkunde-harthoelzer-eiche-buche-esche");
  });

  it("query for 'Augenschutz Schutzbrille Werkstatt' surfaces sicherheit-augenschutz", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query("Augenschutz Schutzbrille Splitter Werkstatt");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toBe("sicherheit-augenschutz-spaene");
  });

  it("query for 'Tischlerei-Ausbildungsordnung Verbindungen' surfaces lehrplan AT doc", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query(
      "Tischlerei-Ausbildungsordnung Verbindungen Zinkenverbindungen",
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toMatch(/^lehrplan-at-tischlerei-/);
  });

  it("query for 'Spundung formschluessig Schwalbenschwanz' surfaces wikipedia chunk", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query(
      "Spundung formschluessig Schwalbenschwanz Beschreibung",
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toMatch(/^wikipedia-schwalbenschwanz-/);
  });

  it("query for 'Schmiege einstellen Verhaeltnis' surfaces anreissen-schmiege", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query("Schmiege einstellen Schwalbenwinkel Skala");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toBe("anreissen-schmiege-einstellen");
  });

  it("off-topic query returns no high-score hits", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const hits = await rag.query("Aktien Krypto Borse Trading", {
      minScore: 0.2,
    });
    expect(hits).toEqual([]);
  });
});

describe("integration with KeywordTopicGuard", () => {
  it("on-topic query gets ON verdict", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const guard = new KeywordTopicGuard({ rag, onTopicMin: 0.3 });
    const v = await guard.evaluate(
      "Streichmass Anrisslinie Schwalbenschwanz Hartholz",
    );
    expect(v.decision).toBe("on");
  });

  it("off-topic query gets OFF verdict", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const guard = new KeywordTopicGuard({
      rag,
      onTopicMin: 0.5,
      offTopicMax: 0.15,
    });
    const v = await guard.evaluate("Quantenphysik Photonen Wellengleichung");
    expect(v.decision).toBe("off");
  });

  it("blacklist hit overrides RAG-score", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const guard = new KeywordTopicGuard({
      rag,
      blacklist: ["bitcoin", "krypto"],
    });
    const v = await guard.evaluate(
      "Schwalbenschwanz Bitcoin investment Hartholz",
    );
    expect(v.decision).toBe("off");
    if (v.decision === "off") expect(v.layer).toBe("keyword");
  });
});
