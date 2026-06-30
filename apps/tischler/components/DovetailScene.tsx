"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import {
  generateBoardAMesh,
  generateBoardBMesh,
  generateMarkings,
  markingsToLineSegments,
} from "@craft-codex/core";
import type {
  DovetailParams,
  DovetailStep,
  TeilungEbene,
  DovetailVariante,
} from "@craft-codex/core";
import { MarkingTubes } from "./MarkingTubes";
import { AnrissFlat, type AnrissLayer } from "./AnrissFlat";
import { DimensionLayer } from "./DimensionLayer";
import { useHolzMaterial } from "../lib/textures/use-holz-material";

/** Wie Anrisslinien gerendert werden: duenne Lines (2D) oder emissive Roehren (XR). */
export type MarkingStyle = "line" | "tube";

interface DovetailSceneProps {
  params: DovetailParams;
  step: DovetailStep;
  /**
   * Optional Wrapper-Komponente um den Scene-Content (z.B. <XR store={...}>).
   * Default: identity (just renders children directly).
   */
  contentWrapper?: (children: ReactNode) => ReactNode;
}

const SCALE_MM_TO_M = 0.001;
const BOARD_SEPARATION_M = 0.15;

/**
 * Pure 3D-Scene-Inhalt — ohne Canvas, ohne XR-Wrapper.
 * Nutzbar in 2D-Canvas und in XR-Context.
 */
export function DovetailSceneContents({
  params,
  step,
  withOrbitControls = true,
  markingStyle = "line",
  markingFilter,
  showBoardB = true,
  anrissLayers,
  dimensionPhase,
  teilung = "stirn",
  variante = "standard",
}: {
  params: DovetailParams;
  step: DovetailStep;
  withOrbitControls?: boolean;
  /** "line" = duenne 2D-Linien, "tube" = emissive Roehren fuer XR-Passthrough. */
  markingStyle?: MarkingStyle;
  /**
   * Progressive Anzeige: nur Anrisslinien zeigen, deren id die Funktion mit
   * true beantwortet. Ohne Filter sind alle Linien des Schritts sichtbar.
   */
  markingFilter?: (id: string) => boolean;
  /**
   * Gegenstueck (Brett B) zeigen. Beim ANREISSEN arbeitet man nur an EINEM
   * Brett — dann false, damit das Gegenstueck nicht ablenkt. Default true.
   */
  showBoardB?: boolean;
  /**
   * Flacher Anriss (Grundlinie/Flanken/Abfallflaechen statt Roehren). Wenn
   * gesetzt, ersetzt er die alten Marking-Linien — das ist die fachliche
   * Anreiss-Darstellung. Das Set steuert, welche Ebenen progressiv sichtbar sind.
   */
  anrissLayers?: ReadonlySet<AnrissLayer>;
  /**
   * Technische Bemaßung fuer den aktuellen Lernschritt (Spec §17). Wenn gesetzt,
   * werden geometrie-gebundene Maße (B/D/T/Maßkette/Schraege) eingeblendet.
   */
  dimensionPhase?: string;
  /** Teilungsebene fuer Anriss + Bemaßung: "stirn" oder "mittellinie". */
  teilung?: TeilungEbene;
  /** Variante: "standard" oder "rzv" (Randzinkenverstaerkung). */
  variante?: DovetailVariante;
}) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[2, 3, 2]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Suspense fallback={null}>
        <BoardA params={params} />
        {showBoardB && <BoardB params={params} />}
      </Suspense>
      {dimensionPhase && (
        <DimensionLayer
          widthMm={params.width_mm}
          thicknessMm={params.thickness_mm}
          lengthMm={params.length_mm}
          phase={dimensionPhase}
          teilung={teilung}
          variante={variante}
        />
      )}
      {anrissLayers ? (
        <AnrissFlat
          widthMm={params.width_mm}
          thicknessMm={params.thickness_mm}
          lengthMm={params.length_mm}
          layers={anrissLayers}
          teilung={teilung}
          variante={variante}
        />
      ) : markingStyle === "tube" ? (
        <MarkingTubes params={params} step={step} markingFilter={markingFilter} />
      ) : (
        <MarkingLines params={params} step={step} markingFilter={markingFilter} />
      )}
      {withOrbitControls && (
        <OrbitControls
          target={[0, 0, 0]}
          enablePan
          enableZoom
          enableDamping={!prefersReducedMotion()}
          minDistance={0.15}
          maxDistance={1.5}
        />
      )}
    </>
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function BoardA({ params }: { params: DovetailParams }) {
  const geometry = useMemo(() => {
    const mesh = generateBoardAMesh(params, THREE);
    return mesh.geometry;
  }, [params]);
  // Alte BufferGeometry freigeben, wenn sich params ändern / beim Unmount —
  // sonst leckt über eine lange Slider-Session GPU-Speicher.
  useEffect(() => () => geometry.dispose(), [geometry]);
  // Weiss → die echte (helle) Fichte-Texturfarbe kommt unverfaelscht durch.
  const material = useHolzMaterial("#ffffff");

  return (
    <mesh
      geometry={geometry}
      material={material}
      scale={[SCALE_MM_TO_M, SCALE_MM_TO_M, SCALE_MM_TO_M]}
      position={[0, BOARD_SEPARATION_M / 2, 0]}
      castShadow
      receiveShadow
    />
  );
}

function BoardB({ params }: { params: DovetailParams }) {
  const geometry = useMemo(() => {
    const mesh = generateBoardBMesh(params, THREE);
    return mesh.geometry;
  }, [params]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  // Brett B minimal waermer getoent → leichte Unterscheidung der zwei Bretter.
  const material = useHolzMaterial("#f0e2cc");

  return (
    <mesh
      geometry={geometry}
      material={material}
      scale={[SCALE_MM_TO_M, SCALE_MM_TO_M, SCALE_MM_TO_M]}
      position={[0, -BOARD_SEPARATION_M / 2, 0]}
      rotation={[0, Math.PI, 0]}
      castShadow
      receiveShadow
    />
  );
}

function MarkingLines({
  params,
  step,
  markingFilter,
}: {
  params: DovetailParams;
  step: DovetailStep;
  markingFilter?: (id: string) => boolean;
}) {
  const lineSegments = useMemo(() => {
    const markings = generateMarkings(step, params).filter(
      (m) => !markingFilter || markingFilter(m.id),
    );
    return markingsToLineSegments(markings, THREE);
  }, [params, step, markingFilter]);
  useEffect(
    () => () => {
      lineSegments.geometry.dispose();
      const mat = lineSegments.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    },
    [lineSegments],
  );

  return (
    <primitive
      object={lineSegments}
      scale={[SCALE_MM_TO_M, SCALE_MM_TO_M, SCALE_MM_TO_M]}
      position={[0, BOARD_SEPARATION_M / 2 + 0.001, 0]}
    />
  );
}

export function DovetailScene({
  params,
  step,
  contentWrapper,
}: DovetailSceneProps) {
  const content = <DovetailSceneContents params={params} step={step} />;
  return (
    <Canvas
      shadows
      camera={{ position: [0.3, 0.25, 0.4], fov: 45 }}
      style={{ width: "100%", height: "100%", background: "#0a0a0a" }}
    >
      {contentWrapper ? contentWrapper(content) : content}
    </Canvas>
  );
}
