/**
 * Hawa Combino 65/80 H FS ul — geführte Montage.
 *
 * Quelle: Häfele/Hawa Montageanleitung 788.2000.310 (09|2019, 16 Seiten).
 * Jeder Schritt trägt die Seitenzahl der Vorlage, damit der Bezug prüfbar bleibt.
 *
 * MASCHINELL aus der PDF-Textebene gewonnen: Schritt-Buchstaben (A–G),
 * Teilschritt-Nummern, Werkzeuge (PZ/TX/SW) und Schraubengrößen.
 * VON HAND ergänzt (steckt nur in den Vektorzeichnungen): die Positionsmaße
 * und die Formulierung der Handlungsanweisungen.
 */

import type { WorkflowDefinition } from "@craft-codex/core";

export const HAWA_COMBINO_WORKFLOW: WorkflowDefinition = {
  id: "hawa-combino-65-80-h-fs-ul",
  label: "Hawa Combino 65/80 H FS ul — 2 Türen",
  steps: [
    {
      id: "A.zuschnitt",
      label: "Schienen zuschneiden",
      instructions: [
        "Laufschiene KIM-1 auf Korpus-Innenmaß (KIM) kürzen.",
        "Abstand der Endbohrung zum Schienenende: max. 50 mm.",
        "Führungsschiene TB-2 auf Türbreite (TB) kürzen.",
      ],
      tools: ["Kappsäge (Alu-Blatt)", "Maßband"],
      relatedMarkingIds: ["schiene_kim", "schiene_tb"],
      checklist: [
        { id: "A.kim", label: "KIM-1 auf Korpus-Innenmaß gekürzt" },
        { id: "A.tb", label: "TB-2 auf Türbreite gekürzt" },
        { id: "A.grat", label: "Schnittkanten entgratet" },
      ],
      ragTopic: "schiene-zuschnitt",
    },
    {
      id: "B.daempfeinzug",
      label: "Dämpfeinzug einclipsen",
      instructions: [
        "Dämpfeinzug in die Laufschiene schieben — 4 Stück.",
        "Mitnehmer aufsetzen bis er hörbar einrastet (CLICK).",
        "Position auf Maß 122 mm ab Schienenende einstellen.",
        "Feststellschraube mit SW 3 anziehen.",
      ],
      tools: ["SW 3"],
      relatedMarkingIds: ["daempfer_at", "daempfer_it"],
      checklist: [
        { id: "B.click", label: "Alle 4 Mitnehmer hörbar eingerastet" },
        { id: "B.mass", label: "Maß 122 mm eingestellt" },
        { id: "B.z", label: "Z-Maß im Bereich 25–60 mm" },
      ],
      ragTopic: "daempfeinzug",
    },
    {
      id: "C.endanschlag",
      label: "Endanschläge setzen",
      instructions: [
        "Je einen Endanschlag links und rechts einsetzen (1× li / 1× re).",
        "Anschlag bis zum hörbaren Einrasten eindrücken (CLICK).",
        "Mit SW 3 in der Schiene klemmen.",
      ],
      tools: ["SW 3"],
      relatedMarkingIds: ["endanschlag_li", "endanschlag_re"],
      checklist: [
        { id: "C.li", label: "Endanschlag links eingerastet" },
        { id: "C.re", label: "Endanschlag rechts eingerastet" },
      ],
      ragTopic: "endanschlag",
    },
    {
      id: "D.schiene_montieren",
      label: "Schienen im Korpus verschrauben",
      instructions: [
        "Laufschiene oben bündig anlegen, Achsmaß 55 mm von der Vorderkante.",
        "Mit ø 3,5 × 35 verschrauben — Schraubabstand laut Schienenlochung.",
        "Alternativ ø 4,5 × 35 bei Korpusstärke ab 25 mm.",
        "Bodenführungsschiene mit ø 4,5 × 35 befestigen, Maß 70 mm.",
      ],
      tools: ["PZ No.2", "Bohrmaschine", "Maßband"],
      relatedMarkingIds: ["bohrung_laufschiene", "bohrung_bodenschiene"],
      checklist: [
        { id: "D.oben", label: "Laufschiene oben verschraubt (55 mm)" },
        { id: "D.unten", label: "Bodenschiene verschraubt (70 mm)" },
        { id: "D.lot", label: "Schienen fluchten, Korpus im Lot" },
      ],
      ragTopic: "schiene-montage",
    },
    {
      id: "E.tuer_bohren",
      label: "Türen bohren",
      instructions: [
        "Türen auf Bohrbild anzeichnen — Randabstand 113 mm.",
        "Topfbohrung Ø 25 mm, Tiefe 10 mm für den Beschlagtopf.",
        "Vorbohrungen Ø 3 mm, Tiefe 3 mm für die Befestigung.",
        "Achtung: Bohrbild für Aussentüre (AT) und Innentüre (IT) unterscheidet sich.",
      ],
      tools: ["Bohrmaschine", "Ø 25 Forstnerbohrer", "Ø 3 Holzbohrer"],
      relatedMarkingIds: ["bohrbild_at", "bohrbild_it", "topf_25"],
      checklist: [
        { id: "E.at", label: "Aussentüre gebohrt" },
        { id: "E.it", label: "Innentüre gebohrt" },
        { id: "E.tiefe", label: "Topftiefe 10 mm eingehalten" },
      ],
      ragTopic: "bohrbild",
    },
    {
      id: "F.1",
      label: "Laufwerk an Innentüre (IT)",
      instructions: [
        "Laufwerk auf die Innentüre setzen.",
        "Mit M3 × 6 verschrauben.",
      ],
      tools: ["TX 10"],
      relatedMarkingIds: ["laufwerk_it"],
      checklist: [{ id: "F.1.fest", label: "Laufwerk IT fest verschraubt" }],
      ragTopic: "laufwerk",
    },
    {
      id: "F.2",
      label: "Beschlagplatte Innentüre (IT)",
      instructions: ["Beschlagplatte IT mit 4,5 × 25 verschrauben."],
      tools: ["PZ No.2"],
      relatedMarkingIds: ["platte_it"],
      checklist: [{ id: "F.2.fest", label: "Platte IT fest" }],
      ragTopic: "beschlagplatte",
    },
    {
      id: "F.3",
      label: "Laufwerk an Aussentüre (AT)",
      instructions: [
        "Laufwerk auf die Aussentüre setzen.",
        "Mit M4 × 6 verschrauben.",
      ],
      tools: ["TX 20"],
      relatedMarkingIds: ["laufwerk_at"],
      checklist: [{ id: "F.3.fest", label: "Laufwerk AT fest verschraubt" }],
      ragTopic: "laufwerk",
    },
    {
      id: "F.4",
      label: "Beschlagplatte Aussentüre (AT)",
      instructions: ["Beschlagplatte AT mit 4,5 × 25 verschrauben."],
      tools: ["PZ No.2"],
      relatedMarkingIds: ["platte_at"],
      checklist: [{ id: "F.4.fest", label: "Platte AT fest" }],
      ragTopic: "beschlagplatte",
    },
    {
      id: "F.5",
      label: "Aussentüre einhängen",
      instructions: [
        "Aussentüre von unten in die Laufschiene einführen.",
        "Nach oben drücken bis das Laufwerk hörbar einrastet (CLICK).",
      ],
      tools: [],
      relatedMarkingIds: ["einhaengen_at"],
      checklist: [{ id: "F.5.click", label: "Einrasten gehört" }],
      ragTopic: "tuer-einhaengen",
    },
    {
      id: "F.6",
      label: "Dämpfeinzug Öffnungsrichtung",
      instructions: [
        "Dämpfeinzug für die Öffnungsrichtung an der AT montieren.",
        "Mit 4,5 × 25 verschrauben.",
      ],
      tools: ["PZ No.2"],
      relatedMarkingIds: ["daempfer_oeffnung"],
      checklist: [{ id: "F.6.fest", label: "Dämpfeinzug fest" }],
      ragTopic: "daempfeinzug",
    },
    {
      id: "F.7",
      label: "Höhenverstellung einstellen",
      instructions: [
        "Türen über die Exzenter auf Höhe und Fuge einstellen — 4 Stück.",
        "Mit M5 × 10 kontern.",
        "Sichtprüfung: Fuge gleichmäßig, Türen fluchten.",
      ],
      tools: ["TX 25"],
      relatedMarkingIds: ["exzenter"],
      checklist: [
        { id: "F.7.fuge", label: "Fuge gleichmäßig" },
        { id: "F.7.flucht", label: "Türen fluchten" },
        { id: "F.7.lauf", label: "Türen laufen leicht, Dämpfung greift" },
      ],
      ragTopic: "justierung",
    },
  ],
};
