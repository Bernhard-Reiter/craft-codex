"use client";

import { useEffect, useState } from "react";
import { Root, Container, Text } from "@react-three/uikit";
import { Card, Button, Slider, TabBar, TabBarItem } from "@react-three/uikit-apfel";
import { PencilRuler, Hammer, Crosshair } from "@react-three/uikit-lucide";
import type {
  DovetailStep,
  IRAGProvider,
  ITopicGuard,
  ITTSProvider,
} from "@craft-codex/core";
import type { AnreissFlow } from "../lib/zinken/anreiss-flow";
import { useXRVoice } from "../lib/voice/use-xr-voice";

export interface Masse {
  width_mm: number;
  thickness_mm: number;
  length_mm: number;
}

/**
 * Übersetzte UI-Strings für die Toolbar. Die Toolbar rendert INNERHALB des
 * R3F-Canvas — useTranslations darf hier nicht aufgerufen werden (React-Context
 * kreuzt die Reconciler-Grenze evtl. nicht). Die Seite baut das Objekt.
 */
export interface XRToolbarLabels {
  tabAnreissen: string;
  tabHand: string;
  width: string;
  thickness: string;
  length: string;
  teilung: string;
  stirnkante: string;
  mittellinie: string;
  variante: string;
  standard: string;
  rzv: string;
  /** Vorformatiert, z.B. "Schritt 3/7 - Teilen". */
  step: string;
  back: string;
  tafel: string;
  done: string;
  next: string;
  handTitle: string;
  handSteps: Record<Exclude<DovetailStep, "ueberblick">, string>;
  board: string;
  plumb: string;
  up: string;
  down: string;
  near: string;
  far: string;
  reset: string;
  askMaster: string;
  statusThinking: string;
  statusSpeaking: string;
  statusListening: string;
  noAudio: string;
}

/**
 * EINE vereinte XR-Toolbar (apfel-Kit) — fasst Modus-Umschalter, Brettmaße,
 * Schritt-Navigation, Tafel-Schalter, "Frag den Meister" und Zentrieren in
 * EINEM verschiebbaren Panel zusammen (frueher vier verstreute Panels). Nur die
 * grosse Detail-Tafel bleibt als zweites Element separat.
 *
 * Adaptiv: im Anreiss-Modus zeigt sie Maße + gefuehrten Anriss-Schritt, im
 * Hand-Modus die fuenf Handschritte. Die Frage-Buttons passen sich dem Schritt
 * an. Auto-Ausrichtung zum Betrachter macht die XRMovable-Huelle (Billboard).
 */
