"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Root, Container, Text } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";
import {
  LICHT,
  MM_ZU_M,
  SPIKE_FARBEN,
  SZENE,
  baueBrettGeometrie,
  baueGebackeneMaterialien,
  baueHolzShaderMaterial,
  type HolzVariante,
} from "../../lib/holz-spike";
import {
  UI_TAKT_MS,
  auswerten,
  fpsAus,
  laufendeSekunden,
  nimmFrame,
  type Auswertung,
  type FpsMessung,
  type MessZustand,
} from "../../lib/fps-messung";

/** Was die Szene höchstens einmal je UI_TAKT_MS (und am Messende) meldet. */
export interface SpikeAnzeige {
  jetztFps: number;
  sekunden: number;
  zustand: MessZustand;
  /** nur in der Meldung, mit der die Messung fertig wurde */
  auswertung: Auswertung | null;
}

/** Fertig übersetzte Texte für die Tafel (kein useTranslations im Canvas). */
export interface SpikeTafelTexte {
  titel: string;
  hinweis: string;
  variante: string;
  sitzung: string;
  live: string;
  messung: string;
  ergebnis?: string;
  urteil?: string;
  start: string;
  wechseln: string;
}

/**
 * P6-Spike: das eine Brett mit umschaltbarer Oberfläche und die Mess-Tafel
 * in der Szene (in der Brille sichtbar). Geometrie und Materialien entstehen
 * einmal (useMemo) und werden beim Verlassen freigegeben. Im Frame-Takt passiert
 * nur: Frame-Zeit in den festen Puffer, zwei Zahlen hochzählen. Kein CSG, keine
 * neuen Objekte je Frame; die Tafel bekommt neue Texte höchstens einmal je Sekunde.
 */
export function SpikeHolzSzene({
  variante,
  messung,
  laeuft,
  urteilOk,
  texte,
  onAnzeige,
  onStart,
  onWechseln,
}: {
  variante: HolzVariante;
  messung: FpsMessung;
  laeuft: boolean;
  urteilOk: boolean | null;
  texte: SpikeTafelTexte;
  onAnzeige: (a: SpikeAnzeige) => void;
  onStart: () => void;
  onWechseln: () => void;
}) {
  const geometrie = useMemo(() => baueBrettGeometrie(), []);
  const shader = useMemo(() => baueHolzShaderMaterial(), []);
  // Plan B: einmal beim Start der Szene gebacken (drei kleine Texturen).
  const gebacken = useMemo(() => baueGebackeneMaterialien(), []);
  useEffect(
    () => () => {
      geometrie.dispose();
      shader.dispose();
      for (const m of gebacken) {
        m.map?.dispose();
        m.dispose();
      }
    },
    [geometrie, shader, gebacken],
  );

  const fenster = useRef({ frames: 0, ms: 0 });
  useFrame((_, delta) => {
    const ms = delta * 1000;
    const f = fenster.current;
    f.frames += 1;
    f.ms += ms;
    const fertig = nimmFrame(messung, ms);
    if (fertig || f.ms >= UI_TAKT_MS) {
      onAnzeige({
        jetztFps: fpsAus(f.frames, f.ms),
        sekunden: laufendeSekunden(messung),
        zustand: messung.zustand,
        auswertung: fertig ? auswerten(messung) : null,
      });
      f.frames = 0;
      f.ms = 0;
    }
  });

  return (
    <>
      <ambientLight intensity={LICHT.umgebung * Math.PI} />
      <directionalLight position={LICHT.richtung} intensity={(1 - LICHT.umgebung) * Math.PI} />

      <mesh
        geometry={geometrie}
        material={variante === "shader" ? shader : gebacken}
        position={SZENE.brettPosition}
        rotation-y={SZENE.brettDrehungY}
        scale={MM_ZU_M}
      />

      <group position={SZENE.tafelPosition} rotation-y={SZENE.tafelDrehungY}>
        <Root pixelSize={0.0011} anchorX="center" anchorY="center">
          <Card flexDirection="column" width={640} padding={22} gap={10} borderRadius={30}>
            <Container backgroundColor={SPIKE_FARBEN.marke} borderRadius={12} padding={12} flexDirection="column" gap={4}>
              <Text fontSize={24} color={SPIKE_FARBEN.papier}>{falte(texte.titel)}</Text>
              <Text fontSize={16} color={SPIKE_FARBEN.papier}>{falte(texte.hinweis)}</Text>
            </Container>
            <Text fontSize={18} color={SPIKE_FARBEN.text}>{falte(texte.variante)}</Text>
            <Text fontSize={15} color={SPIKE_FARBEN.leise}>{falte(texte.sitzung)}</Text>
            <Text fontSize={30} color={SPIKE_FARBEN.papier}>{falte(texte.live)}</Text>
            <Text fontSize={18} color={SPIKE_FARBEN.text}>{falte(texte.messung)}</Text>
            {/* ternär statt &&: ein leerer String wäre im R3F-Baum ein Textknoten */}
            {texte.ergebnis ? <Text fontSize={17} color={SPIKE_FARBEN.text}>{falte(texte.ergebnis)}</Text> : null}
            {texte.urteil ? (
              <Container
                backgroundColor={urteilOk ? SPIKE_FARBEN.gut : SPIKE_FARBEN.schlecht}
                borderRadius={12}
                padding={12}
              >
                <Text fontSize={24} color={SPIKE_FARBEN.papier}>{falte(texte.urteil)}</Text>
              </Container>
            ) : null}
            <Container flexDirection="row" gap={10} justifyContent="space-between">
              <Button size="md" selected disabled={laeuft} onClick={onStart}>
                <Text>{falte(texte.start)}</Text>
              </Button>
              <Button size="md" disabled={laeuft} onClick={onWechseln}>
                <Text>{falte(texte.wechseln)}</Text>
              </Button>
            </Container>
          </Card>
        </Root>
      </group>
    </>
  );
}

/** Wie in ZinkenXRTafel: die Schrift der uikit-0.8-Fassung kennt keine Umlaute und kein ≥. */
function falte(s: string): string {
  return s
    .replace(/·/g, "|").replace(/≥/g, ">=").replace(/×/g, "x")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss")
    .replace(/[–—]/g, "-").replace(/„|“|”|»|«/g, '"');
}
