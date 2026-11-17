/**
 * Messe-Vorlage: Unterschrank 600 mit einer Tür (Blum CLIP top) und einem
 * Schubkasten (Blum MOVENTO). Die Tür-Schritte übernimmt er aus dem
 * CLIP-top-Ablauf, die Schubkasten-Schritte kommen dazu.
 * Maße: packages/core/src/hardware/messe-unterschrank.ts (aus cody-cad daten).
 */

import { BLUM_MOVENTO, MESSE_UNTERSCHRANK, type WorkflowDefinition } from "@craft-codex/core";
import { BLUM_CLIP_TOP_WORKFLOW } from "./blum-clip-top-workflow";

const tuerSchritt = (id: string) => {
  const s = BLUM_CLIP_TOP_WORKFLOW.steps.find((x) => x.id === id);
  if (!s) throw new Error(`CLIP-top-Schritt ${id} fehlt`);
  return s;
};

export const MESSE_UNTERSCHRANK_WORKFLOW: WorkflowDefinition = {
  id: "messe-unterschrank-600",
  label: `Messe-Vorlage: ${MESSE_UNTERSCHRANK.name}`,
  steps: [
    tuerSchritt("B1.topf_bohren"),
    tuerSchritt("B2.topf_schrauben"),
    tuerSchritt("B3.platte_schrauben"),
    {
      id: "M1.schiene_schrauben",
      label: "MOVENTO-Schiene an die Korpusseite",
      instructions: [
        "Dieselbe Korpusseite, Innenfläche oben, Vorderkante links.",
        `${BLUM_MOVENTO.artikel} (NL ${BLUM_MOVENTO.nennlaenge}) auf die Schraublinie legen, erste Schraube 37 mm ab Vorderkante.`,
        "Die übrigen Punkte (243 / 261 / 293 / 357) und die Höhe der Schraublinie sind noch Annahmen.",
        "Rechte Seite gespiegelt genauso.",
      ],
      tools: ["Schrauber"],
      relatedMarkingIds: BLUM_MOVENTO.schrauben.map((s) => `movento.${s.x}`),
      checklist: [
        { id: "M1.links", label: "Schiene links geschraubt" },
        { id: "M1.rechts", label: "Schiene rechts geschraubt" },
      ],
    },
    {
      id: "M2.schubkasten",
      label: "Schubkasten bauen und einhängen",
      instructions: [
        `Holzschubkasten (H 150, LW 562): ${MESSE_UNTERSCHRANK.schubkastenTeile.join(" · ")}.`,
        `Kupplung ${BLUM_MOVENTO.kupplung} unter den Boden.`,
        "Kasten auf die ausgezogenen Schienen setzen, bis die Kupplung einrastet.",
      ],
      tools: ["Schrauber"],
      relatedMarkingIds: [],
      checklist: [
        { id: "M2.kasten", label: "Kasten verleimt" },
        { id: "M2.eingerastet", label: "Kupplung links + rechts eingerastet" },
      ],
    },
    tuerSchritt("B4.einclipsen"),
  ],
};
