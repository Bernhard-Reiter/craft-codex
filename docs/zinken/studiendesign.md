# Studiendesign: Lernbeweis Zinken-Lehrgang (Entwurf für die Bachelorarbeit)

> Stand 14.10.2026, Entwurf aus dem Nacht-Sprint. Muss vor jeder Datenerhebung mit Betreuung, Ethikstelle und Datenschutz der Hochschule abgestimmt werden.
> Quellen: `[D n]` = Didaktik-Teil, `[H n]` = Handwerk-Teil in [recherche.md](recherche.md).
> Englisch: [studiendesign.en.md](studiendesign.en.md).

## 1. Forschungsfrage

**Hauptfrage:** Machen Lehrlinge ohne Zinken-Erfahrung nach dem digitalen Lehrgang (Computer, AR, VR) eine bessere offene Zinkung als nach einer gleich langen herkömmlichen Unterweisung (Lehrbuch und Ausbilder nach der Vier-Stufen-Methode)? Geprüft wird ohne digitale Hilfe und mit neuen Maßen.

Wichtig ist der Zusatz »ohne digitale Hilfe«. Gemessen wird das Gelernte, nicht die Leistung mit eingeblendeten Linien. Ständig eingeblendete Hilfe kann die Übungsleistung verbessern und das Behalten verschlechtern (Guidance-Hypothese) [D 10][D 11][D 12].

**Nebenfragen**
- N1: Unterscheiden sich die Gruppen bei den einzelnen Teilfertigkeiten (Aufteilen, Anreißen, Sägen, Stemmen)?
- N2: Wie bewerten die Lehrlinge die Bedienbarkeit (SUS) und die Belastung (NASA-TLX)? Wie verändert sich ihre Selbstwirksamkeit?
- N3: Wie genau liegen die AR-Anrisse auf dem echten Brett (Restfehler der Registrierung, Abweichung an Kontrollmarken)?

## 2. Hypothesen

- **H1 (primär):** Die Gruppe mit dem Prototyp hat im Nachtest kleinere Fugenspalte als die Kontrollgruppe (Mittelwert über festgelegte Messstellen).
- **H2:** Der Prototyp verringert die Abweichung der Schräge vom Soll (1:6 ≈ 9,46°) und die Abweichung der Anrisse von der Teilung.
- **H3:** Im Nachtest hat die Prototyp-Gruppe weniger Fehlertypen aus dem Fehlerkatalog (über die Grundlinie gesägt, Ausriss, verdreht übertragen …).
- **H4 (explorativ):** Im verzögerten Test (7–14 Tage) bleibt ein Vorteil erhalten.
- **Gegenhypothese, ausdrücklich mitgeprüft:** Die AR-Hilfe verbessert die Übungsleistung, aber nicht den Nachtest ohne Hilfe (Abhängigkeit von der Hilfe) [D 10].

## 3. Design

- **Art:** Pilotstudie mit zwei Gruppen, Vorher/Nachher und wenn möglich verzögertem Test. Die Zuweisung erfolgt zufällig, geschichtet nach Lehrjahr und Vorerfahrung. Zusätzlich gibt es einen Vortest am Restholz, gerades Sägen an einer Linie.
- **Kontrollgruppe (K):** Lehrbuch-Abschnitt und Ausbilder-Unterweisung nach der Vier-Stufen-Methode [D 1][D 2]. Dieselbe Zeit, dasselbe Holz, dieselben Werkzeuge.
- **Prototyp-Gruppe (P):** Computer-Lehrgang (Schritte 1–6, Kontrollfragen, Rechner) → VR-Vormachen in Zeitlupe → AR-Anreißen am echten Brett → Sägen und Stemmen **ohne Brille** (Sicherheitsregel). Die Ausbilderin oder der Ausbilder ist anwesend und greift nur bei Sicherheitsfragen ein.
- **Gleichhalten:** Unterweisungszeit, Übungszeit, Holzart (z. B. Fichte, gleiche Charge), Brettmaße für die Übung (B 140 / D 20) und Sicherheitsunterweisung.
- **Nachtest (beide Gruppen, ohne digitale Hilfe):** eine neue Breite und Dicke (z. B. B 120 / D 18), damit nicht auswendig gelernte Maße, sondern das Verfahren geprüft wird. Zeitlimit festlegen.
- **Verzögerter Test:** nach 7–14 Tagen, gleiche Aufgabe, wenn der Betrieb oder die Schule das zulässt.

