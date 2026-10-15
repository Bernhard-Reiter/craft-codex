"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import {
  hirnholzStuecke,
  saegeschnitte,
  type HirnholzPunkt,
  type Saegeschnitt,
  type ZinkenTeilung,
} from "@craft-codex/core";
import type { SchrittId } from "../../lib/zinken/lehrgang-typen";
import { zeitplan, type Zeitplan } from "../../lib/zinken/arbeitsgang";

/**
 * Das Werkstück des Lehrgangs in 3D — EINE Szene, phasengesteuert.
 *
 * Koordinaten (mm, vor dem Maßstab 0,001):
 *   x entlang der Brettbreite B, y nach oben (y = 0 Grundlinie,
 *   y = D Hirnholz), z quer durch die Dicke (0 = außen, D = innen).
 * Das Zinkenbrett steht, Hirnholz oben (wie in der Zange).
 * Zinken/Abfall/Sägeschnitte kommen fertig aus dem Kern (hirnholzStuecke,
 * saegeschnitte). Diese Datei rechnet keine Teilung nach.
 */

const MM = 0.001;
const HOLZ = "#d8b98a";
const HOLZ_DUNKEL = "#b8945f";
const ABFALL = "#c0583c";
const ANRISS = "#1d1d1b";
const MARKER = "#f5c518";

export interface WerkstueckProps {
  teilung: ZinkenTeilung;
  phase: SchrittId;
  /** Fortschritt der Arbeitsgang-Animation 0..1 (von außen gesteuert). */
  fortschritt: number;
  /** Linienstärke (px) der Anrisslinien. */
  linienBreite?: number;
  /**
   * "voll" = ganzes Werkstück (Computer, VR). "anriss" = nur Linien,
   * Sägefugen und Stemm-Zonen — für AR über dem ECHTEN Brett, das man ja
   * nicht verdecken will. Säge und Stecheisen werden in AR nicht gezeigt.
   */
  darstellung?: "voll" | "anriss";
}

/** Prisma aus einem Hirnholz-Viereck, entlang y von y0 bis y1 extrudiert. */
function usePrisma(punkte: readonly HirnholzPunkt[], y0: number, y1: number) {
  // Schlüssel aus den Zahlen, nicht aus der Array-Identität — sonst entstünde
  // bei jedem Animationsbild eine neue Geometrie.
  const schluessel = punkte.map(([x, z]) => `${x.toFixed(4)},${z.toFixed(4)}`).join(";");
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    // Shape liegt in (x, -z): nach rotateX(-90°) wird y_shape → -z_welt… wir
    // bauen direkt mit x und z und drehen die Extrusion auf +y.
    punkte.forEach(([x, z], i) => (i === 0 ? shape.moveTo(x, -z) : shape.lineTo(x, -z)));
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.01, y1 - y0), bevelEnabled: false });
    // Extrusion läuft entlang +z_shape → auf +y drehen.
    g.rotateX(-Math.PI / 2);
    g.translate(0, y0, 0);
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schluessel, y0, y1]);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

function Prisma({
  punkte,
  y0,
  y1,
  farbe,
  deckkraft = 1,
  versatz = [0, 0, 0],
}: {
  punkte: readonly HirnholzPunkt[];
  y0: number;
  y1: number;
  farbe: string;
  deckkraft?: number;
  versatz?: [number, number, number];
}) {
  const geo = usePrisma(punkte, y0, y1);
  if (deckkraft <= 0.01) return null;
  return (
    <mesh geometry={geo} position={versatz} castShadow receiveShadow>
      <meshStandardMaterial color={farbe} roughness={0.85} transparent={deckkraft < 1} opacity={deckkraft} />
    </mesh>
  );
}

/** Viereck an der Mittellinie (z = D/2) teilen: [außen-Hälfte, innen-Hälfte]. */
function halbiere(p: readonly HirnholzPunkt[]): [HirnholzPunkt[], HirnholzPunkt[]] {
  const [aL, aR, iR, iL] = p as [HirnholzPunkt, HirnholzPunkt, HirnholzPunkt, HirnholzPunkt];
  const mL: HirnholzPunkt = [(aL[0] + iL[0]) / 2, (aL[1] + iL[1]) / 2];
  const mR: HirnholzPunkt = [(aR[0] + iR[0]) / 2, (aR[1] + iR[1]) / 2];
  return [
    [aL, aR, mR, mL],
    [mL, mR, iR, iL],
  ];
}

