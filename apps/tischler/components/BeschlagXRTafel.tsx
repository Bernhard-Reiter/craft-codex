"use client";

/**
 * Schwebende Menütafel der Beschlagmontage — als visionOS-Glasfenster.
 *
 * Baut auf dem erprobten Fenster-Pattern der Lienz-Tafel (XRDetailTafel) auf:
 * apfel Card als Glasrahmen, apfel Buttons mit Hover/Selected, nummerierte
 * Schritt-Kreise, dunkles Glas-Panel für Sekundäres. Alle uikit-Texte laufen
 * durch asciiFold — die XR-Schrift hat keine Umlaut-Glyphen.
 *
 * Bedienlogik lebt in der Seite; die Tafel ist reine Darstellung + Callbacks.
 */

import { Billboard } from "@react-three/drei";
import { Root, Container, Text } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";
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
  onZurueck: () => void;
  onWeiter: () => void;
  onAusrichtenStart: () => void;
  onAusrichtenAbbruch: () => void;
  position?: [number, number, number];
}

export function BeschlagXRTafel({
  schritt,
  index,
  gesamt,
  ausrichten,
  rmsMm,
  rmsGrob,
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
    ? "#ffd60a"
    : registriert
      ? rmsGrob
        ? "#ff6b5e"
        : "#4ade80"
      : "#c7cdd6";

  return (
    <Billboard position={position}>
      <Root pixelSize={0.0011} anchorX="center" anchorY="center">
        {/* Glas-Fensterrahmen — feste Breite, damit Text umbricht. */}
        <Card
          flexDirection="column"
          width={680}
          padding={24}
          gap={16}
          borderRadius={36}
        >
          {/* Kopfzeile: Fortschritt + Titel */}
          <Container
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text fontSize={16} color="#c7cdd6">
              {asciiFold(`Beschlag · Schritt ${index + 1} von ${gesamt}`)}
            </Text>
            {ausrichten && (
              <Button variant="icon" size="sm" onClick={onAusrichtenAbbruch}>
                <X width={18} height={18} />
              </Button>
            )}
          </Container>
          <Text fontSize={30} color="#f4f1e8">
            {asciiFold(schritt?.label ?? "")}
          </Text>

          {/* Werkzeug-Chip — dunkles Glas, wie das Erklär-Panel der Lienz-Tafel */}
          {schritt && schritt.tools.length > 0 && (
            <Container
              flexDirection="row"
              gap={10}
              alignItems="center"
              backgroundColor="#000000"
              backgroundOpacity={0.22}
              borderRadius={14}
              paddingX={16}
              paddingY={10}
            >
              <Hammer width={18} height={18} color="#ffd60a" />
              <Text fontSize={18} color="#f4f1e8">
                {asciiFold(schritt.tools.join(" · "))}
              </Text>
            </Container>
          )}

          {/* Anweisungen als nummerierte Kreise */}
          <Container flexDirection="column" gap={10}>
            {schritt?.instructions.map((zeile, k) => (
              <Container
                key={k}
                flexDirection="row"
                gap={12}
                alignItems="flex-start"
              >
                <Container
                  width={30}
                  height={30}
                  borderRadius={15}
                  backgroundColor="#2b2f3a"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Text fontSize={16} color="#f4f1e8">
                    {String(k + 1)}
                  </Text>
                </Container>
                <Container flexGrow={1} flexShrink={1}>
                  <Text fontSize={19} color="#e8e8ea">
                    {asciiFold(zeile)}
                  </Text>
                </Container>
              </Container>
            ))}
          </Container>

          {/* Fußzeile: Navigation + Ausrichten */}
          <Container
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            marginTop={4}
          >
            <Container flexDirection="row" gap={10}>
              <Button
                variant="rect"
                size="sm"
                disabled={index === 0}
                onClick={onZurueck}
              >
                <ChevronLeft width={18} height={18} />
                <Text fontSize={16}>{asciiFold("Zurück")}</Text>
              </Button>
              <Button
                variant="rect"
                size="sm"
                disabled={index >= gesamt - 1}
                onClick={onWeiter}
              >
                <Text fontSize={16}>Weiter</Text>
                <ChevronRight width={18} height={18} />
              </Button>
            </Container>
            {!ausrichten && (
              <Button variant="rect" size="sm" onClick={onAusrichtenStart}>
                <Crosshair width={18} height={18} />
                <Text fontSize={16}>
                  {asciiFold(registriert ? "Neu ausrichten" : "Ausrichten")}
                </Text>
              </Button>
            )}
          </Container>

          {/* Statuszeile */}
          <Text fontSize={15} color={statusFarbe}>
            {asciiFold(status)}
          </Text>
        </Card>
      </Root>
    </Billboard>
  );
}