export function XRToolbar({
  anreissModus,
  onModus,
  onZentrieren,
  flow,
  index,
  onIndex,
  masse,
  onMasse,
  onTafel,
  tafelOffen,
  step,
  onStep,
  onLotrecht,
  onReset,
  onNudgeHeight,
  onNudgeDepth,
  teilung,
  onTeilung,
  variante,
  onVariante,
  rag,
  guard,
  tts,
  labels,
  position = [0, 0, 0],
}: {
  anreissModus: boolean;
  onModus: (anreiss: boolean) => void;
  onZentrieren: () => void;
  flow: AnreissFlow;
  index: number;
  onIndex: (i: number) => void;
  masse: Masse;
  onMasse: (m: Masse) => void;
  onTafel: () => void;
  tafelOffen: boolean;
  step: DovetailStep;
  onStep: (s: DovetailStep) => void;
  /** Brett wieder lotrecht stellen (Rotation auf 0). */
  onLotrecht: () => void;
  /** Brett-Pose auf Default zuruecksetzen. */
  onReset: () => void;
  onNudgeHeight: (dir: 1 | -1) => void;
  onNudgeDepth: (dir: 1 | -1) => void;
  /** Teilungsebene + Umschalter (Lehrbuch-Methode vs. praxisnah). */
  teilung: "stirn" | "mittellinie";
  onTeilung: (t: "stirn" | "mittellinie") => void;
  /** Variante + Umschalter (Standard vs. Randzinkenverstaerkung). */
  variante: "standard" | "rzv";
  onVariante: (v: "standard" | "rzv") => void;
  rag: IRAGProvider;
  guard: ITopicGuard;
  tts?: ITTSProvider;
  /** Übersetzte Strings — von der Seite (ausserhalb des Canvas) gereicht. */
  labels: XRToolbarLabels;
  position?: [number, number, number];
}) {
  const schritt = flow.schritte[Math.min(index, flow.schritte.length - 1)]!;
  const atStart = index === 0;
  const atEnd = index >= flow.schritte.length - 1;

  // Tafel-Zeilen erscheinen nacheinander (~0,7 s/Zeile), bei jedem Schritt neu.
  const [sichtbar, setSichtbar] = useState(0);
  useEffect(() => {
    setSichtbar(0);
    const timers = schritt.tafel.map((_, k) =>
      setTimeout(() => setSichtbar((s) => Math.max(s, k + 1)), (k + 1) * 700),
    );
    return () => timers.forEach(clearTimeout);
  }, [index, schritt.tafel]);

  const { status, response, audioPlayed, ask } = useXRVoice({ rag, guard, tts });
  const busy = status !== "idle";
  const voiceStep: DovetailStep = anreissModus ? "anreissen" : step;
  const questions =
    voiceStep === "ueberblick"
      ? QUESTIONS_BY_STEP.anreissen
      : QUESTIONS_BY_STEP[voiceStep];
  const statusLabel =
    status === "thinking"
      ? labels.statusThinking
      : status === "speaking"
        ? labels.statusSpeaking
        : status === "listening"
          ? labels.statusListening
          : "";

  return (
    <group position={position}>
      <Root pixelSize={0.001} anchorX="center" anchorY="center">
        <Card flexDirection="column" width={560} padding={20} gap={8} borderRadius={28}>
          {/* 1) Modus + Zentrieren */}
          <Container flexDirection="row" gap={10} alignItems="center">
            <TabBar
              flexGrow={1}
              value={anreissModus ? "anreissen" : "hand"}
              onValueChange={(v) => onModus(v === "anreissen")}
            >
              <TabBarItem value="anreissen" icon={<PencilRuler />}>
                <Text>{asciiFold(labels.tabAnreissen)}</Text>
              </TabBarItem>
              <TabBarItem value="hand" icon={<Hammer />}>
                <Text>{asciiFold(labels.tabHand)}</Text>
              </TabBarItem>
            </TabBar>
            <Button variant="icon" size="md" onClick={onZentrieren}>
              <Crosshair width={20} height={20} />
            </Button>
          </Container>

          <Divider />

          {anreissModus ? (
            <>
              {/* 2a) Brettmaße */}
              <MassRow label={asciiFold(labels.width)} value={masse.width_mm} min={80} max={300}
                onChange={(v) => onMasse({ ...masse, width_mm: v })} />
              <MassRow label={asciiFold(labels.thickness)} value={masse.thickness_mm} min={8} max={40}
                onChange={(v) => onMasse({ ...masse, thickness_mm: v })} />
              <MassRow label={asciiFold(labels.length)} value={masse.length_mm} min={120} max={400}
                onChange={(v) => onMasse({ ...masse, length_mm: v })} />

              {/* 2c) Teilungsebene: Lehrbuch (Mittellinie) vs. praxisnah (Stirn) */}
              <Container flexDirection="row" gap={8} alignItems="center">
                <Text fontSize={13} width={66} color="#cdd6e4">{asciiFold(labels.teilung)}</Text>
                <Button variant="rect" flexGrow={1} selected={teilung === "stirn"}
                  onClick={() => onTeilung("stirn")}>
                  <Text fontSize={14}>{asciiFold(labels.stirnkante)}</Text>
                </Button>
                <Button variant="rect" flexGrow={1} selected={teilung === "mittellinie"}
                  onClick={() => onTeilung("mittellinie")}>
                  <Text fontSize={14}>{asciiFold(labels.mittellinie)}</Text>
                </Button>
              </Container>

              {/* 2d) Variante: Standard vs. Randzinkenverstaerkung */}
              <Container flexDirection="row" gap={8} alignItems="center">
                <Text fontSize={13} width={66} color="#cdd6e4">{asciiFold(labels.variante)}</Text>
                <Button variant="rect" flexGrow={1} selected={variante === "standard"}
                  onClick={() => onVariante("standard")}>
                  <Text fontSize={14}>{asciiFold(labels.standard)}</Text>
                </Button>
                <Button variant="rect" flexGrow={1} selected={variante === "rzv"}
                  onClick={() => onVariante("rzv")}>
                  <Text fontSize={14}>{asciiFold(labels.rzv)}</Text>
                </Button>
              </Container>

              <Divider />

              {/* 3a) Gefuehrter Schritt + animierte Formel */}
              <Text fontSize={15} color="#9fc7b0">
                {asciiFold(labels.step)}
              </Text>
              {schritt.tafel.slice(0, sichtbar).map((zeile, k) => (
                <Text key={k} fontSize={19} color="#f4f1e8">{asciiFold(zeile)}</Text>
              ))}
              <Text fontSize={13} color="#cfe3d6" marginTop={2}>
                {asciiFold(clip(schritt.meisterSagt, 150))}
              </Text>
              {schritt.kennzahl && (
                <Container alignSelf="flex-start" backgroundColor="#ffed00" borderRadius={8}
                  paddingX={12} paddingY={4} marginTop={2}>
                  <Text fontSize={15} color="#0a0a0a">{asciiFold(schritt.kennzahl)}</Text>
                </Container>
              )}

              {/* 4a) Schritt-Navigation + Tafel */}
              <Container flexDirection="row" gap={10} marginTop={8}>
                <Button variant="rect" flexGrow={1} disabled={atStart}
                  onClick={() => !atStart && onIndex(index - 1)}>
                  <Text fontSize={16}>{asciiFold(labels.back)}</Text>
                </Button>
                <Button variant="rect" selected={tafelOffen} onClick={onTafel}>
                  <Text fontSize={16}>{asciiFold(labels.tafel)}</Text>
                </Button>
                <Button variant="rect" flexGrow={1} selected={!atEnd} disabled={atEnd}
                  onClick={() => !atEnd && onIndex(index + 1)}>
                  <Text fontSize={16}>{asciiFold(atEnd ? labels.done : labels.next)}</Text>
                </Button>
              </Container>
            </>
          ) : (
            <>
              {/* 2b/3b) Handschritte */}
              <Text fontSize={15} color="#9fc7b0">{asciiFold(labels.handTitle)}</Text>
              <Container flexDirection="row" gap={8}>
                {HAND_STEPS.map((s, i) => (
                  <Button key={s} variant="rect" flexGrow={1} selected={s === step}
                    onClick={() => onStep(s)}>
                    <Container flexDirection="column" alignItems="center">
                      <Text fontSize={17}>{String(i + 1)}</Text>
                      <Text fontSize={11}>{asciiFold(labels.handSteps[s])}</Text>
                    </Container>
                  </Button>
                ))}
              </Container>
            </>
          )}

          <Divider />

          {/* 4c) Brett ausrichten (Zweitpfad zum Hand-Greifen) */}
          <Container flexDirection="row" gap={8} alignItems="center">
            <Text fontSize={13} width={66} color="#cdd6e4">{asciiFold(labels.board)}</Text>
            <Button variant="rect" flexGrow={1} onClick={onLotrecht}>
              <Text fontSize={14}>{asciiFold(labels.plumb)}</Text>
            </Button>
            <Button variant="rect" onClick={() => onNudgeHeight(1)}><Text fontSize={14}>{asciiFold(labels.up)}</Text></Button>
            <Button variant="rect" onClick={() => onNudgeHeight(-1)}><Text fontSize={14}>{asciiFold(labels.down)}</Text></Button>
            <Button variant="rect" onClick={() => onNudgeDepth(1)}><Text fontSize={14}>{asciiFold(labels.near)}</Text></Button>
            <Button variant="rect" onClick={() => onNudgeDepth(-1)}><Text fontSize={14}>{asciiFold(labels.far)}</Text></Button>
            <Button variant="rect" selected onClick={onReset}><Text fontSize={14}>{asciiFold(labels.reset)}</Text></Button>
          </Container>

          <Divider />

          {/* 5) Frag den Meister */}
          <Text fontSize={16} color="#ffed00">{asciiFold(labels.askMaster)}</Text>
          <Container flexDirection="row" gap={8} flexWrap="wrap">
            {questions.map((q) => (
              <Button key={q} variant="rect" flexGrow={1} disabled={busy} onClick={() => ask(q)}>
                <Text fontSize={14}>{shorten(q)}</Text>
              </Button>
            ))}
          </Container>
          {statusLabel && <Text fontSize={13} color="#ffed00">{asciiFold(statusLabel)}</Text>}
          {response && (
            <Container backgroundColor="#0e0d0c" borderRadius={10} padding={10}>
              <Text fontSize={13} color="#f0f0f0">{asciiFold(clip(response, 200))}</Text>
            </Container>
          )}
          {audioPlayed === false && !busy && response && (
            <Text fontSize={11} color="#9a9a9a">{asciiFold(labels.noAudio)}</Text>
          )}
        </Card>
      </Root>
    </group>
  );
}