/** Schnittfuge: Fläche entlang der Flanke, um die halbe Schnittbreite in den Abfall versetzt. */
function Fuge({ s, D, tiefe }: { s: Saegeschnitt; D: number; tiefe: number }) {
  const geo = useMemo(() => {
    const ox = s.abfallSeite * 0.6;
    const yU = D - tiefe * D;
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          s.aussen[0] + ox, D + 0.1, s.aussen[1] - 0.1,
          s.innen[0] + ox, D + 0.1, s.innen[1] + 0.1,
          s.innen[0] + ox, yU, s.innen[1] + 0.1,
          s.aussen[0] + ox, D + 0.1, s.aussen[1] - 0.1,
          s.innen[0] + ox, yU, s.innen[1] + 0.1,
          s.aussen[0] + ox, yU, s.aussen[1] - 0.1,
        ],
        3,
      ),
    );
    return g;
  }, [s, D, tiefe]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color="#222" side={THREE.DoubleSide} />
    </mesh>
  );
}

const RECHTECK = (B: number, D: number): HirnholzPunkt[] => [[0, 0], [B, 0], [B, D], [0, D]];

const sichtbar = (phase: SchrittId, ab: SchrittId) => {
  const reihe: SchrittId[] = ["holz", "aufteilung", "anreissen", "saegen", "stemmen", "passen"];
  return reihe.indexOf(phase) >= reihe.indexOf(ab);
};

