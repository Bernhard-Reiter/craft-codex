"use client";

import { type ReactNode, type RefObject } from "react";
import type { Object3D } from "three";
import { Handle, HandleTarget } from "@react-three/handle";
import type { Vec3 } from "../lib/xr/use-board-placement";

interface XRPlacementProps {
  position: Vec3;
  /** Ref auf den greifbaren Brett-Knoten — die Toolbar nutzt ihn fuer "Lotrecht". */
  boardRef: RefObject<Object3D | null>;
  /** Visueller Scale der Bretter (XR: 3). */
  contentScale?: number;
  children: ReactNode;
}

/**
 * Platzierungs-Wrapper fuer den Brett-Stack in XR.
 *
 * Das Brett ist mit der HAND greifbar (via @react-three/handle): anfassen →
 * schieben + drehen + positionieren. Funktioniert mit Hand-Tracking, Controller
 * UND Maus (2D-Vorschau). Die Button-Steuerung (Hoehe/Distanz/Lotrecht/Reset)
 * lebt jetzt in der EINEN Toolbar — hier bleibt nur das greifbare Werkstueck.
 */
export function XRPlacement({
  position,
  boardRef,
  contentScale = 3,
  children,
}: XRPlacementProps) {
  return (
    <group position={position}>
      {/* Greifbares Holzstueck: anfassen → schieben + drehen (nur um die
          senkrechte Y-Achse, wie ein Werkstueck auf dem Tisch — frei in 3D war
          schwer kontrollierbar). */}
      <HandleTarget ref={boardRef}>
        <Handle
          targetRef="from-context"
          translate
          rotate={{ x: false, y: true, z: false }}
          scale={false}
        >
          <group scale={[contentScale, contentScale, contentScale]}>
            {children}
          </group>
        </Handle>
      </HandleTarget>
    </group>
  );
}
