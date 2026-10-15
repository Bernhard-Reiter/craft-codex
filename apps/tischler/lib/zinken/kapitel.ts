/**
 * Die EINE Kapitel-Liste des Zinken-Lehrgangs.
 *
 * Einzige Quelle für Reihenfolge und Ids. Lehrgang (lehrgang.ts), Anreiß-Ablauf
 * (anreiss-flow.ts) und Lektion (lektion.ts) zeigen nur noch auf diese Ids.
 * Andere Dateien führen KEINE eigene Literal-Liste von Kapitel- oder
 * Schritt-Ids (Wächter: eine-liste.test.ts).
 *
 * Kapitel 1–3 sind neu geschrieben. Kapitel 4–9 stecken noch in den alten
 * Lehrgang-Schritten saegen, stemmen und passen und sind als »Entwurf«
 * gekennzeichnet, bis sie in späteren Stufen neu geschrieben werden.
 */

export const KAPITEL_IDS = [
  "warum",
  "anzeichnen",
  "kontrolle",
  "saegen",
  "stemmen-vorbereiten",
  "stemmen",
  "schwalbenbrett-anreissen",
  "schwalbenbrett-saegen",
  "zusammenfuehren",
] as const;

export type KapitelId = (typeof KAPITEL_IDS)[number];

export type KapitelStand = "neu" | "entwurf";

export interface Kapitel {
  nr: number;
  id: KapitelId;
  titel: string;
  /** Kurzform für Leisten und Tafeln. */
  kurz: string;
  stand: KapitelStand;
  /** Stufe, in der das Kapitel neu geschrieben ist bzw. wird. */
  paket: string;
}

/**
 * Lehrgang-Einträge → Kapitel. Die Einträge saegen, stemmen und passen fassen
 * noch mehrere Kapitel zusammen (Entwurf).
 */
export const LEHRGANG_GRUPPEN = {
  warum: ["warum"],
  anzeichnen: ["anzeichnen"],
  kontrolle: ["kontrolle"],
  saegen: ["saegen"],
  stemmen: ["stemmen-vorbereiten", "stemmen"],
  passen: ["schwalbenbrett-anreissen", "schwalbenbrett-saegen", "zusammenfuehren"],
} as const;

/** Id eines Lehrgang-Eintrags (Schritt). */
export type SchrittId = keyof typeof LEHRGANG_GRUPPEN;

/** Die Lehrgang-Einträge in Reihenfolge — abgeleitet aus LEHRGANG_GRUPPEN. */
export const SCHRITT_IDS = Object.keys(LEHRGANG_GRUPPEN) as readonly SchrittId[];

const STAND: Record<KapitelId, { stand: KapitelStand; paket: string }> = {
  warum: { stand: "neu", paket: "P1" },
  anzeichnen: { stand: "neu", paket: "P1" },
  kontrolle: { stand: "neu", paket: "P1" },
  saegen: { stand: "entwurf", paket: "P2" },
  "stemmen-vorbereiten": { stand: "entwurf", paket: "P2" },
  stemmen: { stand: "entwurf", paket: "P2" },
  "schwalbenbrett-anreissen": { stand: "entwurf", paket: "P4/P5" },
  "schwalbenbrett-saegen": { stand: "entwurf", paket: "P4/P5" },
  zusammenfuehren: { stand: "entwurf", paket: "P4/P5" },
};

type KapitelText = Record<KapitelId, { titel: string; kurz: string }>;

const TEXT_DE: KapitelText = {
  warum: { titel: "Warum so anzeichnen", kurz: "Warum" },
  anzeichnen: { titel: "Anzeichnen Zinkenbrett, Strich für Strich", kurz: "Anzeichnen" },
  kontrolle: { titel: "Kontrolle, Abfall kreuzen, Fehlerbilder", kurz: "Kontrolle" },
  saegen: { titel: "Vorbereiten und Sägen", kurz: "Sägen" },
  "stemmen-vorbereiten": { titel: "Vorbereiten zum Stemmen", kurz: "Stemmen vorbereiten" },
  stemmen: { titel: "Stemmen", kurz: "Stemmen" },
  "schwalbenbrett-anreissen": { titel: "Schwalbenbrett anreißen", kurz: "Schwalbenbrett anreißen" },
  "schwalbenbrett-saegen": { titel: "Schwalbenbrett sägen und stemmen", kurz: "Schwalbenbrett sägen" },
  zusammenfuehren: { titel: "Nachbessern, zusammenführen, leimen, verputzen", kurz: "Zusammenführen" },
};

const TEXT_EN: KapitelText = {
  warum: { titel: "Why we mark out this way", kurz: "Why" },
  anzeichnen: { titel: "Marking the pin board, line by line", kurz: "Marking" },
  kontrolle: { titel: "Check, mark the waste, typical errors", kurz: "Check" },
  saegen: { titel: "Preparing and sawing", kurz: "Sawing" },
  "stemmen-vorbereiten": { titel: "Preparing to chop", kurz: "Prepare to chop" },
  stemmen: { titel: "Chopping out", kurz: "Chopping" },
  "schwalbenbrett-anreissen": { titel: "Marking the tail board", kurz: "Mark tail board" },
  "schwalbenbrett-saegen": { titel: "Sawing and chopping the tail board", kurz: "Saw tail board" },
  zusammenfuehren: { titel: "Fixing, assembling, gluing, cleaning up", kurz: "Assemble" },
};

function baue(text: KapitelText): readonly Kapitel[] {
  return KAPITEL_IDS.map((id, i) => ({ nr: i + 1, id, ...text[id], ...STAND[id] }));
}

export const KAPITEL_DE: readonly Kapitel[] = baue(TEXT_DE);
export const KAPITEL_EN: readonly Kapitel[] = baue(TEXT_EN);