export function ZinkenWerkstueckInhalt({ teilung, phase, fortschritt, linienBreite = 1.5, darstellung = "voll" }: WerkstueckProps) {
  const voll = darstellung === "voll";
  const { B, D } = teilung.layout;
  const LAENGE = Math.max(3 * D, 60); // sichtbarer Brettkörper unter der Grundlinie
  const stuecke = useMemo(() => hirnholzStuecke(teilung), [teilung]);
  const schnitte = useMemo(() => saegeschnitte(teilung), [teilung]);
  const plan: Zeitplan = useMemo(() => zeitplan(teilung), [teilung]);

  const zeigeAnriss = sichtbar(phase, "anreissen");
  const yTop = D + 0.05;

  // Fortschritt je Element aus dem Zeitplan
  const schnittTiefe = (i: number) =>
    phase === "saegen" ? plan.saegen(fortschritt, i) : sichtbar(phase, "stemmen") ? 1 : 0;
  const abfallWeg = (i: number, haelfte: 0 | 1) =>
    phase === "stemmen" ? plan.stemmen(fortschritt, i, haelfte) : sichtbar(phase, "passen") ? 1 : 0;
  const schwalbenbrettY = phase === "passen" ? (1 - plan.passen(fortschritt)) * 3 * D : null;

  const abfaelle = stuecke.filter((s) => s.art === "abfall");

  return (
    <group scale={[MM, MM, MM]} position={[(-B / 2) * MM, 0, (-D / 2) * MM]}>
      {/* Brettkörper unter der Grundlinie */}
      {voll && <Prisma punkte={RECHTECK(B, D)} y0={-LAENGE} y1={0} farbe={HOLZ} />}

      {/* Über der Grundlinie: vor dem Sägen ein Block, danach Zinken + Abfall einzeln */}
      {phase === "holz" || phase === "aufteilung" ? (
        voll && <Prisma punkte={RECHTECK(B, D)} y0={0} y1={D} farbe={HOLZ} />
      ) : (
        <>
          {stuecke
            .filter((s) => voll && s.art === "zinken")
            .map((s) => (
              <Prisma key={s.id} punkte={s.punkte} y0={0} y1={D} farbe={HOLZ} />
            ))}
          {abfaelle.map((s, i) => {
            const [aussen, innen] = halbiere(s.punkte);
            const wA = abfallWeg(i, 0);
            const wI = abfallWeg(i, 1);
            // AR: Abfall nur als durchscheinende Stemm-Zone über dem echten Holz.
            const deck = (w: number) => (voll ? 1 - w : Math.min(1 - w, 0.4));
            return (
              <group key={s.id}>
                <Prisma punkte={aussen} y0={0} y1={D} farbe={phase === "anreissen" ? HOLZ_DUNKEL : ABFALL}
                  deckkraft={deck(wA)} versatz={[0, wA * D * 1.5, -wA * D]} />
                <Prisma punkte={innen} y0={0} y1={D} farbe={phase === "anreissen" ? HOLZ_DUNKEL : ABFALL}
                  deckkraft={deck(wI)} versatz={[0, wI * D * 1.5, wI * D]} />
              </group>
            );
          })}
        </>
      )}

      {/* Aufteilung: Mittellinie + Teilungspunkte auf dem Hirnholz */}
      {sichtbar(phase, "aufteilung") && phase !== "passen" && (
        <>
          <Line points={[[0, yTop, D / 2], [B, yTop, D / 2]]} color={ANRISS} lineWidth={linienBreite * 0.7} dashed dashSize={3} gapSize={1.5} />
          {teilung.segmente.slice(1).map((s) => (
            <mesh key={`tp-${s.index}`} position={[s.von, yTop, D / 2]}>
              <sphereGeometry args={[0.9, 10, 10]} />
              <meshBasicMaterial color={ANRISS} />
            </mesh>
          ))}
        </>
      )}

      {/* Anreißen: Grundlinie rundum + Flanken auf dem Hirnholz + Senkrechte auf beiden Flächen */}
      {zeigeAnriss && phase !== "passen" && (
        <>
          <Line
            points={[[0, 0, -0.05], [B, 0, -0.05], [B + 0.05, 0, 0], [B + 0.05, 0, D], [B, 0, D + 0.05], [0, 0, D + 0.05], [-0.05, 0, D], [-0.05, 0, 0], [0, 0, -0.05]]}
            color={ANRISS}
            lineWidth={linienBreite}
          />
          {schnitte.map((s) => (
            <group key={`l-${s.id}`}>
              <Line points={[[s.aussen[0], yTop, s.aussen[1]], [s.innen[0], yTop, s.innen[1]]]} color={ANRISS} lineWidth={linienBreite} />
              <Line points={[[s.aussen[0], D, -0.05], [s.aussen[0], 0, -0.05]]} color={ANRISS} lineWidth={linienBreite * 0.8} />
              <Line points={[[s.innen[0], D, D + 0.05], [s.innen[0], 0, D + 0.05]]} color={ANRISS} lineWidth={linienBreite * 0.8} />
            </group>
          ))}
          {/* Abfall-Kreuze auf dem Hirnholz */}
          {phase === "anreissen" &&
            abfaelle.map((s) => {
              const cx = (s.punkte[0][0] + s.punkte[1][0] + s.punkte[2][0] + s.punkte[3][0]) / 4;
              const r = Math.min(D / 4, (s.punkte[1][0] - s.punkte[0][0]) / 3);
              return (
                <group key={`x-${s.id}`}>
                  <Line points={[[cx - r, yTop, D / 2 - r], [cx + r, yTop, D / 2 + r]]} color={ABFALL} lineWidth={linienBreite} />
                  <Line points={[[cx - r, yTop, D / 2 + r], [cx + r, yTop, D / 2 - r]]} color={ABFALL} lineWidth={linienBreite} />
                </group>
              );
            })}
        </>
      )}

      {/* Sägen: Schnittfugen wachsen von oben bis zur Grundlinie, im Abfall neben der Linie */}
      {(phase === "saegen" || phase === "stemmen") &&
        schnitte.map((s, i) => {
          const tiefe = schnittTiefe(i);
          if (tiefe <= 0) return null;
          return <Fuge key={`k-${s.id}`} s={s} D={D} tiefe={tiefe} />;
        })}

      {/* Säge: Blatt am aktuellen Schnitt */}
      {voll && phase === "saegen" && (() => {
        const i = plan.aktiverSchnitt(fortschritt);
        const s = schnitte[i];
        if (!s) return null;
        const tiefe = schnittTiefe(i);
        const x = (s.aussen[0] + s.innen[0]) / 2 + s.abfallSeite * 0.6;
        const winkel = Math.atan2(s.innen[0] - s.aussen[0], D);
        return (
          <group position={[x, D - tiefe * D + 25, D / 2]} rotation={[0, winkel, 0]}>
            <mesh>
              <boxGeometry args={[0.5, 50, 160]} />
              <meshStandardMaterial color="#9aa3ab" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 27, 0]}>
              <boxGeometry args={[8, 6, 160]} />
              <meshStandardMaterial color="#5b4a3a" />
            </mesh>
          </group>
        );
      })()}

      {/* Stecheisen am aktuellen Abfall */}
      {voll && phase === "stemmen" && (() => {
        const { index, haelfte } = plan.aktivesStemmen(fortschritt);
        const s = abfaelle[index];
        if (!s) return null;
        const cx = (s.punkte[0][0] + s.punkte[1][0] + s.punkte[2][0] + s.punkte[3][0]) / 4;
        const z = haelfte === 0 ? -2 : D + 2;
        return (
          <group position={[cx, 40, z]} rotation={[haelfte === 0 ? 0.25 : -0.25, 0, 0]}>
            <mesh position={[0, -10, 0]}>
              <boxGeometry args={[Math.max(4, teilung.layout.T * 0.9), 60, 3]} />
              <meshStandardMaterial color="#9aa3ab" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 35, 0]}>
              <cylinderGeometry args={[7, 7, 40, 16]} />
              <meshStandardMaterial color="#7a4e2a" />
            </mesh>
          </group>
        );
      })()}

      {/* Passen: Schwalbenbrett kommt von oben und schiebt sich über die Zinken */}
      {schwalbenbrettY !== null && (
        <group position={[0, schwalbenbrettY, 0]}>
          {abfaelle.map((s) => (
            <Prisma key={`sw-${s.id}`} punkte={s.punkte} y0={0} y1={D} farbe={MARKER} deckkraft={0.92} />
          ))}
          <Prisma punkte={[[0, D], [B, D], [B, D + LAENGE], [0, D + LAENGE]]} y0={0} y1={D} farbe={MARKER} deckkraft={voll ? 0.92 : 0.45} />
        </group>
      )}
    </group>
  );
}

