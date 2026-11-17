/**
 * Blum CLIP top BLUMOTION 110° + Kreuzmontageplatte 173L6100 —
 * geführte Montage an einer Unterschrank-Tür (2 Scharniere).
 *
 * Quelle: Blum MD-029/3 · 11.24, S. 4 (Topf, Schraubmontage) und S. 5
 * (Montageplatte), übernommen aus cody-cad daten/beschlaege/blum-71b3550.json
 * und blum-173l6100.json (Feld »montage«).
 */

import type { WorkflowDefinition } from "@craft-codex/core";

export const BLUM_CLIP_TOP_WORKFLOW: WorkflowDefinition = {
  id: "blum-clip-top-71b3550-unterschrank",
  label: "Blum CLIP top 110° — Unterschrank-Tür",
  steps: [
    {
      id: "B1.topf_bohren",
      label: "Topfbohrungen setzen (Tür)",
      instructions: [
        "Tür mit der Innenseite nach oben auf den Tisch legen, Anschlagkante links.",
        "Zwei Topfbohrungen Ø 35 setzen, Tiefe zwischen 10,5 und 13 mm.",
        "Ein zu kleines Loch nimmt den Topf nicht auf (Toleranz +0,2 / −0).",
      ],
      tools: ["Forstnerbohrer Ø 35", "Tiefenanschlag"],
      relatedMarkingIds: ["topf.oben", "topf.unten"],
      checklist: [
        { id: "B1.oben", label: "Topf oben gebohrt" },
        { id: "B1.unten", label: "Topf unten gebohrt" },
        { id: "B1.tiefe", label: "Tiefe 10,5–13 mm geprüft" },
      ],
    },
    {
      id: "B2.topf_schrauben",
      label: "Töpfe einsetzen und schrauben",
      instructions: [
        "Topf einsetzen, Arm zeigt von der Kante weg in die Tür.",
        "Mit zwei Spanplattenschrauben 3,5 × 17 je Topf anziehen.",
      ],
      tools: ["Schrauber", "Spanplattenschrauben 3,5 × 17"],
      relatedMarkingIds: ["schraube.oben.a", "schraube.oben.b", "schraube.unten.a", "schraube.unten.b"],
      checklist: [{ id: "B2.vier", label: "Vier Schrauben angezogen" }],
    },
    {
      id: "B3.platte_schrauben",
      label: "Montageplatten an die Korpusseite",
      instructions: [
        "Korpusseite mit der Innenfläche nach oben, Vorderkante links.",
        "Montageplatte schrauben: Lochreihe 37 mm ab Vorderkante, Lochabstand 32 mm.",
      ],
      tools: ["Schrauber"],
      relatedMarkingIds: ["platte.oben.1", "platte.oben.2", "platte.unten.1", "platte.unten.2"],
      checklist: [{ id: "B3.zwei", label: "Beide Platten geschraubt" }],
    },
    {
      id: "B4.einclipsen",
      label: "Tür einclipsen und einstellen",
      instructions: [
        "Scharnierarm auf die Montageplatte clipsen.",
        "Fuge einstellen.",
      ],
      tools: ["Kreuzschlitz-Schraubendreher"],
      relatedMarkingIds: [],
      checklist: [{ id: "B4.fuge", label: "Fuge gleichmäßig" }],
    },
  ],
};
