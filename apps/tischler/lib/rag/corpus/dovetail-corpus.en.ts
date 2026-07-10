import type { RAGDocument } from "@craft-codex/core";
import type { DovetailLicense } from "./dovetail-corpus";

/**
 * Schwalbenschwanz-Wissenskorpus — ENGLISCHER Zwilling von dovetail-corpus.ts.
 *
 * Gleiche Dokument-IDs, gleiche topic-/source-/license-Keys, gleiche
 * source_urls; NUR text und title sind ins Englische übersetzt
 * (US English, Glossar docs/i18n/GLOSSARY.md).
 *
 * Attribution-Regeln:
 *  - CC-BY-SA-Volltexte (Wikipedia DE): Original-Attribution beibehalten,
 *    Marker "— translated from German Wikipedia" angehängt.
 *  - official-document (RIS): Original-Attribution beibehalten, Marker
 *    "— translated from the German original" angehängt; das wörtliche
 *    deutsche Original liegt im ris-corpus.
 *
 * Term-Entscheidungen: Streichmass=marking gauge, Schmiege=bevel gauge,
 * Anschlagwinkel=try square, Stemmeisen=chisel, Stechbeitel=paring chisel,
 * Gestellsaege=frame saw, ZpZ=TPI, Schraenkung=(saw) set, Holzhammer=mallet,
 * Hirnholz=end grain, Schwalben=tails, Pins/Zinken=pins.
 */

/** Zulaessige Lizenzen — sprachneutral, Re-Export unter EN-Namen. */
export { OPEN_CORE_LICENSES as OPEN_CORE_LICENSES_EN } from "./dovetail-corpus";

