"use client";

import { Root, Container, Text } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";
import { ChevronLeft, ChevronRight, Mic, PanelTop, Settings2 } from "@react-three/uikit-lucide";
import type { IRAGProvider, ITopicGuard, ITTSProvider } from "@craft-codex/core";
import { useXRVoice } from "../lib/voice/use-xr-voice";

/**
 * Apple-/visionOS-artiges ORNAMENT: eine kleine, ruhige Glas-Steuerleiste am
 * Rand des Werkstücks. Im "Stillen Werkstatt-Modus" ist das die EINZIGE
 * dauerhaft sichtbare Bedienung — Bühne bleibt beim Holz + Anriss.
 *
 * Inhalt bewusst minimal (Restraint): Lernschritt ◀▶, schneller Tafel-Zugriff,
 * ein-Tap "Frag den Meister" (spricht die Kernfrage des Schritts), und "Mehr…"
 * holt erst auf Wunsch das Detail-Panel (Maße/Formel/Werkzeug). Alles Weitere
 * erscheint kontextuell, nicht dauerhaft.
 */
export function XROrnament({
  index,
  total,
  label,
  meisterFrage,
  onPrev,
  onNext,
  onTafel,
  tafelOffen,
  onMehr,
  panelOffen,
  rag,
  guard,
  tts,
  position = [0, 0, 0],
}: {
  index: number;
  total: number;
  label: string;
  /** Kernfrage des aktuellen Schritts für den Ein-Tap-Meister. */
  meisterFrage: string;
  onPrev: () => void;
  onNext: () => void;
  onTafel: () => void;
  tafelOffen: boolean;
  onMehr: () => void;
  panelOffen: boolean;
  rag: IRAGProvider;
  guard: ITopicGuard;
  tts?: ITTSProvider;
  position?: [number, number, number];
}) {
  const { status, ask } = useXRVoice({ rag, guard, tts });
  const busy = status !== "idle";
  const atStart = index <= 0;
  const atEnd = index >= total - 1;

  return (
    <group position={position}>
      <Root pixelSize={0.001} anchorX="center" anchorY="center">
        {/* Horizontale Glas-Capsule (visionOS-Toolbar-Ornament), grosse Rundung. */}
        <Card
          flexDirection="row"
          alignItems="center"
          gap={10}
          paddingX={16}
          paddingY={10}
          borderRadius={36}
        >
          {/* Lektion-Fluss */}
          <Button variant="icon" size="md" disabled={atStart} onClick={onPrev}>
            <ChevronLeft width={20} height={20} />
          </Button>
          <Container flexDirection="column" alignItems="center" minWidth={86}>
            <Text fontSize={16} color="#f4f1e8">{`Schritt ${index + 1}/${total}`}</Text>
            <Text fontSize={12} color="#9fc7b0">{asciiFold(label)}</Text>
          </Container>
          <Button variant="icon" size="md" selected={!atEnd} disabled={atEnd} onClick={onNext}>
            <ChevronRight width={20} height={20} />
          </Button>

          <Divider />

          {/* Schneller Tafel-Zugriff (Bernhards Wunsch) */}
          <Button variant="pill" size="md" selected={tafelOffen} onClick={onTafel}>
            <Container flexDirection="row" alignItems="center" gap={6}>
              <PanelTop width={16} height={16} />
              <Text fontSize={15}>Tafel</Text>
            </Container>
          </Button>

          {/* Ein-Tap Meister (spricht die Kernfrage des Schritts) */}
          <Button variant="pill" size="md" disabled={busy} onClick={() => ask(meisterFrage)}>
            <Container flexDirection="row" alignItems="center" gap={6}>
              <Mic width={16} height={16} />
              <Text fontSize={15}>{busy ? "..." : "Meister"}</Text>
            </Container>
          </Button>

          <Divider />

          {/* Mehr… holt das Detail-Panel erst auf Wunsch */}
          <Button variant="icon" size="md" selected={panelOffen} onClick={onMehr}>
            <Settings2 width={18} height={18} />
          </Button>
        </Card>
      </Root>
    </group>
  );
}

function Divider() {
  return <Container width={1} height={28} backgroundColor="#3a4452" marginX={2} />;
}

/** Faltet Sonderzeichen auf den Latin-Subset des 3D-Fonts (sonst leere Glyphen). */
function asciiFold(s: string): string {
  return s
    .replace(/·/g, "*").replace(/≈/g, "~").replace(/→/g, "->").replace(/×/g, "x")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss");
}
