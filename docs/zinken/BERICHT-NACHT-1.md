# Bericht Nacht 1: Zinken-Lehrgang

> Stand 14.10.2026, nachts. Zweig `feat/zinken-lehrgang` von `origin/main` 0e71c3f. Geselle A, Meister und Prüfmeister haben gegengezählt.
> Kurz: Lehrgang am Computer und erste AR/VR-Fassung stehen, Tests und Build sind grün, die Quellen sind geprüft. Für dich sind 7 Fragen offen (unten).

## Was steht

| Teil | Wo | Stand |
|---|---|---|
| Rechner (Teilung, Schräge, Papier-Rechnung, Sägeschnitte) | `packages/core` (zinken-teilung) | additiv, Buch-Fixtures als Tests |
| Lehrgang Computer, 6 Schritte | `/[locale]/zinken` | Vormachen → Nachmachen → Kontrollfragen, eigene Hirnholz-SVG, Werkstück-3D je Arbeitsgang |
| AR/VR erste Fassung | `/[locale]/zinken/xr` | 3-Punkt-Registrierung auf dem echten Brett, Anriss/Sägefugen/Stemm-Zonen, VR-Hobelbank in Zeitlupe; nur vorhandene Kit-Bausteine |
| Lernprotokoll | `lib/zinken/protokoll.ts` | Opt-in, standardmäßig **aus** |
| RAG-Schicht | `lib/rag/corpus/zinken-lehrgang-corpus.ts` | aus den Lektionsdaten erzeugt, id-Paritätstest DE/EN über alle Zinken-Korpora |
| Doku | `docs/zinken/` | recherche, lernpfad, studiendesign (je DE + EN), ihm-demo (DE) |

Unberührt: `/dovetail`, `/lernen`, `/werkstatt`, Lienz, PR #41.

## Fachliche Festlegungen (Meister-Auflagen)

- **Schräge:** 1:6 ≈ 9,46°, 1:8 ≈ 7,13°. Die Buchangabe »10–14°« steht getrennt daneben, als zweite Faustregel, nicht als derselbe Wert. Der Winkel ist als Test abgesichert.
- **Rundung:** Der Test prüft den genauen Wert 2T = 21,54, die Anzeige rundet auf 0,1. Der Lehrgang erklärt, warum das Buch 21,6 erhält (es rundet T vorher auf 10,8).
- **Sicherheit:** AR nur zum Anreißen und Prüfen, Sägen und Stemmen ohne Brille. Das steht sichtbar in der App und in `ihm-demo.md`.
- **Streichmaß:** Vorgabe ist das Buch (genau D). Die Zugabe von 0,4–0,8 mm ist als »Werkstattpraxis, weicht vom Lehrbuch ab« gekennzeichnet, mit Quellen (Woodsmith 2022, Popular Woodworking 2024, per WebFetch geprüft).
- **Bilder:** Im Zweig liegen keine Bilddateien (jpg/png/heic).

## Quellen

| | geprüft | geprüft über DOI-Datensatz | korrigiert | falsch | ungeprüft |
|---|---|---|---|---|---|
| Handwerk [H 1–24] | 24 | 0 | 0 | 0 | 0 |
| Didaktik [D 1–39] | 17 | 19 | 3 | 0 | 0 |
| **Summe (63 nummeriert)** | **41** | **19** | **3** | **0** | **0** |

Dazu kommen 8 ungeprüfte Hinweise ohne Nummer, darunter das Lehrbuch selbst, Sellers und Foren. Sie stehen in einer eigenen Tabelle und werden nirgends als Beleg genutzt.
Jede nummerierte Quelle wurde in einem zweiten, unabhängigen Durchgang erneut per WebFetch geöffnet. Korrigiert wurden D2 (Blogartikel Pawlukojc/TWI statt Programmseite), D28 (UploadVR-Titel) und D35 (Bandura 2005, IAP).
Alle Texte sind in eigenen Worten geschrieben, Netzbilder gibt es keine. Details: [recherche.md](recherche.md).

## Tests und Build

Lauf 2, Kopf 9593949, vom Prüfmeister selbst gegengezählt:
- core 181/181 grün
- tischler 510 grün, 0 rot, 24 skip (vorbestehend, nicht im Diff)
- tsc, i18n-Parität und eslint (neue Ordner): 0 Befunde
- `next build`: rc 0. `/zinken` hat 342 kB First Load, `/zinken/xr` 2,26 MB (vergleichbar mit `/dovetail/xr`, 2,32 MB)
- Der id-Paritätstest fand in den bestehenden Zinken-Korpora keine Lücke.

