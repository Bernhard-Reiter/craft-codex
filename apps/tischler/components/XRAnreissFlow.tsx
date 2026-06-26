"use client";

import { Root, Container, Text } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";
import type { AnreissFlow, AnreissSchritt } from "../lib/zinken/anreiss-flow";

/**
 * Gefuehrtes Anreissen im XR — jetzt mit @react-three/uikit + apfel-Kit
 * (Apple-Vision-/Quest-artiges Glas-Design). Flexbox-Layout statt manueller
 * 3D-Koordinaten: Tafel + Buttons ordnen sich automatisch an.
 *
 * pixelSize 0.001 → 1 px = 1 mm in Weltkoordinaten.
 */
export function XRAnreissFlow({
  flow,
  index,
  onIndex,
  position = [0, 0, 0],
}: {
  flow: AnreissFlow;
  index: number;
  onIndex: (i: number) => void;
  position?: [number, number, number];
}) {
  const schritt = flow.schritte[Math.min(index, flow.schritte.length - 1)]!;
  const atStart = index === 0;
  const atEnd = index >= flow.schritte.length - 1;

  return (
    <group position={position}>
      <Root pixelSize={0.001} anchorX="center" anchorY="center">
        <Card
          flexDirection="column"
          width={520}
          padding={24}
          gap={10}
          borderRadius={28}
        >
          <Text fontSize={15} color="#9fc7b0">
            {`Schritt ${index + 1}/${flow.schritte.length} - ${asciiFold(schritt.label)}`}
          </Text>

          {schritt.tafel.map((zeile, k) => (
            <Text key={k} fontSize={20} color="#f4f1e8">
              {asciiFold(zeile)}
            </Text>
          ))}

          <Text fontSize={13} color="#cfe3d6" marginTop={4}>
            {asciiFold(clip(schritt.meisterSagt, 170))}
          </Text>

          {schritt.kennzahl && (
            <Container
              alignSelf="flex-start"
              backgroundColor="#ffed00"
              borderRadius={8}
              paddingX={12}
              paddingY={4}
              marginTop={2}
            >
              <Text fontSize={16} color="#0a0a0a">
                {asciiFold(schritt.kennzahl)}
              </Text>
            </Container>
          )}

          <Container flexDirection="row" gap={14} marginTop={10}>
            <Button
              variant="rect"
              flexGrow={1}
              disabled={atStart}
              onClick={() => !atStart && onIndex(index - 1)}
            >
              <Text fontSize={17}>{"< Zurueck"}</Text>
            </Button>
            <Button
              variant="rect"
              flexGrow={1}
              selected={!atEnd}
              disabled={atEnd}
              onClick={() => !atEnd && onIndex(index + 1)}
            >
              <Text fontSize={17}>{atEnd ? "Fertig" : "Weiter >"}</Text>
            </Button>
          </Container>
        </Card>
      </Root>
    </group>
  );
}

/** Faltet Sonderzeichen auf den Latin-Subset des 3D-Fonts (sonst leere Glyphen). */
function asciiFold(s: string): string {
  return s
    .replace(/·/g, "*")
    .replace(/≈/g, "~")
    .replace(/→/g, "->")
    .replace(/×/g, "x")
    .replace(/²/g, "2")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");
}

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}

export type { AnreissSchritt };
