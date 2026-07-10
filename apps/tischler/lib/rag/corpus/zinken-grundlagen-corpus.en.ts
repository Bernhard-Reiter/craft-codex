import type { RAGDocument } from "@craft-codex/core";

/**
 * Zinken-GRUNDLAGEN-Korpus — ENGLISCHER Zwilling von
 * zinken-grundlagen-corpus.ts.
 *
 * Gleiche Dokument-IDs, gleiche topic-/source-/license-Keys, gleiche
 * source_urls; NUR text, title und die beschreibende attribution sind ins
 * Englische übersetzt (US English, Glossar docs/i18n/GLOSSARY.md).
 *
 * Wichtige Term-Entscheidungen: Zinken=pins, Schwalben=tails,
 * Randzinken=half pins, Hirnholz=end grain, Gratung=sliding dovetail,
 * Anreissen=laying out, Streichmass=marking gauge, Tischler=cabinetmaker.
 *
 * Das amtliche Zitat (zinken-amtlicher-rahmen-at) ist als ÜBERSETZUNG
 * gekennzeichnet — das wörtliche deutsche Original liegt im ris-corpus.
 */

export const ZINKEN_GRUNDLAGEN_CORPUS_EN: RAGDocument[] = [
  // ─────────────────────────────────────────────────────────────────────
  // GRUNDLAGEN — Was ist das? Wofuer? (Laien-Einstieg)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "zinken-was-ist-das",
    text:
      "What is a pin? Pins and tails are the interlocking teeth of a " +
      "dovetail joint (in German: Zinkung) — a corner joint between two " +
      "boards. At the end face — the end grain — each board is cut into a " +
      "comb-like pattern across its full width: teeth (pins on one board, " +
      "tails on the other) with gaps in between. Slide the two boards " +
      "together at the corner and every tooth of one board drops exactly " +
      "into a gap of the other — the boards mesh like the fingers of two " +
      "folded hands. Dovetailing is considered the most labor-intensive, " +
      "but also the most attractive, of the traditional wood joints. For a " +
      "layperson, in one sentence: two wooden edges that interlock like a " +
      "puzzle and form a solid corner.",
    metadata: {
      source: "wikipedia-de",
      title: "Dovetail joint — what it is (layperson's definition)",
      topic: "grundlagen",
      license: "own-paraphrase",
      source_url: "https://de.wikipedia.org/wiki/Holzverbindung",
      attribution: "paraphrased from German Wikipedia (CC-BY-SA-4.0), articles Holzverbindung/Zinkung",
    },
  },
  {
    id: "zinken-wofuer",
    text:
      "What are dovetails good for? Dovetail joints connect boards at the " +
      "corners into a carcass — that is, a box. Classic applications: " +
      "drawers, chests, boxes, jewelry boxes, tool chests, and even " +
      "musical instruments. Three reasons to choose such a labor-intensive " +
      "joint: (1) Strength — the many interlocking surfaces add up to a " +
      "huge glue area and hold extremely well. (2) With the dovetail, the " +
      "joint is mechanically locked even WITHOUT glue or screws: it " +
      "resists pull on its own, because the wedge-shaped tails hook behind " +
      "the pins. (3) It looks beautiful — the visible interlock is read as " +
      "a mark of craftsmanship. On top of that, the joint lets the wood " +
      "keep moving (swelling and shrinking) without the corner cracking open.",
    metadata: {
      source: "own-paraphrase",
      title: "What dovetails are good for — uses + advantages",
      topic: "grundlagen",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinken-begriffe-grundvokabular",
    text:
      "Basic vocabulary of dovetailing — the terms a beginner needs " +
      "first: PINS are the narrow teeth that stand proud on one board (the " +
      "pin board). TAILS are the wedge-shaped teeth on the other board " +
      "(the tail board) — their shape recalls a swallow's forked tail; the " +
      "recesses between them are the sockets. END GRAIN is the end face of " +
      "a board (the cross-section where you see the growth rings) — that's " +
      "where the interlock is cut. In German, a pin is called 'Zinken' and " +
      "the dovetail is the 'Schwalbenschwanz' — literally swallow's tail. " +
      "The WASTE is the material that later gets sawed and chopped away. " +
      "These terms show up in every tutorial and should be second nature " +
      "before anything else.",
    metadata: {
      source: "own-paraphrase",
      title: "Basic vocabulary — pins, tails, end grain, waste",
      topic: "grundlagen",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinken-warum-haelt-formschluss",
    text:
      "Why does a dovetail joint hold? The key is the mechanical " +
      "interlock. With FINGER JOINTS (straight pins) the surfaces are " +
      "straight and square — in theory you can pull the two boards apart " +
      "again; they need glue to hold. With the DOVETAIL the tails are " +
      "wedge-shaped, undercut: they get wider toward the tip. Because of " +
      "that, you can NO longer pull the boards apart in one direction — " +
      "they are mechanically locked and hold even without glue. That is " +
      "exactly what makes the dovetail the strongest corner joint: the " +
      "shape itself keeps the joint from opening, not just the glue.",
    metadata: {
      source: "wikipedia-de",
      title: "Why dovetails hold — mechanical interlock vs. fasteners",
      topic: "grundlagen",
      license: "own-paraphrase",
      source_url: "https://de.wikipedia.org/wiki/Holzverbindung",
      attribution: "paraphrased from German Wikipedia (CC-BY-SA-4.0), articles Holzverbindung/Zinkung",
    },
  },
  {
    id: "zinken-geschichte-kurz",
    text:
      "A short history of dovetailing: dovetail-like wood joints are " +
      "archaic types known for thousands of years; they already appear in " +
      "ancient Egyptian furniture (for example from Tutankhamun's tomb). " +
      "In the 15th century, European craftsmen refined them into an " +
      "elaborate system of wood joints. To this day, the hand-cut dovetail " +
      "is considered the crowning discipline of corner joinery in the " +
      "cabinetmaker's trade — it shows that someone can lay out, saw, and " +
      "chop cleanly.",
    metadata: {
      source: "wikipedia-de",
      title: "History of dovetailing — from Egypt to today",
      topic: "grundlagen",
      license: "own-paraphrase",
      source_url: "https://de.wikipedia.org/wiki/Holzverbindung",
      attribution: "paraphrased from German Wikipedia (CC-BY-SA-4.0), articles Holzverbindung/Zinkung",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZINKENARTEN — welche gibt es?
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "zinkenarten-ueberblick",
    text:
      "What dovetail types are there? First, distinguish by the SHAPE of " +
      "the teeth: straight pins (finger joint, also called box joint) and " +
      "wedge-shaped tails (dovetail). Then by VISIBILITY at the finished " +
      "corner: through dovetail (interlock visible from outside), " +
      "half-blind dovetail (hidden from one side), and full-blind dovetail, " +
      "often mitered (no end grain visible from either side). Beyond those " +
      "come special forms such as double dovetails, mitered dovetails, " +
      "funnel dovetails for splayed work, decorative dovetails, and the " +
      "sliding dovetail (a single dovetail-shaped key in a groove). For a " +
      "start, three are enough: the finger joint (simplest), the through " +
      "dovetail (the classic exercise), and the half-blind dovetail (the " +
      "drawer standard).",
    metadata: {
      source: "own-paraphrase",
      title: "Dovetail types at a glance — shape + visibility",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-fingerzinken",
    text:
      "Finger joint (straight pins): the pins have straight, square faces " +
      "and look like interlocking fingers of equal width. It is the " +
      "simplest dovetail type — easy to lay out and to cut, and well " +
      "suited to machine work with a router and jig. Because the pins have " +
      "no undercut, the joint is not self-locking and needs glue. The " +
      "pattern is even and technical-looking. Ideal as a first exercise " +
      "for apprentices and for industrial production runs (e.g. drawers, " +
      "boxes).",
    metadata: {
      source: "own-paraphrase",
      title: "Dovetail type: finger joint (straight pins)",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-schwalbenschwanz",
    text:
      "Dovetails: the tails are wedge-shaped and get wider toward the tip " +
      "— the shape recalls the forked tail of a swallow, hence the German " +
      "name 'Schwalbenschwanz' (and the English dove's tail). This " +
      "undercut creates a mechanical interlock: the joint holds against " +
      "pull, and in one direction it cannot be separated without breaking " +
      "it. The dovetail angle is usually laid out at a ratio of 1:6 " +
      "(steeper, about 9.5 degrees) or 1:8 (finer, about 7 degrees) — " +
      "which ratio suits which wood is workshop tradition (a common rule " +
      "of thumb in the literature: softwood steeper, hardwood finer). Make " +
      "the angle too steep (toward 1:4) and the slender tips break out, " +
      "because short end grain forms there. The dovetail is the most " +
      "demanding and most pull-resistant type — the crowning discipline.",
    metadata: {
      source: "own-paraphrase",
      title: "Dovetail type: the dovetail (wedge-shaped)",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-offene-zinkung",
    text:
      "Through dovetail: the interlock is visible from both sides of the " +
      "finished corner — you see alternating end grain of pins and tails. " +
      "It is the classic learning and practice joint, used wherever the " +
      "corner is allowed to show or should even act as decoration: boxes, " +
      "tool chests, drawer backs, rustic or deliberately handcrafted " +
      "furniture. Its advantage: the easiest to lay out and to control, " +
      "because you can see the interlock from both sides.",
    metadata: {
      source: "own-paraphrase",
      title: "Dovetail type: through dovetail (visible)",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-halbverdeckte-zinkung",
    text:
      "Half-blind dovetail: here the interlock shows from only ONE side — " +
      "from the other side, the show side, you see no end grain and no " +
      "pins; the corner looks closed. This is the standard for DRAWER " +
      "FRONTS: the front stays clean and handsome on the outside, while " +
      "the drawer side is dovetailed in solidly. More work than the " +
      "through dovetail, because the tails do not go all the way through — " +
      "they stop 'blind' behind a lap of remaining material.",
    metadata: {
      source: "own-paraphrase",
      title: "Dovetail type: half-blind dovetail (drawer front)",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-verdeckte-zinkung-gehrung",
    text:
      "Full-blind dovetail, usually mitered (the secret mitered dovetail): " +
      "from BOTH outside faces no end grain and no interlock can be seen — " +
      "the corner looks like a plain miter (a 45-degree joint), but hides " +
      "a full dovetail joint inside. It is the most refined and most " +
      "labor-intensive variant, used on fine furniture, jewelry boxes, and " +
      "visible carcass corners where none of the construction should show. " +
      "Demands the highest precision in laying out and chopping.",
    metadata: {
      source: "own-paraphrase",
      title: "Dovetail type: secret mitered dovetail (the finest form)",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-sonderformen-gratung",
    text:
      "Special forms of dovetailing: double dovetails (two rows), mitered " +
      "dovetails, funnel dovetails, and decorative dovetails are " +
      "ornamental or structural variants for special cases. A family of " +
      "its own is the SLIDING DOVETAIL (in German: Gratung): one part " +
      "carries just ONE continuous dovetail-shaped key, and the mating " +
      "part has a matching groove, the dovetail housing. The sliding " +
      "dovetail does not join a corner — it fits one board crosswise into " +
      "the face of another (e.g. shelves and dividers, or battens that " +
      "keep wide boards from cupping). It, too, relies on the dovetail's " +
      "mechanical interlock.",
    metadata: {
      source: "wikipedia-de",
      title: "Special dovetail forms + sliding dovetail",
      topic: "zinkenarten",
      license: "own-paraphrase",
      source_url: "https://de.wikipedia.org/wiki/Holzverbindung",
      attribution: "paraphrased from German Wikipedia (CC-BY-SA-4.0), articles Holzverbindung/Zinkung",
    },
  },
  {
    id: "zinken-einordnung-andere-verbindungen",
    text:
      "Context: where does dovetailing sit among wood joints? Wood joints " +
      "are grouped into form-locking (the shapes complement each other, " +
      "e.g. dovetails, mortise and tenon), adhesive (held by glue), and " +
      "fastener-based (nails, screws, dowels, hardware). The dovetail " +
      "joint is the cabinetmaker's finest FORM-LOCKING corner joint. " +
      "Related corner joints are the half-lap (both parts cut away to " +
      "half thickness), the miter (a 45-degree joint — no end grain " +
      "visible, but weak), and the mortise-and-tenon joint (for frames). " +
      "Dowel and biscuit joints are the cheaper, faster, but less sturdy " +
      "modern alternative.",
    metadata: {
      source: "wikipedia-de",
      title: "Context: dovetails among wood joints",
      topic: "uebersicht",
      license: "own-paraphrase",
      source_url: "https://de.wikipedia.org/wiki/Holzverbindung",
      attribution: "paraphrased from German Wikipedia (CC-BY-SA-4.0), article Holzverbindung",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ANREISSEN — wie reisst man Zinken am Brett an?
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "anreissen-was-ist-das",
    text:
      "What does laying out mean? Laying out (marking out) is the exact " +
      "transfer of the joint's geometry onto the wood BEFORE any sawing — " +
      "it is the first and most important step of every dovetail joint. " +
      "You draw or scribe the future saw and chop lines onto the end grain " +
      "and the board faces. Tools: fine lines with the scratch awl or the " +
      "marking knife (they scribe a knife-thin line that guides the saw), " +
      "marks in the waste zones with a sharp pencil. Principle: a clean " +
      "layout is half the joint — a crooked or sloppy layout ruins the " +
      "workpiece before the first saw cut. In Austria's cabinetmaking " +
      "training regulation, laying out is explicitly required as a core " +
      "competence.",
    metadata: {
      source: "own-paraphrase",
      title: "Laying out — definition + why it matters",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-werkzeuge",
    text:
      "Tools for laying out a dovetail joint: (1) MARKING GAUGE — scribes " +
      "the board thickness all the way around; this line marks the " +
      "chopping depth (you chop to here and no deeper). (2) BEVEL GAUGE " +
      "(sliding bevel) — sets out the dovetail angle, 1:6 or 1:8; for " +
      "straight finger joints a fixed try square is enough. (3) TRY SQUARE " +
      "— for square lines and for checking. (4) SCRATCH AWL or MARKING " +
      "KNIFE — for all final, precise lines. (5) PENCIL (sharp) — for " +
      "marks in the waste zones (an X = gets chopped away). (6) DIVIDERS — " +
      "for stepping off the pins evenly across the board width.",
    metadata: {
      source: "own-paraphrase",
      title: "Layout tools: marking gauge, bevel gauge, square, scratch awl",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-zinkenformel",
    text:
      "The dovetail formula: before you lay out, you decide HOW MANY pins " +
      "and tails go across the board width and how wide they will be. That " +
      "depends on board width and board thickness. Rules of thumb: narrow " +
      "boards up to about 100 mm get 3 to 5 pins; wider boards get an odd " +
      "number. The outer pins are often made narrower — that reads as fine " +
      "craftsmanship. The spacing is stepped off evenly with dividers. " +
      "Exactly these two values — the number of pins and the dovetail " +
      "angle (1:6 or 1:8) — are adjustable in the learning tool via the " +
      "sliders, so you can watch the dovetail formula act on the 3D model " +
      "live, before you lay out on a real board.",
    metadata: {
      source: "own-paraphrase",
      title: "Dovetail formula — determining pin count + width",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-reihenfolge",
    text:
      "Order of operations when laying out a dovetail joint: (1) Scribe " +
      "the board thickness all around with the marking gauge — on both " +
      "boards; that gives you the chop-stop line. (2) Set the dovetail " +
      "spacing across the board width and mark it with pencil and " +
      "dividers. (3) Lay out the dovetail angles with the bevel gauge on " +
      "the end grain and down over the edge — all the way around, so you " +
      "can saw with control from both sides. (4) Mark the waste zones with " +
      "an X, so you don't saw away the wrong side. The pins-first method " +
      "has proven itself: saw and chop the pins to completion first, then " +
      "scribe the mating board directly from them — that transfers the " +
      "real geometry and reduces transfer errors.",
    metadata: {
      source: "own-paraphrase",
      title: "Laying out — order of operations + pins-first method",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // BRUECKE zum amtlichen Rahmen (Detail liegt im ris-corpus)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "zinken-amtlicher-rahmen-at",
    text:
      "The official framework in Austria: dovetails are not a 'nice to " +
      "have' — they are mandatory material. The Austrian cabinetmaking " +
      "training regulation (Tischlerei-Ausbildungsordnung, RIS statute " +
      "number 20011991) explicitly requires in the occupational profile — " +
      "translated from the German original — 'producing detachable and " +
      "permanent joints, in particular glue joints, half-laps, " +
      "mortise-and-tenon joints, DOVETAIL JOINTS, dowel joints, biscuit " +
      "joints' — and working workpieces by 'measuring, LAYING OUT, " +
      "full-size layout, planing, sawing, chopping'. The vocational school " +
      "curriculum (Annex 147) additionally names end-grain work and the " +
      "professional making of wood joints. The learning tool thus covers " +
      "exactly one officially mandated core competence of the Austrian " +
      "cabinetmaking apprenticeship.",
    metadata: {
      source: "ris-bka-at",
      title: "Dovetails in the official curriculum — training regulation + vocational school",
      topic: "uebersicht",
      license: "official-document",
      attribution:
        "Republic of Austria, RIS-OGD (data.bka.gv.at), statute nos. 20011991 + 20009625 (Annex 147), official work per §7 UrhG (Austrian Copyright Act)",
      source_url:
        "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011991",
    },
  },
];

/** Frische Kopie des Grundlagen-Korpus (EN, shallow copy je Document). */
export function getZinkenGrundlagenCorpusEn(): RAGDocument[] {
  return ZINKEN_GRUNDLAGEN_CORPUS_EN.map((doc) => ({ ...doc }));
}
