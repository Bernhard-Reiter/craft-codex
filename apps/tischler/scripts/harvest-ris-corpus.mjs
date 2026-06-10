#!/usr/bin/env node
/* eslint-disable */
/**
 * harvest-ris-corpus.mjs — pulls the OFFICIAL Austrian regulations relevant
 * for the Tischler apprenticeship from the RIS OGD API and generates
 * lib/rag/corpus/ris-corpus.ts (committed: official documents are public
 * domain under §7 UrhG, and the demo must work offline).
 *
 * Sources (verified live 2026-06-11):
 *  - Tischlerei-Ausbildungsordnung   Gesetzesnummer 20011991 (alle Teile)
 *  - Lehrpläne für Berufsschulen 2016, Anlage 147 (Tischlerei) GesNr 20009625
 *
 * API lessons inherited from VOAI/LTRE (fixed 2026-05-29, re-applied here):
 *  - errors arrive as HTTP 200 with OgdSearchResult.Error — check the body
 *  - document text is NOT inline; fetch via Dokumentliste ContentUrl (Html)
 *  - JSON paths are case-sensitive (OgdDocumentResults.OgdDocumentReference)
 *  - the page param is "Seitennummer" (double n)
 *
 * Usage: node scripts/harvest-ris-corpus.mjs   (network required, run once)
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "lib", "rag", "corpus", "ris-corpus.ts");
const BASE = "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht";
const TODAY = new Date().toISOString().slice(0, 10);

const SOURCES = [
  {
    gesetzesnummer: "20011991",
    label: "Tischlerei-Ausbildungsordnung",
    topic: "ausbildungsordnung",
    filter: () => true, // alle Paragraphen + Anlagen
  },
  {
    gesetzesnummer: "20009625",
    label: "Lehrplaene fuer Berufsschulen (Lehrplan 2016)",
    topic: "lehrplan",
    filter: (para) => /Anl\.?\s*147/i.test(para ?? ""), // nur Tischlerei-Anlage
  },
];

async function searchAll(gesetzesnummer) {
  const refs = [];
  for (let page = 1; page <= 5; page++) {
    const qs = new URLSearchParams({
      Applikation: "BrKons",
      Gesetzesnummer: gesetzesnummer,
      "Fassung.FassungVom": TODAY,
      DokumenteProSeite: "Fifty",
      Seitennummer: String(page),
    });
    const res = await fetch(`${BASE}?${qs}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`RIS HTTP ${res.status}`);
    const data = await res.json();
    const sr = data.OgdSearchResult ?? {};
    if (sr.Error) throw new Error(`RIS error: ${sr.Error.Message}`);
    const results = sr.OgdDocumentResults ?? {};
    let pageRefs = results.OgdDocumentReference ?? [];
    if (!Array.isArray(pageRefs)) pageRefs = [pageRefs];
    refs.push(...pageRefs);
    const total = Number(results.Hits?.["#text"] ?? pageRefs.length);
    if (refs.length >= total || pageRefs.length === 0) break;
  }
  return refs;
}

function refMeta(ref) {
  const md = ref?.Data?.Metadaten ?? {};
  const br = md.Bundesrecht ?? {};
  const kons = br.BrKons ?? {};
  // ContentReference can be an object or array; collect all Html urls.
  let contentRefs = ref?.Data?.Dokumentliste?.ContentReference ?? [];
  if (!Array.isArray(contentRefs)) contentRefs = [contentRefs];
  let htmlUrl = null;
  for (const cr of contentRefs) {
    let urls = cr?.Urls?.ContentUrl ?? [];
    if (!Array.isArray(urls)) urls = [urls];
    for (const u of urls) {
      if (u?.DataType === "Html" && u?.Url) htmlUrl = u.Url;
    }
  }
  return {
    id: md.Technisch?.ID ?? "",
    kurztitel: br.Kurztitel ?? "",
    para: kons.ArtikelParagraphAnlage ?? "",
    htmlUrl,
  };
}

function stripHtml(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** Split long documents into ~900-char chunks on paragraph boundaries. */
function chunkText(text, maxLen = 900) {
  if (text.length <= maxLen * 1.3) return [text];
  const paras = text.split("\n").filter((p) => p.trim().length > 0);
  const chunks = [];
  let cur = "";
  for (const p of paras) {
    if (cur.length + p.length > maxLen && cur.length > 200) {
      chunks.push(cur.trim());
      cur = "";
    }
    cur += p + "\n";
  }
  if (cur.trim().length > 0) chunks.push(cur.trim());
  return chunks;
}

function tsString(s) {
  return JSON.stringify(s);
}

async function main() {
  const docs = [];
  for (const src of SOURCES) {
    console.log(`▸ ${src.label} (GesNr ${src.gesetzesnummer})`);
    const refs = await searchAll(src.gesetzesnummer);
    console.log(`  ${refs.length} Dokumente gefunden`);
    let taken = 0;
    for (const ref of refs) {
      const m = refMeta(ref);
      if (!src.filter(m.para)) continue;
      if (!m.htmlUrl) {
        console.log(`  ! kein HTML-Content: ${m.para}`);
        continue;
      }
      const res = await fetch(m.htmlUrl);
      if (!res.ok) {
        console.log(`  ! HTTP ${res.status} fuer ${m.para}`);
        continue;
      }
      const text = stripHtml(await res.text());
      if (text.length < 80) continue; // leere/Inhaltsverzeichnis-Schnipsel
      const chunks = chunkText(text);
      chunks.forEach((chunk, i) => {
        const suffix = chunks.length > 1 ? ` (Teil ${i + 1}/${chunks.length})` : "";
        docs.push({
          id: `ris-${src.gesetzesnummer}-${m.para.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}${chunks.length > 1 ? `-${i + 1}` : ""}`,
          text: chunk,
          title: `${src.label} ${m.para}${suffix}`,
          source: `RIS Bundesrecht konsolidiert, GesNr ${src.gesetzesnummer}, ${m.para}, Fassung ${TODAY}`,
          topic: src.topic,
          risId: m.id,
        });
      });
      taken++;
      await new Promise((r) => setTimeout(r, 300)); // RIS hoeflich behandeln
    }
    console.log(`  → ${taken} Dokumente uebernommen`);
  }

  const entries = docs
    .map(
      (d) => `  {
    id: ${tsString(d.id)},
    text: ${tsString(d.text)},
    metadata: {
      title: ${tsString(d.title)},
      source: ${tsString(d.source)},
      attribution: "Rechtsinformationssystem des Bundes (RIS), amtliches Werk gem. §7 UrhG",
      license: "official-document",
      topic: ${tsString(d.topic)},
    },
  },`,
    )
    .join("\n");

  const file = `import type { RAGDocument } from "@craft-codex/core";

/**
 * GENERATED — do not edit by hand. Regenerate via:
 *   node scripts/harvest-ris-corpus.mjs
 *
 * Official Austrian regulations for the Tischler apprenticeship, harvested
 * from the RIS OGD API (data.bka.gv.at) on ${TODAY}. Amtliche Werke sind
 * gemeinfrei (§7 UrhG) — committed so the demo answers offline AND citable.
 */

export const RIS_CORPUS: RAGDocument[] = [
${entries}
];

export function getRisCorpus(): RAGDocument[] {
  return RIS_CORPUS;
}
`;
  await writeFile(OUT_PATH, file);
  console.log(`✓ ${docs.length} Korpus-Dokumente → ${OUT_PATH}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
