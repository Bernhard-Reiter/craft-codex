"use client";

import { Root, Container, Text as UIText } from "@react-three/uikit";
import { TabBar, TabBarItem, Button } from "@react-three/uikit-apfel";
import { PencilRuler, Hammer, Crosshair } from "@react-three/uikit-lucide";

/**
 * XR-Navigationsleiste im Meta-Quest-Dock-Stil (apfel TabBar).
 *
 * Quest-Navigations-Standard: eine schwebende TabBar mit Icon-Tabs fuer den
 * Moduswechsel + eine Aktions-Taste. Immer sichtbar, vom Brett entkoppelt.
 */
export function XRNavBar({
  anreissModus,
  onModus,
  onZentrieren,
  position = [0, 0, 0],
}: {
  anreissModus: boolean;
  onModus: (anreiss: boolean) => void;
  onZentrieren: () => void;
  position?: [number, number, number];
}) {
  return (
    <group position={position}>
      <Root pixelSize={0.001} anchorX="center" anchorY="center">
        <Container flexDirection="row" gap={12} alignItems="center">
          <TabBar
            value={anreissModus ? "anreissen" : "hand"}
            onValueChange={(v) => onModus(v === "anreissen")}
          >
            <TabBarItem value="anreissen" icon={<PencilRuler />}>
              <UIText>Anreissen</UIText>
            </TabBarItem>
            <TabBarItem value="hand" icon={<Hammer />}>
              <UIText>Hand-Schritte</UIText>
            </TabBarItem>
          </TabBar>
          <Button variant="icon" size="md" onClick={onZentrieren}>
            <Crosshair width={22} height={22} />
          </Button>
        </Container>
      </Root>
    </group>
  );
}
