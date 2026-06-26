"use client";

import { useMemo } from "react";
import type { DovetailLayout, DovetailParams } from "@craft-codex/core";
import type { AnreissPhase } from "../lib/zinken/anreiss-flow";

const SCALE_MM_TO_M = 0.001;
const BOARD_SEPARATION_M = 0.15;

/**
 * Virtuelle Werkzeuge, die der Meister "parallel am Brett" zeigt — passend zum
 * aktuellen Anreiss-Schritt:
 *  - Maßband mit Teilstrichen (Messen/Teilen/Markieren) → zeigt die ECHTE
 *    Lehrbuch-Einteilung (AZT Teile à T), damit es mit der Tafel uebereinstimmt.
 *  - Streichmaß-Anschlag (Streichmass) → die Backe laeuft an der Brettkante.
 *  - Winkelschablone / Schmiege (Schräge) → ein Keil im Verhaeltnis 1:ratio.
 *
 * Alles im lokalen Brett-A-Koordinatensystem (mm), gleich transformiert wie die
 * Anrisslinien. Visuelle Feinjustierung am echten Screen/Headset noch sinnvoll.
 */
export function WerkzeugAmBrett({
  phase,
  params,
  layout,
}: {
  phase: AnreissPhase;
  params: DovetailParams;
  layout: DovetailLayout;
}) {
  const halfW = params.width_mm / 2;
  const halfL = params.length_mm / 2;
  const t = params.thickness_mm;

  const showMassband =
    phase === "messen" || phase === "teile" || phase === "markieren";
  const showWinkel = phase === "schraege" || phase === "markieren";
  const showStreichmass = phase === "streichmass";

  // Teil-Grenzen der Lehrbuch-Teilung: AZT+1 Striche ueber die Breite.
  const striche = useMemo(() => {
    const out: number[] = [];
    for (let k = 0; k <= layout.AZT; k++) out.push(-halfW + k * layout.T);
    return out;
  }, [layout.AZT, layout.T, halfW]);

  return (
    <group
      scale={[SCALE_MM_TO_M, SCALE_MM_TO_M, SCALE_MM_TO_M]}
      position={[0, BOARD_SEPARATION_M / 2 + 0.003, 0]}
    >
      {/* ── Maßband mit Teilstrichen, vor der Stirnkante ── */}
      {showMassband && (
        <group position={[0, 7, halfL + 9]}>
          <mesh>
            <boxGeometry args={[params.width_mm, 4, 13]} />
            <meshStandardMaterial color="#e7c486" roughness={0.6} />
          </mesh>
          {striche.map((x, i) => (
            <mesh key={i} position={[x, 2.6, 0]}>
              <boxGeometry args={[0.9, 1.2, 13]} />
              <meshStandardMaterial color="#2b2b20" roughness={0.5} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── Streichmaß-Anschlag an der rechten Brettkante ── */}
      {showStreichmass && (
        <group position={[halfW + 9, -t / 2, halfL - t / 2]}>
          <mesh>
            <boxGeometry args={[8, t + 14, 10]} />
            <meshStandardMaterial color="#7a5a36" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* ── Winkelschablone (Schmiege) im Verhaeltnis 1:ratio ── */}
      {showWinkel && (
        <Winkelschablone
          ratio={layout.slopeRatio}
          t={t}
          xPos={-halfW + layout.T * 2}
          halfL={halfL}
        />
      )}
    </group>
  );
}

function Winkelschablone({
  ratio,
  t,
  xPos,
  halfL,
}: {
  ratio: number;
  t: number;
  xPos: number;
  halfL: number;
}) {
  // Keil zeigt die Schraege 1:ratio — ein duenner Balken, um atan(run/t) gekippt.
  const run = t / ratio;
  const len = Math.sqrt(t * t + run * run);
  return (
    <group position={[xPos, 6, halfL - t / 2]}>
      <mesh rotation={[0, 0, Math.atan2(run, t)]}>
        <boxGeometry args={[2.5, len, 6]} />
        <meshStandardMaterial
          color="#3b6ea5"
          emissive="#1d3a5a"
          emissiveIntensity={0.4}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
