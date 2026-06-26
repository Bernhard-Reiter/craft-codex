"use client";

import { useState } from "react";
import { Text } from "@react-three/drei";
import type { AnreissFlow, AnreissSchritt } from "../lib/zinken/anreiss-flow";
import { XR_FONT_URL } from "../lib/xr/font";

/**
 * Geführtes Anreissen im XR-Headset: eine schwebende 3D-Tafel zeigt pro
 * Sub-Schritt die Formel + den Meister-Satz, zwei grosse Buttons schalten
 * vor/zurueck. Der aktive Schritt steuert ueber onSchritt die progressiven
 * Anrisslinien + Werkzeuge am Hologramm.
 *
 * Unskaliert (echte Meter), als overlay im XRPlacement.
 */
export function XRAnreissFlow({
  flow,
  index,
  onIndex,
  position = [0, 0, 0],
}: {
  flow: AnreissFlow;
  index: number;
  onIndex: (i: number) => void;
  /** Position des Inhalts (default 0/0/0 — fuers verschiebbare Panel). */
  position?: [number, number, number];
}) {
  const schritt = flow.schritte[Math.min(index, flow.schritte.length - 1)]!;
  const atStart = index === 0;
  const atEnd = index >= flow.schritte.length - 1;

  return (
    <group position={position}>
      {/* Kopf: Schritt X/N — Label (Panel-Hintergrund liefert XRDraggablePanel) */}
      <Text
        position={[-0.22, 0.17, 0.002]}
        fontSize={0.018}
        color="#9fc7b0"
        anchorX="left"
        anchorY="middle"
        font={XR_FONT_URL}
      >
        {`Schritt ${index + 1}/${flow.schritte.length} - ${asciiFold(schritt.label)}`}
      </Text>

      {/* Tafel-Formeln */}
      {schritt.tafel.map((zeile, k) => (
        <Text
          key={k}
          position={[-0.22, 0.11 - k * 0.035, 0.002]}
          fontSize={0.02}
          color="#f4f1e8"
          anchorX="left"
          anchorY="middle"
          maxWidth={0.46}
          font={XR_FONT_URL}
        >
          {asciiFold(zeile)}
        </Text>
      ))}

      {/* Meister-Satz (gekuerzt) */}
      <Text
        position={[0, -0.07, 0.002]}
        fontSize={0.014}
        color="#cfe3d6"
        anchorX="center"
        anchorY="top"
        maxWidth={0.46}
        textAlign="center"
        font={XR_FONT_URL}
      >
        {asciiFold(clip(schritt.meisterSagt, 160))}
      </Text>

      {/* Kennzahl-Badge */}
      {schritt.kennzahl && (
        <group position={[0, -0.155, 0.003]}>
          <mesh>
            <planeGeometry args={[0.26, 0.04]} />
            <meshBasicMaterial color="#ffed00" />
          </mesh>
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.018}
            color="#0a0a0a"
            anchorX="center"
            anchorY="middle"
            font={XR_FONT_URL}
          >
            {asciiFold(schritt.kennzahl)}
          </Text>
        </group>
      )}

      {/* Navigations-Buttons */}
      <NavButton
        position={[-0.13, -0.235, 0.002]}
        label="< Zurueck"
        disabled={atStart}
        onClick={() => !atStart && onIndex(index - 1)}
      />
      <NavButton
        position={[0.13, -0.235, 0.002]}
        label={atEnd ? "Fertig" : "Weiter >"}
        primary={!atEnd}
        disabled={atEnd}
        onClick={() => !atEnd && onIndex(index + 1)}
      />
    </group>
  );
}

function NavButton({
  position,
  label,
  onClick,
  primary = false,
  disabled = false,
}: {
  position: [number, number, number];
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const base = disabled ? "#23211e" : primary ? "#ffed00" : "#32373c";
  const color = hovered && !disabled ? (primary ? "#fff45a" : "#444b52") : base;
  const fg = primary && !disabled ? "#0a0a0a" : "#f0f0f0";

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.2, 0.05, 0.015]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <Text
        position={[0, 0, 0.011]}
        fontSize={0.017}
        color={fg}
        anchorX="center"
        anchorY="middle"
        font={XR_FONT_URL}
      >
        {label}
      </Text>
    </group>
  );
}

/** Faltet Sonderzeichen auf den Latin-Subset des 3D-Fonts (sonst leere Glyphen). */
function asciiFold(s: string): string {
  return s
    .replace(/·/g, "*")
    .replace(/≈/g, "~")
    .replace(/→/g, "->")
    .replace(/×/g, "x")
    .replace(/²/g, "2")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");
}

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}

export type { AnreissSchritt };
