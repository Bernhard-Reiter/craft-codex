"use client";

import { Text } from "@react-three/drei";
import type {
  DovetailStep,
  IRAGProvider,
  ITopicGuard,
  ITTSProvider,
} from "@craft-codex/core";
import { useXRVoice } from "../lib/voice/use-xr-voice";
import { XR_FONT_URL } from "../lib/xr/font";
import { XRButton } from "./XRButton";

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
 * World-Space Voice-Coach fuer die XR-Session ("Frag den Meister").
 *
 * Kein DOM-Overlay (bricht in AR die Immersion) — alles als 3D-UI in
 * Reichweite. FAQ-Buttons statt Mikrofon: robust gegen Werkstattlaerm + ohne
 * Mic-Permission in der Session. Antwort kommt als Stimme (falls Cache/Server)
 * UND immer als lesbarer 3D-Text.
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
      <Text
        position={[0, 0.18, 0]}
        fontSize={0.026}
        color="#ffed00"
        anchorX="center"
        anchorY="middle"
        font={XR_FONT_URL}
      >
        Frag den Meister
      </Text>

      {questions.map((q, i) => (
        <VoiceButton
          key={q}
          label={shorten(q)}
          y={0.1 - i * 0.075}
          busy={busy}
          onAsk={() => ask(q)}
        />
      ))}

      {/* Status / Antwort als gewrappter 3D-Text auf dunklem Panel */}
      {(busy || response) && (
        <group position={[0, -0.16, 0]}>
          <mesh>
            <planeGeometry args={[0.46, 0.2]} />
            <meshBasicMaterial color="#0e0d0c" transparent opacity={0.82} />
          </mesh>
          {statusLabel && (
            <Text
              position={[0, 0.07, 0.002]}
              fontSize={0.018}
              color="#ffed00"
              anchorX="center"
              anchorY="middle"
              font={XR_FONT_URL}
            >
              {statusLabel}
            </Text>
          )}
          {response && (
            <Text
              position={[0, statusLabel ? -0.005 : 0.02, 0.002]}
              fontSize={0.014}
              color="#f0f0f0"
              anchorX="center"
              anchorY="middle"
              maxWidth={0.42}
              textAlign="center"
              font={XR_FONT_URL}
            >
              {clip(response, 220)}
            </Text>
          )}
          {audioPlayed === false && !busy && response && (
            <Text
              position={[0, -0.085, 0.002]}
              fontSize={0.011}
              color="#9a9a9a"
              anchorX="center"
              anchorY="middle"
              font={XR_FONT_URL}
            >
              kein Audio - Text-Antwort
            </Text>
          )}
        </group>
      )}
    </group>
  );
}

function VoiceButton({
  label,
  y,
  busy,
  onAsk,
}: {
  label: string;
  y: number;
  busy: boolean;
  onAsk: () => void;
}) {
  return (
    <XRButton
      label={`? ${label}`}
      position={[0, y, 0]}
      width={0.44}
      height={0.062}
      fontSize={0.016}
      disabled={busy}
      onClick={onAsk}
    />
  );
}

/** Lange Frage fuer den Button kuerzen (volle Frage geht an die Pipeline). */
function shorten(q: string): string {
  return q.length > 28 ? q.slice(0, 26) + "..." : q;
}

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}
