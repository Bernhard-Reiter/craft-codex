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
import { getDovetailCorpus } from "./dovetail-corpus";
import { getRisCorpus } from "./ris-corpus";

export function getDemoCorpus(): RAGDocument[] {
  return [
    ...getZinkenGrundlagenCorpus(),
    ...getDovetailCorpus(),
    ...getRisCorpus(),
  ];
}

export { getZinkenGrundlagenCorpus, getDovetailCorpus, getRisCorpus };
