"use client";

import { useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoundedBox, Text } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { XR_FONT_URL } from "../lib/xr/font";

export type Vec3 = [number, number, number];

interface XRDraggablePanelProps {
  /** Aktuelle Welt-Position des Panels (vom Parent gehalten, persistent). */
  position: Vec3;
  onDragMove: (p: Vec3) => void;
  onDragEnd: () => void;
  width: number;
  height: number;
  title?: string;
  /** Nur Greifleiste, kein eigener Hintergrund — fuer Inhalte mit eigenem
   *  Panel (z.B. ein apfel-Card aus uikit). */
  bare?: boolean;
  children?: ReactNode;
}

/**
 * Verschiebbares Menü-Panel im Meta-Quest-Stil.
 *
 * - **Entkoppelt vom Brett**: haelt eine EIGENE Welt-Pose, verschwindet also
 *   nicht, wenn das Brett bewegt wird.
 * - **Quest-Look**: abgerundetes, halbtransparentes Panel mit hellem Rahmen
 *   und Greifleiste oben (wie die System-Fenster der Quest).
 * - **Verschiebbar**: an der Greifleiste anfassen und ziehen — Ray-Plane-Schnitt
 *   auf einer horizontalen Ebene, funktioniert mit Hand-Ray UND Maus (Vorschau).
 */
export function XRDraggablePanel({
  position,
  onDragMove,
  onDragEnd,
  width,
  height,
  title,
  bare = false,
  children,
}: XRDraggablePanelProps) {
  const grab = useRef<{ id: number; offX: number; offZ: number } | null>(null);
  const [grabbed, setGrabbed] = useState(false);
  const [hover, setHover] = useState(false);
  const plane = useRef(new THREE.Plane());
  const hit = useRef(new THREE.Vector3());

  const intersect = (e: ThreeEvent<PointerEvent>): THREE.Vector3 | null => {
    plane.current.set(new THREE.Vector3(0, 1, 0), -position[1]);
    const p = e.ray.intersectPlane(plane.current, hit.current);
    return p ? p.clone() : null;
  };

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const p = intersect(e);
    if (!p) return;
    grab.current = { id: e.pointerId, offX: p.x - position[0], offZ: p.z - position[2] };
    setGrabbed(true);
    try {
      (e.target as Element & { setPointerCapture?: (i: number) => void }).setPointerCapture?.(e.pointerId);
    } catch {
      /* manche XR-Pointer ohne capture — Drag funktioniert per Ray dennoch */
    }
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const g = grab.current;
    if (!g || g.id !== e.pointerId) return;
    e.stopPropagation();
    const p = intersect(e);
    if (!p) return;
    onDragMove([p.x - g.offX, position[1], p.z - g.offZ]);
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    if (!grab.current || grab.current.id !== e.pointerId) return;
    e.stopPropagation();
    grab.current = null;
    setGrabbed(false);
    onDragEnd();
  };

  const barColor = grabbed ? "#ffed00" : hover ? "#3a4658" : "#2a3340";

  return (
    <group position={position}>
      {!bare && (
        <>
          {/* Panel-Korpus (Quest-Glas) */}
          <RoundedBox args={[width, height, 0.012]} radius={0.018} smoothness={4}>
            <meshStandardMaterial
              color="#11161d"
              transparent
              opacity={0.92}
              roughness={0.35}
              metalness={0.1}
            />
          </RoundedBox>
          {/* Heller Rahmen-Akzent */}
          <RoundedBox args={[width + 0.01, height + 0.01, 0.008]} radius={0.02} smoothness={4} position={[0, 0, -0.004]}>
            <meshStandardMaterial color="#5a6b8a" emissive="#2a3550" emissiveIntensity={0.5} />
          </RoundedBox>
        </>
      )}

      {/* Greifleiste oben */}
      <group position={[0, height / 2 + 0.028, 0.006]}>
        <RoundedBox
          args={[width * 0.6, 0.04, 0.014]}
          radius={0.016}
          smoothness={4}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
          }}
          onPointerOut={() => setHover(false)}
        >
          <meshStandardMaterial
            color={barColor}
            emissive={grabbed ? "#ffed00" : "#000000"}
            emissiveIntensity={grabbed ? 0.5 : 0}
            roughness={0.5}
          />
        </RoundedBox>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.016}
          color={grabbed ? "#0a0a0a" : "#cdd6e4"}
          anchorX="center"
          anchorY="middle"
          font={XR_FONT_URL}
        >
          {grabbed ? "ziehen" : title ? `:: ${title}` : ":: verschieben"}
        </Text>
      </group>

      {/* Inhalt vor dem Panel */}
      <group position={[0, 0, 0.012]}>{children}</group>
    </group>
  );
}