/** Spielt den Fortschritt ab (Zeitlupe über `tempo`), meldet ihn nach außen. */
export function Abspieler({
  laeuft,
  tempo,
  dauerS,
  fortschritt,
  onFortschritt,
}: {
  laeuft: boolean;
  tempo: number;
  dauerS: number;
  fortschritt: number;
  onFortschritt: (f: number) => void;
}) {
  const f = useRef(fortschritt);
  f.current = fortschritt;
  useFrame((_, dt) => {
    if (!laeuft) return;
    const neu = Math.min(1, f.current + (dt * tempo) / dauerS);
    if (neu !== f.current) onFortschritt(neu);
  });
  return null;
}

export function ZinkenWerkstueck3D({
  teilung,
  phase,
  fortschritt,
  laeuft,
  tempo,
  onFortschritt,
  wrapper,
}: WerkstueckProps & {
  laeuft: boolean;
  tempo: number;
  onFortschritt: (f: number) => void;
  wrapper?: (c: ReactNode) => ReactNode;
}) {
  const inhalt = (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[0.3, 0.6, 0.4]} intensity={1.1} castShadow />
      <ZinkenWerkstueckInhalt teilung={teilung} phase={phase} fortschritt={fortschritt} />
      <Abspieler laeuft={laeuft} tempo={tempo} dauerS={phase === "saegen" ? 16 : phase === "stemmen" ? 16 : 6}
        fortschritt={fortschritt} onFortschritt={onFortschritt} />
      <OrbitControls makeDefault target={[0, 0, 0]} minDistance={0.12} maxDistance={0.8} />
    </>
  );
  return (
    <Canvas shadows camera={{ position: [0.16, 0.14, 0.2], fov: 40 }} style={{ width: "100%", height: "100%", background: "#141414" }}>
      {wrapper ? wrapper(inhalt) : inhalt}
    </Canvas>
  );
}
