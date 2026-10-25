# XR-Design-Leitfaden — Enterprise-Regeln für alles räumliche UI

Verbindlich seit 01.09.2026 (Bernhards Direktive: „immer mit dem Kit bauen —
das Rad nicht neu erfinden"). Das Wissen stammt aus Apples Spatial-HIG,
gebaut wird ausschließlich mit **Metas horizon-Kit** (Reality Labs Design
System) auf `@react-three/uikit` 1.x — der aktiv gepflegten Linie für unsere
Zielhardware Quest 3. Vision Pro erreicht dieselbe Web-App über Safari/WebXR;
Parität gilt als *gleiche visuelle Spezifikation und gleicher Workflow* und
ist erst nach einem Test auf echter Vision-Pro-Hardware zugesichert.

## Die sechs Regeln

**1. Nur Kit-Komponenten für Interaktion.**
Buttons, Checkboxen, Slider, Panels kommen aus `@react-three/uikit-horizon`
— nie aus handgebauten Containern. Das Kit liefert Hover-/Press-Feedback,
Trefferflächen und Zustände gratis; Eigenbau war die Ursache des
„UI/UX-Katastrophe"-Befunds vom 27.08. Layout-Container und Text aus
`@react-three/uikit` sind frei.

**2. Ein Fenster, aufrecht, in der Blickkomfort-Zone.**
Eine schwebende Tafel pro Ablauf (Billboard, Start ~1,2 m Höhe, ~0,75 m vor
dem Nutzer, leicht unter Augenhöhe). Nie UI am Werkstück verankern, das
waagrecht liegen kann — und kein Fensterwildwuchs. Sekundäres gehört IN die
Tafel, nicht daneben.

**3. Größen in Sehwinkeln denken, nicht in Pixeln.**
Fließtext ≥ ~1° Sehwinkel (bei 0,75 m Distanz und pixelSize 0.0011 heißt
das: fontSize ≥ ~14), Trefferflächen ≥ ~2° (Kit-Buttons `size="sm"` erfüllen
das). Im Zweifel größer — der Nutzer steht, trägt ein Headset und hat keine
Lesebrille auf.

**4. Eingaben nach Aufgabe trennen, nie doppelt belegen.**
Trigger = UI-Bedienung. Griff-Taste = räumliches Erfassen (Ecken antippen).
Eine Taste darf nie gleichzeitig Menü UND Weltinteraktion auslösen
(Lektion aus Quest-Testrunde 1). Jede Kernfunktion muss ohne Handtracking
und ohne Sprache erreichbar sein — Handschuhe, Lärm, beide Hände am
Werkstück sind der Normalfall der Werkstatt.

**5. Räumlicher Zustand ist sichtbar und verfallbar.**
Registrierungsgüte (RMS in mm) steht immer auf der Tafel; über 10 mm wird
sie rot und fordert Neu-Ausrichtung. Session-Ende oder Reset verwirft die
Transformation sofort — nichts rendert je an einer alten Weltposition.
Sicherheitsrelevantes (Bohrpunkte) bleibt hinter seinem Prüfstand-Gate,
auch in AR.

**6. Text, den die Schrift kann.**
Alle uikit-Texte laufen durch `lib/xr/ascii-fold.ts`. Gemessen (01.09.2026,
Glyphen-Atlas der uikit-1.0-Inter): Umlaute und ß sind vorhanden und bleiben
stehen; gefaltet werden nur `Ø ø ± – — · ≈ → × ²` und typografische
Anführungszeichen. Nach jedem uikit-Update: Messung wiederholen, bevor die
Faltung verändert wird.

## Nicht-Regeln (bewusst weggelassen)

- Keine Eingabe-Abstraktionsschicht („semantic actions") — direktes Mapping
  reicht für ein Produkt mit einer Nutzergruppe; Kommentar im Code genügt.
- Keine Komfortzonen-Utility — die Startpose ist eine dokumentierte
  Konstante (`TAFEL_POS`), keine Bibliothek.
- Keine Vision-Pro-Spezifikation auf Vorrat. Ein Satz genügt: Auf Vision Pro
  gibt es keine Controller; die Ecken-Erfassung braucht dort einen
  Pinch-Pfad. Das wird gebaut UND abgenommen, wenn echte Hardware da ist.

## Referenzen

- Hausmuster: `components/BeschlagXRTafel.tsx` (Tafel), `XRDetailTafel.tsx`
  (Fenster mit Tab-Rail), `XRToolbar.tsx` (Werkzeugleiste)
- Kit-Doku: pmndrs/uikit → docs/horizon-kit
- Migrations-Historie: PR #41 (uikit 0.8+apfel → 1.0+horizon, atomar)
