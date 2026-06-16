import type { RAGDocument } from "@craft-codex/core";

/**
 * Zinken-GRUNDLAGEN-Korpus — die "von ganz vorne"-Wissensschicht (Phase F).
 *
 * Zweck: Das Lehrtool soll einem kompletten Laien zuerst erklaeren WAS Zinken
 * sind, WOFUER sie gut sind, WELCHE Zinkenarten es gibt und WIE man sie
 * anreisst — bevor die erste Anrisslinie auf dem Brett erscheint. Diese
 * Schicht beantwortet die Einstiegsfragen, die der bestehende
 * Schwalbenschwanz-Korpus (dovetail-corpus) ueberspringt.
 *
 * Quellen (alle oeffentlich, lizenzkompatibel fuer den Open-Core MIT-Build):
 *  - "wikipedia-de"   → DE-Wikipedia "Holzverbindung" / "Zinkung", paraphrasiert
 *                        (Fakten gemeinfrei; Attribution CC-BY-SA-4.0 als Quelle)
 *  - "own-paraphrase" → eigenes Tischler-Fachwissen (Bernhard Reiter) +
 *                        paraphrasierte oeffentliche Lehrtexte (schreiner-seiten.de)
 *  - Der AMTLICHE Rahmen (Anreissen + Zinkenverbindungen als Pflichtkompetenz)
 *    liegt im ris-corpus (RIS-OGD, §7 UrhG gemeinfrei) — hier nur eine Bruecke.
 *
 * Schema folgt RAGDocument aus @craft-codex/core.
 * topic-Werte: "grundlagen" | "zinkenarten" | "anreissen" | "uebersicht"
 */