## 4. Messgrößen

### Objektiv (am Werkstück, Bewertende kennen die Gruppe nicht)

Alle Werkstücke bekommen einen Code. Die Messenden wissen nicht, aus welcher Gruppe ein Stück stammt.

| Größe | Verfahren (vorab festlegen) | Einheit |
|---|---|---|
| Fugenspalt (primär) | Fühlerlehre an festgelegten Messstellen je Flanke nach standardisiertem Trockenpassen, ohne Pressen | mm |
| Schrägenabweichung | Flankenwinkel mit Winkelmesser oder Foto + Auswertung, gegen das Soll 9,46° | ° |
| Anrissabweichung | Abstand der Anrisse von der Soll-Teilung (Messschieber) vor dem Sägen | mm |
| Grundlinie | Überschnitt über die Grundlinie ja/nein, Länge | mm |
| Fehlertypen | Zählung nach dem Fehlerkatalog des Lehrgangs (je Schritt) | Anzahl |
| Zeit | je Teilschritt und gesamt | min |
| Gesamturteil | blinde Bewertung durch zwei Fachleute nach Kriterienliste, Übereinstimmung (ICC/Kappa) | Skala |

Eine genormte Messung für Zinken-Qualität wurde in der Recherche nicht gefunden. Das eigene Protokoll ist deshalb Teil der Arbeit und wird vorab im Pilot erprobt [D 24][D 25].

### Subjektiv (Fragebogen)

- **SUS** (System Usability Scale), nur für P [D 31][D 32]
- **NASA-TLX** (Belastung), für beide Gruppen nach der Übung [D 33]
- **Selbstwirksamkeit:** eine aufgabenbezogene Skala nach Banduras Anleitung (»Ich kann eine Zinkung so anreißen, dass …«) [D 35], dazu die allgemeine Skala nach Schwarzer & Jerusalem [D 34]
- **SSQ** (Simulator-Übelkeit) vor und nach jeder Brillen-Sitzung, mit Abbruchkriterium [D 30][D 29]

### Technisch (nur P)

- Restfehler der 3-Punkt-Registrierung, wie ihn der Prototyp anzeigt
- Abweichung einer projizierten Kontrollmarke von einer echten Marke. Für Quest 3 liegt keine veröffentlichte Millimeter-Messung der Überlagerung vor; diese Messung ist ein eigener Beitrag [D 26][D 27].

## 5. Stichprobe

- Zielgruppe: Tischler-Lehrlinge im 1. Lehrjahr ohne Zinken-Erfahrung (Selbstauskunft und Ausbilder-Bestätigung).
- **Pilot:** 12–20 Personen insgesamt. Das reicht für Machbarkeit und Streuung, nicht für einen gesicherten Wirksamkeitsnachweis. Die Größe einer Hauptstudie wird aus der Streuung im Pilot und einem fachlich relevanten Mindestunterschied geplant, z. B. 0,2 mm Fugenspalt. Diesen Wert legen Fachleute fest.
- Ausschluss: Personen mit Vorerfahrung oder mit gesundheitlichen Gründen gegen VR/AR (Epilepsie, starke Reiseübelkeit). Wer die Brille nicht nutzen will, ist kein Ausschlussgrund, sondern wird dokumentiert.

## 6. Auswertung

