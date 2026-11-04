"use client";

/**
 * Schwebende Menütafel der Beschlagmontage — Meta horizon-Kit (RLDS).
 *
 * Enterprise-Leitplanken (docs/xr-design-leitfaden.md):
 * - EIN Fenster, aufrecht in der Blickkomfort-Zone, Billboard zum Nutzer.
 * - Nur Kit-Komponenten: Panel (RLDS-Glas), Button (Hover/Press vom Kit),
 *   ProgressBar, Checkbox. Keine handgebauten Interaktionsflächen.
 * - Trigger bedient die Tafel; die Ecken-Erfassung liegt auf der Griff-Taste.
 * - Alle uikit-Texte durch asciiFold (Ø/±/– fehlen der Schrift; Umlaute
 *   kann die 1.0-Schrift — gemessen, nicht vermutet).
 *
 * Zustand lebt in der Seite; die Tafel ist Darstellung + Callbacks.
 */

import { Billboard } from "@react-three/drei";
import { Container, Text } from "@react-three/uikit";
import { Panel, Button, ProgressBar, Checkbox } from "@react-three/uikit-horizon";
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  X,
  Hammer,
} from "@react-three/uikit-lucide";
import type { WorkflowStep } from "@craft-codex/core";
import { asciiFold } from "../lib/xr/ascii-fold";

export interface BeschlagXRTafelProps {
  schritt: WorkflowStep | undefined;
  index: number;
  gesamt: number;
  ausrichten: boolean;
  /** RMS in mm, wenn registriert — sonst null. */
  rmsMm: number | null;
  rmsGrob: boolean;
  /** Abgehakte Checklisten-Punkte (checklistItemId → true). */
  erledigt: Record<string, boolean>;
  onErledigt: (id: string, wert: boolean) => void;
  onZurueck: () => void;
  onWeiter: () => void;
  onAusrichtenStart: () => void;
  onAusrichtenAbbruch: () => void;
  position?: [number, number, number];
}

const FARBE = {
  text: "#f4f1e8",
  gedimmt: "#c7cdd6",
  akzent: "#ffd60a",
  ok: "#4ade80",
  warn: "#ff6b5e",
} as const;

export function BeschlagXRTafel({
  schritt,
  index,
  gesamt,
  ausrichten,
  rmsMm,
  rmsGrob,
  erledigt,
  onErledigt,
  onZurueck,
  onWeiter,
  onAusrichtenStart,
  onAusrichtenAbbruch,
  position = [0, 1.25, -0.75],
}: BeschlagXRTafelProps) {
  const registriert = rmsMm !== null;

  const status = ausrichten
    ? "Ausrichten läuft — Kreuz auf die Ecke, Griff-Taste drücken"
    : registriert
      ? rmsGrob
        ? `Ausrichtung grob: ±${rmsMm.toFixed(1)} mm — bitte neu ausrichten`
        : `Ausgerichtet: ±${rmsMm.toFixed(1)} mm · Werkstück nicht bewegen`
      : "Noch nicht ausgerichtet — Maße erscheinen nach dem Ausrichten";

  const statusFarbe = ausrichten
    ? FARBE.akzent
    : registriert
      ? rmsGrob
        ? FARBE.warn
        : FARBE.ok
      : FARBE.gedimmt;

  return (
    <Billboard position={position}>
      {/* Panel = RLDS-Glasfenster; Transform direkt am äußersten Element (uikit 1.0) */}
      <Panel
        pixelSize={0.0011}
        anchorX="center"
        anchorY="center"
        flexDirection="column"
        width={560}
        padding={22}
        gap={12}
        borderRadius={28}
      >
        {/* Kopf: Fortschritt + ggf. Abbrechen */}
        <Container flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text fontSize={14} color={FARBE.gedimmt}>
            {asciiFold(`Beschlag · Schritt ${index + 1} von ${gesamt}`)}
          </Text>
          {ausrichten && (
            <Button variant="secondary" size="sm" icon onClick={onAusrichtenAbbruch}>
              <X width={16} height={16} />
            </Button>
          )}
        </Container>
        <ProgressBar value={(index + 1) / gesamt} width="100%" />

        <Text fontSize={26} color={FARBE.text}>
          {asciiFold(schritt?.label ?? "")}
        </Text>

        {/* Werkzeug-Chip */}
        {schritt && schritt.tools.length > 0 && (
          <Container
            flexDirection="row"
            gap={8}
            alignItems="center"
            backgroundColor="#000000"
            borderRadius={12}
            paddingX={14}
            paddingY={8}
          >
            <Hammer width={16} height={16} color={FARBE.akzent} />
            <Text fontSize={16} color={FARBE.text}>
              {asciiFold(schritt.tools.join(" · "))}
            </Text>
          </Container>
        )}

        {/* Anweisungen als nummerierte Kreise (Lienz-Muster) */}
        <Container flexDirection="column" gap={8}>
          {schritt?.instructions.map((zeile, k) => (
            <Container key={k} flexDirection="row" gap={10} alignItems="flex-start">
              <Container
                width={26}
                height={26}
                borderRadius={13}
                backgroundColor="#2b2f3a"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Text fontSize={14} color={FARBE.text}>
                  {String(k + 1)}
                </Text>
              </Container>
              <Container flexGrow={1} flexShrink={1}>
                <Text fontSize={17} color="#e8e8ea">
                  {asciiFold(zeile)}
                </Text>
              </Container>
            </Container>
          ))}
        </Container>

        {/* Prüfpunkte zum Abhaken — direkt in AR */}
        {schritt?.checklist && schritt.checklist.length > 0 && (
          <Container flexDirection="column" gap={6}>
            {schritt.checklist.map((c) => (
              <Container key={c.id} flexDirection="row" gap={10} alignItems="center">
                <Checkbox
                  checked={!!erledigt[c.id]}
                  onCheckedChange={(w: boolean) => onErledigt(c.id, w)}
                />
                <Text fontSize={15} color={erledigt[c.id] ? FARBE.gedimmt : FARBE.text}>
                  {asciiFold(c.label)}
                </Text>
              </Container>
            ))}
          </Container>
        )}

        {/* Fußzeile */}
        <Container
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          marginTop={4}
        >
          <Container flexDirection="row" gap={8}>
            <Button variant="secondary" size="sm" disabled={index === 0} onClick={onZurueck}>
              <ChevronLeft width={16} height={16} />
              <Text fontSize={14}>Zurück</Text>
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={index >= gesamt - 1}
              onClick={onWeiter}
            >
              <Text fontSize={14}>Weiter</Text>
              <ChevronRight width={16} height={16} />
            </Button>
          </Container>
          {!ausrichten && (
            <Button variant="secondary" size="sm" onClick={onAusrichtenStart}>
              <Crosshair width={16} height={16} />
              <Text fontSize={14}>
                {asciiFold(registriert ? "Neu ausrichten" : "Ausrichten")}
              </Text>
            </Button>
          )}
        </Container>

        {/* Status */}
        <Text fontSize={13} color={statusFarbe}>
          {asciiFold(status)}
        </Text>
      </Panel>
    </Billboard>
  );
}
