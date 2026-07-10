/**
 * Combined demo corpus — knowledge layers:
 *  0. Grundlagen: "von ganz vorne" — was sind Zinken, wofuer, welche Arten,
 *                 wie anreissen (zinken-grundlagen-corpus, Laien-Einstieg)
 *  1. Handwerk:   paraphrased craft knowledge + Wikipedia (dovetail-corpus)
 *  2. Recht:      official regulations from RIS (ris-corpus, generated)
 *  3. Didaktik:   Barlieb material (lands here after the 2026-06-13 session)
 */

import type { RAGDocument } from "@craft-codex/core";
import { getZinkenGrundlagenCorpus } from "./zinken-grundlagen-corpus";
import { getZinkenGrundlagenCorpusEn } from "./zinken-grundlagen-corpus.en";
import { getZinkenKonstruktionCorpus } from "./dovetail-konstruktion-corpus";
import { getZinkenKonstruktionCorpusEn } from "./dovetail-konstruktion-corpus.en";
import { getDovetailCorpus } from "./dovetail-corpus";
import { getDovetailCorpusEn } from "./dovetail-corpus.en";
import { getRisCorpus } from "./ris-corpus";

export type CorpusLocale = "de" | "en";

/**
 * EN-Korpus = uebersetzte Fachdokumente + RIS im deutschen Original
 * (Rechtsquellen werden NIE uebersetzt — Authentizitaet vor Retrieval-Score).
 */
export function getDemoCorpus(locale: CorpusLocale = "de"): RAGDocument[] {
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

export {
  getZinkenGrundlagenCorpus,
  getZinkenKonstruktionCorpus,
  getDovetailCorpus,
  getRisCorpus,
};
