# Lernpfad: Begründung der Entscheidungen

> Stand 14.10.2026. Begründet, warum der Zinken-Lehrgang so aufgebaut ist, wie er ist.
> Quellen: `[D n]` und `[H n]` in [recherche.md](recherche.md). Studie: [studiendesign.md](studiendesign.md).
> Englisch: [lernpfad.en.md](lernpfad.en.md).
> Code: `apps/tischler/lib/zinken/lehrgang.ts` (DE) und `lehrgang.en.ts` (EN, gleiche ids).

## Die sechs Schritte

| Nr | id | Schritt | Was der Lehrling danach kann |
|---|---|---|---|
| 1 | `holz` | Holz wählen und vorbereiten | Bezugsseiten markieren, Hirnholz prüfen, Dicke D messen |
| 2 | `aufteilung` | Aufteilung auf der Mittellinie | Schwalbenzahl festlegen, Teile rechnen, Schräge 1:6 einstellen |
| 3 | `anreissen` | Anreißen — Zinkenbrett zuerst | Grundlinie, Teilung, Schrägen und Abfall anreißen |
| 4 | `saegen` | Sägen — im Abfall, senkrecht, bis zur Grundlinie | Neben der Linie bis zur Grundlinie sägen |
| 5 | `stemmen` | Stemmen — von beiden Seiten zur Mitte | Abfall ohne Ausriss bis zur Grundlinie ausstemmen |
| 6 | `passen` | Übertragen, Passen, Verleimen | Zinken übertragen, trocken passen, verleimen |

Jeder Schritt hat dieselben Teile: Ziel und Werkzeug, Vormachen (Meister-Kommentar und 3D in Zeitlupe), Nachmachen (Handgriffe), Kontrollpunkte, Fehlerbilder, Sicherheit und Kontrollfragen.

Ablauf über die Medien: Computer (Schritte 1–6, Rechner) → VR-Vormachen in Zeitlupe → AR-Anreißen am echten Brett → Sägen und Stemmen ohne Brille.

---

## Didaktische Entscheidungen

Die zwölf Entscheidungen folgen den zwölf Folgerungen der Didaktik-Recherche. »Stand« sagt, wie weit die App sie heute umsetzt.

### E1. Vier-Stufen-Methode in jedem Schritt, Ausbilder bleibt dabei

- **Die App:** Jeder der sechs Schritte durchläuft die vier Stufen. Vorbereiten = Ziel und Werkzeug. Vormachen = Kommentar und Animation. Nachmachen = Handgriffe. Üben = Kontrollpunkte und Fragen. Fehlerbilder verweisen bei Unklarheit an den Ausbilder (z. B. abweichende Dicke melden, Spalten nur in Absprache füllen).
- **Warum:** Die Methode ist in der Lehrlingsausbildung eingeführt und erkennt Fehler früh [D 1]. Ihr Vorbild zeigt die Tätigkeit in kleinen Abschnitten und lässt sie danach vorführen [D 2]. Die Handwerkslehre ist auch das Vorbild der Cognitive Apprenticeship [D 3]. Die Rohfassung hatte die vier Stufen auf die Medien verteilt (Computer, VR, AR, Holz). Die App legt sie in jeden Schritt, weil Anreißen, Sägen und Stemmen je eine eigene Vormach-Nachmach-Runde brauchen. Die Medienkette bleibt als Ablauf darüber.
- **Stand:** umgesetzt am Computer. Die Korrektur in Stufe 3 bleibt beim Menschen.

### E2. Vormachen mit hörbaren Gedanken

- **Die App:** Der Vormachen-Text ist in der Ich-Form geschrieben und sagt, worauf der Meister achtet (z. B. beim Sägen auf beide Linien gleichzeitig schauen). Kontrollfragen fragen nach dem Warum, etwa warum von beiden Seiten gestemmt wird.
- **Warum:** *Modeling* heißt, das verdeckte Denken sichtbar zu machen, nicht nur die Bewegung. Fragen nach dem Warum leisten *articulation* [D 3].
- **Stand:** teilweise. Pausen in der Animation mit der Frage »Was kommt als Nächstes?« fehlen. Ob die Kommentare in VR hörbar werden, ist offen.

### E3. Erst das Warum, dann das Wie im Moment

