"use client";

import { Root, Container, Text } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";
import { PencilRuler, Hammer, X } from "@react-three/uikit-lucide";
import type { AnreissFlow } from "../lib/zinken/anreiss-flow";
import type { DovetailLayout } from "@craft-codex/core";

/**
 * Detail-Tafel als visionOS-Fenster.
 *
 * Apple-/visionOS-Window-Pattern: ein GLAS-Fensterrahmen (apfel Card, grosse
 * Rundung) mit einer vertikalen Tab-Rail LINKS (Anreissen/Hand), rundem
 * Schliessen-Button OBEN-RECHTS und der eigentlichen Schultafel als dunkler,
 * "eingehaengter" Schreibflaeche darin (Ebenen = Tiefe). Die Fensterleiste zum
 * Greifen liefert die XRMovable-Huelle unten.
 *
 * Inhalt: im Anreiss-Modus die Formel + ausfuehrliche Erklaerung des aktuellen
 * Schritts; im Hand-Modus die Uebersicht der fuenf Handschritte.
 */
export function XRDetailTafel({
  flow,
  index,
  anreissModus,
  onModus,
  onClose,
  position = [0, 1.25, -0.75],
}: {
  flow: AnreissFlow;
  index: number;
  anreissModus: boolean;
  onModus: (anreiss: boolean) => void;
  onClose: () => void;
  position?: [number, number, number];
}) {
  const schritt = flow.schritte[Math.min(index, flow.schritte.length - 1)]!;
  const detail = detailFuer(schritt.id, flow.layout);
  const titel = anreissModus ? `Tafel - ${schritt.label}` : "Tafel - Handschritte";

  return (
    <group position={position}>
      <Root pixelSize={0.0011} anchorX="center" anchorY="center">
        {/* GLAS-Fensterrahmen (visionOS) — feste Breite, damit der Text umbricht
            und das Fenster nicht ins Riesenhafte waechst. */}
        <Card flexDirection="row" width={1020} padding={22} gap={20} borderRadius={40}>
          {/* Tab-Rail LINKS */}
          <Container flexDirection="column" gap={12} alignItems="center">
            <Button
              variant="icon"
              size="md"
              selected={anreissModus}
              onClick={() => onModus(true)}
            >
              <PencilRuler width={20} height={20} />
            </Button>
            <Button
              variant="icon"
              size="md"
              selected={!anreissModus}
              onClick={() => onModus(false)}
            >
              <Hammer width={20} height={20} />
            </Button>
          </Container>

          {/* Hauptbereich */}
          <Container flexDirection="column" gap={16} flexGrow={1}>
            {/* Kopfzeile mit rundem Schliessen-Button oben-rechts */}
            <Container flexDirection="row" justifyContent="space-between" alignItems="center">
              <Text fontSize={26} color="#f4f1e8">{asciiFold(titel)}</Text>
              <Button variant="icon" size="sm" onClick={onClose}>
                <X width={18} height={18} />
              </Button>
            </Container>

            {/* Inhalt direkt auf dem Glas — modern, neutral; kein gruenes Brett,
                kein Holzrahmen. Erklaerung in einem dezenten dunklen Glas-Panel. */}
            <Container flexDirection="column" gap={16}>
              {anreissModus ? (
                <>
                  <Container flexDirection="column" gap={8}>
                    {schritt.tafel.map((zeile, k) => (
                      <Text key={k} fontSize={32} color="#f4f1e8">{asciiFold(zeile)}</Text>
                    ))}
                  </Container>
                  <Container
                    backgroundColor="#000000"
                    backgroundOpacity={0.22}
                    borderRadius={16}
                    padding={20}
                    marginTop={2}
                  >
                    <Text fontSize={19} color="#c7cdd6">{asciiFold(detail)}</Text>
                  </Container>
                </>
              ) : (
                <Container flexDirection="column" gap={12}>
                  {HANDSCHRITTE.map((h, k) => (
                    <Container key={h.name} flexDirection="row" gap={12} alignItems="flex-start">
                      <Container
                        width={34}
                        height={34}
                        borderRadius={17}
                        backgroundColor="#2b2f3a"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize={18} color="#f4f1e8">{String(k + 1)}</Text>
                      </Container>
                      <Container flexDirection="column" flexGrow={1}>
                        <Text fontSize={22} color="#f4f1e8">{h.name}</Text>
                        <Text fontSize={16} color="#aeb4bf">{asciiFold(h.hint)}</Text>
                      </Container>
                    </Container>
                  ))}
                </Container>
              )}
            </Container>
          </Container>
        </Card>
      </Root>
    </group>
  );
}

