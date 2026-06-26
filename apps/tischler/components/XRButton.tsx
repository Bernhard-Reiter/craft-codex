"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { XR_FONT_URL } from "./../lib/xr/font";

/**
 * Button im Meta-Quest-/Horizon-OS-Stil — EIN konsistentes Design fuer alle
 * 3D-Buttons im XR.
 *
 * Design-Tokens (aus dem Meta Horizon OS Look abgeleitet):
 *  - Form: Pill (stark abgerundet, radius ~ Hoehe/2), echte Tiefe.
 *  - Glas: dunkel-transparent, heller Rahmen — wie die Quest-System-Buttons.
 *  - Akzent: Meta-Blau (#1273EB) fuer aktiv/primaer.
 *  - Hover/Focus: deutlich heller + Glow + leichtes Anheben (Quest-typisch
 *    sehr ausgepraegtes Fokus-Highlight, damit man den Ziel-Button klar sieht).
 */
export const META_BLUE = "#1273eb";
const GLASS = "#1b2026";
const GLASS_HOVER = "#2c3440";
const BORDER = "#5b6675";
const BORDER_ACTIVE = "#7fb4ff";

export function XRButton({
  label,
  onClick,
  position = [0, 0, 0],
  width = 0.12,
  height = 0.05,
  fontSize = 0.018,
  active = false,
  primary = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  position?: [number, number, number];
  width?: number;
  height?: number;
  fontSize?: number;
  active?: boolean;
  primary?: boolean;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const filled = active || primary;

  // Quest-typisch: fuehlbares Anheben + Glow bei Hover/Active.
  useFrame(() => {
    const g = groupRef.current;
    if (g) {
      const target = disabled ? 1 : active ? 1.06 : hovered ? 1.045 : 1;
      const z = disabled ? 0 : active ? 0.012 : hovered ? 0.008 : 0;
      g.scale.x += (target - g.scale.x) * 0.25;
      g.scale.y += (target - g.scale.y) * 0.25;
      g.position.z += (z - g.position.z) * 0.25;
    }
    const m = matRef.current;
    if (m) {
      const targetE = disabled ? 0 : active ? 0.55 : hovered ? 0.35 : filled ? 0.25 : 0.04;
      m.emissiveIntensity += (targetE - m.emissiveIntensity) * 0.2;
    }
  });

  const bg = disabled
    ? "#23262b"
    : filled
      ? META_BLUE
      : hovered
        ? GLASS_HOVER
        : GLASS;
  const emissive = filled ? META_BLUE : hovered ? "#3a4a63" : "#000000";
  const fg = disabled ? "#6b7280" : filled ? "#ffffff" : hovered ? "#ffffff" : "#dfe4ea";
  const radius = Math.min(width, height) * 0.46;
  const depth = 0.016;

  return (
    <group ref={groupRef} position={position}>
      {/* Rahmen-Glow (Quest-Fokusrand) */}
      <RoundedBox
        args={[width + 0.006, height + 0.006, depth * 0.7]}
        radius={radius}
        smoothness={4}
        position={[0, 0, -0.003]}
      >
        <meshStandardMaterial
          color={active || hovered ? BORDER_ACTIVE : BORDER}
          emissive={active || hovered ? BORDER_ACTIVE : "#000000"}
          emissiveIntensity={active || hovered ? 0.5 : 0}
          transparent
          opacity={active || hovered ? 0.9 : 0.5}
        />
      </RoundedBox>

      {/* Button-Korpus (Glas / Meta-Blau) */}
      <RoundedBox
        args={[width, height, depth]}
        radius={radius}
        smoothness={4}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (!disabled) onClick();
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          ref={matRef}
          color={bg}
          emissive={emissive}
          emissiveIntensity={0.04}
          transparent
          opacity={filled ? 0.96 : 0.9}
          metalness={0.25}
          roughness={0.35}
        />
      </RoundedBox>

      <Text
        position={[0, 0, depth / 2 + 0.002]}
        fontSize={fontSize}
        color={fg}
        anchorX="center"
        anchorY="middle"
        maxWidth={width * 0.92}
        textAlign="center"
        font={XR_FONT_URL}
      >
        {label}
      </Text>
    </group>
  );
}