- Primär: Vergleich des Fugenspalts im Nachtest zwischen P und K mit Vortest als Kovariate (ANCOVA). Bei kleiner Stichprobe oder Verletzung der Annahmen Mann-Whitney-U bzw. Rangvarianzanalyse. Effektstärke mit Konfidenzintervall angeben, nicht nur den p-Wert.
- Sekundär: Winkel, Anrisse, Fehlertypen (Zählmodell), Zeit; Fragebögen deskriptiv und als Gruppenvergleich.
- Übereinstimmung der zwei Bewertenden: ICC bzw. gewichtetes Kappa.
- Vorab festlegen (Präregistrierung, z. B. OSF): Hypothesen, Messstellen, Auswertung, Umgang mit fehlenden Werten.

## 7. Ethik und Datenschutz (Lehrlinge sind oft minderjährig)

- **Einwilligung:** Nötig sind die Einwilligung der Erziehungsberechtigten und die Zustimmung des Lehrlings selbst, mit getrennten, altersgerechten Informationsblättern [D 38]. Dazu kommt die Zustimmung des Lehrbetriebs bzw. der Berufsschule. Bei Schulen gelten die Vorgaben der Bildungsdirektion für empirische Untersuchungen [D 39]. Ein Ethikvotum der Hochschule ist einzuholen.
- **Rechtsgrundlage:** Art. 8 DSGVO und § 4 Abs. 4 DSG (Alter 14) betreffen Online-Dienste, die Kindern direkt angeboten werden. Sie sind **nicht** die Rechtsgrundlage dieser Studie und werden nicht so angeführt [D 36][D 37].
- **Daten:** Werkstück-Codes statt Namen (Pseudonymisierung). Die Zuordnungsliste liegt getrennt bei der Studienleitung und wird nach der Auswertung gelöscht. Es werden keine Passthrough- oder Kamerabilder gespeichert. Fotos zeigen nur Werkstücke, keine Personen.
- **Prototyp:** Das Lern-Protokoll ist standardmäßig aus. Es arbeitet nur mit Opt-in, speichert lokal ohne Namen und Uhrzeit, nur Schritt, Frage richtig/falsch, Hilfestufe und grobe Minuten. Export erfolgt nur per Knopfdruck als Datei. Für die Studie wird es nur nach Einwilligung eingeschaltet. »Lokal« heißt nicht automatisch »anonym«; Zeitverläufe können zusammen mit dem Stundenplan auf Personen verweisen.
- **Sicherheit:** Gesägt und gestemmt wird nie mit aufgesetzter Brille. Brillen-Sitzungen bleiben kurz (Richtwert unter 20 Minuten, im Pilot prüfen), mit SSQ und Abbruchmöglichkeit jederzeit [D 29][D 30]. Für die Werkzeugregeln gilt die DGUV Information 209-001 [H, siehe recherche.md].

## 8. Grenzen

- Kleine Pilotstichprobe, ein Holz, ein Betrieb bzw. eine Schule. Die Ergebnisse lassen sich nur begrenzt verallgemeinern.
- Neuheitseffekt der Brille, und die Ausbilderwirkung lässt sich nur teilweise gleich halten.
- Keine Haptik in VR: Säge- und Stemmgefühl entsteht nur am echten Holz.
- Die Tracking-Genauigkeit der Brille ist keine Messtechnik. Die AR-Linien sind eine Hilfe und kein Maß; angerissen wird mit Streichmaß und Messer.
- Die Leistung der Kontrollgruppe hängt stark von der Ausbilderin oder dem Ausbilder ab. Das wird dokumentiert und wenn möglich durch mehrere Ausbilder ausgeglichen.

## 9. Offene Punkte für Bernhard

- Hochschule, Betreuung und Ethikstelle
- Partnerbetrieb oder Berufsschule für den Pilot
- Fachleute für die blinde Bewertung (zwei Personen)
- Titel und Verlag des Lehrbuchs (TODO(Bernhard): Titel/Verlag)