export const ZINKEN_GRUNDLAGEN_CORPUS: RAGDocument[] = [
  // ─────────────────────────────────────────────────────────────────────
  // GRUNDLAGEN — Was ist das? Wofuer? (Laien-Einstieg)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "zinken-was-ist-das",
    text:
      "Was ist ein Zinken? Eine Zinkenverbindung (auch Zinkung) ist eine " +
      "Eckverbindung von zwei Brettern. An der Stirnseite — dem Hirnholz — " +
      "wird jedes Brett ueber die ganze Breite kammartig ausgeschnitten: es " +
      "entstehen Zacken (die Zinken) und dazwischen Luecken. Werden die zwei " +
      "Bretter ueber Eck zusammengeschoben, greift jeder Zinken des einen " +
      "Bretts genau in die Luecke des anderen — die beiden Bretter verzahnen " +
      "sich wie die Finger zweier ineinandergelegter Haende. Die Zinkung gilt " +
      "als die aufwaendigste, aber auch die ansprechendste der traditionellen " +
      "Holzverbindungen. Fuer einen Laien in einem Satz: zwei Holzkanten, die " +
      "wie ein Puzzle ineinandergreifen und so eine feste Ecke bilden.",
    metadata: {
      source: "wikipedia-de",
      title: "Zinkenverbindung — Was ist das (Laien-Definition)",
      topic: "grundlagen",
      license: "own-paraphrase",
      source_url: "https://de.wikipedia.org/wiki/Holzverbindung",
      attribution: "paraphrasiert nach Wikipedia DE (CC-BY-SA-4.0), Artikel Holzverbindung/Zinkung",
    },
  },
  {
    id: "zinken-wofuer",
    text:
      "Wofuer sind Zinken gut? Zinkenverbindungen verbinden Bretter ueber Eck " +
      "zu einem Korpus — also einem Kasten. Klassische Anwendungen: " +
      "Schubladen, Truhen, Kisten, Schatullen, Werkzeugkaesten und sogar " +
      "Musikinstrumente. Drei Gruende, warum man diese aufwaendige Verbindung " +
      "waehlt: (1) Festigkeit — die vielen verzahnten Flaechen ergeben eine " +
      "riesige Leimflaeche und halten extrem stabil. (2) Beim Schwalbenschwanz " +
      "ist die Verbindung sogar OHNE Leim und Schrauben formschluessig: sie " +
      "haelt auf Zug von selbst, weil die keilfoermigen Zinken sich verhaken. " +
      "(3) Sie sieht schoen aus — die sichtbare Verzahnung gilt als Zeichen " +
      "von Handwerkskunst. Zusaetzlich laesst die Verbindung das Holz weiter " +
      "arbeiten (quellen und schwinden), ohne dass die Ecke reisst.",
    metadata: {
      source: "own-paraphrase",
      title: "Wofuer Zinken gut sind — Anwendungen + Vorteile",
      topic: "grundlagen",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinken-begriffe-grundvokabular",
    text:
      "Grundvokabular der Zinkung — die Begriffe, die ein Anfaenger zuerst " +
      "braucht: ZINKEN sind die herausstehenden Zacken/Zapfen am einen Brett. " +
      "SCHWALBEN oder Schwalbenschwaenze nennt man die keilfoermigen Zacken " +
      "beim Schwalbenschwanz; die Aussparungen dazwischen sind die Luecken. " +
      "HIRNHOLZ ist die Stirnflaeche des Bretts (die Querschnittsflaeche, wo " +
      "man die Jahresringe sieht) — dort wird die Verzahnung eingeschnitten. " +
      "Im Englischen heisst der Zinken 'pin' und der Schwalbenschwanz " +
      "'dovetail' (Taubenschwanz/Schwalbenschwanz). Die ABFALLSEITE ist das " +
      "Material, das spaeter weggesaegt und weggestemmt wird. Diese Begriffe " +
      "tauchen in jeder Anleitung auf und sollten zuerst sitzen.",
    metadata: {
      source: "own-paraphrase",
      title: "Grundvokabular — Zinken, Schwalbe, Hirnholz, Pin, Abfallseite",
      topic: "grundlagen",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinken-warum-haelt-formschluss",
    text:
      "Warum haelt eine Zinkenverbindung? Der Schluessel ist der Formschluss. " +
      "Bei FINGERZINKEN (geraden Zinken) sind die Flaechen gerade und " +
      "rechtwinklig — man kann die beiden Bretter theoretisch wieder " +
      "auseinanderziehen; sie brauchen Leim, um zu halten. Beim " +
      "SCHWALBENSCHWANZ sind die Zinken keilfoermig hinterschnitten: sie " +
      "werden zur Spitze hin breiter. Dadurch kann man die Bretter in einer " +
      "Richtung NICHT mehr auseinanderziehen — sie sind formschluessig " +
      "verriegelt und halten auch ohne Leim. Genau das macht den " +
      "Schwalbenschwanz zur stabilsten Eckverbindung: die Form selbst " +
      "verhindert das Aufgehen, nicht nur der Leim.",
    metadata: {
      source: "wikipedia-de",
      title: "Warum Zinken halten — Formschluss vs. Kraftschluss",
      topic: "grundlagen",
      license: "own-paraphrase",
      source_url: "https://de.wikipedia.org/wiki/Holzverbindung",
      attribution: "paraphrasiert nach Wikipedia DE (CC-BY-SA-4.0), Artikel Holzverbindung/Zinkung",
    },
  },
  {
    id: "zinken-geschichte-kurz",
    text:
      "Geschichte der Zinkung — kurz: Zinkenartige Holzverbindungen sind als " +
      "archaische Typen schon ueber Jahrtausende bekannt; man findet sie " +
      "bereits in altaegyptischen Moebeln (etwa aus dem Grab des Tutanchamun). " +
      "Im 15. Jahrhundert wurden sie im europaeischen Handwerk zu einem " +
      "komplizierten System von Holzverbindungen weiterentwickelt. Bis heute " +
      "gilt die von Hand gearbeitete Schwalbenschwanzzinkung im Tischler- und " +
      "Schreinerhandwerk als Koenigsdisziplin der Eckverbindung — sie zeigt, " +
      "dass jemand sauber anreissen, saegen und stemmen kann.",
    metadata: {
      source: "wikipedia-de",
      title: "Geschichte der Zinkung — von Aegypten bis heute",
      topic: "grundlagen",
      license: "own-paraphrase",
      source_url: "https://de.wikipedia.org/wiki/Holzverbindung",
      attribution: "paraphrasiert nach Wikipedia DE (CC-BY-SA-4.0), Artikel Holzverbindung/Zinkung",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZINKENARTEN — welche gibt es?
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "zinkenarten-ueberblick",
    text:
      "Welche Zinkenarten gibt es? Man unterscheidet zuerst nach der FORM der " +
      "Zinken: gerade Zinken (Fingerzinken) und keilfoermige Zinken " +
      "(Schwalbenschwanzzinken). Dann nach der SICHTBARKEIT an der fertigen " +
      "Ecke: offene Zinkung (Verzahnung von aussen sichtbar), halbverdeckte " +
      "Zinkung (von einer Seite nicht sichtbar) und verdeckte Zinkung, oft auf " +
      "Gehrung (von beiden Seiten kein Hirnholz sichtbar). Dazu kommen " +
      "Sonderformen wie Doppelzinken, Gehrungszinken, Trichterzinken, " +
      "Zierzinken und die Gratung (ein einzelner Schwalbenschwanzzinken in " +
      "einer Nut). Fuer den Einstieg reichen drei: Fingerzinken (einfachste), " +
      "offener Schwalbenschwanz (klassische Uebung) und halbverdeckter " +
      "Schwalbenschwanz (Schubladen-Standard).",
    metadata: {
      source: "own-paraphrase",
      title: "Zinkenarten im Ueberblick — Form + Sichtbarkeit",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-fingerzinken",
    text:
      "Fingerzinken (gerade Zinken): Die Zinken haben gerade, rechtwinklige " +
      "Flaechen und sehen aus wie ineinandergreifende Finger gleicher Breite. " +
      "Sie sind die einfachste Zinkenart — leicht anzureissen und " +
      "auszuarbeiten, auch gut maschinell mit Oberfraese und Zinkenschablone " +
      "herstellbar. Weil sie keinen Hinterschnitt haben, sind sie nicht " +
      "selbsthaltend und brauchen Leim. Gleichmaessiges, technisches " +
      "Verzahnungsbild. Ideal als erste Uebung fuer Lehrlinge und fuer " +
      "industrielle Serienfertigung (z.B. Schubladen, Kisten).",
    metadata: {
      source: "own-paraphrase",
      title: "Zinkenart: Fingerzinken (gerade Zinken)",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-schwalbenschwanz",
    text:
      "Schwalbenschwanzzinken: Die Zinken sind keilfoermig und werden zur " +
      "Spitze hin breiter — die Form erinnert an den gegabelten Schwanz einer " +
      "Schwalbe. Durch diesen Hinterschnitt entsteht Formschluss: die " +
      "Verbindung haelt auf Zug, in einer Richtung kann man sie ohne " +
      "Zerstoerung nicht mehr trennen. Der Schwalbenwinkel betraegt 1:6 (etwa " +
      "9,5 Grad) fuer Hartholz wie Eiche oder Buche und 1:8 (etwa 7 Grad) fuer " +
      "Weichholz wie Kiefer oder Fichte. Steiler als 1:4 bricht bei Belastung, " +
      "flacher als 1:8 haelt schlecht. Der Schwalbenschwanz ist die " +
      "anspruchsvollste und zugfesteste Zinkenart — die Koenigsdisziplin.",
    metadata: {
      source: "own-paraphrase",
      title: "Zinkenart: Schwalbenschwanzzinken",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-offene-zinkung",
    text:
      "Offene Zinkung: Die Verzahnung ist an der fertigen Ecke von beiden " +
      "Seiten sichtbar — man sieht abwechselnd Hirnholz von Zinken und " +
      "Schwalben. Sie ist die klassische Lern- und Uebungsverbindung und wird " +
      "dort eingesetzt, wo die Ecke ruhig sichtbar sein darf oder sogar als " +
      "Zierde wirken soll: Kisten, Werkzeugkaesten, Schubladenrueckwaende, " +
      "rustikale oder bewusst handwerklich gezeigte Moebel. Vorteil: am " +
      "einfachsten anzureissen und zu kontrollieren, weil man die Verzahnung " +
      "von beiden Seiten sieht.",
    metadata: {
      source: "own-paraphrase",
      title: "Zinkenart: offene Zinkung (sichtbar)",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-halbverdeckte-zinkung",
    text:
      "Halbverdeckte Zinkung (halbverdeckter Schwalbenschwanz): Hier ist die " +
      "Verzahnung nur von EINER Seite sichtbar — von der anderen, der " +
      "Schauseite, sieht man kein Hirnholz und keine Zinken, die Ecke wirkt " +
      "geschlossen. Das ist der Standard fuer SCHUBLADENFRONTEN: die Front " +
      "bleibt aussen glatt und schoen, waehrend die Seitenwand fest " +
      "eingezinkt ist. Aufwaendiger als die offene Zinkung, weil die Zinken " +
      "nicht durchgehen, sondern in einer Restmaterialstaerke 'blind' enden.",
    metadata: {
      source: "own-paraphrase",
      title: "Zinkenart: halbverdeckte Zinkung (Schubladenfront)",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-verdeckte-zinkung-gehrung",
    text:
      "Verdeckte Zinkung, meist auf Gehrung: Von BEIDEN Aussenseiten ist kein " +
      "Hirnholz und keine Verzahnung zu sehen — die Ecke sieht aus wie eine " +
      "reine Gehrung (ein 45-Grad-Stoss), versteckt aber innen eine volle " +
      "Zinkenverbindung. Das ist die aufwaendigste und edelste Variante, " +
      "eingesetzt bei hochwertigen Moebeln, Schatullen und sichtbaren " +
      "Korpusecken, wo nichts von der Konstruktion sichtbar sein soll. " +
      "Verlangt hoechste Praezision beim Anreissen und Stemmen.",
    metadata: {
      source: "own-paraphrase",
      title: "Zinkenart: verdeckte Zinkung auf Gehrung (edelste Form)",
      topic: "zinkenarten",
      license: "own-paraphrase",
    },
  },
  {
    id: "zinkenart-sonderformen-gratung",
    text:
      "Sonderformen der Zinkung: Doppelzinken (zwei Reihen), Gehrungszinken, " +
      "Trichterzinken und Zierzinken sind dekorative oder konstruktive " +
      "Varianten fuer besondere Faelle. Eine eigene Familie ist die GRATUNG: " +
      "dabei hat ein Teil nur EINEN durchlaufenden Schwalbenschwanzzinken und " +
      "das Gegenstueck eine passende Nut, die Gratnut. Die Gratung verbindet " +
      "nicht ueber Eck, sondern fuegt ein Brett quer in die Flaeche eines " +
      "anderen ein (z.B. Zwischenboeden, Brettverbreiterungen, die sich gegen " +
      "Verziehen sichern). Auch sie nutzt den Schwalbenschwanz-Formschluss.",
    metadata: {
      source: "wikipedia-de",
      title: "Zinken-Sonderformen + Gratung",
      topic: "zinkenarten",
      license: "own-paraphrase",
      source_url: "https://de.wikipedia.org/wiki/Holzverbindung",
      attribution: "paraphrasiert nach Wikipedia DE (CC-BY-SA-4.0), Artikel Holzverbindung/Zinkung",
    },
  },
  {
    id: "zinken-einordnung-andere-verbindungen",
    text:
      "Einordnung: Wo steht die Zinkung unter den Holzverbindungen? Man teilt " +
      "Holzverbindungen ein in formschluessig (die Formen ergaenzen sich, z.B. " +
      "Zinken, Schlitz und Zapfen), stoffschluessig (durch Leim/Verleimung) " +
      "und kraftschluessig (durch Naegel, Schrauben, Duebel, Beschlaege). Die " +
      "Zinkenverbindung ist die hochwertigste FORMSCHLUESSIGE Eckverbindung " +
      "des Tischlers. Verwandte Eckverbindungen sind die Ueberblattung (beide " +
      "Teile auf halbe Dicke ausgenommen), die Gehrung (45-Grad-Stoss, kein " +
      "Hirnholz sichtbar, aber schwach) und die Schlitz-Zapfen-Verbindung " +
      "(fuer Rahmen). Duebel- und Lamellenverbindungen sind die guenstigere, " +
      "schneller herstellbare, aber weniger stabile moderne Alternative.",
    metadata: {
      source: "wikipedia-de",
      title: "Einordnung: Zinkung unter den Holzverbindungen",
      topic: "uebersicht",
      license: "own-paraphrase",
      source_url: "https://de.wikipedia.org/wiki/Holzverbindung",
      attribution: "paraphrasiert nach Wikipedia DE (CC-BY-SA-4.0), Artikel Holzverbindung",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ANREISSEN — wie reisst man Zinken am Brett an?
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "anreissen-was-ist-das",
    text:
      "Was heisst Anreissen? Anreissen ist das exakte Uebertragen der " +
      "Verbindungs-Geometrie auf das Holz, BEVOR gesaegt wird — es ist der " +
      "erste und wichtigste Schritt jeder Zinkung. Man zeichnet bzw. ritzt die " +
      "spaeteren Saege- und Stemmlinien auf Hirnholz und Brettflaeche an. " +
      "Werkzeug: feine Linien mit der Reissnadel oder dem Anreissmesser " +
      "(ritzen eine messerschmale Linie, in der sich die Saege fuehrt), " +
      "Markierungen in der Abfallzone mit dem spitzen Bleistift. Grundsatz: " +
      "Ein sauberer Anriss ist die halbe Verbindung — ein schiefer oder " +
      "ungenauer Anriss ruiniert das Werkstueck schon vor dem ersten " +
      "Saegeschnitt. Anreissen ist in der oesterreichischen Tischlerei- " +
      "Ausbildungsordnung ausdruecklich als Pflichtkompetenz vorgeschrieben.",
    metadata: {
      source: "own-paraphrase",
      title: "Anreissen — Definition + Bedeutung",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-werkzeuge",
    text:
      "Werkzeuge zum Anreissen einer Zinkung: (1) STREICHMASS — ritzt die " +
      "Brettstaerke umlaufend auf das Hirnholz; diese Linie markiert die " +
      "spaetere Stemmtiefe (bis hierher wird gestemmt, nicht tiefer). " +
      "(2) SCHMIEGE (verstellbarer Winkel) — traegt den Schwalbenwinkel 1:6 " +
      "oder 1:8 an; bei geraden Fingerzinken genuegt der feste Anschlagwinkel. " +
      "(3) ANSCHLAGWINKEL — fuer rechtwinklige Linien und zum Kontrollieren. " +
      "(4) REISSNADEL oder ANREISSMESSER — fuer alle finalen, praezisen " +
      "Linien. (5) BLEISTIFT (spitz) — fuer Markierungen in der Abfallzone " +
      "(Kreuz = wird weggestemmt). (6) STECHZIRKEL/Teiler — zum gleichmaessigen " +
      "Aufteilen der Zinken ueber die Brettbreite.",
    metadata: {
      source: "own-paraphrase",
      title: "Anreiss-Werkzeuge: Streichmass, Schmiege, Winkel, Reissnadel",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-zinkenformel",
    text:
      "Die Zinkenformel: Bevor man anreisst, legt man fest, WIE VIELE Zinken " +
      "und Schwalben auf die Brettbreite kommen und wie breit sie werden. Das " +
      "haengt von Brettbreite und Brettstaerke ab. Faustregeln: schmale " +
      "Bretter bis etwa 100 mm bekommen 3 bis 5 Zinken; breitere Bretter eine " +
      "ungerade Anzahl. Aussenzinken werden oft schmaler gesetzt, das gilt als " +
      "handwerklich hochwertig. Die Aufteilung wird mit dem Stechzirkel " +
      "gleichmaessig uebertragen. Genau diese zwei Groessen — Anzahl der Pins " +
      "und der Schwalbenwinkel (1:6 oder 1:8) — sind im Lehrtool ueber die " +
      "Schieberegler einstellbar, sodass man die Wirkung der Zinkenformel " +
      "live am 3D-Modell sieht, bevor man am echten Brett anreisst.",
    metadata: {
      source: "own-paraphrase",
      title: "Zinkenformel — Anzahl + Breite der Zinken bestimmen",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-reihenfolge",
    text:
      "Reihenfolge beim Anreissen einer Schwalbenschwanzzinkung: " +
      "(1) Brettstaerke mit dem Streichmass umlaufend anreissen — auf beiden " +
      "Brettern, das ergibt die Stemm-Stopp-Linie. (2) Die Zinken-Teilung " +
      "ueber die Brettbreite festlegen und mit Bleistift/Zirkel markieren. " +
      "(3) Die Schwalbenwinkel mit der Schmiege auf dem Hirnholz und ueber die " +
      "Kante anreissen — umlaufend, damit man von beiden Seiten kontrolliert " +
      "saegen kann. (4) Die Abfallzonen mit einem Kreuz markieren, damit man " +
      "nicht die falsche Seite wegsaegt. Bewaehrt ist die Pin-First-Methode: " +
      "zuerst die Zinken (Pins) fertig saegen und ausstemmen, dann das " +
      "Gegenstueck danach anreissen — das uebertraegt die echte Geometrie und " +
      "reduziert Uebertragungsfehler.",
    metadata: {
      source: "own-paraphrase",
      title: "Anreissen — Reihenfolge + Pin-First-Methode",
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
      "Amtlicher Rahmen in Oesterreich: Zinken sind kein 'nice to have', " +
      "sondern Pflichtstoff. Die Tischlerei-Ausbildungsordnung (RIS, " +
      "Gesetzesnummer 20011991) verlangt im Berufsbild ausdruecklich, " +
      "'loesbare und unloesbare Verbindungen herzustellen, insbesondere " +
      "Verleimungen, Ueberblattungen, Schlitz- und Zapfenverbindungen, " +
      "ZINKENVERBINDUNGEN, Duebelverbindungen, Lamellenverbindungen' — und " +
      "Werkstuecke zu bearbeiten durch 'Messen, ANREISSEN, Aufreissen, " +
      "Hobeln, Saegen, Stemmen'. Der Berufsschul-Lehrplan (Anlage 147) nennt " +
      "zusaetzlich die Hirnholzbearbeitung und das fachgerechte Erstellen von " +
      "Holzverbindungen. Das Lehrtool deckt damit exakt eine amtlich " +
      "vorgeschriebene Kernkompetenz der Tischler-Lehre ab.",
    metadata: {
      source: "ris-bka-at",
      title: "Zinken im amtlichen Lehrplan — Ausbildungsordnung + Berufsschule",
      topic: "uebersicht",
      license: "official-document",
      attribution:
        "Republik Oesterreich, RIS-OGD (data.bka.gv.at), GesNr 20011991 + 20009625 (Anl. 147), amtliches Werk §7 UrhG",
      source_url:
        "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011991",
    },
  },
];

/** Frische Kopie des Grundlagen-Korpus (shallow copy je Document). */
export function getZinkenGrundlagenCorpus(): RAGDocument[] {
  return ZINKEN_GRUNDLAGEN_CORPUS.map((doc) => ({ ...doc }));
}