const HAND_STEPS: ReadonlyArray<Exclude<DovetailStep, "ueberblick">> = [
  "anreissen",
  "saegen",
  "stemmen",
  "passen",
  "pruefen",
];

// Wortlaut = TTS-Cache-Key — exakt wie in VoiceConsole, sonst greift die
// vorvertonte Offline-Stimme nicht.
const QUESTIONS_BY_STEP: Record<Exclude<DovetailStep, "ueberblick">, string[]> = {
  anreissen: ["Wie reisse ich mit dem Streichmass an", "Schwalbenwinkel fuer Hartholz"],
  saegen: ["Auf welcher Seite saege ich"],
  stemmen: ["Stemmeisen Schliff"],
  passen: ["Wie pruefe ich die Passung"],
  pruefen: ["Wie pruefe ich die Passung"],
};

function Divider() {
  return <Container height={1} backgroundColor="#3a4452" marginY={3} />;
}

function MassRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <Container flexDirection="row" alignItems="center" gap={10}>
      <Text fontSize={14} width={66} color="#cdd6e4">{label}</Text>
      <Slider flexGrow={1} value={value} min={min} max={max} step={1} onValueChange={onChange} />
      <Text fontSize={14} width={60} color="#f4f1e8">{`${Math.round(value)} mm`}</Text>
    </Container>
  );
}

/** Faltet Sonderzeichen auf den Latin-Subset des 3D-Fonts (sonst leere Glyphen). */
function asciiFold(s: string): string {
  return s
    .replace(/·/g, "*").replace(/≈/g, "~").replace(/→/g, "->").replace(/×/g, "x")
    .replace(/²/g, "2").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss");
}

function shorten(q: string): string {
  return q.length > 30 ? q.slice(0, 28) + "..." : q;
}

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}
