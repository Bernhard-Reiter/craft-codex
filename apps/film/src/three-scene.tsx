import { useMemo } from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const C = {
  bg: '#070E19',
  cyan: '#4FC3F7',
  cyanHot: '#00E5FF',
  gold: '#F5D06F',
  green: '#35E59A',
  panelFill: '#12293F',
};

/* Deterministische Pseudo-Zufallszahl (kein Math.random — Render muss stabil sein) */
const rnd = (i: number, salt = 1) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ── Kamera: ein Flug, keine Schnitte ── */
export const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const z = interpolate(frame, [0, 165, 460, 560, 750], [26, 8, 7.2, 12, 12.6], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: 'clamp',
  });
  const sway = interpolate(frame, [0, 165], [1, 0.35], { extrapolateRight: 'clamp' });
  const x = Math.sin(frame / 90) * 0.7 * sway;
  const y = interpolate(frame, [0, 165], [1.4, 0.25], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: 'clamp',
  }) + Math.sin(frame / 130) * 0.12;
  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 0);
  return null;
};

/* ── Schwebender Staub ── */
export const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  const positions = useMemo(() => {
    const n = 420;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (rnd(i, 1) - 0.5) * 30;
      arr[i * 3 + 1] = (rnd(i, 2) - 0.5) * 16;
      arr[i * 3 + 2] = rnd(i, 3) * 26;
    }
    return arr;
  }, []);
  return (
    <points position={[0, Math.sin(frame / 200) * 0.2, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={C.cyan} size={0.045} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
};

/* ── Ein Glass-Panel mit Code-Zeilen ── */
const GlassPanel: React.FC<{
  pos: [number, number, number];
  w: number;
  h: number;
  ry?: number;
  seed: number;
  opacity?: number;
}> = ({ pos, w, h, ry = 0, seed, opacity = 1 }) => {
  const lines = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        w: w * (0.35 + rnd(seed * 10 + i) * 0.45),
        y: h / 2 - 0.28 - i * (h / 5.2),
      })),
    [w, h, seed],
  );
  return (
    <group position={pos} rotation={[0, ry, 0]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={C.panelFill} transparent opacity={0.45 * opacity} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(w, h)]} />
        <lineBasicMaterial color={C.cyanHot} transparent opacity={0.95 * opacity} />
      </lineSegments>
      {lines.map((l, i) => (
        <mesh key={i} position={[-w / 2 + l.w / 2 + 0.12, l.y, 0.012]}>
          <planeGeometry args={[l.w, 0.055]} />
          <meshBasicMaterial color={C.cyan} transparent opacity={0.8 * opacity} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

/* ── Das Panel-Feld in der Tiefe ── */
const PANELS: Array<{ pos: [number, number, number]; w: number; h: number; ry: number }> = [
  { pos: [-4.6, 1.4, 20], w: 3.4, h: 2.1, ry: 0.35 },
  { pos: [4.8, -1.2, 18.5], w: 3.0, h: 1.9, ry: -0.3 },
  { pos: [-3.4, -1.8, 16], w: 2.6, h: 1.7, ry: 0.28 },
  { pos: [3.9, 1.8, 14.5], w: 2.9, h: 1.8, ry: -0.32 },
  { pos: [-5.2, 0.2, 12.5], w: 3.2, h: 2.0, ry: 0.42 },
  { pos: [5.6, 0.4, 11], w: 2.7, h: 1.7, ry: -0.4 },
  { pos: [-2.9, 2.1, 9.5], w: 2.2, h: 1.4, ry: 0.22 },
  { pos: [2.8, -2.0, 8.5], w: 2.4, h: 1.5, ry: -0.25 },
  { pos: [-4.4, -1.1, 6.5], w: 2.8, h: 1.8, ry: 0.38 },
  { pos: [4.6, 1.3, 5], w: 2.5, h: 1.6, ry: -0.35 },
  { pos: [-2.2, 0.9, 3], w: 1.9, h: 1.2, ry: 0.18 },
  { pos: [2.4, -0.7, 2], w: 2.0, h: 1.3, ry: -0.2 },
];

export const PanelField: React.FC = () => {
  const frame = useCurrentFrame();
  // Beim Merge ziehen die Panels zur Mitte und lösen sich auf
  const s = interpolate(frame, [468, 560], [1, 0.1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const op = interpolate(frame, [468, 545], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (frame > 560) return null;
  return (
    <group scale={[s, s, s]}>
      {PANELS.map((p, i) => (
        <GlassPanel key={i} pos={p.pos} w={p.w} h={p.h} ry={p.ry + Math.sin(frame / 160 + i) * 0.02} seed={i + 1} opacity={op} />
      ))}
    </group>
  );
};

/* ── Zinken-Verbindung (Schwalbenschwanz) ── */
const dovetailShapes = () => {
  // Linke Hälfte: zwei Schwalbenschwanz-Zinken auf der rechten Kante
  const L = new THREE.Shape();
  L.moveTo(-3, -1.5);
  L.lineTo(0, -1.5);
  L.lineTo(0, -1.1);
  L.lineTo(0.62, -0.92);
  L.lineTo(0.62, -0.58);
  L.lineTo(0, -0.4);
  L.lineTo(0, 0.4);
  L.lineTo(0.62, 0.58);
  L.lineTo(0.62, 0.92);
  L.lineTo(0, 1.1);
  L.lineTo(0, 1.5);
  L.lineTo(-3, 1.5);
  L.closePath();
  // Rechte Hälfte: passende Ausnehmungen
  const R = new THREE.Shape();
  R.moveTo(3, -1.5);
  R.lineTo(3, 1.5);
  R.lineTo(0, 1.5);
  R.lineTo(0, 1.1);
  R.lineTo(0.62, 0.92);
  R.lineTo(0.62, 0.58);
  R.lineTo(0, 0.4);
  R.lineTo(0, -0.4);
  R.lineTo(0.62, -0.58);
  R.lineTo(0.62, -0.92);
  R.lineTo(0, -1.1);
  R.lineTo(0, -1.5);
  R.closePath();
  return { L, R };
};

const DovetailHalf: React.FC<{ shape: THREE.Shape; color: string; fill: string }> = ({ shape, color, fill }) => {
  const geo = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth: 0.45, bevelEnabled: false }), [shape]);
  return (
    <group>
      <mesh geometry={geo}>
        <meshBasicMaterial color={fill} transparent opacity={0.8} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[geo]} />
        <lineBasicMaterial color={color} transparent opacity={0.95} />
      </lineSegments>
    </group>
  );
};

export const DovetailMerge: React.FC = () => {
  const frame = useCurrentFrame();
  const { L, R } = useMemo(dovetailShapes, []);
  if (frame < 462) return null;
  const t = interpolate(frame, [470, 560], [1, 0], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const appear = interpolate(frame, [462, 486], [0, 1], {
    extrapolateRight: 'clamp',
  });
  return (
    <group scale={[appear, appear, appear]} position={[0, 0, 0.5]}>
      <group position={[-6.4 * t, 0, 0]}>
        <DovetailHalf shape={L} color={C.cyanHot} fill="#0E3A58" />
      </group>
      <group position={[6.4 * t, 0, 0]}>
        <DovetailHalf shape={R} color={C.gold} fill="#3E3416" />
      </group>
    </group>
  );
};

/* ── Blitz beim Schließen + LIVE-Puls ── */
export const FlashAndLive: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [556, 559, 567], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const liveIn = interpolate(frame, [575, 595], [0, 1], {
    easing: Easing.out(Easing.back(1.6)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <group position={[0, 0, 1.2]}>
      {flash > 0 && (
        <mesh>
          <planeGeometry args={[40, 24]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={flash} />
        </mesh>
      )}
      {frame >= 575 && (
        <group scale={[liveIn, liveIn, liveIn]}>
          <mesh>
            <circleGeometry args={[0.22, 40]} />
            <meshBasicMaterial color={C.green} />
          </mesh>
          {[0, 1, 2].map((k) => {
            const local = Math.max(0, frame - 590 - k * 26);
            const cycle = (local % 80) / 80;
            const on = frame >= 590 + k * 26;
            return (
              on && (
                <mesh key={k}>
                  <ringGeometry args={[0.3 + cycle * 2.6, 0.34 + cycle * 2.6, 48]} />
                  <meshBasicMaterial color={C.green} transparent opacity={0.55 * (1 - cycle)} side={THREE.DoubleSide} />
                </mesh>
              )
            );
          })}
        </group>
      )}
    </group>
  );
};