Nachlauf nach den Text-Fixes (Streichmaß, Spur): Kopf b56b42c, gleiches Skript. Ergebnis wieder grün: core 181/181, tischler 510/0/24 skip, tsc, i18n und eslint 0, `next build` rc 0.

## Nachzug N2 (Prüfung des Entwurf-PR #55)

Die Prüfung fand zwei Blocker. Beide sind behoben, jeweils mit eigenem Test.
- **Abfall im Hirnholz war gekippt wie ein Zinken.** An jeder Flanke gab es außen eine Lücke und innen eine Überlappung von je 2·D/(2·Schräge), beim Buchbeispiel 3,33 mm. Das betraf die Schraffur in der Zeichnung, die Stemm-Zonen in 3D und das AR-Overlay. Die Sägeschnitte waren richtig. Jetzt ist der Abfall die Gegenform: außen breiter, innen schmaler. Der neue Test verlangt für jedes Nachbarpaar dieselbe Flanke außen und innen und prüft bei z = 0, D/2 und D, dass nichts fehlt und nichts doppelt ist (5 Maßkombinationen). Der Test wurde zuerst am alten Code rot gesehen.
- **AR: Ausrichtung überlebte das Sitzungsende.** Beim nächsten Start lag das Werkstück an der alten Pose und zeigte »ausgerichtet … gut«. Jetzt setzt das Sitzungsende Registrierung, Ausrichten und Ungültig zurück.
- **N3 (Nach-Prüfung N2): AR-Overlay nur bei brauchbarer Ausrichtung.** Das Werkstück wird nur noch bei Güte »gut« oder »grenzwertig« an die registrierte Pose gezeichnet, sonst bleibt es am Platzhalter. Neu-Ausrichten und »ungültig« verwerfen die alte Pose (Test zuerst rot an der alten Logik).
- Kleiner: Die Griff-Taste zählt nur noch an der Hand mit der Sonde. AR/VR übernimmt die Maße aus dem Rechner und zeigt sichtbar an, welche Maße gelten (sonst »Buchbeispiel 140 × 20 mm«). Ein leeres AZS-Feld bedeutet wieder »Vorschlag der Formel«.

**Lehre:** Ein Test, der nur Summen prüft, beweist keine Lage. Der alte Test hieß »lückenlos«, hat aber nur die Flächen-Summe geprüft, und die bleibt bei jeder Kippung B·D. Einen Test muss man an dem messen, was er wirklich prüft, nicht an seinem Namen.

## Offen / bewusst nicht gemacht

- **Stemm-Reihenfolge:** `arbeitsgang.ts` lässt erst die Außenhälfte und dann die Innenhälfte stemmen. Gochnour und Cosman [H 13][H 18] beginnen innen. Das ist noch nicht geändert und steht in lernpfad F5 als offen (siehe Frage 6).
- **Ideen aus der Didaktik, nicht gebaut:**
  - Worked-Example-Stufen im Rechner (vorgerechnet → teilweise → selbst)
  - AR-Fading (volle Linien → Endpunkte → aus)
  - Hilfestufen nach der Leistung statt von Hand gewählt
  - Messe-Modus
- **halbverdeckt:** Zeichnung und 3D zeigen noch die offene Zinkung (Nacht 2).
- **Noch nicht geprüft:** AR/VR auf der Quest 3. Bisher gibt es nur Build und Unit-Tests, kein Gerätetest.
- **Kein Merge:** Der Stand liegt als Entwurf-PR vor.

## Fragen an Bernhard

1. **Lehrbuch:** Wie heißen Titel, Verlag und Auflage? Das brauchen wir fürs Zitieren. Bisher heißt es nur »das Lehrbuch«.
2. **Streichmaß:** Welches Maß lehrst du, genau D wie im Buch oder D plus 0,4–0,8 mm?
3. **Sicherheitsregel:** Passt »AR nur Anreißen/Prüfen, Sägen und Stemmen ohne Brille« so?
4. **Routen:** Soll `/zinken` später `/lernen` bzw. `/werkstatt` ersetzen?
5. **Studie:** Welche Hochschule, wer betreut, braucht es ein Ethikvotum? (`studiendesign.md`)
6. **Stemmen:** Soll innen begonnen werden wie bei Gochnour und Cosman, oder bleibt außen → innen?
7. **#41:** Bei der Migration von #41 die neue `ZinkenXRTafel` mitziehen? Das wäre eine Datei.
