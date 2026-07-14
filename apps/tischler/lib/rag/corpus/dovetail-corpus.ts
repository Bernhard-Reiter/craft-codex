import type { RAGDocument } from "@craft-codex/core";

/**
 * Schwalbenschwanz-Wissenskorpus (Phase C+).
 *
 * Inhalt aus drei Quellklassen, jeweils per `metadata.license` markiert:
 *  - "own-paraphrase"     → eigene paraphrasierte Fachtexte (kein woertliches
 *                           Zitat aus geschuetzten Werken)
 *  - "CC-BY-SA-4.0"       → Wikipedia DE Volltext, mit Attribution
 *  - "official-document"  → Auszuege aus oeffentlichen Verordnungen (RIS / BMBWF)
 *
 * Quellenangaben in `metadata.source` und `metadata.attribution`.
 * Lehrling-EDU (MIT, Open-Core) lasst nur lizenzkompatible Eintraege zu —
 * proprietary Variante kann spaeter weitere Lizenzklassen ergaenzen
 * (z.B. "barlieb-licensed" fuer kommerziell lizenzierte INNOS-Materialien).
 *
 * Schema folgt RAGDocument aus @craft-codex/core.
 */

export type DovetailLicense =
  | "CC-BY-SA-4.0"
  | "CC-BY-4.0"
  | "public-domain"
  | "own-paraphrase"
  | "official-document";

/** Zulaessige Lizenzen fuer den Open-Core Lehrling-EDU Build. */
export const OPEN_CORE_LICENSES: ReadonlyArray<DovetailLicense> = [
  "CC-BY-SA-4.0",
  "CC-BY-4.0",
  "public-domain",
  "own-paraphrase",
  "official-document",
];

