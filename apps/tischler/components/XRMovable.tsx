"use client";

import { type ReactNode } from "react";
import { Billboard } from "@react-three/drei";
import { Handle, HandleTarget } from "@react-three/handle";
import { Root, Container, Text as UIText } from "@react-three/uikit";
import { Card } from "@react-three/uikit-apfel";

/**
 * Verschiebbare Panel-Huelle im Meta-/Quest-Stil (wie die Fenster der Quest-
 * Apps): unten eine apfel-Greifleiste, an der man das Panel mit Hand/Controller/
 * Maus packt und frei im Raum verschiebt (via @react-three/handle).
 *
 * Nur die Greifleiste ist greifbar — der Panel-Inhalt (Buttons, Slider) bleibt
 * normal bedienbar.
 */
export function XRMovable({
  position = [0, 0, 0],
  griffOffsetY = -0.045,
  griffBreite = 220,
  billboard = true,
  children,
}: {
  position?: [number, number, number];
  /** Y-Position der Greifleiste relativ zum Panel-Zentrum (m). */
  griffOffsetY?: number;
  /** Breite der Greifleiste in px (uikit). */
  griffBreite?: number;
  /** Panel richtet sich automatisch zum Betrachter aus (nur Y-Achse). */
  billboard?: boolean;
  children?: ReactNode;
}) {
  const inhalt = (
    <>
      {children}

      {/* Greifleiste (apfel-Glas) = der Handle */}
      <Handle targetRef="from-context" translate scale={false} rotate={false}>
        <group position={[0, griffOffsetY, 0.01]}>
          <Root pixelSize={0.001} anchorX="center" anchorY="center">
            <Card
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              gap={8}
              width={griffBreite}
              paddingY={7}
              borderRadius={20}
            >
              <Container flexDirection="row" gap={3}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Container key={i} width={4} height={4} borderRadius={2} backgroundColor="#8a96a8" />
                ))}
              </Container>
              <UIText fontSize={13} color="#cdd6e4">verschieben</UIText>
            </Card>
          </Root>
        </group>
      </Handle>
    </>
  );

  return (
    <group position={position}>
      <HandleTarget>
        {/* Billboard: dreht das Panel um die senkrechte Achse zum Betrachter,
            damit Text/Buttons immer lesbar zu einem stehen. */}
        {billboard ? (
          <Billboard follow lockX lockZ>
            {inhalt}
          </Billboard>
        ) : (
          inhalt
        )}
      </HandleTarget>
    </group>
  );
}