const HANDSCHRITTE: ReadonlyArray<{ name: string; hint: string }> = [
  { name: "Anreissen", hint: "Risslinien aufs Holz uebertragen — die Grundlage fuer alles." },
  { name: "Saegen", hint: "Auf der Abfallseite saegen, die Anrisslinie stehen lassen." },
  { name: "Stemmen", hint: "Abfall bis zur Grundlinie ausstemmen — von beiden Seiten." },
  { name: "Passen", hint: "Gegenstueck anzeichnen und trocken einpassen." },
  { name: "Pruefen", hint: "Fugen pruefen, nacharbeiten bis die Verbindung satt schliesst." },
];

/** Ausfuehrliche Lehrer-Erklaerung pro Schritt, mit echten Werten. */
function detailFuer(
  phase: AnreissFlow["schritte"][number]["id"],
  L: DovetailLayout,
): string {
  const mm = (x: number) => x.toFixed(1).replace(".", ",");
  switch (phase) {
    case "messen":
      return (
        `Bevor wir rechnen, messen wir das Brett genau aus. B ist die Breite ` +
        `(${mm(L.B)} mm, von Kante zu Kante), D die Dicke (${mm(L.D)} mm, die ` +
        `Staerke des Bretts). Diese zwei Masse bestimmen die ganze Zinkenteilung — ` +
        `mehr brauchen wir nicht. Genaues Messen ist die Grundlage: ein falsches ` +
        `Mass zieht sich durch die ganze Rechnung.`
      );
    case "schwalbenzahl":
      return (
        `AZS ist die Anzahl der Schwalben. Formel: AZS = B / (1,7 * D). Warum 1,7? ` +
        `Das ist ein Erfahrungswert aus der Werkstatt — er sorgt fuer ein schoenes ` +
        `Verhaeltnis von Schwalbe zu Brettdicke (nicht zu viele winzige, nicht zu ` +
        `wenige klobige). Hier: ${mm(L.B)} / (1,7 * ${mm(L.D)}) = ${mm(L.B)} / ` +
        `${mm(1.7 * L.D)} = ${L.AZS_raw.toFixed(2).replace(".", ",")} ~ ${L.AZS} ` +
        `Schwalben. Willst du weniger und breitere, nimm 2 statt 1,7.`
      );
    case "teile":
      return (
        `AZT ist die Anzahl der Einteilungsteile. Eine Schwalbe ist 2 Teile breit, ` +
        `ein Zinken 1 Teil — pro Schwalbe also 3 Teile, plus 1 fuer die beiden ` +
        `Randzinken: AZT = AZS * 3 + 1 = ${L.AZS} * 3 + 1 = ${L.AZT}. Die Teilbreite ` +
        `T = B / AZT = ${mm(L.B)} / ${L.AZT} = ${mm(L.T)} mm. Damit ist jeder Zinken ` +
        `${mm(L.zinkenBreite)} mm und jede Schwalbe ${mm(L.schwalbeBreite)} mm breit.`
      );
    case "streichmass":
      return (
        `Mit dem Streichmass uebertragen wir die Brettdicke D = ${mm(L.D)} mm ` +
        `umlaufend ums Brett. Diese Linie ist die Stemmtiefe — bis hierher wird ` +
        `gestemmt, nie tiefer. Sie laeuft auf allen vier Seiten gleich, damit der ` +
        `Grund der Verbindung sauber auf einer Hoehe liegt.`
      );
    case "markieren":
      return (
        `Jetzt teilen wir die Breite in die ${L.AZT} berechneten Teile und ` +
        `markieren die ${L.AZS} Schwalben. Zinken schmal (1 Teil, ${mm(L.zinkenBreite)} ` +
        `mm), Schwalbe breit (2 Teile, ${mm(L.schwalbeBreite)} mm). Die Teilpunkte ` +
        `mit Stechzirkel oder Lineal sauber abtragen — gleichmaessig verteilt gibt ` +
        `das ruhige, schoene Bild.`
      );
    case "schraege":
      return (
        `Die Schwalbenflanke bekommt die Schraege 1 : ${L.slopeRatio} (rund ` +
        `${L.slopeDeg.toFixed(0)} Grad). Mit der Schmiege jede Flanke anlegen. ` +
        `Steiler bricht an den Spitzen aus (dort steht kurzes Hirnholz), flacher ` +
        `haelt schlechter auf Zug. 1 : ${L.slopeRatio} ist der bewaehrte Mittelweg ` +
        `zwischen Halt und Haltbarkeit.`
      );
    case "fertig":
      return (
        `Der Anriss steht: ${L.AZS} Schwalben in ${L.AZT} Teilen, jedes ${mm(L.T)} ` +
        `mm, mit der Schraege 1 : ${L.slopeRatio}. Jetzt wird gesaegt — immer auf ` +
        `der Abfallseite der Linie, damit die Anrisslinie als feiner Strich ` +
        `stehenbleibt. Sie ist spaeter deine Pruefmarke beim Passen.`
      );
    default:
      return "";
  }
}

function asciiFold(s: string): string {
  return s
    .replace(/·/g, "*").replace(/≈/g, "~").replace(/→/g, "->").replace(/×/g, "x")
    .replace(/²/g, "2").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss");
}