- **Die App:** Am Computer stehen Gründe und Zusammenhänge (Bezugsseiten, Teilung, Schräge, Reihenfolge) vor der Arbeit am Holz. In AR erscheinen nur knappe Arbeitshilfen am Brett: Anriss, Sägefugen mit Abfallseite, Stemm-Zonen. Handgriffe gibt es kurz und ausführlich.
- **Warum:** 4C/ID trennt unterstützende Information (vor der Aufgabe) von prozeduraler Information (im Moment der Aufgabe) [D 4]. Das hält die Belastung beim Arbeiten niedrig [D 5].
- **Stand:** umgesetzt.

### E4. Rechner als vorgerechnetes Beispiel

- **Die App:** Schritt 2 rechnet das Buchbeispiel vollständig vor: B 140 / D 20, Schätzung, Kontrolle mit B/(1,7·D), Festlegung auf 4 Schwalben, 13 Teile, T ≈ 10,8 mm, Kettenprobe. Der Rechner startet mit diesem Beispiel. Danach gibt der Lehrling eigene Maße ein. Die Schwalbenzahl legt er selbst fest; die Formel ist nur ein Vorschlag.
- **Warum:** Für Novizen sind ausgearbeitete Beispiele wirksamer als sofortiges Selbstrechnen [D 6] und senken die Belastung [D 5].
- **Stand:** teilweise. Die Zwischenstufe (teilweise vorgerechnet) fehlt, siehe Ideen.

### E5. VR schlicht halten

- **Die App:** Die VR-Szene zeigt eine schlichte Hobelbank (Platte, Füße, Vorderzange) und das Werkstück in der Zange. Gezeigt wird das Vormachen in Zeitlupe aus Sicht des Lehrlings. Keine Werkstatt-Dekoration.
- **Warum:** Mehr Immersion brachte in einer Studie mehr Präsenz, aber weniger Lernen und mehr Belastung [D 17]. VR lohnt sich dort, wo sie etwas kann, das Video nicht kann: Perspektive, Zeitlupe, Wiederholung [D 5].
- **Stand:** umgesetzt (erste Fassung, nicht an der Brille getestet).

### E6. Hilfe schrittweise abbauen

- **Die App:** Am Computer gibt es drei Hilfestufen: 2 = alles, 1 = Stichworte, 0 = nur Ziel und Kontrollpunkt. Der Lehrling wählt die Stufe selbst; Start ist Stufe 2.
- **Warum:** Ständige Zusatzhilfe verbessert die Übungsleistung und kann das Behalten verschlechtern (Guidance-Hypothese) [D 10]. Bei komplexen Fertigkeiten ist anfangs mehr Hilfe sinnvoll [D 11]. Das Gerüst muss also da sein und wieder abgebaut werden (*fading*) [D 3][D 12].
- **Stand:** teilweise. Der Wechsel ist nicht leistungsabhängig. Im AR-Overlay fehlt das Fading noch, siehe Ideen.

### E7. Rückmeldung zur Sache

- **Die App:** Jede Kontrollfrage erklärt nach der Antwort das Warum. Kontrollpunkte sind beobachtbar (z. B. kein Lichtspalt am Winkel, kein Papier im Spalt). Fehlerbilder nennen Ursache und Abhilfe.
- **Warum:** Feedback wirkt, wenn es zeigt, wo man steht und was als Nächstes kommt. Lob für die Person wirkt am wenigsten [D 9].
- **Stand:** umgesetzt.

### E8. Teilübungen am Restholz

- **Die App:** Fehlerbilder empfehlen, Sägen vorher an Abfallholz zu üben. Kontrollpunkte setzen messbare Ziele (z. B. D auf 0,5 mm genau, kein Überschnitt).
- **Warum:** Die assoziative Phase gibt es nur am echten Holz [D 7]. Gezielte Übung mit Teilzielen erklärt Leistungsunterschiede [D 8]. 4C/ID ergänzt die ganze Aufgabe durch Teilaufgabenübung [D 4]. Die Übungsfolge Linie → Stopp → Strich stehen lassen stammt aus der Werkstatt [H 20].
- **Stand:** teilweise. Ein eigener Übungsschritt fehlt, siehe Ideen.

### E9. AR ist Hilfe, kein Maß

