/**
 * Zinken-Lehrgang (DE) — sechs Schritte für Lehrlinge, die noch nie gezinkt
 * haben. Offene Zinkung, Zinken zuerst, Schräge 1:6, geometrische Teilung auf
 * der Mittellinie (österreichisches Fachkunde-Lehrbuch Tischler, Kap. 4.1 —
 * TODO(Bernhard): Titel/Verlag). Alle Texte in eigenen Worten.
 *
 * Begründungen der didaktischen Form: docs/zinken/lernpfad.md und
 * docs/zinken/recherche.md. Gegenstück EN: lehrgang.en.ts (gleiche ids).
 */
import type { LehrgangSchritt } from "./lehrgang-typen";

export const LEHRGANG_DE: readonly LehrgangSchritt[] = [
  {
    id: "holz",
    nr: 1,
    titel: "Holz wählen und vorbereiten",
    ziel: "Du erkennst Faserrichtung, Hirnholz und Bezugsseiten und misst die Brettdicke D genau.",
    werkzeug: ["Meterstab oder Stahlmaßstab", "Messschieber", "Anschlagwinkel", "Bleistift"],
    vormachen: [
      "Ich nehme zwei Bretter gleicher Dicke, astfrei an den Enden. Für den ersten Versuch Weichholz, zum Beispiel Fichte oder Kiefer, ruhig gewachsen.",
      "Zuerst suche ich die schönste Fläche und die geradeste Kante. Das sind meine Bezugsseiten. Ich zeichne das Tischlerzeichen drauf, damit ich sie nie verwechsle.",
      "Dann prüfe ich mit dem Winkel, ob das Hirnholz rechtwinklig abgelängt ist. Wenn nicht, wird es zuerst sauber nachgeschnitten.",
      "Jetzt messe ich die Dicke D mit dem Messschieber an beiden Enden. Diese Zahl brauche ich gleich für die Aufteilung und fürs Streichmaß.",
    ],
    nachmachen: [
      { kurz: "Bretter wählen", lang: "Wähle zwei gleich dicke Bretter ohne Äste und Risse an den Enden. Die Fasern sollen möglichst parallel zur Kante laufen." },
      { kurz: "Bezugsseiten markieren", lang: "Bestimme an jedem Brett Bezugsfläche und Bezugskante und markiere sie mit dem Tischlerzeichen." },
      { kurz: "Hirnholz prüfen", lang: "Halte den Winkel an Bezugsfläche und Bezugskante an. Das Hirnholz muss in beide Richtungen rechtwinklig sein." },
      { kurz: "D messen", lang: "Miss die Dicke D an beiden Enden. Weichen die Werte ab, nimm den kleineren Wert und sag es dem Ausbilder." },
    ],
    kontrollpunkt: [
      "Beide Bretter tragen das Tischlerzeichen auf Bezugsfläche und Bezugskante.",
      "Der Winkel liegt an beiden Hirnholzenden ohne Lichtspalt an.",
      "Du kannst D auf 0,5 mm genau nennen.",
    ],
    fehler: [
      { fehler: "Ausriss oder Riss am Brettende", ursache: "Ast oder Trockenriss nah am Hirnholz", abhilfe: "Brett um einige Zentimeter kürzen oder ein anderes nehmen. Zinken halten nur in gesundem Holz." },
      { fehler: "Verbindung wird schief", ursache: "Hirnholz nicht rechtwinklig abgelängt", abhilfe: "Vor dem Anreißen mit dem Winkel prüfen und nachschneiden." },
      { fehler: "Seiten verwechselt", ursache: "Bezugsseiten nicht markiert", abhilfe: "Immer zuerst das Tischlerzeichen setzen. Jedes Maß wird von der Bezugsseite genommen." },
    ],
    sicherheit: [
      "Bretter beim Messen und Prüfen fest auflegen oder einspannen.",
      "Splitter an rauen Kanten: Hände nicht über die Kante ziehen.",
    ],
    fragen: [
      {
        id: "holz-1",
        frage: "Warum markierst du Bezugsfläche und Bezugskante?",
        antworten: [
          "Damit alle Maße von derselben Seite genommen werden",
          "Damit das Brett schöner aussieht",
          "Weil der Leim nur dort hält",
        ],
        richtig: 0,
        erklaerung: "Alle Anrisse gehen von den Bezugsseiten aus. So passen Zinken und Schwalben zusammen, auch wenn das Brett nicht perfekt ist.",
      },
      {
        id: "holz-2",
        frage: "Wofür brauchst du die Brettdicke D?",
        antworten: [
          "Nur für die Holzbestellung",
          "Für die Aufteilung und zum Einstellen des Streichmaßes",
          "Für die Leimmenge",
        ],
        richtig: 1,
        erklaerung: "D steckt in der Formel für die Schwalbenzahl, und die Grundlinie wird mit dem Streichmaß genau auf D angerissen.",
      },
    ],
    szene: { step: "ueberblick", anrissLayers: [] },
  },
  {
    id: "aufteilung",
    nr: 2,
    titel: "Aufteilung auf der Mittellinie",
    ziel: "Du legst die Schwalbenzahl fest und teilst die Brettbreite so, dass Zinken 1T und Schwalben 2T breit sind und alles genau aufgeht.",
    werkzeug: ["Taschenrechner oder der Rechner hier", "Stahlmaßstab", "Bleistift", "Streichmaß"],
    vormachen: [
      "Ich schaue mir das Brett an und schätze: Wie viele Schwalben sehen gut aus? Bei 140 mm Breite und 20 mm Dicke schätze ich etwa vier.",
      "Zur Kontrolle rechne ich: Breite durch 1,7 mal Dicke ergibt 140 durch 34, also gut 4. Mit 2 mal Dicke wären es 3,5, also eher weniger Schwalben. Ich lege fest: 4.",
      "Jetzt die Teile: dreimal die Schwalbenzahl plus eins, also 13 Teile. Jedes Teil T ist 140 durch 13, rund 10,8 mm.",
      "Auf der Mittellinie bekommt jeder Zinken ein Teil und jede Schwalbe zwei Teile. Außen sitzt immer ein Randzinken. Ich prüfe: 5 Zinken mal 1T plus 4 Schwalben mal 2T ergibt 13T, also wieder 140 mm.",
      "Für die Schräge 1:6 zeichne ich ein Hilfsdreieck: 1T zur Seite auf 6T Länge. Das ergibt etwa 9,5 Grad. Die 6T sind nur eine Hilfslänge auf dem Papier, keine Schnittlänge.",
    ],
    nachmachen: [
      { kurz: "Schätzen", lang: "Schätze die Schwalbenzahl nach Augenmaß. Rechne zur Kontrolle B/(1,7·D) für mehr oder B/(2·D) für weniger Schwalben." },
      { kurz: "Festlegen", lang: "Lege eine ganze Zahl fest. Das Ergebnis der Formel ist nur ein Vorschlag, die Entscheidung triffst du." },
      { kurz: "Teile rechnen", lang: "AZT = 3·AZS + 1, dann T = B/AZT. Schreib T mit einer Nachkommastelle auf." },
      { kurz: "Kette prüfen", lang: "Zähle nach: (AZS + 1) Zinken zu 1T plus AZS Schwalben zu 2T muss genau B ergeben." },
      { kurz: "Schräge wählen", lang: "1:6 ist die Regel aus dem Buch (rund 9,5°). Zeichne das Hilfsdreieck 1T auf 6T und stelle die Schmiege danach ein." },
    ],
    kontrollpunkt: [
      "Die Summe aller Teile ergibt genau die Brettbreite B.",
      "Außen links und rechts sitzt je ein Randzinken mit 1T.",
      "Die Schmiege steht auf 1:6 und ist mit der Feststellschraube gesichert.",
    ],
    fehler: [
      { fehler: "Teilung geht nicht auf, am Rand bleibt ein Rest", ursache: "T zu früh gerundet und mit dem gerundeten Wert weitergemessen", abhilfe: "Die Teilung von beiden Rändern zur Mitte messen oder mit dem Stechzirkel abschreiten. Kleine Reste verteilen sich dann." },
      { fehler: "Schwalben wirken zu schmal oder zu breit", ursache: "Schwalbenzahl nur ausgerechnet, nicht angeschaut", abhilfe: "Zahl festlegen, Teilung grob aufzeichnen und mit dem Auge prüfen. Erst dann anreißen." },
      { fehler: "Schräge falsch eingestellt", ursache: "Hilfsdreieck verwechselt (6T zur Seite statt 1T)", abhilfe: "Das Dreieck ist lang und schmal: 6 Teile in Faserrichtung, 1 Teil quer dazu." },
    ],
    sicherheit: ["Schmiege und Streichmaß haben Spitzen oder Schneiden: zum Ablegen die Spitze nach unten oder in die Schutzkappe."],
    fragen: [
      {
        id: "aufteilung-1",
        frage: "B = 140 mm, festgelegt 4 Schwalben. Wie viele Teile AZT?",
        antworten: ["12", "13", "9"],
        richtig: 1,
        erklaerung: "AZT = 3 · 4 + 1 = 13. Das sind 5 Zinken zu je 1 Teil und 4 Schwalben zu je 2 Teilen.",
      },
      {
        id: "aufteilung-2",
        frage: "Wie breit ist eine Schwalbe auf der Mittellinie?",
        antworten: ["1T", "2T", "6T"],
        richtig: 1,
        erklaerung: "Zinken sind 1T breit, Schwalben 2T. Die 6T sind die Länge des Hilfsdreiecks für die Schräge.",
      },
      {
        id: "aufteilung-3",
        frage: "Welcher Winkel steckt in der Schräge 1:6?",
        antworten: ["Etwa 9,5°", "Genau 14°", "Etwa 30°"],
        richtig: 0,
        erklaerung: "1:6 heißt: auf 6 Teile Länge 1 Teil zur Seite. Das sind rund 9,5°. Das Buch nennt zusätzlich 10° bis 14°. Das ist eine zweite Faustregel, nicht derselbe Wert.",
      },
    ],
    szene: { step: "anreissen", anrissLayers: ["divisions"] },
  },
  {
    id: "anreissen",
    nr: 3,
    titel: "Anreißen — Zinkenbrett zuerst",
    ziel: "Du reißt Grundlinie, Teilung, Schrägen und Abfall am Zinkenbrett so an, dass jeder Schnitt eine klare Linie hat.",
    werkzeug: ["Streichmaß", "Anreißmesser", "Schmiege (auf 1:6)", "Anschlagwinkel", "weicher Bleistift"],
    vormachen: [
      "Ich stelle das Streichmaß genau auf die Dicke des Gegenbretts. Am besten halte ich es direkt am Brett an, statt eine Zahl abzulesen. Werkstattpraxis, weicht vom Lehrbuch ab: Manche Tischler stellen es 0,4 bis 0,8 mm größer ein (Woodsmith 2022, Popular Woodworking 2024). Dann stehen Zinken und Schwalben nach dem Leimen etwas über und werden bündig gehobelt. Vorgabe im Lehrgang bleibt das Buch: genau D.",
      "Die Grundlinie reiße ich rundum: beide Flächen und beide Kanten, immer mit dem Anschlag an der Hirnholzkante. Ich drücke leicht und mache lieber zwei leichte Züge als einen festen, beide in derselben Spur. Eine zweite, versetzte Linie verwirrt später beim Stemmen.",
      "Auf dem Hirnholz trage ich die Teilung von der Mittellinie ab. Von jedem Teilungspunkt aus reiße ich mit der Schmiege die Schrägen an. Beim Zinkenbrett liegen die Schrägen auf dem Hirnholz.",
      "Von den Schrägen aus führe ich die Linien mit dem Winkel senkrecht auf beiden Flächen bis zur Grundlinie hinunter.",
      "Zum Schluss kommt in jedes Abfallstück ein Kreuz. Ab jetzt weiß ich bei jedem Schnitt, auf welcher Seite der Linie die Säge läuft.",
    ],
    nachmachen: [
      { kurz: "Streichmaß auf D", lang: "Stelle das Streichmaß an der Dicke des Gegenbretts ein, nicht an einer abgelesenen Zahl." },
      { kurz: "Grundlinie rundum", lang: "Reiße die Grundlinie auf beiden Flächen und beiden Kanten. Der Anschlag liegt dabei immer am Hirnholz." },
      { kurz: "Teilung übertragen", lang: "Trage die Teilungspunkte aus Schritt 2 auf dem Hirnholz ab, von der Mittellinie aus." },
      { kurz: "Schrägen reißen", lang: "Reiße mit der Schmiege (1:6) von jedem Punkt aus die Schrägen auf dem Hirnholz." },
      { kurz: "Senkrechte auf den Flächen", lang: "Führe die Linien mit dem Winkel von den Schrägen senkrecht zur Grundlinie, auf beiden Flächen." },
      { kurz: "Abfall kreuzen", lang: "Markiere jedes Abfallstück mit einem Kreuz. Prüfe es zweimal, bevor du sägst." },
    ],
    kontrollpunkt: [
      "Die Grundlinie läuft rundum, und ihre Enden treffen sich an den Ecken.",
      "Jede Schräge zeigt in die richtige Richtung: Die Zinken werden zur Innenseite hin breiter.",
      "In jedem Abfallstück steht ein Kreuz, und kein Zinken ist angekreuzt.",
    ],
    fehler: [
      { fehler: "Grundlinie läuft schief oder doppelt", ursache: "Anschlag nicht satt am Hirnholz oder zu fest gedrückt", abhilfe: "Anschlag zuerst andrücken, dann die Spitze nachziehen. Lieber mehrere leichte Züge." },
      { fehler: "Abfall auf der falschen Seite markiert", ursache: "Kreuz nach Gefühl gesetzt", abhilfe: "Laut prüfen: Zinken bleiben, Lücken fallen weg. Erst dann kreuzen." },
      { fehler: "Linien unscharf", ursache: "Harter oder stumpfer Bleistift statt Messer", abhilfe: "Die Senkrechten mit dem Anreißmesser reißen. Die Klinge bildet eine kleine Kante, in der die Säge Halt findet." },
    ],
    sicherheit: [
      "Anreißmesser und Streichmaß sind scharf: vom Körper weg ziehen und die Hand hinter der Schneide halten.",
      "Das Brett zum Anreißen in der Hobelbank einspannen, nicht in der Hand halten.",
    ],
    fragen: [
      {
        id: "anreissen-1",
        frage: "Worauf stellst du das Streichmaß ein?",
        antworten: ["Auf die Dicke des Gegenbretts", "Auf die halbe Brettbreite", "Auf 6T"],
        richtig: 0,
        erklaerung: "Die Zinken sind so lang, wie das Gegenbrett dick ist. Bei offener Zinkung ist die Grundlinie genau D vom Hirnholz entfernt.",
      },
      {
        id: "anreissen-2",
        frage: "Wozu dient das Kreuz im Abfallstück?",
        antworten: ["Als Verzierung", "Damit du weißt, auf welcher Seite der Linie du sägst und was du ausstemmst", "Als Leimmarke"],
        richtig: 1,
        erklaerung: "Die Säge läuft immer im Abfall neben der Linie. Ohne Kreuz verwechselt man das unter Stress leicht.",
      },
    ],
    szene: { step: "anreissen", anrissLayers: ["baseline", "divisions", "flanks", "wastes"] },
  },
  {
    id: "saegen",
    nr: 4,
    titel: "Sägen — im Abfall, senkrecht, bis zur Grundlinie",
    ziel: "Du sägst jeden Schnitt auf der Abfallseite neben der Linie, senkrecht und genau bis zur Grundlinie.",
    werkzeug: ["Zinkensäge oder japanische Dozuki", "Hobelbank mit Vorderzange", "Laubsäge oder Dekupiersäge für den groben Abfall"],
    vormachen: [
      "Ich spanne das Brett senkrecht und tief in die Zange, damit nichts federt.",
      "Ich stelle mich so hin, dass Unterarm, Säge und Schnitt in einer Linie liegen. Die Säge halte ich locker, wie einen Vogel: fest genug, dass er nicht wegfliegt, aber ohne ihn zu drücken.",
      "Zum Ansetzen lege ich den Daumen an das Blatt, neben der Linie auf der Abfallseite. Dann ziehe ich ein paar kurze, leichte Züge, bis die Säge geführt läuft.",
      "Jetzt säge ich mit langen, ruhigen Zügen ohne Druck. Ich schaue auf beide Linien gleichzeitig: oben auf die Schräge und vorne auf die Senkrechte.",
      "Kurz vor der Grundlinie werde ich langsamer und höre genau dort auf. Ich säge nie darüber, denn ein Schnitt über die Grundlinie bleibt sichtbar.",
    ],
    nachmachen: [
      { kurz: "Einspannen", lang: "Spanne das Brett senkrecht und kurz über der Zange ein, damit es beim Sägen nicht schwingt." },
      { kurz: "Abfallseite", lang: "Setze die Säge auf der Abfallseite neben der Linie an, nicht auf der Linie. Die Linie bleibt stehen." },
      { kurz: "Daumen führt", lang: "Leg den Daumen ans Blatt und mach kurze Ansägezüge, bis eine Kerbe da ist." },
      { kurz: "Ohne Druck", lang: "Säge mit dem Eigengewicht der Säge und langen Zügen. Druck lässt die Säge verlaufen." },
      { kurz: "Bis zur Grundlinie", lang: "Werde vor der Grundlinie langsam und hör genau dort auf, auf beiden Flächen gleich." },
      { kurz: "Grob ausräumen", lang: "Entferne den groben Abfall mit der Laubsäge, mit 1–2 mm Abstand zur Grundlinie. Der Rest wird gestemmt." },
    ],
    kontrollpunkt: [
      "Jeder Schnitt liegt im Abfall, und die Anrisslinie ist noch zu sehen.",
      "Der Schnitt steht senkrecht. Ein Winkel an der Brettfläche zeigt keinen Spalt.",
      "Auf keiner Fläche ist über die Grundlinie gesägt.",
    ],
    fehler: [
      { fehler: "Säge läuft weg, der Schnitt wird schief", ursache: "Zu viel Druck, verkrampfter Griff, Körper nicht hinter der Säge", abhilfe: "Locker greifen, Unterarm in Schnittlinie, ohne Druck sägen. Vorher an Abfallholz üben." },
      { fehler: "Über die Grundlinie gesägt", ursache: "Am Ende zu schnell oder nur eine Seite angeschaut", abhilfe: "Am Schluss langsamer werden und beide Flächen prüfen. Ist eine Fläche noch nicht an der Grundlinie, die Säge leicht kippen und nur diese Fläche fertig sägen." },
      { fehler: "Spalt in der fertigen Verbindung", ursache: "Auf oder jenseits der Linie gesägt statt im Abfall", abhilfe: "Die Linie muss nach dem Schnitt noch stehen. Wer im Abfall sägt, kann nacharbeiten, wer daneben sägt, nicht." },
    ],
    sicherheit: [
      "Die freie Hand ist nie vor dem Sägeblatt. Der Daumen führt nur beim Ansetzen und kommt dann weg.",
      "Die Säge nach dem Schnitt mit den Zähnen vom Körper weg ablegen.",
      "Nicht mit aufgesetzter AR- oder VR-Brille sägen. Erst ansehen, dann Brille ab, dann sägen.",
    ],
    fragen: [
      {
        id: "saegen-1",
        frage: "Wo setzt du die Säge an?",
        antworten: ["Genau auf der Linie", "Auf der Abfallseite neben der Linie", "Auf der Zinkenseite neben der Linie"],
        richtig: 1,
        erklaerung: "Die Linie gehört zum Zinken. Sägst du im Abfall daneben, passt der Zinken. Sägst du auf der Linie, wird er um die halbe Schnittbreite zu schmal.",
      },
      {
        id: "saegen-2",
        frage: "Was machst du, damit die Säge nicht wegläuft?",
        antworten: ["Kräftig drücken", "Locker führen und lange Züge ohne Druck machen", "Schneller sägen"],
        richtig: 1,
        erklaerung: "Druck und ein verkrampfter Griff sind die häufigsten Ursachen für schiefe Schnitte. Die Säge arbeitet mit ihrem eigenen Gewicht.",
      },
    ],
    szene: { step: "saegen", anrissLayers: ["baseline", "flanks", "wastes"], arbeitsgang: "saegen" },
  },
  {
    id: "stemmen",
    nr: 5,
    titel: "Stemmen — von beiden Seiten zur Mitte",
    ziel: "Du stemmst den Abfall sauber bis zur Grundlinie aus, von beiden Seiten zur Mitte, ohne Ausrisse.",
    werkzeug: ["Stecheisen (etwas schmaler als die Lücke)", "Klüpfel (Holzhammer)", "Zulage aus Abfallholz", "Zwinge"],
    vormachen: [
      "Ich lege das Brett flach auf eine Zulage und spanne es mit der Zwinge fest. Die Zulage liegt bündig an der Grundlinie.",
      "Ich wähle ein Stecheisen, das etwas schmaler ist als die engste Stelle der Lücke.",
      "Das Eisen setze ich genau in die Grundlinie, mit der Fase zum Abfall. Mit einem leichten Schlag mache ich den Vorstich. Dann nehme ich schräg von der Abfallseite einen kleinen Keil heraus, damit eine saubere Kante entsteht.",
      "Jetzt stemme ich abwechselnd senkrecht und schräg, aber nur bis etwa zur halben Dicke. Ich neige das Eisen ganz leicht nach innen, damit die Mitte etwas hohl wird.",
      "Dann drehe ich das Brett um und mache dasselbe von der anderen Seite, bis sich die Schnitte in der Mitte treffen. So reißt auf keiner Seite etwas aus.",
    ],
    nachmachen: [
      { kurz: "Flach spannen", lang: "Brett flach auf eine Zulage spannen, die Zulage bündig zur Grundlinie." },
      { kurz: "Eisen wählen", lang: "Nimm ein Stecheisen, das etwas schmaler ist als die engste Stelle der Lücke." },
      { kurz: "Vorstich", lang: "Setz das Eisen in die Grundlinie, Fase zum Abfall, und schlag leicht. Nimm dann von der Abfallseite einen Keil heraus." },
      { kurz: "Bis zur Hälfte", lang: "Stemme abwechselnd senkrecht und schräg, nur bis etwa zur halben Dicke, leicht hinterschnitten." },
      { kurz: "Wenden", lang: "Dreh das Brett um und stemme von der anderen Seite, bis sich beide Seiten treffen." },
      { kurz: "Kontrollieren", lang: "Prüfe mit dem Winkel: Die Grundfläche ist gerade oder leicht hohl, nie ballig." },
    ],
    kontrollpunkt: [
      "Die Grundlinie ist auf beiden Flächen scharf und ohne Ausrisse.",
      "In der Lücke steht kein Grat. Die Mitte ist gerade oder ganz leicht hohl.",
      "Die Flanken der Zinken sind unbeschädigt, kein Eisen hat sie gequetscht.",
    ],
    fehler: [
      { fehler: "Ausriss an der Rückseite", ursache: "Von nur einer Seite durchgestemmt", abhilfe: "Immer nur bis zur Hälfte, dann wenden. Die Zulage stützt zusätzlich." },
      { fehler: "Grundlinie wandert nach hinten", ursache: "Erster Schlag zu fest, die Fase drückt das Eisen über die Linie", abhilfe: "Vorstich leicht, dann zuerst Abfall wegnehmen und erst danach tiefer stechen." },
      { fehler: "Flanke beschädigt", ursache: "Eisen breiter als die Lücke oder verkantet", abhilfe: "Ein schmaleres Eisen nehmen und gerade halten." },
      { fehler: "Verbindung geht nicht ganz zusammen", ursache: "Grundfläche ballig, also in der Mitte zu hoch", abhilfe: "Leicht hinterschneiden, damit die Mitte nicht trägt. Mit dem Winkel prüfen." },
    ],
    sicherheit: [
      "Beide Hände hinter der Schneide. Die Führungshand hält das Eisen am Heft oder an der Klinge oberhalb des Bretts, nie vor der Schneide.",
      "Brett immer festspannen, niemals mit der Hand halten.",
      "Nur scharfe Eisen verwenden. Stumpfe brauchen mehr Kraft und rutschen eher ab.",
      "Nicht mit aufgesetzter AR- oder VR-Brille stemmen.",
    ],
    fragen: [
      {
        id: "stemmen-1",
        frage: "Warum stemmst du von beiden Seiten?",
        antworten: ["Damit es schneller geht", "Damit auf der Rückseite nichts ausreißt", "Weil das Eisen zu kurz ist"],
        richtig: 1,
        erklaerung: "Wer von einer Seite durchschlägt, drückt auf der Rückseite Fasern heraus. Von beiden Seiten zur Mitte bleiben beide Grundlinien scharf.",
      },
      {
        id: "stemmen-2",
        frage: "Wie liegt die Fase beim Vorstich an der Grundlinie?",
        antworten: ["Zur Abfallseite", "Zum Zinken hin", "Egal"],
        richtig: 0,
        erklaerung: "Die flache Rückseite des Eisens liegt an der Grundlinie, die Fase zeigt in den Abfall. So bleibt der Schnitt genau auf der Linie.",
      },
    ],
    szene: { step: "stemmen", anrissLayers: ["baseline", "wastes"], arbeitsgang: "stemmen" },
  },
  {
    id: "passen",
    nr: 6,
    titel: "Übertragen, Passen, Verleimen",
    ziel: "Du überträgst die Zinken genau aufs Schwalbenbrett, passt trocken und verleimst ohne Spalt.",
    werkzeug: ["Anreißmesser", "Streichmaß (gleiche Einstellung)", "Zinkensäge", "Stecheisen", "Klüpfel", "Leim", "Zwingen", "Zulagen"],
    vormachen: [
      "Das Schwalbenbrett bekommt dieselbe Grundlinie. Ich nehme dazu das Streichmaß mit derselben Einstellung wie vorher.",
      "Ich stelle das fertige Zinkenbrett genau auf die Grundlinie des Schwalbenbretts, Bezugsseite an Bezugsseite. Dann fahre ich mit dem Messer an jeder Zinkenflanke entlang. Das Brett darf dabei nicht verrutschen.",
      "Mit dem Winkel ziehe ich die Linien über das Hirnholz und kreuze den Abfall. Jetzt sind die Lücken für die Zinken der Abfall.",
      "Ich säge wieder im Abfall und stemme von beiden Seiten. Dann stecke ich die Teile ohne Leim nur ein Stück zusammen. Wo es klemmt, sieht man glänzende Druckstellen. Nur dort nehme ich mit dem Eisen hauchdünn etwas weg.",
      "Erst wenn es von Hand mit leichten Schlägen über eine Zulage zusammengeht, kommt Leim auf die Flanken. Dann spanne ich mit Zulagen und Zwingen und prüfe den Winkel.",
    ],
    nachmachen: [
      { kurz: "Grundlinie Schwalbenbrett", lang: "Reiße die Grundlinie mit unveränderter Streichmaß-Einstellung rundum an." },
      { kurz: "Übertragen", lang: "Stell das Zinkenbrett genau auf die Grundlinie, Bezugsseiten zusammen, und fahre mit dem Messer die Flanken nach." },
      { kurz: "Linien und Abfall", lang: "Führe die Linien mit dem Winkel übers Hirnholz und kreuze den Abfall. Jetzt sind es die Zinkenlücken." },
      { kurz: "Sägen und Stemmen", lang: "Sägen im Abfall, stemmen von beiden Seiten, genau wie beim Zinkenbrett." },
      { kurz: "Trocken passen", lang: "Stecke die Teile nur ein Stück zusammen, lies die Druckstellen ab und nimm nur dort etwas weg." },
      { kurz: "Verleimen", lang: "Leim auf die Flanken, mit Zulagen zusammenschlagen, spannen, Winkel prüfen und den Leimaustritt entfernen." },
    ],
    kontrollpunkt: [
      "Die Verbindung geht trocken mit leichten Schlägen über eine Zulage zusammen, ohne dass etwas reißt.",
      "Kein Spalt an den Flanken. Ein Blatt Papier passt nicht hinein.",
      "Die Bretter stehen im Winkel zueinander, der Anschlagwinkel liegt satt an.",
    ],
    fehler: [
      { fehler: "Verbindung verdreht oder versetzt", ursache: "Beim Übertragen Bezugsseiten vertauscht oder Brett verrutscht", abhilfe: "Bezugsseite an Bezugsseite, Zinkenbrett mit Zwinge oder Gewicht sichern und dann übertragen." },
      { fehler: "Zu stramm, das Brett reißt beim Zusammenschlagen", ursache: "Auf der Linie gesägt statt im Abfall oder Linie auf der falschen Seite stehen gelassen", abhilfe: "Trocken passen, Druckstellen lesen, mit dem Eisen hauchdünn nachnehmen. Nie mit Gewalt." },
      { fehler: "Spalt an den Flanken", ursache: "Im Zinken gesägt oder beim Passen zu viel weggenommen", abhilfe: "Beim nächsten Mal Linie stehen lassen. Kleine Spalten nur in Absprache mit dem Ausbilder füllen." },
      { fehler: "Verbindung geht nicht ganz zu", ursache: "Ballige Grundfläche oder Grat in der Ecke", abhilfe: "Grundfläche leicht hohl nachstechen, Ecken mit schmalem Eisen säubern." },
    ],
    sicherheit: [
      "Beim Zusammenschlagen immer eine Zulage benutzen, nie direkt aufs Werkstück schlagen.",
      "Leim nicht in die Augen bringen. Hände nach dem Verleimen waschen.",
    ],
    fragen: [
      {
        id: "passen-1",
        frage: "Wie überträgst du die Zinken aufs Schwalbenbrett?",
        antworten: ["Mit einer neuen Messung", "Zinkenbrett auf die Grundlinie stellen und mit dem Messer die Flanken nachfahren", "Nach Augenmaß"],
        richtig: 1,
        erklaerung: "Beim Übertragen wird nicht neu gemessen. Das fertige Zinkenbrett ist die Schablone, deshalb passt die Verbindung auch, wenn die Zinken nicht perfekt sind.",
      },
      {
        id: "passen-2",
        frage: "Es klemmt beim Trockenpassen. Was tust du?",
        antworten: ["Fester schlagen", "Druckstellen suchen und nur dort hauchdünn nachnehmen", "Gleich verleimen"],
        richtig: 1,
        erklaerung: "Glänzende Stellen zeigen, wo es drückt. Gezielt wenig wegnehmen. Gewalt sprengt das Brett.",
      },
    ],
    szene: { step: "passen", anrissLayers: [], arbeitsgang: "passen" },
  },
] as const;
