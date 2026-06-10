/**
 * Combined demo corpus — three knowledge layers:
 *  1. Handwerk:  paraphrased craft knowledge + Wikipedia (dovetail-corpus)
 *  2. Recht:     official regulations from RIS (ris-corpus, generated)
 *  3. Didaktik:  Barlieb material (lands here after the 2026-06-13 session)
 */

import type { RAGDocument } from "@craft-codex/core";
import { getDovetailCorpus } from "./dovetail-corpus";
import { getRisCorpus } from "./ris-corpus";

export function getDemoCorpus(): RAGDocument[] {
  return [...getDovetailCorpus(), ...getRisCorpus()];
}

export { getDovetailCorpus, getRisCorpus };