- **Die App:** Das Brett wird mit drei Punkten ausgerichtet. Die Tafel zeigt den Restfehler: bis 2 mm »gut«, bis 5 mm »grenzwertig«, darüber neu ausrichten. Die Grenzen sind vorläufig und am Gerät zu messen. Angerissen wird mit Streichmaß und Messer; die Linien in der Brille zeigen nur, wo.
- **Sicherheitsregel:** Mit der AR-Brille wird nur angerissen und geprüft. Sägen und Stemmen nie mit aufgesetzter Brille. Die Regel steht in den Sicherheitshinweisen der Schritte 4 und 5.
- **Warum:** Quest 3 kann in schwierigen Fällen um mehr als 10 cm abweichen [D 26]. Passthrough ist im Nahbereich verzerrt [D 28], Tiefe wird schlechter eingeschätzt [D 27]. Eine Millimeter-Messung für Quest 3 gibt es nicht; sie ist Teil der Studie. Beim Stemmen gehören beide Hände hinter die Schneide und der Blick auf die Schneide [H 23]. Registrierte AR senkt Folgefehler [D 18], deshalb lohnt sie sich gerade beim Anreißen.
- **Stand:** umgesetzt (erste Fassung, nicht an der Brille getestet).

### E10. Brillen-Sitzungen kurz

- **Die App:** Keine eigene Zeitgrenze. Studie und Messe-Vorführung begrenzen die Dauer (Richtwert unter 20 Minuten, nicht belegt) und fragen nach Übelkeit.
- **Warum:** Cybersickness ist häufig und messbar [D 29]; der SSQ ist das Standardinstrument [D 30].
- **Stand:** im Studiendesign geregelt, nicht in der App.

### E11. Lernen getrennt von Übungsleistung messen

- **Die App:** Das Lernprotokoll speichert nur Übungsdaten: Schritt geöffnet, Frage richtig oder falsch, Hilfestufe, grobe Minuten. Der Lernbeweis entsteht außerhalb der App: Nachtest am echten Brett, ohne Brille, mit neuen Maßen.
- **Warum:** Übungsleistung mit Hilfe ist kein Lernbeweis [D 10]. Viele Studien messen nur Usability [D 13]. Das Vorbild WeldAR testet ohne Hilfe [D 22]; der Transfer ist die Hauptlücke [D 21].
- **Stand:** umgesetzt (Protokoll); Messung siehe [Studiendesign](studiendesign.md).

### E12. Datenschutz vor Datenerhebung

- **Die App:** Das Lernprotokoll ist **standardmäßig aus (Opt-in)**. Es speichert lokal, ohne Namen, Uhrzeit oder Geräte-ID. Export nur per Knopfdruck als Datei, Löschen jederzeit. Passthrough- und Kamerabilder werden nicht gespeichert.
- **Warum:** Lehrlinge sind oft minderjährig. Nötig sind getrennte Informationen und Einwilligungen [D 38] und die Genehmigung der Schule [D 39]. Art. 8 DSGVO und § 4 Abs. 4 DSG sind nicht die Rechtsgrundlage der Studie [D 36][D 37]. »Lokal« heißt nicht automatisch »anonym«.
- **Stand:** umgesetzt.

---

## Fachliche Entscheidungen

### F1. Zinken zuerst

- **Die App:** Schritt 3 reißt das Zinkenbrett an, Schritt 6 überträgt auf das Schwalbenbrett.
- **Warum:** So lehrt es das Lehrbuch. Der Übertrag liegt auf Langholz, und Sägefehler an den Zinken gleicht das Anpassen der Schwalben aus [H 1]. Die europäische Ausbildung arbeitet meist so [H 3]. Beide Reihenfolgen sind fachlich gleichwertig [H 1][H 2].

### F2. Schräge 1:6 ≈ 9,46°

- **Die App:** 1:6 über ein Hilfsdreieck 1T auf 6T, im Text gerundet 9,5°. Eine Kontrollfrage stellt klar: Die 10–14° aus dem Buch sind eine zweite Faustregel, nicht derselbe Wert (10–14° entspricht etwa 1:5,7 bis 1:4).
- **Warum:** 1:6 reicht für die meisten Projekte [H 11]. Die Hart/Weich-Regel (1:6 bzw. 1:8 ≈ 7,13°) ist vor allem Konvention [H 7][H 9][H 10].

