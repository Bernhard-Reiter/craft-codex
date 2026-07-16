import { AbsoluteFill, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import {
  CameraRig,
  Dust,
  PanelField,
  DovetailMerge,
  FlashAndLive,
  BackgroundStructures,
  ForegroundOccluders,
  C,
} from './three-scene';
import { GatesConsole, LiveLabel, EndCards, Vignette, Grain, Letterbox } from './overlays';
import { Effects } from './effects';

export const FPS = 30;
export const SLICE_DURATION = 750; // 25 s

/**
 * Inside Cody — Vertical Slice (Szene 8+9)
 * Ein Kameraflug: Panel-Feld → Gates-Konsole (rot → Reparatur → grün)
 * → Zinken-Merge → LIVE → Claim → Titelkarte.
 */
export const VerticalSlice: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <ThreeCanvas
        width={width}
        height={height}
        style={{ width, height }}
        camera={{ fov: 45, near: 0.1, far: 60, position: [0, 1, 26] }}
      >
        <color attach="background" args={[C.bg]} />
        <fog attach="fog" args={[C.bg, 13, 34]} />
        <CameraRig />
        <BackgroundStructures />
        <Dust />
        <PanelField />
        <DovetailMerge />
        <FlashAndLive />
        <ForegroundOccluders />
        <Effects />
      </ThreeCanvas>
      <GatesConsole />
      <LiveLabel />
      <Vignette />
      <Grain />
      <EndCards />
      <Letterbox />
    </AbsoluteFill>
  );
};
