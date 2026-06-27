"use client";

import { type ReactNode } from "react";
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
  children,
}: {
  position?: [number, number, number];
  /** Y-Position der Greifleiste relativ zum Panel-Zentrum (m). */
  griffOffsetY?: number;
  /** Breite der Greifleiste in px (uikit). */
  griffBreite?: number;
  children?: ReactNode;
}) {
  return (
    <group position={position}>
      <HandleTarget>
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
      </HandleTarget>
    </group>
  );
}
