"use client";

import { TransformControls } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ManualPlacementProvider } from "../lib/tracking/manual-placement";

interface PlacementHandlesProps {
  targetId: string;
  provider: ManualPlacementProvider;
  initialPosition?: [number, number, number];
  children?: React.ReactNode;
  onConfirm?: () => void;
}

/**
 * Drag-Gizmo fuer Manual-Placement.
 *
 * Wraps `children` in einer THREE.Group an deren Position TransformControls
 * angreift. Bei jedem Drag-Frame wird Pose in den Provider gespiegelt.
 */
export function PlacementHandles({
  targetId,
  provider,
  initialPosition = [0, 0, 0],
  children,
}: PlacementHandlesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const handleChange = () => {
    const obj = groupRef.current;
    if (!obj) return;
    provider.setPose(targetId, {
      position: [obj.position.x, obj.position.y, obj.position.z],
      rotation: [
        obj.quaternion.x,
        obj.quaternion.y,
        obj.quaternion.z,
        obj.quaternion.w,
      ],
      confidence: 1,
    });
  };

  return (
    <>
      <group ref={groupRef} position={initialPosition}>
        {children}
      </group>
      {ready && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode="translate"
          onObjectChange={handleChange}
        />
      )}
    </>
  );
}