export const DOVETAIL_CORPUS_EN: RAGDocument[] = [
  // ─────────────────────────────────────────────────────────────────────
  // Phase 1: Bestand (10 Docs, paraphrasiert) — license: own-paraphrase
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "anriss-streichmass",
    text:
      "The layout is the foundation of every dovetail joint. With the " +
      "marking gauge, the board thickness is scribed all the way around " +
      "onto the end of the board — this line marks the maximum chopping " +
      "depth. Then the dovetail angles are set out with the bevel gauge at " +
      "1:6 (softwood) or 1:8 (hardwood). Important: run all layout lines " +
      "all the way around, so you can saw from both sides.",
    metadata: {
      source: "spannagel",
      title: "Der Moebelbau — layout technique",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "pin-verteilung",
    text:
      "Pin count and distribution depend on the board width. Rule of " +
      "thumb: for boards up to 100mm, 3-5 pins are enough; for wider " +
      "boards, use an odd number. An asymmetric layout (smaller outer " +
      "pins) is considered a mark of fine handwork — it shows the pins " +
      "were laid out by hand, not by machine. An even layout is more " +
      "economical for beginners.",
    metadata: {
      source: "spannagel",
      title: "Der Moebelbau — pin geometry",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "saegen-abfallseite",
    text:
      "When sawing, ALWAYS cut on the waste side of the layout line — the " +
      "layout line itself must remain standing as a fine mark. That " +
      "leaves material for fine-tuning when fitting. Klausz's " +
      "recommendation: saw the pins first, then scribe the tails from the " +
      "pins. This pins-first method reduces transfer errors. Saw blade: a " +
      "Japanese ryoba or a fine frame saw with 14-16 TPI.",
    metadata: {
      source: "klausz",
      title: "Dovetails by Hand — Sawing Technique",
      topic: "saegen",
      license: "own-paraphrase",
    },
  },
  {
    id: "schwalbenwinkel-ratio",
    text:
      "The dovetail angle describes the ratio of board thickness to " +
      "sideways offset. 1:8 (about 7°) is the standard for hardwood such " +
      "as oak or beech — the shallow angle is plenty, and steeper angles " +
      "would let the short grain at the tail tips break out. 1:6 (about " +
      "9.5°) is recommended for softwood such as pine or spruce: the " +
      "softer wood gives under load, so the steeper angle secures the " +
      "mechanical lock. Steeper than 1:4 is off limits — it breaks " +
      "under load.",
    metadata: {
      source: "klausz",
      title: "Dovetails by Hand — Angle Selection",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "stemmeisen-auswahl",
    text:
      "Chisel bevel: 25 degrees for softwood, 30 degrees for hardwood. " +
      "The paring chisel should be wider than the narrowest pin, so you " +
      "can chop cleanly between the tails in a single pass. A " +
      "mirror-polished cutting edge is essential — hone on waterstones " +
      "(8000 grit) shortly before each use. A dull chisel tears wood " +
      "fibers instead of cutting them, which ruins the fit.",
    metadata: {
      source: "pollak",
      title: "Holzverbindungen — tool knowledge",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "stemm-technik",
    text:
      "When chopping, first strike straight down into the layout line — " +
      "that keeps the chisel from tearing out below the line. Then split " +
      "the material away from below at a flat angle. Never chop deeper " +
      "than the marking-gauge line. Work alternately from both sides so " +
      "no end grain tears out on the back. Take off the last half " +
      "millimeter by hand with the paring chisel.",
    metadata: {
      source: "pollak",
      title: "Holzverbindungen — chopping technique",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "schwalbenschwanz-history",
    text:
      "The dovetail joint (German: Schwalbenschwanzverbindung) has been " +
      "documented since ancient Egypt — found in furniture from " +
      "Tutankhamun's tomb. It was refined over thousands of years and is " +
      "considered the crowning discipline of joinery in the European " +
      "cabinetmaker's trade. The mechanical interlock holds without glue " +
      "or screws. Main applications: drawer sides, jewelry boxes, chests.",
    metadata: {
      source: "wikipedia-de",
      title: "Dovetail joint — history",
      topic: "uebersicht",
      license: "own-paraphrase",
    },
  },
  {
    id: "passen-ist-soll",
    text:
      "Fitting is done dry (without glue). Carefully slide board B onto " +
      "board A — if it goes in without pressure, the fit is too loose and " +
      "the workpiece is unusable. If it binds too hard, identify the high " +
      "spots with the paring chisel (shiny spots from rubbing) and take " +
      "them off selectively. Goal: light taps with the mallet bring the " +
      "joint together without causing splits.",
    metadata: {
      source: "klausz",
      title: "Dovetails by Hand — Fitting",
      topic: "passen",
      license: "own-paraphrase",
    },
  },
  {
    id: "lehrplan-at-modul3",
    text:
      "Curriculum criteria for the Austrian cabinetmaking apprenticeship, " +
      "module 3 (wood joints): the dovetail joint must be mastered in " +
      "four steps — clean layout with marking gauge + bevel gauge, exact " +
      "sawing on the waste side, clean chopping without tear-out, tight " +
      "fit without visible gaps. Assessment: maximum gap 0.2mm, no " +
      "end-grain tear-out, even pin geometry.",
    metadata: {
      source: "lehrplan-at",
      title: "Cabinetmaking curriculum — module 3 criteria (paraphrased)",
      topic: "uebersicht",
      license: "own-paraphrase",
    },
  },
  {
    id: "haeufige-fehler",
    text:
      "Typical dovetail mistakes: (1) Pin too narrow — breaks when " +
      "driven home; at least 4mm at the narrowest point. (2) Saw blade " +
      "wandering — the cut runs skewed, the pin gets thinner toward the " +
      "bottom. (3) Chopped past the marking-gauge line — gap on the " +
      "board-face side. (4) Forgot to lay out all the way around — the " +
      "saw cut shoots through. (5) Impatient fitting with the mallet and " +
      "no dry fit — split pins.",
    metadata: {
      source: "barlieb-workshop",
      title: "INNOS workshop — failure patterns",
      topic: "pruefen",
      license: "own-paraphrase",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Wikipedia DE — Schwalbenschwanzverbindung (CC-BY-SA 4.0)
  // Quelle: https://de.wikipedia.org/wiki/Schwalbenschwanzverbindung
  // Stand: 2026-05-09 — Volltext gechunkt nach Sektionen, hier uebersetzt.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "wikipedia-schwalbenschwanz-beschreibung",
    text:
      "The dovetail joint resembles a tongue-and-groove joint in which " +
      "the shape of the tongue vaguely recalls the forked tail of a " +
      "swallow. Unlike a tongue-and-groove joint, it is form-locking to a " +
      "higher degree — not only across the dovetail, but also along its " +
      "length. The joint is assembled in the third direction, which " +
      "likewise lies across the dovetail.",
    metadata: {
      source: "wikipedia-de",
      title: "Dovetail joint — description",
      topic: "uebersicht",
      license: "CC-BY-SA-4.0",
      attribution:
        "Wikipedia DE Mitwirkende, Lizenz CC-BY-SA 4.0 — translated from German Wikipedia",
      source_url:
        "https://de.wikipedia.org/wiki/Schwalbenschwanzverbindung",
    },
  },
  {
    id: "wikipedia-schwalbenschwanz-tannenbaum",
    text:
      "Designs with multiple teeth are called a fir-tree joint " +
      "(Tannenbaumverbindung). This form is widespread above all for " +
      "fastening the rotor blades of turbomachines, since high " +
      "centrifugal forces can be distributed over several contact " +
      "surfaces. The fir-tree geometry is a variant of the dovetail joint " +
      "with several form-locking steps instead of a single one.",
    metadata: {
      source: "wikipedia-de",
      title: "Dovetail joint — fir-tree joint",
      topic: "uebersicht",
      license: "CC-BY-SA-4.0",
      attribution:
        "Wikipedia DE Mitwirkende, Lizenz CC-BY-SA 4.0 — translated from German Wikipedia",
      source_url:
        "https://de.wikipedia.org/wiki/Schwalbenschwanzverbindung",
    },
  },
  {
    id: "wikipedia-schwalbenschwanz-anwendungen-holz",
    text:
      "In wood joinery, dovetail joints need no additional metal " +
      "fasteners. They are used in cabinetmaking to join solid wood in " +
      "drawers, chests, and musical instruments. A further application " +
      "lies in timber framing, where dovetail joints make load-bearing " +
      "connections possible without nails or screws.",
    metadata: {
      source: "wikipedia-de",
      title: "Dovetail joint — applications in wood",
      topic: "uebersicht",
      license: "CC-BY-SA-4.0",
      attribution:
        "Wikipedia DE Mitwirkende, Lizenz CC-BY-SA 4.0 — translated from German Wikipedia",
      source_url:
        "https://de.wikipedia.org/wiki/Schwalbenschwanzverbindung",
    },
  },
  {
    id: "wikipedia-schwalbenschwanz-anwendungen-maschinenbau",
    text:
      "In mechanical engineering, dovetail connections are used to fasten " +
      "the blades to the rotor of a turbomachine. In machine tools, a " +
      "trapezoidal groove is machined into the machine table to accept " +
      "clamping irons; clamping claws are slid in from the side. Dovetail " +
      "ways permit form-locking sliding guides that allow linear " +
      "translation, and can also be realized as rolling-element guides. " +
      "Another application is the quick mounting of cameras on tripods.",
    metadata: {
      source: "wikipedia-de",
      title: "Dovetail joint — applications in mechanical engineering",
      topic: "uebersicht",
      license: "CC-BY-SA-4.0",
      attribution:
        "Wikipedia DE Mitwirkende, Lizenz CC-BY-SA 4.0 — translated from German Wikipedia",
      source_url:
        "https://de.wikipedia.org/wiki/Schwalbenschwanzverbindung",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Lehrplan AT — Tischlerei-Ausbildungsordnung (offizielles Dokument)
  // Quelle: RIS BKA Gesetzesnummer 20011991
  // Stand: 2026-05-09 — Zitate hier als ÜBERSETZUNG; deutsches Original
  // liegt im ris-corpus.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "lehrplan-at-tischlerei-verbindungen",
    text:
      "In competence area 4 (cabinetmaking work), under 4.3 work " +
      "execution, the Austrian cabinetmaking training regulation " +
      "explicitly requires: 'producing detachable and permanent joints, " +
      "in particular glue joints, half-laps, mortise-and-tenon joints, " +
      "dovetail joints, dowel joints, biscuit joints, and connections " +
      "using hardware'. This competence is assigned to all three years of " +
      "the apprenticeship.",
    metadata: {
      source: "ris-bka-at",
      title: "Cabinetmaking training regulation — competence 4.3.15",
      topic: "uebersicht",
      license: "official-document",
      attribution:
        "Republik Oesterreich, RIS-BKA Gesetzesnummer 20011991, oeffentliche Verordnung — translated from the German original",
      source_url:
        "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011991",
    },
  },
  {
    id: "lehrplan-at-tischlerei-bearbeitung",
    text:
      "Under 4.3 work execution, the cabinetmaking training regulation " +
      "explicitly lists manual woodworking: 'working materials and " +
      "workpieces, in particular measuring, laying out, full-size layout, " +
      "planing, sawing, chopping, drilling, sanding, shaping curves, " +
      "jointing, routing'. Laying out and chopping are thus already " +
      "bindingly required by the public occupational profile — and the " +
      "dovetail is one of the required 'Zinkenverbindungen' (dovetail " +
      "joints).",
    metadata: {
      source: "ris-bka-at",
      title: "Cabinetmaking training regulation — work execution",
      topic: "uebersicht",
      license: "official-document",
      attribution:
        "Republik Oesterreich, RIS-BKA Gesetzesnummer 20011991, oeffentliche Verordnung — translated from the German original",
      source_url:
        "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011991",
    },
  },
  {
    id: "lehrplan-at-tischlerei-berufsprofil",
    text:
      "The occupational profile of the cabinetmaking training regulation " +
      "describes the qualification as a 'Schwerpunktlehrberuf' (an " +
      "apprenticeship trade with a specialization focus), three years " +
      "plus a specialization in 'general cabinetmaking' or 'wood " +
      "turning'. In the shared competence area of cabinetmaking work, the " +
      "graduating apprentice must produce sketches and production-ready " +
      "drawings, keep tools ready for use, and master different " +
      "material-working processes such as sawing, sanding, or lacquering. " +
      "The dovetail joint is a concrete instance of the required " +
      "'Zinkenverbindungen' (dovetail joints).",
    metadata: {
      source: "ris-bka-at",
      title: "Cabinetmaking training regulation — occupational profile",
      topic: "uebersicht",
      license: "official-document",
      attribution:
        "Republik Oesterreich, RIS-BKA Gesetzesnummer 20011991, oeffentliche Verordnung — translated from the German original",
      source_url:
        "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011991",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Eigene paraphrasierte Erweiterung — Anreissen (6 Docs)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "anreissen-schmiege-einstellen",
    text:
      "The bevel gauge is set to the chosen dovetail angle — usually " +
      "against a numbered scale with the standard ratios 1:6 and 1:8. " +
      "Before laying out, check the setting on a scrap piece: make a " +
      "short stroke, then cross-check with the try square. A skewed bevel " +
      "gauge produces unsymmetrical pins and ruins the joint before the " +
      "first saw cut. Tip: set it once per workpiece and don't touch it " +
      "again.",
    metadata: {
      source: "own-paraphrase",
      title: "Setting + checking the bevel gauge",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-streichmass-justierung",
    text:
      "The marking gauge is set to the exact board thickness of the " +
      "mating piece — not to the thickness of the current workpiece. For " +
      "board B (pins), the line on board A (tails) must be calibrated to " +
      "B's thickness. Marking-gauge materials: wooden bodies are " +
      "traditional, metal cutters hold their edge longer. The cutter must " +
      "be razor sharp — a dull cutter tears fibers instead of scribing " +
      "cleanly.",
    metadata: {
      source: "own-paraphrase",
      title: "Marking gauge — adjustment + materials",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-hirnholz-markierung",
    text:
      "On the end grain, a cross or a single stroke is traditionally " +
      "drawn to tell tails and pins apart unambiguously. The cross marks " +
      "the waste zone between the pins, the stroke marks the tails to " +
      "keep. When sawing, you orient yourself by this marking — leave a " +
      "cross standing and you've cut the workpiece mirror-reversed, and " +
      "the joint won't fit. Make the marking with a pencil in the waste " +
      "zone; don't scribe it in.",
    metadata: {
      source: "own-paraphrase",
      title: "End-grain marking: cross vs stroke",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-uebertragung-brett-zu-brett",
    text:
      "With the pins-first method, the pins are sawed and chopped out " +
      "completely first — then board A (tails) is stood on board B " +
      "(pins) and marked along the pin edges with the marking knife. The " +
      "board must be perfectly aligned — the slightest offset creates " +
      "gaps. Aids: a clamp to hold it, a flat workbench, and a sharp " +
      "marking knife (no pencil — it's too thick). The transferred lines " +
      "define the tail geometry.",
    metadata: {
      source: "own-paraphrase",
      title: "Transfer board A → board B (pins-first)",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-pin-symmetrie-tradition",
    text:
      "A symmetric pin layout (all pins equally wide) is faster by " +
      "machine and standard for industrial drawers. An asymmetric layout " +
      "(small pins outside, wider ones inside) is considered a mark of " +
      "quality in the traditional cabinetmaker's trade — it shows the " +
      "joint was laid out by hand. English drawer tradition: outer pins " +
      "as narrow as structurally sensible (about 4-5mm) for a more " +
      "delicate look. Functionally it makes no difference — both hold " +
      "identically.",
    metadata: {
      source: "own-paraphrase",
      title: "Symmetric vs asymmetric pin layout",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-anreissmesser-vs-bleistift",
    text:
      "The marking knife leaves a knife-thin line that doubles as a " +
      "sawing aid — the saw can register itself in this line. A pencil " +
      "stroke is 0.3-0.5mm thick and allows no precision below 0.5mm. " +
      "Rule of thumb: marking knife for all final lines (saw edge, " +
      "marking-gauge line), pencil only for marks in the waste zone (pin " +
      "centers, crosses). If you saw to a pencil line, you can't hit a " +
      "0.1mm tolerance either.",
    metadata: {
      source: "own-paraphrase",
      title: "Marking knife vs pencil — the precision gap",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Eigene paraphrasierte Erweiterung — Saegen (5 Docs)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "saegen-ryoba-vs-dozuki-vs-gestellsaege",
    text:
      "Three classic saws for dovetails: (1) Japanese ryoba — " +
      "double-edged blade with crosscut + rip teeth, very flexible. (2) " +
      "Japanese dozuki — back-stiffened precision saw, ideal for the " +
      "finest tail cuts. (3) Western frame saw (continental) — sturdy, " +
      "for hardwood, slightly wider in the cut. Beginners often benefit " +
      "from the dozuki — the back forces the cut straight. Professionals " +
      "vary by wood species.",
    metadata: {
      source: "own-paraphrase",
      title: "Ryoba vs dozuki vs frame saw",
      topic: "saegen",
      license: "own-paraphrase",
    },
  },
  {
    id: "saegen-koerperhaltung-fuehrung",
    text:
      "Sawing posture decides cutting precision: workpiece clamped at " +
      "eye level or slightly below, shoulders square, the forearm of the " +
      "sawing hand in line with the saw blade. The cut is guided with " +
      "the whole arm, not just the wrist — the wrist only fixes the " +
      "angle. Don't hold your breath. Ergonomically correct: stand " +
      "offset slightly to the side, so the saw stroke runs in a straight " +
      "line.",
    metadata: {
      source: "own-paraphrase",
      title: "Sawing posture + body position",
      topic: "saegen",
      license: "own-paraphrase",
    },
  },
  {
    id: "saegen-zugsaege-vs-stosssaege",
    text:
      "Japanese saws cut on the pull stroke — the blade is under tension " +
      "during the pull and can therefore be very thin (0.3-0.4mm kerf). " +
      "Western saws cut on the push stroke — the blade must be stiffer " +
      "so it won't buckle (0.6-0.8mm kerf). Consequence: Japanese saws " +
      "are more accurate but more delicate, Western saws more forgiving " +
      "but wider in the cut. For dovetails in hardwood, a thin Japanese " +
      "saw pays off because of the narrow pins.",
    metadata: {
      source: "own-paraphrase",
      title: "Pull saw vs push saw — tradition + mechanics",
      topic: "saegen",
      license: "own-paraphrase",
    },
  },
  {
    id: "saegen-zpz-auswahl",
    text:
      "TPI (teeth per inch) determines cutting speed and surface " +
      "quality. For dovetails, 14-20 TPI is the sweet spot. Fewer TPI " +
      "(8-10) cuts faster but leaves rough saw edges that need rework. " +
      "More TPI (22-26) cuts super fine but is slow and tends to clog " +
      "with chips. For end grain (along the grain): crosscut teeth. For " +
      "the board's end face (across the grain): rip teeth. The wrong " +
      "tooth pattern causes tear-out.",
    metadata: {
      source: "own-paraphrase",
      title: "TPI — choosing teeth per inch",
      topic: "saegen",
      license: "own-paraphrase",
    },
  },
  {
    id: "saegen-schraenkung-saw-set",
    text:
      "The set is the sideways bend of the saw teeth — it makes the kerf " +
      "wider than the blade itself, so the blade won't bind. Too much " +
      "set produces a rough cut; too little makes the blade run hot from " +
      "friction. The set is readjusted with a saw set. On Japanese saws " +
      "the set comes from the factory and should not be adjusted " +
      "yourself — replacing the blade is customary. On Western frame " +
      "saws, regular setting is mandatory.",
    metadata: {
      source: "own-paraphrase",
      title: "Tooth set — saw-set adjustment",
      topic: "saegen",
      license: "own-paraphrase",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Eigene paraphrasierte Erweiterung — Stemmen (5 Docs)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "stemmen-pflege-honung",
    text:
      "Chisel care is mandatory: before every use, the edge is honed on " +
      "waterstones. Standard program: 1000 grit for coarse honing, 4000 " +
      "for fine, 8000 for polish. The mirror-polish test: you must be " +
      "able to see your eyebrow in it. Soak waterstones in water for " +
      "5-10 minutes before use, otherwise they clog against the chisel " +
      "instead of cutting. After honing: dry the chisel briefly and wipe " +
      "on a thin coat of camellia oil against rust.",
    metadata: {
      source: "own-paraphrase",
      title: "Chisel care + waterstones",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "stemmen-werkbank-aufspannung",
    text:
      "When chopping, the workpiece must be clamped immovably. A " +
      "workbench with front vise + tail vise is the gold standard. " +
      "Alternatively, clamps with wooden protective jaws. Important: " +
      "clamp close to the chopping area, not 30cm away — otherwise the " +
      "workpiece vibrates under the blow and the chisel slips. For " +
      "dovetail chopping, the board must be able to stand vertically, so " +
      "you can chop into the end grain from above. A pin clamping batten " +
      "helps with repeated setups.",
    metadata: {
      source: "own-paraphrase",
      title: "Workbench + clamping the workpieces",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "stemmen-holzhammer-auswahl",
    text:
      "The mallet for chopping work: traditionally made of hornbeam, " +
      "weight 400-600g. Too light (under 300g) needs more blows and " +
      "tires the hand; too heavy (over 800g) leads to overshooting " +
      "cuts. Plastic mallets (polyamide) are an alternative — they " +
      "don't wreck the chisel handle as quickly. Never use a metal " +
      "hammer — it splits the handle apart. The blow should be sudden " +
      "and short, not prolonged tapping.",
    metadata: {
      source: "own-paraphrase",
      title: "Choosing a mallet — weight + material",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "stemmen-auflage-restholz",
    text:
      "When chopping, a piece of scrap wood must lie under the " +
      "workpiece — otherwise the end grain splinters out on the back. " +
      "The scrap (beech, at least 15mm thick) catches the chisel as it " +
      "breaks through and defines a clean exit edge. Classic beginner's " +
      "mistake: chopping the workpiece on the bare workbench — the " +
      "benchtop gets battered AND the workpiece tears out. Check the " +
      "scrap after every session and flip it if needed.",
    metadata: {
      source: "own-paraphrase",
      title: "Scrap-wood backing — protection against end-grain tear-out",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "stemmen-brust-vs-schlag",
    text:
      "Two chopping techniques: (1) Paring — the chisel driven with the " +
      "chest or shoulder, without a mallet, for fine cleanup and shiny " +
      "spots. Precise but strenuous. (2) Mallet chopping — with the " +
      "mallet, fast and powerful, for bulk material removal. The typical " +
      "dovetail uses both: first mallet chopping to remove the material " +
      "between the pins roughly (80% of the volume), then paring to " +
      "shave the last 0.5mm down to the marking-gauge line.",
    metadata: {
      source: "own-paraphrase",
      title: "Paring vs mallet chopping",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Eigene paraphrasierte Erweiterung — Passen (4 Docs)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "passen-trocken-test-pflicht",
    text:
      "The dry fit is NOT optional. Before any glue touches the " +
      "workpiece, the joint must be pushed together dry. A cursory check " +
      "is not enough — full depth must be reached, without breaking the " +
      "pins. If the dry fit reveals an area that's too tight, take " +
      "material off selectively with the paring chisel. Skip the dry fit " +
      "and go straight to glue, and you lose the workpiece — glue " +
      "starts to grab after just 30 seconds, and corrections are then " +
      "impossible.",
    metadata: {
      source: "own-paraphrase",
      title: "The dry fit is mandatory",
      topic: "passen",
      license: "own-paraphrase",
    },
  },
  {
    id: "passen-glanzstellen-diagnose",
    text:
      "Shiny spots form during the dry fit from rubbing at tight areas — " +
      "the wood gets lightly burnished and gleams in raking light. They " +
      "are the most important diagnostic information when fitting. " +
      "Method: after the dry fit, hold the workpiece against incoming " +
      "light and scan the inner faces of the tails. Shine on a tail " +
      "cheek = take it off with the paring chisel (0.1-0.2mm). Shine on " +
      "the pin end grain = the pin is too long. No shine, but the " +
      "workpiece binds = the marking-gauge line sits too high.",
    metadata: {
      source: "own-paraphrase",
      title: "Identifying shiny spots when fitting",
      topic: "passen",
      license: "own-paraphrase",
    },
  },
  {
    id: "passen-eckiger-pin-vs-spalt",
    text:
      "Diagnosis matrix for dovetail fit: (1) A pin catching square at " +
      "the tail opening = pin too wide at the top; lightly chamfer the " +
      "pin's top edge with the paring chisel. (2) Visible gap at the " +
      "marking-gauge line = pin too short, or gauge line too high. (3) " +
      "Gap on one side only = the saw cut was skewed. (4) Board standing " +
      "proud = the board is wider than planned; plane it flush at the " +
      "bench. (5) Loose fit = unusable workpiece, start over.",
    metadata: {
      source: "own-paraphrase",
      title: "Catching pin vs gap — diagnosis matrix",
      topic: "passen",
      license: "own-paraphrase",
    },
  },
  {
    id: "passen-letzter-schliff-stechbeitel",
    text:
      "The final pass before glue-up is done with the paring chisel — " +
      "not with sandpaper (which rounds the edges and ruins the crisp " +
      "pin geometry). Using the paring technique, shiny spots are taken " +
      "off precisely, 0.1mm per pass. Dry-fit again between every pass. " +
      "Goal: board B seats fully in board A with light mallet taps, " +
      "without shiny spots, without a gap, without a pin standing proud. " +
      "Maximum layer 0.05mm for the very last pass.",
    metadata: {
      source: "own-paraphrase",
      title: "The final pass with the paring chisel",
      topic: "passen",
      license: "own-paraphrase",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Eigene paraphrasierte Erweiterung — Pruefen (4 Docs)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "pruefen-soll-ist-diff-visuell",
    text:
      "Visual target-vs-actual check of the finished joint: scan from " +
      "three distances — (1) From 30cm away: does the joint look tight, " +
      "or does it gape? (2) From 10cm: are the tail slopes straight or " +
      "wavy? (3) From 2cm in raking light: do you see gaps or end-grain " +
      "tear-out? A finished dovetail joint should look as if made from " +
      "one piece — the individual pins should barely stand out in the " +
      "30cm test.",
    metadata: {
      source: "own-paraphrase",
      title: "Visual target-vs-actual check — 3 distances",
      topic: "pruefen",
      license: "own-paraphrase",
    },
  },
  {
    id: "pruefen-spalt-toleranz-klassen",
    text:
      "Gap tolerance classes for assessment: (1) Professional level: at " +
      "most 0.1mm of gap, not detectable with a loupe. (2) Journeyman / " +
      "apprentice level 3: at most 0.2mm of gap, not visible to the " +
      "naked eye at a distance. (3) Apprentice level 1: at most 0.5mm of " +
      "gap, acceptable for dry practice pieces. Over 1mm of gap = " +
      "unusable workpiece. Measuring aids: feeler gauge (0.1mm blade) or " +
      "a matchstick (0.5mm). Assess in raking light from 30cm.",
    metadata: {
      source: "own-paraphrase",
      title: "Gap tolerance classes — professional/apprentice",
      topic: "pruefen",
      license: "own-paraphrase",
    },
  },
  {
    id: "pruefen-hirnholz-ausriss",
    text:
      "Recognizing end-grain tear-out: at the transition between tail " +
      "and pin, a small splinter typically appears when the chisel went " +
      "through without scrap-wood backing. Diagnosis: hold the part with " +
      "its end-grain side against the light; tear-out shows up as a " +
      "small breakout. Repair is usually not possible — a splinter glued " +
      "back with wood glue works functionally, but stays visible. Better " +
      "to start over than to try to hide it — the apprentice mentality " +
      "of 'it'll be fine' is deadly here.",
    metadata: {
      source: "own-paraphrase",
      title: "Recognizing + assessing end-grain tear-out",
      topic: "pruefen",
      license: "own-paraphrase",
    },
  },
  {
    id: "pruefen-pin-symmetrie-messen",
    text:
      "Measuring pin symmetry: with calipers, measure the width of each " +
      "pin at its top and bottom edge. With a symmetric layout: all pins " +
      "equal within +-0.2mm. With an asymmetric layout: the scheme " +
      "should be continuous — small-medium-large-medium-small, not " +
      "random. A sketch of the pin distribution BEFORE laying out helps " +
      "— then you can compare objectively against target values at the " +
      "end. Strongly differing pin widths point to a misadjusted bevel " +
      "gauge or saw drift.",
    metadata: {
      source: "own-paraphrase",
      title: "Measuring pin symmetry with calipers",
      topic: "pruefen",
      license: "own-paraphrase",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Eigene paraphrasierte Erweiterung — Werkzeugkunde (5 Docs)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "werkzeug-schmiege-aufbau",
    text:
      "The bevel gauge consists of two legs that pivot on a locking " +
      "screw. Classic build: wooden legs with brass fittings, " +
      "alternatively all-metal. Most bevel gauges also carry a numbered " +
      "scale for common angles (1:6, 1:8, 45 degrees). Care: don't " +
      "overtighten the locking screw; keep the legs' contact faces clean " +
      "— wood chips between the legs falsify the angle. Before every " +
      "layout, check the set angle against the try square.",
    metadata: {
      source: "own-paraphrase",
      title: "Bevel gauge — construction + scale",
      topic: "werkzeug",
      license: "own-paraphrase",
    },
  },
  {
    id: "werkzeug-streichmass-holz-vs-metall",
    text:
      "Marking-gauge designs: (1) Wooden body with wooden wedge — " +
      "traditional, light, cheap, but the wedge shifts with humidity " +
      "swings. (2) All-metal with micrometer screw — pricier, more " +
      "precise, insensitive to humidity. (3) Wooden body with metal " +
      "clamping hinge — the compromise. Cutter material: hardened steel " +
      "is a must, ground to a point like a tiny marking knife. Care: " +
      "resharpen the cutter regularly on a fine stone, store it lightly " +
      "oiled.",
    metadata: {
      source: "own-paraphrase",
      title: "Marking gauge — wooden body vs metal",
      topic: "werkzeug",
      license: "own-paraphrase",
    },
  },
  {
    id: "werkzeug-saegen-tradition-west-japan",
    text:
      "Western saw tradition: thick saw blades, settable teeth, " +
      "developed for the push cut — robust and repairable. Japanese " +
      "tradition: super-thin blades, factory-set, pull cut — the finest " +
      "cut, but delicate. Both traditions produce outstanding dovetails; " +
      "the choice is a matter of taste. A workshop mix makes sense: " +
      "Japanese saw for precision, Western saw as the rugged everyday " +
      "workhorse. More important than tradition: a sharp, straight, " +
      "true-running saw.",
    metadata: {
      source: "own-paraphrase",
      title: "Western saw vs Japanese saw — tradition + practice",
      topic: "werkzeug",
      license: "own-paraphrase",
    },
  },
  {
    id: "werkzeug-stemmeisen-groessen-set",
    text:
      "Chisel set for dovetails: at least 6mm, 12mm, and 20mm narrow " +
      "chisels. Optional: skew chisels for hard-to-reach pin corners — " +
      "they get into inside pin corners where a straight chisel won't " +
      "fit. Material: good tool steel (CrV or PM-V11), handle of " +
      "hornbeam or ash with a striking hoop. Set tip: better 3 superbly " +
      "maintained chisels than 12 dull ones. Brands: Lie-Nielsen, " +
      "Stanley Sweetheart, Veritas, Two Cherries — every price class " +
      "has usable options.",
    metadata: {
      source: "own-paraphrase",
      title: "Chisel size set + material",
      topic: "werkzeug",
      license: "own-paraphrase",
    },
  },
  {
    id: "werkzeug-honungsbank-setup",
    text:
      "A honing station belongs in every workshop: a solid base (a " +
      "workbench corner), waterstones in a plastic tray (so the water " +
      "doesn't flood the whole workpiece), a leather strop for the final " +
      "pass, a clean cloth for drying. Ergonomics: the stones should sit " +
      "at belly height, not too high — when honing you need to be able " +
      "to press downward. Budget at least 5 minutes per chisel. A poorly " +
      "kept workshop fundamentally does not produce good dovetails.",
    metadata: {
      source: "own-paraphrase",
      title: "Honing station setup",
      topic: "werkzeug",
      license: "own-paraphrase",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Eigene paraphrasierte Erweiterung — Holzkunde (4 Docs)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "holzkunde-harthoelzer-eiche-buche-esche",
    text:
      "Hardwoods for dovetails: (1) Oak — strong, durable, classic for " +
      "drawers. Contains tannic acid; don't combine with iron nails. " +
      "(2) Beech — denser than oak, good for chopping, but prone to " +
      "warping with humidity swings. (3) Ash — elastic and " +
      "shock-resistant, above all for joints under load. In common: all " +
      "three benefit from the 1:8 dovetail angle and sharp tools. Don't " +
      "go shallower than 1:8, or the lock won't fully engage.",
    metadata: {
      source: "own-paraphrase",
      title: "Hardwoods — oak, beech, ash",
      topic: "holzkunde",
      license: "own-paraphrase",
    },
  },
  {
    id: "holzkunde-weichholz-kiefer-fichte-tanne",
    text:
      "Softwood for dovetails has its own pitfalls: (1) Pine — " +
      "resinous, gums up the saw blade, needs regular cleaning. (2) " +
      "Spruce — splinters easily when chopped, sharp tools are " +
      "mandatory. (3) Fir — like spruce, a touch softer still. In " +
      "general: dovetail angle 1:6 instead of 1:8 — the soft wood gives, " +
      "so the steeper angle keeps the lock engaged. Guide the saw cut slowly " +
      "— a fast cut tears fibers. Minimum pin width 6mm instead of 4mm.",
    metadata: {
      source: "own-paraphrase",
      title: "Softwood — pine, spruce, fir",
      topic: "holzkunde",
      license: "own-paraphrase",
    },
  },
  {
    id: "holzkunde-faserrichtung-hirnholz",
    text:
      "Recognizing grain direction is the prerequisite for a clean cut. " +
      "End grain (the end face) shows growth rings — here you saw " +
      "across the grain, which leaves rough cut edges. The board edge " +
      "(long side) shows parallel lines — here you plane along the " +
      "grain, which gives smooth surfaces. In a dovetail: pins are " +
      "chopped into the end grain (across the grain), tails are shaped " +
      "in the body of the board (along the grain). This asymmetry " +
      "explains why the tools must be treated differently.",
    metadata: {
      source: "own-paraphrase",
      title: "Grain direction + identifying end grain",
      topic: "holzkunde",
      license: "own-paraphrase",
    },
  },
  {
    id: "holzkunde-feuchteausgleich",
    text:
      "Wood works — it takes up moisture from the air and releases it " +
      "again. Before working it, the wood must acclimate in the " +
      "workshop for at least 2-4 weeks, or the finished joint will " +
      "distort. Ideal workshop climate: 50-60% relative humidity. Rule " +
      "of thumb: 1mm of movement per 100mm of board width for a 20% " +
      "change in moisture. For dovetails this means: the 1:6 dovetail " +
      "angle usually tolerates this movement, 1:4 would break. Before " +
      "glue-up: check the wood with a moisture meter, target <= 12% " +
      "wood moisture for indoor furniture.",
    metadata: {
      source: "own-paraphrase",
      title: "Moisture equalization before working",
      topic: "holzkunde",
      license: "own-paraphrase",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Eigene paraphrasierte Erweiterung — Sicherheit (3 Docs)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "sicherheit-augenschutz-spaene",
    text:
      "Eye protection is mandatory when chopping: a flying wood " +
      "splinter can seriously injure an eye. Safety glasses with side " +
      "shields, EN166 certified. With hardwood and mallet chopping, " +
      "small splinters fly regularly — don't take the glasses off " +
      "'just for this one cut'. When sanding and drilling too: glasses " +
      "on. Workshop rule: no glasses = no machine. In addition, a P2 " +
      "respirator when sanding hardwood, because of the cancer risk " +
      "from oak dust (per the MAK list).",
    metadata: {
      source: "own-paraphrase",
      title: "Eye protection + respiratory protection in the workshop",
      topic: "sicherheit",
      license: "own-paraphrase",
    },
  },
  {
    id: "sicherheit-werkstueck-aufnahme",
    text:
      "Cut-safe workholding is mandatory when sawing and chopping. " +
      "Never hold the workpiece with your free hand — bench clamps, " +
      "bench dogs, or fixtures are the correct solutions. When sawing " +
      "with a Japanese saw: clamp the workpiece in a sawhorse or " +
      "between bench dogs, both hands on the tool. Cut injuries in the " +
      "cabinetmaker's trade happen primarily through inadequate " +
      "workholding — the second hand on the workpiece instead of on " +
      "the tool. Standard: 1m of distance between your free hand and " +
      "the cut line.",
    metadata: {
      source: "own-paraphrase",
      title: "Cut-safe workholding",
      topic: "sicherheit",
      license: "own-paraphrase",
    },
  },
  {
    id: "sicherheit-erste-hilfe-werkstatt",
    text:
      "First-aid kit in the workshop: sterile wound dressings, pressure " +
      "bandage, adhesive bandages in various sizes, disinfectant, " +
      "splinter tweezers, eye wash, list of emergency numbers. Location " +
      "clearly visible at the workshop door, not behind stacks of " +
      "workpieces. Check yearly for shelf life — disinfectant and wound " +
      "dressings expire. For deeper cuts: apply pressure, raise the " +
      "hand, call emergency services (144 in Austria, 112 in the EU). " +
      "Never pull large splinters out of an eye yourself — go straight " +
      "to an eye doctor.",
    metadata: {
      source: "own-paraphrase",
      title: "First-aid kit in the workshop",
      topic: "sicherheit",
      license: "own-paraphrase",
    },
  },
];

/**
 * Liefert eine frische Kopie des EN-Korpus.
 *
 * Wichtig: zurueckgegebene Documents sind shallow-copy — die metadata-Objekte
 * werden geteilt. Wer mutieren will, soll structuredClone() nutzen.
 */
export function getDovetailCorpusEn(): RAGDocument[] {
  return DOVETAIL_CORPUS_EN.map((doc) => ({ ...doc }));
}

/**
 * Liefert nur EN-Documents, deren metadata.topic einem der gewuenschten
 * Topics entspricht. Hilfreich fuer step-spezifische Voice-Antworten.
 */
export function getDovetailCorpusByTopicEn(
  topics: ReadonlyArray<string>,
): RAGDocument[] {
  const set = new Set(topics);
  return DOVETAIL_CORPUS_EN.filter(
    (doc) =>
      typeof doc.metadata.topic === "string" && set.has(doc.metadata.topic),
  ).map((doc) => ({ ...doc }));
}

/**
 * Liefert nur EN-Documents, deren metadata.license in der erlaubten Liste
 * ist. Use-Case wie im deutschen Original (Open-Core Lehrling-EDU).
 */
export function getDovetailCorpusByLicenseEn(
  licenses: ReadonlyArray<DovetailLicense>,
): RAGDocument[] {
  const set = new Set<string>(licenses);
  return DOVETAIL_CORPUS_EN.filter((doc) => {
    const lic = doc.metadata.license;
    return typeof lic === "string" && set.has(lic);
  }).map((doc) => ({ ...doc }));
}
