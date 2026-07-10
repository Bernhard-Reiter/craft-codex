"use client";

import { Root, Container, Text } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";
import { PencilRuler, Hammer, X } from "@react-three/uikit-lucide";
import type { AnreissFlow } from "../lib/zinken/anreiss-flow";

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
 *
 * i18n: Die Tafel rendert INNERHALB des R3F-Canvas — useTranslations darf hier
 * nicht aufgerufen werden. Titel, Erklaertext und Handschritte kommen deshalb
 * fertig uebersetzt als Props von der Seite.
 */
export function XRDetailTafel({
  flow,
  index,
  anreissModus,
  onModus,
  onClose,
  title,
  detailText,
  handSteps,
  position = [0, 1.25, -0.75],
}: {
  flow: AnreissFlow;
  index: number;
  anreissModus: boolean;
  onModus: (anreiss: boolean) => void;
  onClose: () => void;
  /** Fenster-Titel, vorformatiert (z.B. "Tafel - Teilen"). */
  title: string;
  /** Ausfuehrliche Lehrer-Erklaerung zum aktuellen Schritt, mit echten Werten. */
  detailText: string;
  /** Die fuenf Handschritte (Name + Merksatz), uebersetzt. */
  handSteps: ReadonlyArray<{ name: string; hint: string }>;
  position?: [number, number, number];
}) {
  const schritt = flow.schritte[Math.min(index, flow.schritte.length - 1)]!;

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
              <Text fontSize={26} color="#f4f1e8">{asciiFold(title)}</Text>
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
                    <Text fontSize={19} color="#c7cdd6">{asciiFold(detailText)}</Text>
                  </Container>
                </>
              ) : (
                <Container flexDirection="column" gap={12}>
                  {handSteps.map((h, k) => (
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
                        <Text fontSize={22} color="#f4f1e8">{asciiFold(h.name)}</Text>
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

function asciiFold(s: string): string {
  return s
    .replace(/·/g, "*").replace(/≈/g, "~").replace(/→/g, "->").replace(/×/g, "x")
    .replace(/²/g, "2").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss");
}
