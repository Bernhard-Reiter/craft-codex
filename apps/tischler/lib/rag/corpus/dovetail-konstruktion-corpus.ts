import type { RAGDocument } from "@craft-codex/core";

/**
 * Zinken-KONSTRUKTIONS-Korpus — die Berechnungs- und Anreiss-Schicht.
 *
 * Quelle: Tischler-Fachbuch "Konstruktionslehre" (Kapitel 4 Korpusverbindungen,
 * Zinkenverbindungen / Kompetenz-Check 8), fachlich gegengelesen von
 * Tischlermeister Bernhard Reiter. Es werden nur die FORMELN und das Verfahren
 * paraphrasiert (gemeinfreie Fakten), kein Originaltext uebernommen.
 *
 * Zweck: Der Voice-Meister kann jede Rueckfrage zur Zinkenteilung in EINFACHER
 * Sprache beantworten ("Warum 1,7?", "Wie viele Schwalben?", "Was ist die
 * Randzinkenverstaerkung?") und dabei die echten Lehrbuch-Schritte erklaeren.
 *
 * topic-Wert durchgehend: "konstruktion".
 * Schreibstil: gesprochen, Laie-zuerst, ASCII-Umlaute (ae/oe/ue) wie der
 * uebrige Korpus.
 */

export const ZINKEN_KONSTRUKTION_CORPUS: RAGDocument[] = [
  {
    id: "konstruktion-grundsystem",
    text:
      "Das Grundsystem der Zinkenteilung — so denkt der Tischler: Eine " +
      "Schwalbenschwanz-Reihe besteht aus Zinken (den schmalen Stegen) und " +
      "Schwalben (den breiten, keilfoermigen Teilen dazwischen). Die Faustregel " +
      "fuer ein ruhiges, regelmaessiges Bild: ein Zinken ist 1 Teil breit, eine " +
      "Schwalbe 2 Teile. Wir nennen so ein Teil 'T'. Eine volle Wiederholung ist " +
      "also 1T + 2T = 3T. Die Schwalben sollen optisch gleichmaessig ueber die " +
      "Brettbreite verteilt sein. Die Schraege der Schwalbe (der Winkel der " +
      "Keilflanke) liegt bei 10 bis 14 Grad, oder als Verhaeltnis ausgedrueckt " +
      "ungefaehr 1:6. Steiler als 1:6 bricht an den Spitzen aus, flacher haelt " +
      "schlechter auf Zug. Merksatz fuer den Lehrling: Zinken schmal, Schwalbe " +
      "doppelt so breit, Schraege eins zu sechs.",
    metadata: {
      source: "own-paraphrase",
      title: "Grundsystem — Zinken 1T, Schwalbe 2T, Schraege 1:6",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrasiert nach Konstruktionslehre (Tischler-Fachbuch), Kap. 4 Zinkenverbindungen",
    },
  },
  {
    id: "konstruktion-begriffe",
    text:
      "Die Abkuerzungen der Zinkenkonstruktion — das Vokabular, das auf jeder " +
      "Werkstattzeichnung steht: B ist die Brettbreite, D die Brettdicke. AZS " +
      "ist die Anzahl der Schwalben, AZT die Anzahl der Einteilungsteile. T ist " +
      "die Breite eines einzelnen Teils. ZS ist das Konstruktionsmass der " +
      "Schraege (wie weit der Keil auf der Schwalbenlaenge auswandert). RZV ist " +
      "die Randzinkenverstaerkung — ein dickerer Steg ganz aussen. RB ist die " +
      "Restbreite, also B minus die beiden Raender. ZT ist die Breite einer " +
      "ganzen Zinkenteilung. SL ist die Schwalbenlaenge (bei offenen Zinken " +
      "gleich der Brettdicke D). BL ist die Blattstaerke bei halbverdeckten " +
      "Zinken. Wer diese elf Kuerzel kennt, liest jede Zinkenzeichnung.",
    metadata: {
      source: "own-paraphrase",
      title: "Begriffe & Abkuerzungen (B, D, AZS, AZT, T, ZS, RZV, RB, SL, BL)",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrasiert nach Konstruktionslehre (Tischler-Fachbuch), Kap. 4",
    },
  },
  {
    id: "konstruktion-mittellinie",
    text:
      "Methode 1 — Geometrische Zinkenteilung auf der Mittellinie (der " +
      "Standardweg). Du brauchst nur zwei Masse: Brettbreite B und Brettdicke D. " +
      "Schritt 1: Schwalbenzahl schaetzen mit AZS = B geteilt durch (1,7 mal D). " +
      "Beispiel B=140 mm, D=20 mm: AZS = 140 / (1,7 x 20) = 140 / 34 = 4,12, also " +
      "rund 4 Schwalben. Schritt 2: Anzahl der Teile AZT = AZS mal 3 plus 1. Bei " +
      "4 Schwalben: 4 x 3 + 1 = 13 Teile. Das eine zusaetzliche Teil entsteht " +
      "durch die beiden halben Randzinken. Schritt 3: Teilbreite T = B / AZT = " +
      "140 / 13 = 10,77 mm. Damit ist ein Zinken rund 10,8 mm breit und eine " +
      "Schwalbe rund 21,6 mm (2T). Schritt 4: Schraege anlegen, 1:6 — auf der " +
      "Schwalbenlaenge wandert die Flanke ZS = 6 x T, also rund 65 mm aus (als " +
      "Steigungsdreieck 10,8 hoch zu 65 breit). Fertig ist die Einteilung.",
    metadata: {
      source: "own-paraphrase",
      title: "Methode 1: Mittellinienteilung (AZS, AZT, T, Schraege) — Beispiel B=140/D=20",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrasiert nach Konstruktionslehre (Tischler-Fachbuch), Kap. 4, Beispiel B=140/D=20",
    },
  },
  {
    id: "konstruktion-warum-17",
    text:
      "Warum steht in der Schwalbenformel die Zahl 1,7? Das ist ein " +
      "Erfahrungswert aus der Werkstatt, kein Naturgesetz. AZS = B / (1,7 x D) " +
      "gibt dir eine SCHWALBENZAHL, bei der die Schwalben in einem schoenen, " +
      "kraeftigen Verhaeltnis zur Brettdicke stehen — nicht zu viele winzige, " +
      "nicht zu wenige klobige. Willst du WENIGER und breitere Schwalben, nimmst " +
      "du statt 1,7 die 2: AZS = B / (2 x D). Beide Wege sind richtig; der Faktor " +
      "steuert nur, wie fein die Teilung wird. Eselsbruecke fuer den Lehrling: " +
      "1,7 ist dein Daumenwert fuer 'normal-fein', 2 fuer 'etwas groeber'. Und " +
      "am Ende darf das Auge entscheiden — die Anzahl darf man auch einfach nach " +
      "Augenmass festlegen.",
    metadata: {
      source: "own-paraphrase",
      title: "Warum 1,7 in AZS = B/(1,7·D)? — Faustwert erklaert",
      topic: "konstruktion",
      license: "own-paraphrase",
    },
  },
  {
    id: "konstruktion-randverstaerkung",
    text:
      "Methode 2 — Zinkenteilung ueber die Randzinkenverstaerkung. Diese Methode " +
      "nimmst du, wenn die Randzinken (ganz aussen) kraeftiger sein sollen, damit " +
      "die Ecke nicht ausbricht. Schritt 1: Randzinkenverstaerkung RZV = D / 3. " +
      "Bei D=20 mm: RZV = 6,67, am Werkstueck auf rund 6,5 mm gerundet. Die volle " +
      "Randzinkenbreite ist dann 2 x RZV, also rund 13 mm. Schritt 2: Restbreite " +
      "RB = B minus 2 x RZV = 140 minus 13 = 127 mm. Schritt 3: Schwalbenzahl auf " +
      "der Restbreite: AZS = RB / (1,7 x D) = 127 / 34 = 3,7, also 4 Schwalben. " +
      "Schritt 4: Zinkenteilung ZT = RB / AZS = 127 / 4 = 31,8 mm. Die Restbreite " +
      "wird also in vier gleiche Bereiche von rund 32 mm geteilt, die beiden " +
      "Raender bleiben extra kraeftig stehen.",
    metadata: {
      source: "own-paraphrase",
      title: "Methode 2: Randzinkenverstaerkung (RZV, RB, ZT)",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrasiert nach Konstruktionslehre (Tischler-Fachbuch), Kap. 4",
    },
  },
  {
    id: "konstruktion-grundlinie-ungerade",
    text:
      "Methode 3 — Ungerade Teile auf der Grundlinie. Der einfachste Weg, wenn " +
      "es schnell gehen soll. Du teilst die Grundlinie in eine IMMER ungerade " +
      "Anzahl gleich grosser Teile. Schritt 1: Anzahl der Teile AZT = B / SL. SL " +
      "ist die Schwalbenlaenge; bei offenen (durchgehenden) Zinken ist SL gleich " +
      "der Brettdicke D. Beispiel B=140 mm, SL=20 mm: AZT = 140 / 20 = 7 Teile. " +
      "Wichtig: das Ergebnis muss auf eine ungerade Zahl gerundet werden — 5, 7, " +
      "9, 11 und so weiter. Schritt 2: Teilbreite T = B / AZT = 140 / 7 = 20 mm. " +
      "Weil sich Zinken und Schwalben abwechseln und die Anzahl ungerade ist, " +
      "sitzt aussen auf beiden Seiten ein Zinken — das gibt eine saubere, " +
      "symmetrische Ecke.",
    metadata: {
      source: "own-paraphrase",
      title: "Methode 3: Ungerade Teile auf der Grundlinie (AZT = B/SL)",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrasiert nach Konstruktionslehre (Tischler-Fachbuch), Kap. 4",
    },
  },
  {
    id: "konstruktion-halbverdeckt",
    text:
      "Halbverdeckte Zinken — wenn man die Verbindung von vorne NICHT sehen soll " +
      "(typisch bei Schubladen: vorne glatt, Zinken nur von der Seite sichtbar). " +
      "Dabei bleibt auf einer Seite ein duennes Blatt stehen, das die Zinken " +
      "verdeckt. Die Blattstaerke BL waehlt man zwischen einem Viertel und einem " +
      "Drittel der Brettdicke: BL = D/4 bis D/3. Bei D=20 mm sind das rund 5 bis " +
      "6,7 mm. Die nutzbare Schwalbenlaenge wird dadurch kuerzer: SL = D minus " +
      "BL. Rechnest du mit SL=15 mm, ergibt die Grundlinienteilung bei B=140: " +
      "AZT = 140 / 15 = 9,3, gerundet auf die naechste ungerade Zahl also 9 " +
      "Teile. Sonst gilt dieselbe Logik wie bei den offenen Zinken.",
    metadata: {
      source: "own-paraphrase",
      title: "Halbverdeckte Zinken — Blattstaerke BL = D/4 bis D/3, SL = D − BL",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrasiert nach Konstruktionslehre (Tischler-Fachbuch), Kap. 4",
    },
  },
  {
    id: "konstruktion-hilfsstrahl",
    text:
      "Der Hilfsstrahl-Trick — wenn die Teilbreite eine krumme Zahl ergibt. " +
      "Beispiel B=140 mm, D=18 mm: AZT = 140 / 18 = 7,78, gerundet 9 Teile. Die " +
      "rechnerische Teilbreite waere 140 / 9 = 15,56 mm — so ein Mass kannst du " +
      "nicht sauber neunmal abmessen. Stattdessen: Zeichne einen schraegen " +
      "Hilfsstrahl von der einen Brettkante weg. Trag darauf neun GLEICHE, aber " +
      "beliebig grosse Abschnitte ab, zum Beispiel je 20 mm (macht 180 mm). " +
      "Verbinde den letzten Punkt mit dem Ende der Brettbreite. Jetzt uebertraegst " +
      "du die uebrigen Punkte parallel auf die Grundlinie — fertig sind neun exakt " +
      "gleiche Teilungen, ganz ohne Dezimalmasse abzumessen. Ein alter " +
      "Geometrie-Trick, der am Brett genauso funktioniert wie am Papier.",
    metadata: {
      source: "own-paraphrase",
      title: "Hilfsstrahl — gleiche Teilung ohne krumme Masse messen",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrasiert nach Konstruktionslehre (Tischler-Fachbuch), Kap. 4",
    },
  },
  {
    id: "konstruktion-schwindmass-regel",
    text:
      "Die wichtigste Material-Regel beim Zinken, die kein Anfaenger ueberhoeren " +
      "darf: Bei Massivholz wird NIE Laengsholz starr mit Querholz verleimt, wenn " +
      "das die natuerliche Bewegung des Holzes blockiert. Holz arbeitet — es " +
      "quillt und schwindet mit der Luftfeuchte, und zwar quer zur Faser viel " +
      "staerker als laengs. Verleimst du zwei Teile so, dass ihre Schwindmasse " +
      "gegeneinander arbeiten, reisst die Verbindung mit der Zeit und das Moebel " +
      "ist hin. Der Schwalbenschwanz ist gerade deshalb so gut: er haelt " +
      "formschluessig und laesst das Holz trotzdem arbeiten, ohne dass die Ecke " +
      "aufreisst. Merksatz: erst ans Schwinden denken, dann an die Teilung.",
    metadata: {
      source: "own-paraphrase",
      title: "Schwindmass-Regel — Laengsholz nie starr mit Querholz verleimen",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrasiert nach Konstruktionslehre (Tischler-Fachbuch), Kap. 4 (Massivholz-Warnung)",
    },
  },
  {
    id: "konstruktion-kreative-teilung",
    text:
      "Darf man von den Formeln abweichen? Ja — und das ist ausdruecklich " +
      "erlaubt. Die Berechnung gibt dir eine saubere, regelmaessige Standard- " +
      "teilung. Aber im modernen Moebelbau wird die sichtbare Zinkung bewusst " +
      "als Gestaltungselement eingesetzt: unterschiedlich breite Schwalben, " +
      "bewusst unregelmaessige Abstaende, schmale Akzent-Zinken. Solange drei " +
      "Dinge stimmen, ist alles erlaubt: genug Stabilitaet, ausreichende " +
      "Randabstaende (die Ecke darf nicht ausbrechen) und Ruecksicht auf die " +
      "Holzbewegung. Die Formel ist dein sicheres Fundament — die Gestaltung " +
      "darauf ist Handwerkskunst.",
    metadata: {
      source: "own-paraphrase",
      title: "Kreative Zinkenteilung — wann man von der Formel abweichen darf",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrasiert nach Konstruktionslehre (Tischler-Fachbuch), Kap. 4",
    },
  },
];

export function getZinkenKonstruktionCorpus(): RAGDocument[] {
  return ZINKEN_KONSTRUKTION_CORPUS;
}
