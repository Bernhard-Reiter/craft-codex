"use client";

import { Root, Container, Text } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";
import { ChevronLeft, ChevronRight, Play, Pause, Crosshair } from "@react-three/uikit-lucide";

/**
 * Schritt-Tafel für den Zinken-Lehrgang in AR/VR — aus denselben Kit-
 * Bausteinen wie XRDetailTafel (apfel Card + Button, Glas-Fenster), keine
 * eigenen Roh-Panels. Bei der Kit-Migration (#41) wie die übrigen
 * XR-Tafeln mitzuziehen.
 *
 * Texte kommen fertig übersetzt (kein useTranslations im Canvas).
 */
export interface ZinkenXRTafelTexte {
  titel: string;
  zeilen: readonly string[];
  status: string;
  sicherheit: string;
  zurueck: string;
  weiter: string;
  abspielen: string;
  pause: string;
  ausrichten?: string;
}

export function ZinkenXRTafel({
  texte,
  laeuft,
  kannZurueck,
  kannWeiter,
  mitAnimation,
  onZurueck,
  onWeiter,
  onAbspielen,
  onAusrichten,
  position = [0.25, 1.35, -0.7],
}: {
  texte: ZinkenXRTafelTexte;
  laeuft: boolean;
  kannZurueck: boolean;
  kannWeiter: boolean;
  mitAnimation: boolean;
  onZurueck: () => void;
  onWeiter: () => void;
  onAbspielen: () => void;
  onAusrichten?: () => void;
  position?: [number, number, number];
}) {
  return (
    <group position={position}>
      <Root pixelSize={0.0011} anchorX="center" anchorY="center">
        <Card flexDirection="column" width={760} padding={24} gap={14} borderRadius={36}>
          <Text fontSize={28} color="#f4f1e8">{falte(texte.titel)}</Text>
          <Container flexDirection="column" gap={8}>
            {texte.zeilen.map((z, i) => (
              <Text key={i} fontSize={19} color="#e4e1d8">{falte(z)}</Text>
            ))}
          </Container>
          <Container backgroundColor="#000000" backgroundOpacity={0.25} borderRadius={14} padding={14}>
            <Text fontSize={17} color="#ffd34d">{falte(texte.sicherheit)}</Text>
          </Container>
          <Text fontSize={16} color="#aeb4bf">{falte(texte.status)}</Text>
          <Container flexDirection="row" gap={10} justifyContent="space-between">
            <Button size="md" disabled={!kannZurueck} onClick={onZurueck}>
              <ChevronLeft width={18} height={18} />
              <Text>{falte(texte.zurueck)}</Text>
            </Button>
            {mitAnimation && (
              <Button size="md" onClick={onAbspielen}>
                {laeuft ? <Pause width={18} height={18} /> : <Play width={18} height={18} />}
                <Text>{falte(laeuft ? texte.pause : texte.abspielen)}</Text>
              </Button>
            )}
            {onAusrichten && texte.ausrichten && (
              <Button size="md" onClick={onAusrichten}>
                <Crosshair width={18} height={18} />
                <Text>{falte(texte.ausrichten)}</Text>
              </Button>
            )}
            <Button size="md" selected disabled={!kannWeiter} onClick={onWeiter}>
              <Text>{falte(texte.weiter)}</Text>
              <ChevronRight width={18} height={18} />
            </Button>
          </Container>
        </Card>
      </Root>
    </group>
  );
}

/** Wie XRDetailTafel: die Schrift der uikit-0.8-Fassung kennt keine Umlaute. */
function falte(s: string): string {
  return s
    .replace(/·/g, "*").replace(/≈/g, "~").replace(/→/g, "->").replace(/×/g, "x")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss")
    .replace(/[–—]/g, "-").replace(/„|“|”|»|«/g, '"');
}
