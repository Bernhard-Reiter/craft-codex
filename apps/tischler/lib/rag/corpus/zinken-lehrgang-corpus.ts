/**
 * Zinken-Lehrgang als RAG-Wissen — ERZEUGT aus lib/zinken/lehrgang(.en).ts,
 * damit Lektion und Sprach-Assistent nie auseinanderlaufen (eine Quelle).
 * Je Schritt: ein Dokument »Arbeitsschritt« (Ziel, Handgriffe, Kontrollpunkt),
 * ein Dokument je typischem Fehler (Ursache → Abhilfe), ein Dokument Sicherheit.
 * Lizenz: eigene Formulierung (own-paraphrase). Rechenregel nach dem
 * österreichischen Fachkunde-Lehrbuch Tischler, Kap. 4.1 — TODO(Bernhard): Titel/Verlag.
 */
import type { RAGDocument } from "@craft-codex/core";
import { getLehrgang } from "../../zinken/lehrgang-index";

const QUELLE = "craft-codex-lehrgang";

export function getZinkenLehrgangCorpus(locale: "de" | "en" = "de"): RAGDocument[] {
  const en = locale === "en";
  const out: RAGDocument[] = [];
  for (const s of getLehrgang(locale)) {
    const basis = {
      source: QUELLE,
      topic: `lehrgang-${s.id}`,
      license: "own-paraphrase",
    };
    out.push({
      id: `lehrgang-${s.id}-arbeitsschritt`,
      text: [
        `${en ? "Step" : "Schritt"} ${s.nr}: ${s.titel}. ${s.ziel}`,
        `${en ? "Tools" : "Werkzeug"}: ${s.werkzeug.join(", ")}.`,
        ...s.nachmachen.map((n, i) => `${i + 1}. ${n.kurz}: ${n.lang}`),
        `${en ? "Checkpoint" : "Kontrollpunkt"}: ${s.kontrollpunkt.join(" ")}`,
      ].join("\n"),
      metadata: { ...basis, title: `${s.nr}. ${s.titel}` },
    });
    s.fehler.forEach((f, i) => {
      out.push({
        id: `lehrgang-${s.id}-fehler-${i + 1}`,
        text: `${en ? "Mistake" : "Fehler"}: ${f.fehler}. ${en ? "Cause" : "Ursache"}: ${f.ursache}. ${en ? "Fix" : "Abhilfe"}: ${f.abhilfe}`,
        metadata: { ...basis, title: `${s.titel} — ${f.fehler}` },
      });
    });
    out.push({
      id: `lehrgang-${s.id}-sicherheit`,
      text: `${en ? "Safety" : "Sicherheit"} — ${s.titel}: ${s.sicherheit.join(" ")}`,
      metadata: { ...basis, topic: "sicherheit", title: `${s.titel} — ${en ? "safety" : "Sicherheit"}` },
    });
  }
  return out;
}