export const DOVETAIL_CORPUS: RAGDocument[] = [
  // ─────────────────────────────────────────────────────────────────────
  // Phase 1: Bestand (10 Docs, paraphrasiert) — license: own-paraphrase
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "anriss-streichmass",
    text:
      "Der Anriss ist die Grundlage jeder Schwalbenschwanzverbindung. " +
      "Mit dem Streichmass wird die Brettstaerke umlaufend auf das " +
      "Hirnholz uebertragen — diese Linie markiert die maximale Stemmtiefe. " +
      "Anschliessend werden die Schwalbenwinkel mit der Schmiege auf 1:6 " +
      "(Weichholz) bzw. 1:8 (Hartholz) angetragen. Wichtig: alle Anrisse " +
      "umlaufend ziehen, damit man von beiden Seiten saegen kann.",
    metadata: {
      source: "spannagel",
      title: "Der Moebelbau — Anrisstechnik",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "pin-verteilung",
    text:
      "Pin-Anzahl und Verteilung haengen von der Brettbreite ab. Faustregel: " +
      "bei Brettern bis 100mm reichen 3-5 Pins, bei breiteren Brettern eine " +
      "ungerade Anzahl. Asymmetrische Verteilung (kleinere Aussenpins) gilt " +
      "als handwerklich hochwertig — sie zeigt dass die Pins von Hand " +
      "angerissen wurden, nicht maschinell. Gleichmaessige Verteilung ist " +
      "fuer Anfaenger oekonomischer.",
    metadata: {
      source: "spannagel",
      title: "Der Moebelbau — Pin-Geometrie",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "saegen-abfallseite",
    text:
      "Beim Saegen IMMER auf der Abfallseite der Anrisslinie schneiden — " +
      "die Anrisslinie selbst muss als feiner Strich stehenbleiben. So bleibt " +
      "Material zum Nachjustieren beim Anpassen. Klausz' Empfehlung: zuerst " +
      "die Pins saegen, dann ueber die Pins die Schwalben anreissen. Diese " +
      "Pin-First-Methode reduziert Uebertragungsfehler. Saegeblatt: " +
      "japanische Ryoba oder eine feine Gestellsaege mit 14-16 ZpZ.",
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
      "Der Schwalbenwinkel beschreibt das Verhaeltnis von Brettstaerke zu " +
      "seitlichem Versatz. 1:8 (etwa 7°) ist Standard fuer Hartholz wie " +
      "Eiche oder Buche — der flache Winkel genuegt, zu steile Winkel " +
      "liessen die kurzen Fasern an den Schwalbenspitzen ausbrechen. " +
      "1:6 (etwa 9.5°) wird fuer Weichholz wie Kiefer oder Fichte " +
      "empfohlen: das weichere Holz gibt unter Last nach, der steilere " +
      "Winkel sichert die mechanische Verriegelung. Steiler als 1:4 " +
      "verboten — bricht bei Belastung.",
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
      "Stemmeisen-Schliff: 25 Grad fuer Weichholz, 30 Grad fuer Hartholz. " +
      "Das Stosseisen sollte breiter als der schmalste Pin sein, um sauber " +
      "in einem Zug zwischen den Schwalben durchstemmen zu koennen. Wichtig " +
      "ist eine spiegelblanke Schneidkante — Honung mit Wassersteinen " +
      "(8000er Koernung) kurz vor jedem Einsatz. Stumpfes Eisen reisst " +
      "Holzfasern statt zu schneiden, was die Passung ruiniert.",
    metadata: {
      source: "pollak",
      title: "Holzverbindungen — Werkzeugkunde",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "stemm-technik",
    text:
      "Beim Stemmen erst senkrecht in die Anrisslinie einschlagen — das " +
      "verhindert dass das Stemmeisen unter der Linie ausreisst. Dann von " +
      "unten in flachem Winkel das Material wegspalten. Niemals tiefer als " +
      "die Streichmass-Linie stemmen. Aus beiden Richtungen abwechselnd " +
      "arbeiten, damit kein Hirnholz auf der Rueckseite ausreisst. Letzten " +
      "halben Millimeter mit dem Stechbeitel von Hand abnehmen.",
    metadata: {
      source: "pollak",
      title: "Holzverbindungen — Stemm-Technik",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "schwalbenschwanz-history",
    text:
      "Die Schwalbenschwanzverbindung (englisch: dovetail joint) ist seit " +
      "dem alten Aegypten belegt — gefunden in Moebeln aus dem Grab " +
      "Tutanchamuns. Sie wurde ueber Jahrtausende verfeinert und gilt im " +
      "europaeischen Tischlerhandwerk als Koenigsdisziplin der Holzverbindung. " +
      "Die mechanische Verriegelung haelt ohne Leim oder Schraube. " +
      "Hauptanwendungen: Schubladenseiten, Schatullen, Truhen.",
    metadata: {
      source: "wikipedia-de",
      title: "Schwalbenschwanzverbindung — Geschichte",
      topic: "uebersicht",
      license: "own-paraphrase",
    },
  },
  {
    id: "passen-ist-soll",
    text:
      "Das Anpassen erfolgt trocken (ohne Leim). Brett B vorsichtig auf " +
      "Brett A schieben — geht es ohne Druck rein, ist die Passung zu lose " +
      "und das Werkstueck unbrauchbar. Klemmt es zu stark, mit dem " +
      "Stechbeitel die hohen Stellen identifizieren (Glanzstellen vom Reiben) " +
      "und punktuell abnehmen. Ziel: leichtes Klopfen mit dem Holzhammer " +
      "fuegt die Verbindung zusammen, ohne Risse zu erzeugen.",
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
      "Lehrplan-Kriterien Tischler-Lehre Oesterreich, Modul 3 " +
      "(Holzverbindungen): die Schwalbenschwanzverbindung muss in vier " +
      "Schritten beherrscht werden — sauberes Anreissen mit Streichmass + " +
      "Schmiege, exaktes Saegen auf der Abfallseite, sauberes Stemmen ohne " +
      "Ausreisser, dichte Passung ohne sichtbare Spalten. Bewertung: " +
      "maximaler Spalt 0.2mm, kein Hirnholz-Ausriss, gleichmaessige " +
      "Pin-Geometrie.",
    metadata: {
      source: "lehrplan-at",
      title: "Lehrplan Tischler — Modul 3 Kriterien (paraphrasiert)",
      topic: "uebersicht",
      license: "own-paraphrase",
    },
  },
  {
    id: "haeufige-fehler",
    text:
      "Typische Fehler beim Schwalbenschwanz: (1) Pin zu schmal — " +
      "bricht beim Einschlagen; mindestens 4mm an der schmalsten Stelle. " +
      "(2) Saegeblatt verzogen — Schnitt laeuft schraeg, Pin wird unten " +
      "duenner. (3) Streichmass-Linie ueberstemmt — Spalt auf der " +
      "Brettkoerper-Seite. (4) Vergessen umlaufend anzureissen — " +
      "Saegeschnitt schiesst durch. (5) Ungeduldiges Anpassen mit Hammer " +
      "ohne Trocken-Test — gespaltene Pins.",
    metadata: {
      source: "barlieb-workshop",
      title: "INNOS Workshop — Fehlerbilder",
      topic: "pruefen",
      license: "own-paraphrase",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Wikipedia DE — Schwalbenschwanzverbindung (CC-BY-SA 4.0)
  // Quelle: https://de.wikipedia.org/wiki/Schwalbenschwanzverbindung
  // Stand: 2026-05-09 — Volltext gechunkt nach Sektionen.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "wikipedia-schwalbenschwanz-beschreibung",
    text:
      "Die Schwalbenschwanzverbindung aehnelt einer Spundung, bei der die " +
      "Form des Spunds entfernt an die gegabelte Form des Schwanzes einer " +
      "Schwalbe erinnert. Im Gegensatz zur Spundung ist sie in hoeherem " +
      "Masse formschluessig — nicht nur quer zum Schwalbenschwanz, sondern " +
      "auch in dessen Laengsrichtung. Die Verbindung wird in der dritten " +
      "Richtung gefuegt, die ebenfalls quer zum Schwalbenschwanz liegt.",
    metadata: {
      source: "wikipedia-de",
      title: "Schwalbenschwanzverbindung — Beschreibung",
      topic: "uebersicht",
      license: "CC-BY-SA-4.0",
      attribution: "Wikipedia DE Mitwirkende, Lizenz CC-BY-SA 4.0",
      source_url:
        "https://de.wikipedia.org/wiki/Schwalbenschwanzverbindung",
    },
  },
  {
    id: "wikipedia-schwalbenschwanz-tannenbaum",
    text:
      "Bei mehrfach gezackten Ausfuehrungen spricht man von einer " +
      "Tannenbaumverbindung. Diese Form ist vor allem zur Befestigung von " +
      "Laufschaufeln von Stroemungsmaschinen verbreitet, da hohe Fliehkraefte " +
      "auf mehrere Kontaktflaechen verteilt werden koennen. Die Tannenbaum- " +
      "Geometrie ist eine Variante der Schwalbenschwanzverbindung mit " +
      "mehreren formschluessigen Stufen statt einer einzelnen.",
    metadata: {
      source: "wikipedia-de",
      title: "Schwalbenschwanzverbindung — Tannenbaumverbindung",
      topic: "uebersicht",
      license: "CC-BY-SA-4.0",
      attribution: "Wikipedia DE Mitwirkende, Lizenz CC-BY-SA 4.0",
      source_url:
        "https://de.wikipedia.org/wiki/Schwalbenschwanzverbindung",
    },
  },
  {
    id: "wikipedia-schwalbenschwanz-anwendungen-holz",
    text:
      "In der Holzverbindungstechnik benoetigen Schwalbenschwanzverbindungen " +
      "keine zusaetzlichen metallischen Verbindungselemente. Die Anwendung " +
      "findet sich in der Tischlerei zur Verbindung von Massivhoelzern bei " +
      "Schubladen, Truhen und Musikinstrumenten. Eine weitere Anwendung " +
      "liegt im Fachwerkbau, wo Schwalbenschwanzverbindungen tragende " +
      "Verbindungen ohne Naegel oder Schrauben ermoeglichen.",
    metadata: {
      source: "wikipedia-de",
      title: "Schwalbenschwanzverbindung — Anwendungen Holz",
      topic: "uebersicht",
      license: "CC-BY-SA-4.0",
      attribution: "Wikipedia DE Mitwirkende, Lizenz CC-BY-SA 4.0",
      source_url:
        "https://de.wikipedia.org/wiki/Schwalbenschwanzverbindung",
    },
  },
  {
    id: "wikipedia-schwalbenschwanz-anwendungen-maschinenbau",
    text:
      "Im Maschinenbau dienen Schwalbenschwanzverbindungen zur Befestigung " +
      "der Schaufeln auf dem Laufrad einer Stroemungsmaschine. In Werkzeug- " +
      "maschinen wird im Maschinentisch eine trapezfoermige Nut zur Aufnahme " +
      "von Spanneisen eingearbeitet, in die Spannpratzen von der Seite " +
      "eingeschoben werden. Schwalbenschwanzfuehrungen erlauben formschluessige, " +
      "translation ermoeglichende Gleitfuehrungen und koennen auch als " +
      "Waelzfuehrung realisiert werden. Eine weitere Anwendung ist die " +
      "Schnellbefestigung von Fotoapparaten auf Stativen.",
    metadata: {
      source: "wikipedia-de",
      title: "Schwalbenschwanzverbindung — Anwendungen Maschinenbau",
      topic: "uebersicht",
      license: "CC-BY-SA-4.0",
      attribution: "Wikipedia DE Mitwirkende, Lizenz CC-BY-SA 4.0",
      source_url:
        "https://de.wikipedia.org/wiki/Schwalbenschwanzverbindung",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Lehrplan AT — Tischlerei-Ausbildungsordnung (offizielles Dokument)
  // Quelle: RIS BKA Gesetzesnummer 20011991
  // Stand: 2026-05-09 — kurze direkte Zitate aus oeffentlichem Recht.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "lehrplan-at-tischlerei-verbindungen",
    text:
      "Die oesterreichische Tischlerei-Ausbildungsordnung verlangt im " +
      "Kompetenzbereich 4 (Tischlerarbeiten) unter 4.3 Arbeitsausfuehrung " +
      "explizit: 'loesbare und unloesbare Verbindungen herstellen, " +
      "insbesondere Verleimungen, Ueberblattungen, Schlitz- und " +
      "Zapfenverbindungen, Zinkenverbindungen, Duebelverbindungen, " +
      "Lamellenverbindungen und Verbindungen mittels Beschlaegen'. " +
      "Diese Kompetenz ist allen drei Lehrjahren zugeordnet.",
    metadata: {
      source: "ris-bka-at",
      title: "Tischlerei-Ausbildungsordnung — Kompetenz 4.3.15",
      topic: "uebersicht",
      license: "official-document",
      attribution:
        "Republik Oesterreich, RIS-BKA Gesetzesnummer 20011991, oeffentliche Verordnung",
      source_url:
        "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011991",
    },
  },
  {
    id: "lehrplan-at-tischlerei-bearbeitung",
    text:
      "Die Tischlerei-Ausbildungsordnung listet unter 4.3 Arbeitsausfuehrung " +
      "die manuelle Holzbearbeitung explizit auf: 'Materialien und " +
      "Werkstuecke bearbeiten, insbesondere Messen, Anreissen, Aufreissen, " +
      "Hobeln, Saegen, Stemmen, Bohren, Schleifen, Schweifen, Fuegen, " +
      "Fraesen'. Anreissen und Stemmen sind also bereits durch das " +
      "oeffentliche Berufsbild verbindlich vorgeschrieben — die " +
      "Schwalbenschwanzverbindung gehoert zu den Zinkenverbindungen.",
    metadata: {
      source: "ris-bka-at",
      title: "Tischlerei-Ausbildungsordnung — Arbeitsausfuehrung",
      topic: "uebersicht",
      license: "official-document",
      attribution:
        "Republik Oesterreich, RIS-BKA Gesetzesnummer 20011991, oeffentliche Verordnung",
      source_url:
        "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011991",
    },
  },
  {
    id: "lehrplan-at-tischlerei-berufsprofil",
    text:
      "Das Berufsprofil der Tischlerei-Ausbildungsordnung beschreibt die " +
      "Qualifikation als 'Schwerpunktlehrberuf' mit drei Lehrjahren plus " +
      "Spezialisierung in 'Allgemeine Tischlerei' oder 'Drechslerei'. Im " +
      "gemeinsamen Kompetenzbereich Tischlerarbeiten muss die Lehrabsolventin " +
      "Skizzen und fertigungsgerechte Zeichnungen erstellen, fuer die " +
      "Einsatzbereitschaft von Werkzeugen sorgen und unterschiedliche " +
      "Verfahren der Materialbearbeitung wie Saegen, Schleifen oder " +
      "Lackieren beherrschen. Die Schwalbenschwanzverbindung ist eine " +
      "konkrete Auspraegung der geforderten Zinkenverbindungen.",
    metadata: {
      source: "ris-bka-at",
      title: "Tischlerei-Ausbildungsordnung — Berufsprofil",
      topic: "uebersicht",
      license: "official-document",
      attribution:
        "Republik Oesterreich, RIS-BKA Gesetzesnummer 20011991, oeffentliche Verordnung",
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
      "Die Schmiege wird auf den gewaehlten Schwalbenwinkel eingestellt — " +
      "ueblich ist eine bezifferte Skala mit den Standardverhaeltnissen 1:6 " +
      "und 1:8. Vor dem Anreissen prueft man die Einstellung an einem " +
      "Reststueck: kurzer Strich, dann gegenkontrollieren mit dem " +
      "Anschlagswinkel. Eine schief eingestellte Schmiege erzeugt unsymmetrische " +
      "Pins und ruiniert die Verbindung schon vor dem ersten Saegeschnitt. " +
      "Tipp: pro Werkstueck einmal einstellen und nicht mehr verstellen.",
    metadata: {
      source: "own-paraphrase",
      title: "Schmiege einstellen + Pruefen",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-streichmass-justierung",
    text:
      "Das Streichmass wird auf die genaue Brettstaerke des Gegenstuecks " +
      "eingestellt — nicht auf die Staerke des aktuellen Werkstuecks. Bei " +
      "Brett B (Pins) muss die Linie auf Brett A (Schwalben) auf die " +
      "Brettstaerke von B kalibriert sein. Streichmass-Werkstoffe: " +
      "Holzkoerper sind traditionell, Metallklingen halten ihren Schliff " +
      "laenger. Die Klinge muss messerscharf sein — eine stumpfe Klinge " +
      "reisst Fasern statt sauber zu ritzen.",
    metadata: {
      source: "own-paraphrase",
      title: "Streichmass — Justierung + Werkstoffe",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-hirnholz-markierung",
    text:
      "Auf dem Hirnholz wird traditionell ein Kreuz oder Strich gesetzt um " +
      "Schwalben und Pins eindeutig zu unterscheiden. Das Kreuz markiert die " +
      "Abfallzone zwischen den Pins, der Strich die zu erhaltenden Schwalben. " +
      "Beim Saegen orientiert man sich an dieser Markierung — wer ein Kreuz " +
      "stehen laesst, hat das Werkstueck spiegelverkehrt geschnitten und " +
      "die Verbindung passt nicht. Die Markierung sollte mit dem Bleistift " +
      "in der Abfallzone gesetzt werden, nicht eingeritzt.",
    metadata: {
      source: "own-paraphrase",
      title: "Hirnholz-Markierung Kreuz vs Strich",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-uebertragung-brett-zu-brett",
    text:
      "Bei der Pin-First-Methode werden zuerst die Pins fertig gesaegt und " +
      "ausgestemmt — dann wird Brett A (Schwalben) auf Brett B (Pins) " +
      "gestellt und mit dem Anreissmesser laengs der Pin-Kanten markiert. " +
      "Das Brett muss dabei exakt fluchten — leichtester Versatz erzeugt " +
      "Spalten. Hilfsmittel: Schraubzwinge zum Halten, ebene Werkbank, " +
      "und ein scharfes Anreissmesser (kein Bleistift, der ist zu dick). " +
      "Die uebertragenen Linien definieren die Schwalben-Geometrie.",
    metadata: {
      source: "own-paraphrase",
      title: "Uebertragung Brett A → Brett B (Pin-First)",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-pin-symmetrie-tradition",
    text:
      "Symmetrische Pin-Anordnung (alle Pins gleich breit) ist maschinell " +
      "schneller und fuer industrielle Schubladen Standard. Asymmetrische " +
      "Anordnung (kleine Pins aussen, breitere innen) gilt im traditionellen " +
      "Tischlerhandwerk als Qualitaetsmerkmal — sie zeigt, dass die " +
      "Verbindung von Hand angerissen wurde. Englische Schubladen-Tradition: " +
      "Aussenpins so schmal wie statisch sinnvoll (etwa 4-5mm) fuer einen " +
      "filigraneren Eindruck. Funktional macht das keinen Unterschied — " +
      "beides haelt mechanisch identisch.",
    metadata: {
      source: "own-paraphrase",
      title: "Symmetrische vs asymmetrische Pin-Anordnung",
      topic: "anreissen",
      license: "own-paraphrase",
    },
  },
  {
    id: "anreissen-anreissmesser-vs-bleistift",
    text:
      "Das Anreissmesser hinterlaesst eine messerschmale Linie, die als " +
      "Saegehilfe dient — der Saegeruecken kann sich in dieser Linie " +
      "fuehren lassen. Ein Bleistiftstrich ist 0.3-0.5mm dick und " +
      "erlaubt keine Praezision unter 0.5mm. Faustregel: Anreissmesser " +
      "fuer alle finalen Linien (Saegekante, Streichmass), Bleistift nur " +
      "fuer Markierungen in der Abfallzone (Pin-Mitte, Kreuze). Wer mit " +
      "Bleistift saegt, kann auch keine 0.1mm Toleranz erreichen.",
    metadata: {
      source: "own-paraphrase",
      title: "Anreissmesser vs Bleistift — Praezisionsdifferenz",
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
      "Drei klassische Saegen fuer Schwalbenschwanz: (1) Japanische Ryoba " +
      "— Doppelblatt mit Querschnitt + Laengsschnitt, sehr flexibel. " +
      "(2) Japanische Dozuki — Ruecken-versteifte Praezisionssaege, " +
      "ideal fuer feinste Schwalbenschnitte. (3) Westliche Gestellsaege " +
      "(Continental) — robust, fuer Hartholz, etwas dicker im Schnitt. " +
      "Anfaenger profitieren oft von der Dozuki — der Ruecken zwingt " +
      "den Schnitt gerade. Profis variieren je nach Holzart.",
    metadata: {
      source: "own-paraphrase",
      title: "Ryoba vs Dozuki vs Gestellsaege",
      topic: "saegen",
      license: "own-paraphrase",
    },
  },
  {
    id: "saegen-koerperhaltung-fuehrung",
    text:
      "Die Saegehaltung entscheidet ueber die Schnittpraezision: Werkstueck " +
      "auf Augenhoehe oder leicht darunter aufgespannt, Schultern gerade, " +
      "Saegehand-Unterarm in einer Linie mit dem Saegeblatt. Der Schnitt " +
      "wird mit dem ganzen Arm gefuehrt, nicht nur mit dem Handgelenk — " +
      "das Handgelenk fixiert nur den Winkel. Atmen nicht anhalten. " +
      "Ergonomisch korrekt: man steht leicht seitlich versetzt, sodass " +
      "der Saegezug in einer geraden Linie laeuft.",
    metadata: {
      source: "own-paraphrase",
      title: "Saegehaltung + Koerperposition",
      topic: "saegen",
      license: "own-paraphrase",
    },
  },
  {
    id: "saegen-zugsaege-vs-stosssaege",
    text:
      "Japanische Saegen schneiden auf Zug — das Saegeblatt steht im " +
      "Zugmoment unter Zugspannung und kann darum sehr duenn sein " +
      "(0.3-0.4mm Schnittfuge). Westliche Saegen schneiden auf Stoss — " +
      "das Blatt muss steifer sein um nicht zu knicken (0.6-0.8mm " +
      "Schnittfuge). Konsequenz: Japan-Saegen sind genauer aber " +
      "empfindlicher, West-Saegen verzeihender aber breiter im Schnitt. " +
      "Fuer Schwalbenschwanz im Hartholz lohnt eine duenne Japan-Saege " +
      "wegen der schmalen Pins.",
    metadata: {
      source: "own-paraphrase",
      title: "Zugsaege vs Stoss-Saege — Tradition + Mechanik",
      topic: "saegen",
      license: "own-paraphrase",
    },
  },
  {
    id: "saegen-zpz-auswahl",
    text:
      "ZpZ (Zaehne pro Zoll) bestimmt Schnittgeschwindigkeit und " +
      "Oberflaechenqualitaet. Fuer Schwalbenschwanz: 14-20 ZpZ ist der " +
      "Sweet Spot. Weniger ZpZ (8-10) schneidet schneller, hinterlaesst " +
      "aber raue Saegekanten die nachgearbeitet werden muessen. Mehr " +
      "ZpZ (22-26) schneidet super-fein, ist aber langsam und neigt " +
      "zum Verstopfen mit Spaenen. Fuer Hirnholz (laengs Faser): " +
      "Querschnitt-Verzahnung. Fuer Brettstirnseite (quer Faser): " +
      "Laengsschnitt-Verzahnung. Falsche Verzahnung erzeugt Ausreisser.",
    metadata: {
      source: "own-paraphrase",
      title: "ZpZ — Zaehne pro Zoll Auswahl",
      topic: "saegen",
      license: "own-paraphrase",
    },
  },
  {
    id: "saegen-schraenkung-saw-set",
    text:
      "Die Schraenkung ist die seitliche Auslenkung der Saegezaehne — sie " +
      "macht den Schnittspalt breiter als das Blatt selbst, damit das " +
      "Blatt nicht klemmt. Eine zu starke Schraenkung erzeugt rauhen " +
      "Schnitt, eine zu geringe laesst das Blatt unter Reibung warm laufen. " +
      "Mit dem Saw-Set wird die Schraenkung nachjustiert. Bei Japan-Saegen " +
      "ist die Schraenkung ab Werk und sollte nicht selbst nachgestellt " +
      "werden — Klingenwechsel ist ueblich. Bei westlichen Gestellsaegen " +
      "ist regelmaessiges Schraenken Pflicht.",
    metadata: {
      source: "own-paraphrase",
      title: "Schraenkung — Saw-Set Justierung",
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
      "Stemmeisen-Pflege ist Pflicht: vor jedem Einsatz wird die Schneide " +
      "auf Wassersteinen abgezogen. Standardprogramm: 1000er Koernung fuer " +
      "Grobschliff, 4000er fuer Feinschliff, 8000er fuer Polish. Der " +
      "Spiegelpolitur-Test: man muss seine Augenbraue darin sehen koennen. " +
      "Wassersteine vor Gebrauch 5-10 Minuten in Wasser legen, sonst " +
      "ziehen sie das Eisen zu. Nach der Honung: Eisen kurz abtrocknen, " +
      "duenn mit Kamelienoel einreiben gegen Rost.",
    metadata: {
      source: "own-paraphrase",
      title: "Stemmeisen-Pflege + Wassersteine",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "stemmen-werkbank-aufspannung",
    text:
      "Beim Stemmen muss das Werkstueck unbeweglich aufgespannt sein. " +
      "Werkbank mit Vorderzange + Hinterzange ist der Goldstandard. " +
      "Alternativ Schraubzwingen mit Holzschutz-Backen. Wichtig: " +
      "Aufspann-Punkt nahe dem Stemm-Bereich, nicht 30cm weiter weg — " +
      "sonst schwingt das Werkstueck unter dem Schlag und das Eisen " +
      "rutscht. Bei Schwalbenschwanz-Stemmungen muss das Brett vertikal " +
      "stehen koennen, damit man von oben in das Hirnholz stemmen kann. " +
      "Eine Pin-Klemmleiste hilft bei wiederholten Auspsannungen.",
    metadata: {
      source: "own-paraphrase",
      title: "Werkbank + Aufspannung der Werkstuecke",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "stemmen-holzhammer-auswahl",
    text:
      "Der Holzhammer fuer Stemmarbeiten: traditionell aus Weissbuche oder " +
      "Hainbuche, Gewicht 400-600g. Zu leicht (unter 300g) erfordert mehr " +
      "Schlaege und ermuedet die Hand, zu schwer (ueber 800g) fuehrt zu " +
      "ueberzogenen Stemmungen. Kunststoff-Klueppel (Polyamid) sind " +
      "Alternative — sie zerstoeren das Stemmeisen-Heft nicht so schnell. " +
      "Niemals einen Metallhammer nutzen — der treibt das Heft " +
      "auseinander. Der Schlag soll ploetzlich und kurz sein, nicht " +
      "lange klopfen.",
    metadata: {
      source: "own-paraphrase",
      title: "Holzhammer-Auswahl — Gewicht + Material",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "stemmen-auflage-restholz",
    text:
      "Beim Stemmen muss unter dem Werkstueck ein Restholz liegen — sonst " +
      "splittert das Hirnholz auf der Rueckseite aus. Das Restholz " +
      "(Buche, mindestens 15mm dick) faengt das durchgehende Stemmeisen " +
      "ab und definiert eine saubere Abreisskante. Klassischer Anfaenger- " +
      "Fehler: Werkstueck auf der nackten Werkbank stemmen — die " +
      "Werkbankplatte wird zerschlagen UND das Werkstueck reisst aus. " +
      "Restholz nach jeder Sitzung kontrollieren und ggf wenden.",
    metadata: {
      source: "own-paraphrase",
      title: "Auflage-Restholz — Schutz vor Hirnholz-Ausriss",
      topic: "stemmen",
      license: "own-paraphrase",
    },
  },
  {
    id: "stemmen-brust-vs-schlag",
    text:
      "Zwei Stemmtechniken: (1) Brust-Stemmung — Eisen mit der Brust oder " +
      "Schulter gefuehrt, ohne Hammer, fuer feines Nacharbeiten und " +
      "Glanzstellen. Praezise aber kraftraubend. (2) Schlag-Stemmung — " +
      "mit Holzhammer, schnell und kraftvoll, fuer Grob-Material- " +
      "abnahme. Der typische Schwalbenschwanz nutzt beide: erst " +
      "Schlag-Stemmung um das Material zwischen den Pins grob zu " +
      "entfernen (80% des Volumens), dann Brust-Stemmung um die " +
      "letzten 0.5mm bis zur Streichmass-Linie zu schaben.",
    metadata: {
      source: "own-paraphrase",
      title: "Brust-Stemmung vs Schlag-Stemmung",
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
      "Der Trocken-Test ist NICHT optional. Bevor irgendein Leim auf das " +
      "Werkstueck kommt, muss die Verbindung trocken zusammengeschoben werden. " +
      "Fluechtige Pruefung reicht nicht — die volle Tiefe muss erreicht " +
      "werden, ohne Brechen der Pins. Findet man im Trockentest einen " +
      "zu engen Bereich, wird mit dem Stechbeitel selektiv abgetragen. " +
      "Wer den Trocken-Test ueberspringt und direkt mit Leim arbeitet, " +
      "verliert das Werkstueck — Leim setzt schon nach 30 Sekunden an, " +
      "Korrekturen sind dann unmoeglich.",
    metadata: {
      source: "own-paraphrase",
      title: "Trocken-Test ist Pflicht",
      topic: "passen",
      license: "own-paraphrase",
    },
  },
  {
    id: "passen-glanzstellen-diagnose",
    text:
      "Glanzstellen entstehen beim Trocken-Test durch Reibung an zu engen " +
      "Stellen — das Holz wird leicht poliert und glaenzt im Streiflicht. " +
      "Sie sind die wichtigste diagnostische Information beim Anpassen. " +
      "Werkzeug: das Werkstueck nach dem Trockentest gegen einen " +
      "Lichteinfall halten und die Schwalben-Innenseiten abscannen. " +
      "Glanz auf der Schwalben-Wange = wegnehmen mit Stechbeitel " +
      "(0.1-0.2mm). Glanz auf dem Pin-Hirnholz = Pin ist zu lang. " +
      "Kein Glanz, aber Werkstueck klemmt = Streichmass-Linie zu hoch.",
    metadata: {
      source: "own-paraphrase",
      title: "Glanzstellen identifizieren beim Anpassen",
      topic: "passen",
      license: "own-paraphrase",
    },
  },
  {
    id: "passen-eckiger-pin-vs-spalt",
    text:
      "Diagnose-Matrix Schwalbenschwanz-Passung: (1) Eckiger Pin im " +
      "Schwalben-Eingang = Pin oben zu breit, mit Stechbeitel die Pin- " +
      "Oberkante leicht abschraegen. (2) Sichtbarer Spalt am Streichmass = " +
      "Pin zu kurz oder Streichmass-Linie zu hoch. (3) Spalt nur an " +
      "einer Seite = Saegeschnitt war schief. (4) Brett-Ueberstand = " +
      "Brett ist breiter als geplant, planen mit der Hobelbank " +
      "buendig. (5) Lockerer Sitz = unbrauchbares Werkstueck, " +
      "neu beginnen.",
    metadata: {
      source: "own-paraphrase",
      title: "Eckiger Pin vs Spalt — Diagnose-Matrix",
      topic: "passen",
      license: "own-paraphrase",
    },
  },
  {
    id: "passen-letzter-schliff-stechbeitel",
    text:
      "Der letzte Schliff vor dem Verleimen erfolgt mit dem Stechbeitel — " +
      "nicht mit Schleifpapier (das verrundet die Kanten und ruiniert " +
      "die scharfe Pin-Geometrie). Mit der Brust-Stemmung-Technik werden " +
      "Glanzstellen punktgenau abgenommen, jeweils 0.1mm pro Durchgang. " +
      "Zwischen jedem Abtrag erneut Trocken-Test. Ziel: Brett B passt " +
      "mit leichtem Hammer-Klopfen vollstaendig in Brett A, ohne " +
      "Glanzstellen, ohne Spalt, ohne Pin-Ueberstand. Maximale " +
      "Schichtdicke 0.05mm fuer den allerletzten Durchgang.",
    metadata: {
      source: "own-paraphrase",
      title: "Letzter Schliff mit Stechbeitel",
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
      "Visuelle Soll-Ist-Pruefung der fertigen Verbindung: aus drei Distanzen " +
      "abscannen — (1) Aus 30cm Abstand: sieht die Verbindung satt aus oder " +
      "klafft sie? (2) Aus 10cm: sind die Schwalben-Schraegen geradlinig " +
      "oder wellig? (3) Aus 2cm im Streiflicht: sieht man Spalten oder " +
      "Hirnholz-Ausriss? Eine fertige Schwalbenschwanzverbindung soll " +
      "wie aus einem Stueck wirken — die einzelnen Pins sollten sich " +
      "im 30cm-Test fast nicht abzeichnen.",
    metadata: {
      source: "own-paraphrase",
      title: "Soll-Ist-Diff visuell — 3 Distanzen",
      topic: "pruefen",
      license: "own-paraphrase",
    },
  },
  {
    id: "pruefen-spalt-toleranz-klassen",
    text:
      "Spalt-Toleranz-Klassen fuer die Bewertung: (1) Profi-Niveau: " +
      "maximal 0.1mm Spalt, mit Lupe nicht erkennbar. (2) Geselle/Lehrling " +
      "Stufe 3: maximal 0.2mm Spalt, mit blossem Auge in Distanz nicht " +
      "sichtbar. (3) Lehrling Stufe 1: maximal 0.5mm Spalt, akzeptabel " +
      "fuer Trockenuebungen. Ueber 1mm Spalt = unbrauchbares Werkstueck. " +
      "Messhilfe: Fuehlerlehre (0.1mm-Blatt) oder Streichholz (0.5mm). " +
      "Bewertung im Streiflicht aus 30cm.",
    metadata: {
      source: "own-paraphrase",
      title: "Spalt-Toleranz-Klassen — Profi/Lehrling",
      topic: "pruefen",
      license: "own-paraphrase",
    },
  },
  {
    id: "pruefen-hirnholz-ausriss",
    text:
      "Hirnholz-Ausriss erkennen: am Uebergang zwischen Schwalbe und " +
      "Pin entsteht typisch ein kleiner Splitter wenn das Stemmeisen " +
      "ohne Restholz-Auflage durchgegangen ist. Diagnose: Bauteil mit " +
      "der Hirnholzseite gegen Licht halten, Auriss zeichnet sich als " +
      "kleine Ausbrechung ab. Korrektur ist meist nicht moeglich — " +
      "verklebter Splitter mit Holzleim wird funktional, aber bleibt " +
      "sichtbar. Lieber neu beginnen als versuchen zu kaschieren — " +
      "Lehrlings-Mentalitaet 'das wird schon' ist hier toedlich.",
    metadata: {
      source: "own-paraphrase",
      title: "Hirnholz-Ausriss erkennen + bewerten",
      topic: "pruefen",
      license: "own-paraphrase",
    },
  },
  {
    id: "pruefen-pin-symmetrie-messen",
    text:
      "Pin-Symmetrie-Messung: mit Messschieber Breite jedes Pins an " +
      "Ober- und Unterkante messen. Bei symmetrischer Anordnung: " +
      "alle Pins gleich +-0.2mm. Bei asymmetrischer Anordnung: das " +
      "Schema soll kontinuierlich sein, also klein-mittel-gross-mittel- " +
      "klein, nicht zufaellig. Hilfreich ist eine Skizze der Pin- " +
      "Verteilung VOR dem Anreissen — dann kann am Ende objektiv mit " +
      "Soll-Werten verglichen werden. Stark unterschiedliche Pin-Breiten " +
      "deuten auf falsch eingestellte Schmiege oder Saege-Drift hin.",
    metadata: {
      source: "own-paraphrase",
      title: "Pin-Symmetrie messen mit Messschieber",
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
      "Die Schmiege besteht aus zwei Schenkeln, die ueber eine Klemmschraube " +
      "winklig verstellbar sind. Klassische Bauform: Holzschenkel mit " +
      "Messing-Beschlag, alternativ Vollmetall. Die meisten Schmiegen " +
      "haben zusaetzlich eine bezifferte Skala fuer haeufige Winkel " +
      "(1:6, 1:8, 45 Grad). Pflege: Klemmschraube nicht ueberdrehen, " +
      "Schenkel-Auflageflaechen sauber halten — Holzspaene zwischen den " +
      "Schenkeln verfaelschen den Winkel. Vor jedem Anreissen den " +
      "eingestellten Winkel mit dem Anschlagswinkel pruefen.",
    metadata: {
      source: "own-paraphrase",
      title: "Schmiege Aufbau + Skala",
      topic: "werkzeug",
      license: "own-paraphrase",
    },
  },
  {
    id: "werkzeug-streichmass-holz-vs-metall",
    text:
      "Streichmass-Bauarten: (1) Holzkoerper mit Holzkeil — traditionell, " +
      "leicht, billig, der Holzkeil verspannt aber bei Feuchteschwankung. " +
      "(2) Vollmetall mit Mikrometer-Schraube — teurer, praeziser, " +
      "feuchteunempfindlich. (3) Holzkoerper mit Metall-Klemmscharnier — " +
      "Kompromiss. Klingen-Material: gehaerteter Stahl ist Pflicht, " +
      "spitz angeschliffen wie ein winziges Anreissmesser. Pflege: " +
      "Klinge regelmaessig nachschaerfen mit feinem Stein, leicht " +
      "geoelt aufbewahren.",
    metadata: {
      source: "own-paraphrase",
      title: "Streichmass — Holzkoerper vs Metall",
      topic: "werkzeug",
      license: "own-paraphrase",
    },
  },
  {
    id: "werkzeug-saegen-tradition-west-japan",
    text:
      "Westliche Saegen-Tradition: dicke Saegeblaetter, schraenkbare " +
      "Zaehne, fuer Stoss-Schnitt entwickelt — robust und reparierbar. " +
      "Japanische Tradition: super-duenne Blaetter, ab Werk geschraenkt, " +
      "Zugschnitt — feinster Schnitt aber empfindlich. Beide Traditionen " +
      "produzieren hervorragende Schwalbenschwaenze, die Wahl ist " +
      "Geschmackssache. Werkstattmix ist sinnvoll: Japan-Saege fuer " +
      "Praezision, West-Saege als robuste Alltagswaffe. Wichtiger als " +
      "die Tradition ist: scharfe, gerade ausgerichtete Saege.",
    metadata: {
      source: "own-paraphrase",
      title: "Westliche Saege vs Japan-Saege — Tradition + Praxis",
      topic: "werkzeug",
      license: "own-paraphrase",
    },
  },
  {
    id: "werkzeug-stemmeisen-groessen-set",
    text:
      "Stemmeisen-Set fuer Schwalbenschwanz: mindestens 6mm, 12mm und " +
      "20mm Schmal-Stemmeisen. Optional: schraege Stechbeitel (sog. " +
      "'Skew Chisels') fuer schwer erreichbare Pin-Ecken — sie kommen " +
      "in Pin-Innenecken, in die das gerade Eisen nicht passt. Material: " +
      "guter Werkzeugstahl (CrV oder PM-V11), Heft aus Hainbuche oder " +
      "Esche mit Schlagring. Set-Tipp: lieber 3 hervorragend gepflegte " +
      "Eisen als 12 stumpfe Eisen. Marken: Lie-Nielsen, Stanley Sweetheart, " +
      "Veritas, Two Cherries — jede Preisklasse hat brauchbare Optionen.",
    metadata: {
      source: "own-paraphrase",
      title: "Stemmeisen-Groessen-Set + Material",
      topic: "werkzeug",
      license: "own-paraphrase",
    },
  },
  {
    id: "werkzeug-honungsbank-setup",
    text:
      "Eine Honungsbank-Station gehoert in jede Werkstatt: stabiler " +
      "Untergrund (Werkbank-Ecke), Wassersteine in einer Plastik-Wanne " +
      "(damit das Wasser nicht das ganze Werkstueck flutet), Lederriemen " +
      "fuer das finale Abziehen, sauberes Tuch zum Trocknen. Ergonomie: " +
      "die Steine sollen auf Bauchhoehe sein, nicht zu hoch — beim " +
      "Honen muss man Druck nach unten geben koennen. Mindestens 5 " +
      "Minuten pro Stemmeisen einplanen. Eine schlecht gepflegte " +
      "Werkstatt produziert grundsaetzlich keine guten Schwalbenschwaenze.",
    metadata: {
      source: "own-paraphrase",
      title: "Honungsbank Setup",
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
      "Harthoelzer fuer Schwalbenschwanz: (1) Eiche — fest, langlebig, " +
      "klassisch fuer Schubladen. Gerbsaeure-haltig, nicht mit Eisen- " +
      "Naegeln kombinieren. (2) Buche — dichter als Eiche, gut zum " +
      "Stemmen, neigt aber zu Verzug bei Feuchteschwankung. (3) Esche — " +
      "elastisch und stossfest, vor allem fuer beanspruchte Verbindungen. " +
      "Gemeinsam: alle drei profitieren vom 1:8 Schwalbenwinkel und " +
      "scharfen Werkzeugen. Flacher als 1:8 nicht gehen, sonst greift " +
      "die Verriegelung nicht voll.",
    metadata: {
      source: "own-paraphrase",
      title: "Harthoelzer — Eiche, Buche, Esche",
      topic: "holzkunde",
      license: "own-paraphrase",
    },
  },
  {
    id: "holzkunde-weichholz-kiefer-fichte-tanne",
    text:
      "Weichholz fuer Schwalbenschwanz hat besondere Tuecken: (1) Kiefer " +
      "— harzhaltig, verklebt das Saegeblatt, regelmaessiges Reinigen " +
      "noetig. (2) Fichte — splittert leicht beim Stemmen, scharfe " +
      "Werkzeuge sind Pflicht. (3) Tanne — aehnlich Fichte, etwas " +
      "weicher noch. Generell: Schwalbenwinkel 1:6 statt 1:8 — das " +
      "weiche Holz gibt nach, der steilere Winkel haelt die Verriegelung. " +
      "Saegeschnitt langsam fuehren — schneller Schnitt zerreisst Fasern. " +
      "Pin-Mindestbreite 6mm statt 4mm.",
    metadata: {
      source: "own-paraphrase",
      title: "Weichholz — Kiefer, Fichte, Tanne",
      topic: "holzkunde",
      license: "own-paraphrase",
    },
  },
  {
    id: "holzkunde-faserrichtung-hirnholz",
    text:
      "Faserrichtung erkennen ist Voraussetzung fuer sauberen Schnitt. " +
      "Hirnholz (Stirnseite) zeigt Jahresringe — hier wird quer zur Faser " +
      "gesaegt, das ergibt rauhe Schnittkanten. Brettkante (Laengsseite) " +
      "zeigt parallele Linien — hier wird laengs der Faser gehobelt, " +
      "ergibt glatte Oberflaechen. Beim Schwalbenschwanz: Pins werden ins " +
      "Hirnholz gestemmt (quer Faser), Schwalben werden im Brett-Korpus " +
      "geformt (laengs Faser). Diese Asymmetrie erklaert warum die " +
      "Werkzeuge unterschiedlich behandelt werden muessen.",
    metadata: {
      source: "own-paraphrase",
      title: "Faserrichtung + Hirnholz-Identifikation",
      topic: "holzkunde",
      license: "own-paraphrase",
    },
  },
  {
    id: "holzkunde-feuchteausgleich",
    text:
      "Holz arbeitet — es nimmt Feuchtigkeit aus der Luft auf und gibt " +
      "sie wieder ab. Vor dem Verarbeiten muss das Holz mindestens 2-4 " +
      "Wochen in der Werkstatt akklimatisieren, sonst verzieht sich die " +
      "fertige Verbindung. Ideale Werkstatt-Feuchte: 50-60% relative " +
      "Luftfeuchtigkeit. Faustregel: 1mm Bewegung pro 100mm Brettbreite " +
      "bei 20% Feuchteaenderung. Bei Schwalbenschwanz heisst das: " +
      "der Schwalbenwinkel 1:6 toleriert ueblicherweise diese Bewegung, " +
      "1:4 wuerde brechen. Vor dem Verleimen: Holz mit Feuchtemessgeraet " +
      "messen, Ziel <= 12% Holzfeuchte fuer Innenmoebel.",
    metadata: {
      source: "own-paraphrase",
      title: "Feuchteausgleich vor Verarbeitung",
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
      "Augenschutz ist beim Stemmen Pflicht: ein wegspringender Holzsplitter " +
      "kann das Auge schwer verletzen. Schutzbrille mit seitlichem Schutz, " +
      "EN166 zertifiziert. Bei Hartholz und Schlag-Stemmung springen " +
      "regelmaessig kleine Splitter — Brille nicht abnehmen 'nur fuer " +
      "diesen einen Schnitt'. Auch beim Schleifen und Bohren: Brille auf. " +
      "Werkstatt-Regel: keine Brille = keine Maschine. Ergaenzend " +
      "Atemschutz P2 bei Hartholz-Schleifen wegen Eichenstaub-Krebs- " +
      "risiko (gemaess MAK-Liste).",
    metadata: {
      source: "own-paraphrase",
      title: "Augenschutz + Atemschutz im Werkstattbetrieb",
      topic: "sicherheit",
      license: "own-paraphrase",
    },
  },
  {
    id: "sicherheit-werkstueck-aufnahme",
    text:
      "Schnittsichere Werkstueck-Aufnahme ist Pflicht beim Saegen und " +
      "Stemmen. Niemals mit der freien Hand das Werkstueck festhalten — " +
      "Werkbank-Zwingen, Bankhaken oder Spannvorrichtungen sind die " +
      "korrekten Loesungen. Beim Saegen mit Japan-Saege: Werkstueck im " +
      "Saegebock oder zwischen Werkbank-Bankhaken einspannen, beide " +
      "Haende auf dem Werkzeug. Schnittwunden im Tischlerhandwerk " +
      "passieren primaer durch unzureichende Aufspannung — die zweite " +
      "Hand am Werkstueck statt am Werkzeug. Standard: 1m Abstand " +
      "zwischen freier Hand und Schnittlinie.",
    metadata: {
      source: "own-paraphrase",
      title: "Schnittsichere Werkstueck-Aufnahme",
      topic: "sicherheit",
      license: "own-paraphrase",
    },
  },
  {
    id: "sicherheit-erste-hilfe-werkstatt",
    text:
      "Erste-Hilfe-Set in der Werkstatt: sterile Wundauflagen, " +
      "Druckverband, Pflaster verschiedener Groessen, Desinfektionsmittel, " +
      "Splitterpinzette, Augenspuelung, Notruf-Liste. Standort gut " +
      "sichtbar an der Werkstatttuer, nicht hinter Werkstueck-Stapeln. " +
      "Pruefung jaehrlich auf Haltbarkeit — Desinfektionsmittel und " +
      "Wundauflagen verfallen. Bei tieferen Schnittwunden: Druck " +
      "ausueben, Hand hochhalten, Notarzt rufen (144 in Oesterreich, " +
      "112 im EU-Raum). Niemals selbst grosse Splitter aus dem Auge " +
      "ziehen — direkt zum Augenarzt.",
    metadata: {
      source: "own-paraphrase",
      title: "Erste-Hilfe-Set in der Werkstatt",
      topic: "sicherheit",
      license: "own-paraphrase",
    },
  },
];

/**
 * Liefert eine frische Kopie des Korpus.
 *
 * Wichtig: zurueckgegebene Documents sind shallow-copy — die metadata-Objekte
 * werden geteilt. Wer mutieren will, soll structuredClone() nutzen.
 */
export function getDovetailCorpus(): RAGDocument[] {
  return DOVETAIL_CORPUS.map((doc) => ({ ...doc }));
}

/**
 * Liefert nur Documents, deren metadata.topic einem der gewuenschten Topics
 * entspricht. Hilfreich fuer step-spezifische Voice-Antworten.
 */
export function getDovetailCorpusByTopic(
  topics: ReadonlyArray<string>,
): RAGDocument[] {
  const set = new Set(topics);
  return DOVETAIL_CORPUS.filter(
    (doc) =>
      typeof doc.metadata.topic === "string" && set.has(doc.metadata.topic),
  ).map((doc) => ({ ...doc }));
}

/**
 * Liefert nur Documents, deren metadata.license in der erlaubten Liste ist.
 *
 * Use-Case: Open-Core Lehrling-EDU laedt nur lizenzkompatible Inhalte
 * (default: OPEN_CORE_LICENSES). proprietary Variante kann spaeter weitere
 * Lizenzklassen erlauben (z.B. "barlieb-licensed").
 */
export function getDovetailCorpusByLicense(
  licenses: ReadonlyArray<DovetailLicense>,
): RAGDocument[] {
  const set = new Set<string>(licenses);
  return DOVETAIL_CORPUS.filter((doc) => {
    const lic = doc.metadata.license;
    return typeof lic === "string" && set.has(lic);
  }).map((doc) => ({ ...doc }));
}
