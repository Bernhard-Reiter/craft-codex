"use client";

import { Root, Container, Text } from "@react-three/uikit";
import { Button } from "@react-three/uikit-apfel";
import type { AnreissFlow } from "../lib/zinken/anreiss-flow";
import type { DovetailLayout } from "@craft-codex/core";

/**
 * Grosse virtuelle Schultafel — auf Wunsch eingeblendet. Erklaert die Formel
 * des aktuellen Anreiss-Schritts "wie in der Schule" ganz genau, mit echten
 * Werten aus dem berechneten Layout.
 *
 * Dunkelgruene Tafel-Optik, grosse Schrift, links die Formel/Rechnung, darunter
 * die ausfuehrliche Erklaerung. Schliessen ueber den Button.
 */
export function XRDetailTafel({
  flow,
  index,
  onClose,
  position = [0, 1.25, -0.75],
}: {
  flow: AnreissFlow;
  index: number;
  onClose: () => void;
  position?: [number, number, number];
}) {
  const schritt = flow.schritte[Math.min(index, flow.schritte.length - 1)]!;
  const detail = detailFuer(schritt.id, flow.layout);

  return (
    <group position={position}>
      <Root pixelSize={0.0014} anchorX="center" anchorY="center">
        <Container
          flexDirection="column"
          width={900}
          padding={40}
          gap={18}
          borderRadius={16}
          backgroundColor="#16241c"
          borderWidth={6}
          borderColor="#6b4a2f"
        >
          {/* Kopfzeile */}
          <Container flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text fontSize={26} color="#e9f3ec">
              {asciiFold(`Tafel - ${schritt.label}`)}
            </Text>
            <Button variant="rect" onClick={onClose}>
              <Text fontSize={18}>schliessen</Text>
            </Button>
          </Container>

          <Container height={2} backgroundColor="#3c5a48" />

          {/* Formel gross */}
          <Container flexDirection="column" gap={8}>
            {schritt.tafel.map((zeile, k) => (
              <Text key={k} fontSize={34} color="#fdf6df">
                {asciiFold(zeile)}
              </Text>
            ))}
          </Container>

          {/* Ausfuehrliche Erklaerung */}
          <Container backgroundColor="#0e1813" borderRadius={10} padding={20} marginTop={8}>
            <Text fontSize={20} color="#cfe3d6">
              {asciiFold(detail)}
            </Text>
          </Container>
        </Container>
      </Root>
    </group>
  );
}

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
