"use client";

/**
 * 3-Punkt-Registrierung per Controller-Spitze — allgemeine Fassung des
 * Musters aus BeschlagARRegistration (dort unverändert gelassen). Die
 * getrackte Spitze 15 cm vor dem Controller ist die Sonde; GRIFF-Taste
 * erfasst einen Punkt (nicht der Trigger — der bedient die Tafel).
 *
 * Texte kommen fertig übersetzt als Props (kein useTranslations im Canvas).
 */
import { useRef, useState } from "react";
import * as THREE from "three";
import { Billboard, Text } from "@react-three/drei";
import { XRSpace, useXRInputSourceEvent, useXRInputSourceState } from "@react-three/xr";
import { solveRigidFrom3Points, type Vec3 } from "@craft-codex/core";

export interface DreiPunktErgebnis {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  /** RMS-Restfehler in Metern. */
  rmsError: number;
}

const SONDE = 0.15;

export function XRDreiPunktRegistrierung({
  modell,
  anweisungen,
  ohneController,
  onRegistriert,
  onUngueltig,
}: {
  modell: [Vec3, Vec3, Vec3];
  /** Drei Anweisungen (je Punkt), übersetzt. */
  anweisungen: readonly [string, string, string];
  ohneController: string;
  onRegistriert: (r: DreiPunktErgebnis) => void;
  /** Punkte (fast) auf einer Linie → keine Lösung. */
  onUngueltig: () => void;
}) {
  const spitze = useRef<THREE.Group>(null);
  const [punkte, setPunkte] = useState<Vec3[]>([]);
  // Erfasste Punkte zusätzlich im Ref: Die Callbacks laufen außerhalb eines
  // setState-Updaters (der darf in StrictMode doppelt laufen).
  const erfasst = useRef<Vec3[]>([]);
  const rechts = useXRInputSourceState("controller", "right");
  const links = useXRInputSourceState("controller", "left");
  // Die Sonde hängt an genau einem Controller; nur dessen Griff-Taste zählt.
  const sonde = (rechts ?? links)?.inputSource;
  const raum = sonde?.targetRaySpace;

  useXRInputSourceEvent(
    sonde,
    "squeeze",
    () => {
      const g = spitze.current;
      if (!g) return;
      const p = new THREE.Vector3();
      g.getWorldPosition(p);
      const neu: Vec3[] = [...erfasst.current, [p.x, p.y, p.z]];
      if (neu.length < 3) {
        erfasst.current = neu;
        setPunkte(neu);
        return;
      }
      erfasst.current = [];
      setPunkte([]);
      const t = solveRigidFrom3Points(modell, neu as [Vec3, Vec3, Vec3]);
      if (t) onRegistriert({ position: t.position, quaternion: t.rotation, rmsError: t.rmsError });
      else onUngueltig();
    },
    [modell, onRegistriert, onUngueltig],
  );

  return (
    <>
      {raum && (
        <XRSpace space={raum}>
          <mesh position={[0, 0, -SONDE / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0015, 0.0015, SONDE, 12]} />
            <meshBasicMaterial color="#a4a4ac" />
          </mesh>
          <group ref={spitze} position={[0, 0, -SONDE]}>
            <mesh>
              <sphereGeometry args={[0.003, 12, 12]} />
              <meshBasicMaterial color="#ffed00" />
            </mesh>
          </group>
        </XRSpace>
      )}
      {punkte.map((c, i) => (
        <mesh key={i} position={c}>
          <sphereGeometry args={[0.006, 16, 16]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>
      ))}
      <Billboard position={[0, 0.9, -0.6]}>
        <Text fontSize={0.02} color="#ffed00" anchorX="center" anchorY="middle" maxWidth={0.7}>
          {raum ? anweisungen[Math.min(punkte.length, 2)] : ohneController}
        </Text>
      </Billboard>
    </>
  );
}
