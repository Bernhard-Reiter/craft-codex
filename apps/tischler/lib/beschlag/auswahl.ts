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
  type HardwareLayout,
  type WorkflowDefinition,
} from "@craft-codex/core";
import { BLUM_CLIP_TOP_WORKFLOW } from "./blum-clip-top-workflow";
import { HAWA_COMBINO_WORKFLOW } from "./hawa-combino-workflow";

export interface Werkstueck {
  id: string;
  /** Wie es dem Tischler angezeigt wird. */
  name: string;
  breiteMm: number;
  hoeheMm: number;
  layout: HardwareLayout;
}

export interface BeschlagEintrag {
  id: "hawa" | "blum";
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

const HAWA: BeschlagEintrag = {
  id: "hawa",
  label: "Hawa Combino (Schiebetür)",
  workflow: HAWA_COMBINO_WORKFLOW,
  werkstueckFuer: () => HAWA_TUER,
};

/** Vorauswahl der Seiten: Hawa wie bisher. */
export const STANDARD_BESCHLAG = HAWA;

export const BESCHLAEGE: BeschlagEintrag[] = [
  HAWA,
  {
    id: "blum",
    label: "Blum CLIP top (Unterschrank)",
    workflow: BLUM_CLIP_TOP_WORKFLOW,
    werkstueckFuer: (stepId) =>
      stepId === "B3.platte_schrauben" ? BLUM_SEITE : BLUM_TUER,
  },
];
