"use client";

import { useEffect, useState } from "react";
import { Root, Container, Text } from "@react-three/uikit";
import { Card, Button, Slider } from "@react-three/uikit-apfel";
import type { AnreissFlow, AnreissSchritt } from "../lib/zinken/anreiss-flow";

export interface Masse {
  width_mm: number;
  thickness_mm: number;
  length_mm: number;
}

/**
 * Gefuehrtes Anreissen im XR (apfel-Kit). Jetzt mit Brettmass-Slidern — die
 * Formel passt sich live an die Masse an — und einem Button, der die grosse
 * Detail-Tafel oeffnet.
 */
export function XRAnreissFlow({
  flow,
  index,
  onIndex,
  masse,
  onMasse,
  onTafel,
  position = [0, 0, 0],
}: {
  flow: AnreissFlow;
  index: number;
  onIndex: (i: number) => void;
  masse: Masse;
  onMasse: (m: Masse) => void;
  onTafel: () => void;
  position?: [number, number, number];
}) {
  const schritt = flow.schritte[Math.min(index, flow.schritte.length - 1)]!;
  const atStart = index === 0;
  const atEnd = index >= flow.schritte.length - 1;

  // Tafel schreibt Zeile fuer Zeile mit (~0,7 s pro Zeile), bei jedem Schritt neu.
  const [sichtbar, setSichtbar] = useState(0);
  useEffect(() => {
    setSichtbar(0);
    const timers = schritt.tafel.map((_, k) =>
      setTimeout(() => setSichtbar((s) => Math.max(s, k + 1)), (k + 1) * 700),
    );
    return () => timers.forEach(clearTimeout);
  }, [index, schritt.tafel]);

  return (
    <group position={position}>
      <Root pixelSize={0.001} anchorX="center" anchorY="center">
        <Card flexDirection="column" width={540} padding={22} gap={8} borderRadius={28}>
          {/* Brettmaße einstellen */}
          <MassRow
            label="Breite B"
            value={masse.width_mm}
            min={80}
            max={300}
            onChange={(v) => onMasse({ ...masse, width_mm: v })}
          />
          <MassRow
            label="Dicke D"
            value={masse.thickness_mm}
            min={8}
            max={40}
            onChange={(v) => onMasse({ ...masse, thickness_mm: v })}
          />
          <MassRow
            label="Länge L"
            value={masse.length_mm}
            min={120}
            max={400}
            onChange={(v) => onMasse({ ...masse, length_mm: v })}
          />

          <Container height={1} backgroundColor="#3a4452" marginY={4} />

          <Text fontSize={15} color="#9fc7b0">
            {`Schritt ${index + 1}/${flow.schritte.length} - ${asciiFold(schritt.label)}`}
          </Text>
          {schritt.tafel.slice(0, sichtbar).map((zeile, k) => (
            <Text key={k} fontSize={20} color="#f4f1e8">
              {asciiFold(zeile)}
            </Text>
          ))}
          <Text fontSize={13} color="#cfe3d6" marginTop={4}>
            {asciiFold(clip(schritt.meisterSagt, 160))}
          </Text>

          {schritt.kennzahl && (
            <Container alignSelf="flex-start" backgroundColor="#ffed00" borderRadius={8} paddingX={12} paddingY={4} marginTop={2}>
              <Text fontSize={16} color="#0a0a0a">{asciiFold(schritt.kennzahl)}</Text>
            </Container>
          )}

          <Container flexDirection="row" gap={10} marginTop={10}>
            <Button variant="rect" flexGrow={1} disabled={atStart} onClick={() => !atStart && onIndex(index - 1)}>
              <Text fontSize={16}>{"< Zurueck"}</Text>
            </Button>
            <Button variant="rect" onClick={onTafel}>
              <Text fontSize={16}>Tafel</Text>
            </Button>
            <Button variant="rect" flexGrow={1} selected={!atEnd} disabled={atEnd} onClick={() => !atEnd && onIndex(index + 1)}>
              <Text fontSize={16}>{atEnd ? "Fertig" : "Weiter >"}</Text>
            </Button>
          </Container>
        </Card>
      </Root>
    </group>
  );
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
      <Text fontSize={14} width={70} color="#cdd6e4">{label}</Text>
      <Slider flexGrow={1} value={value} min={min} max={max} step={1} onValueChange={onChange} />
      <Text fontSize={14} width={64} color="#f4f1e8">{`${Math.round(value)} mm`}</Text>
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

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}

export type { AnreissSchritt };
