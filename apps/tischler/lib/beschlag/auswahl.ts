/**
 * Welche Beschläge die Montage-Seiten (2D und AR) kennen.
 *
 * Ein Beschlag hat einen Ablauf (Schritte) und je Schritt ein Werkstück, auf
 * dem gebohrt wird. Bei Hawa ist das immer das Türblatt; bei Blum liegt für
 * die Montageplatte die Korpusseite auf dem Tisch — dann wird neu ausgerichtet.
 */

import {
  buildBlumClipTopTuerLayout,
  buildBlumMontageplatteSeiteLayout,
  buildHawaCombinoLayout,
  buildMesseUnterschrankSeiteLayout,
  MESSE_UNTERSCHRANK,
  type HardwareLayout,
  type WorkflowDefinition,
} from "@craft-codex/core";
import { BLUM_CLIP_TOP_WORKFLOW } from "./blum-clip-top-workflow";
import { HAWA_COMBINO_WORKFLOW } from "./hawa-combino-workflow";
import { MESSE_UNTERSCHRANK_WORKFLOW } from "./messe-unterschrank-workflow";

export interface Werkstueck {
  id: string;
  /** Wie es dem Tischler angezeigt wird. */
  name: string;
  breiteMm: number;
  hoeheMm: number;
  layout: HardwareLayout;
}

export interface BeschlagEintrag {
  id: "hawa" | "blum" | "messe";
  /** Annahmen der Vorlage, sichtbar über dem Ablauf. */
  annahmen?: readonly string[];
  label: string;
  workflow: WorkflowDefinition;
  werkstueckFuer: (stepId: string | undefined) => Werkstueck;
}

// Hawa-Durchstich: Türblatt 600 × 2000 (wie bisher).
const HAWA_TUER: Werkstueck = {
  id: "hawa.tuer",
  name: "Türblatt 600 × 2000",
  breiteMm: 600,
  hoeheMm: 2000,
  layout: buildHawaCombinoLayout(600),
};

// Blum: Beispiel-Unterschrank 600 × 720 × 560 aus cody-cad
// tests/fixtures/daten/blum-unterschrank-scharnier-satz.json (dort als
// Annahme markiert: Testfall, kein Auftrag).
const BLUM_TUER: Werkstueck = {
  id: "blum.tuer",
  name: "Unterschrank-Tür 600 × 720",
  breiteMm: 600,
  hoeheMm: 720,
  layout: buildBlumClipTopTuerLayout(600, 720),
};
const BLUM_SEITE: Werkstueck = {
  id: "blum.seite",
  name: "Korpusseite links 560 × 720",
  breiteMm: 560,
  hoeheMm: 720,
  layout: buildBlumMontageplatteSeiteLayout(560),
};

// Messe-Vorlage: Unterschrank 600 · 1 Tür · 1 Innenschubkasten (Maße aus cody-cad).
const M = MESSE_UNTERSCHRANK;
const MESSE_TUER: Werkstueck = {
  id: "messe.tuer",
  name: `Tür ${M.tuer.breite} × ${M.tuer.hoehe} (Messe-Unterschrank)`,
  breiteMm: M.tuer.breite,
  hoeheMm: M.tuer.hoehe,
  layout: buildBlumClipTopTuerLayout(M.tuer.breite, M.tuer.hoehe),
};
const MESSE_SEITE: Werkstueck = {
  id: "messe.seite",
  name: `Korpusseite links ${M.korpus.tiefe} × ${M.korpus.hoehe} (Messe-Unterschrank)`,
  breiteMm: M.korpus.tiefe,
  hoeheMm: M.korpus.hoehe,
  layout: buildMesseUnterschrankSeiteLayout(),
};
const MESSE_SEITEN_SCHRITTE = new Set(["B3.platte_schrauben", "M1.schiene_schrauben", "M2.schubkasten"]);

export const MESSE: BeschlagEintrag = {
  id: "messe",
  label: "⭐ Messe-Unterschrank 600",
  workflow: MESSE_UNTERSCHRANK_WORKFLOW,
  annahmen: M.annahmen,
  werkstueckFuer: (stepId) =>
    stepId && MESSE_SEITEN_SCHRITTE.has(stepId) ? MESSE_SEITE : MESSE_TUER,
};

const HAWA: BeschlagEintrag = {
  id: "hawa",
  label: "Hawa Combino (Schiebetür)",
  workflow: HAWA_COMBINO_WORKFLOW,
  werkstueckFuer: () => HAWA_TUER,
};

/** Vorauswahl der Seiten: Hawa wie bisher. */
export const STANDARD_BESCHLAG = HAWA;

export const BESCHLAEGE: BeschlagEintrag[] = [
  MESSE,
  HAWA,
  {
    id: "blum",
    label: "Blum CLIP top (Unterschrank)",
    workflow: BLUM_CLIP_TOP_WORKFLOW,
    werkstueckFuer: (stepId) =>
      stepId === "B3.platte_schrauben" ? BLUM_SEITE : BLUM_TUER,
  },
];