### F3. Streichmaß auf die Dicke

- **Die App:** Das Streichmaß wird direkt am Gegenbrett eingestellt (SL = D). Für das Schwalbenbrett bleibt die Einstellung gleich.
- **Warum:** Das ist die Vorgabe des Lehrbuchs und bleibt sie. Die Werkstattpraxis weicht davon ab: Myers nennt 1/64″ (≈ 0,4 mm) über der Werkstückdicke [H 5], Wittmer etwa 1/32″ (≈ 0,8 mm) [H 11]. Der Lehrgang kann diese Variante als Hinweis nennen, ohne die Vorgabe zu ändern.
- **Hinweis:** Der Text empfiehlt zwei leichte Züge statt eines festen. Das deckt sich mit Kenney, wenn beide Züge in derselben Spur liegen [H 17]. Wittmer warnt vor doppelten Linien [H 11].

### F4. Sägen im Abfall, ohne Druck

- **Die App:** Säge auf der Abfallseite, Linie bleibt stehen, Daumen nur beim Anschnitt, lange Züge ohne Druck, vor der Grundlinie langsamer.
- **Warum:** Den Strich stehen lassen ist der Schlüssel zu dichten Verbindungen [H 13][H 20]. Druck und Verkrampfung lassen die Säge verlaufen [H 20][H 21]. Daumen weg von den Zähnen [H 23].

### F5. Stemmen von beiden Seiten

- **Die App:** Vorstich an der Grundlinie, Fase zum Abfall, bis zur halben Dicke, wenden, ganz leicht hinterschnitten. Die Animation stemmt erst die Außenhälfte, dann die Innenhälfte.
- **Warum:** Halb von jeder Seite verhindert Ausriss [H 12][H 15][H 18]. Ob man hinterschneidet, ist strittig [H 11][H 13]; für Anfänger nur wenig [H 5].
- **Offen:** Gochnour und Cosman beginnen innen und enden außen, damit ein Ausbruch innen liegt [H 13][H 18]. Die Reihenfolge in der Animation ist zu prüfen.

### F6. Fehlerbilder und Sicherheit je Schritt

- **Die App:** Jeder Schritt hat eigene Fehlerbilder (Fehler, Ursache, Abhilfe) und eigene Sicherheitshinweise.
- **Warum:** Die häufigsten Anfängerfehler sind gut belegt (siehe [recherche.md, H8](recherche.md#h8-fehlerbilder)). Die Werkzeugregeln folgen der DGUV [H 23]. Das Zuordnen eigener Fehler zu einer Liste ist eine bewährte Übung [H 13][H 15].

---

## Noch nicht umgesetzt (Ideen)

- **Worked-Example-Stufen im Rechner:** vorgerechnet (heute) → teilweise (der Lehrling ergänzt AZT oder T, der Rechner prüft) → selbst (der Rechner zeigt nur noch richtig oder falsch) [D 5][D 6].
- **AR-Fading:** volle Linien → nur Endpunkte → aus, mit Prüfung nach dem Schnitt. Der Wechsel richtet sich nach der Leistung, nicht nach der Zeit [D 10][D 11][D 12].
- **Messe-Modus:** Lernprotokoll bleibt aus, Knopf »von vorn« für jeden Gast, kurze Sitzungen (siehe IHM-Vorführung in [ihm-demo.md](ihm-demo.md)).
- **Hilfestufe vorschlagen:** Nach richtigen Antworten und erfüllten Kontrollpunkten schlägt die App die nächstniedrige Stufe vor [D 10].
- **Übungsschritt am Restholz:** gerade Linie, Stopp an der Linie, Strich stehen lassen, vor Schritt 4 [D 8][H 20].
- **Pausen im Vormachen:** Die Animation hält an und fragt »Was kommt als Nächstes?« [D 3].

## Lernprotokoll

Standardmäßig aus (Opt-in). Nur Lernereignisse, lokal, ohne Namen und Uhrzeit, Export nur per Knopfdruck. Für die Studie wird es nur nach Einwilligung eingeschaltet (siehe [Studiendesign](studiendesign.md), Abschnitt 7).
