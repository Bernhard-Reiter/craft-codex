"use client";

import { Root, Container, Text as UIText } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";
import type {
  DovetailStep,
  IRAGProvider,
  ITopicGuard,
  ITTSProvider,
} from "@craft-codex/core";
import { useXRVoice } from "../lib/voice/use-xr-voice";

/**
 * Frage-Buttons pro Lernschritt.
 *
 * ⚠️ Wortlaut = TTS-Cache-Key — exakt wie in VoiceConsole DEFAULT_SAMPLE_QUERIES,
 * sonst greift die vorvertonte Offline-Stimme nicht.
 */
const QUESTIONS_BY_STEP: Record<Exclude<DovetailStep, "ueberblick">, string[]> = {
  anreissen: [
    "Wie reisse ich mit dem Streichmass an",
    "Schwalbenwinkel fuer Hartholz",
  ],
  saegen: ["Auf welcher Seite saege ich"],
  stemmen: ["Stemmeisen Schliff"],
  passen: ["Wie pruefe ich die Passung"],
  pruefen: ["Wie pruefe ich die Passung"],
};

interface XRVoicePanelProps {
  step: DovetailStep;
  rag: IRAGProvider;
  guard: ITopicGuard;
  /** Echte Stimme (Cache/Server). Fehlt sie → Text-only, Demo laeuft weiter. */
  tts?: ITTSProvider;
  /** Position relativ zum Brett-Origin (echte Meter). */
  position?: [number, number, number];
}

/**
 * World-Space Voice-Coach fuer die XR-Session ("Frag den Meister"), im
 * apfel-Kit-Stil. FAQ-Buttons statt Mikrofon (robust gegen Werkstattlaerm).
 * Antwort als Stimme (falls Cache/Server) UND immer als lesbarer Text.
 */
export function XRVoicePanel({
  step,
  rag,
  guard,
  tts,
  position = [-0.5, 0.05, 0],
}: XRVoicePanelProps) {
  const { status, response, audioPlayed, ask } = useXRVoice({ rag, guard, tts });
  const busy = status !== "idle";

  const questions =
    step === "ueberblick"
      ? QUESTIONS_BY_STEP.anreissen
      : QUESTIONS_BY_STEP[step];

  const statusLabel =
    status === "thinking"
      ? "Denke nach ..."
      : status === "speaking"
        ? "Spricht ..."
        : status === "listening"
          ? "Hoere zu ..."
          : "";

  return (
    <group position={position}>
      <Root pixelSize={0.001} anchorX="center" anchorY="center">
        <Card flexDirection="column" width={460} gap={8} padding={18} borderRadius={24}>
          <UIText fontSize={18} color="#ffed00">
            Frag den Meister
          </UIText>

          {questions.map((q) => (
            <Button
              key={q}
              variant="rect"
              disabled={busy}
              onClick={() => ask(q)}
            >
              <UIText fontSize={15}>{shorten(q)}</UIText>
            </Button>
          ))}

          {statusLabel && (
            <UIText fontSize={14} color="#ffed00">
              {statusLabel}
            </UIText>
          )}
          {response && (
            <Container backgroundColor="#0e0d0c" borderRadius={10} padding={10}>
              <UIText fontSize={13} color="#f0f0f0">
                {clip(response, 220)}
              </UIText>
            </Container>
          )}
          {audioPlayed === false && !busy && response && (
            <UIText fontSize={11} color="#9a9a9a">
              kein Audio - Text-Antwort
            </UIText>
          )}
        </Card>
      </Root>
    </group>
  );
}

/** Lange Frage fuer den Button kuerzen (volle Frage geht an die Pipeline). */
function shorten(q: string): string {
  return q.length > 30 ? q.slice(0, 28) + "..." : q;
}

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}
