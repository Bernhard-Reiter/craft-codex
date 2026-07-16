import { useMemo } from 'react';
import { Vector2 } from 'three';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { LOOK } from './look';

/**
 * 3D-Postprocessing — nur frame-unabhängige Effekte (kein TAA, kein History-Buffer):
 * Remotion bestimmt den Frame, jeder Frame wird unabhängig berechnet.
 */
export const Effects: React.FC = () => {
  const caOffset = useMemo(() => new Vector2(...LOOK.caOffset), []);
  if (!LOOK.bloom && !LOOK.ca) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        mipmapBlur
        intensity={LOOK.bloom ? LOOK.bloomIntensity : 0}
        luminanceThreshold={LOOK.bloomThreshold}
        luminanceSmoothing={LOOK.bloomSmoothing}
      />
      <ChromaticAberration
        offset={caOffset}
        radialModulation={false}
        modulationOffset={0}
      />
    </EffectComposer>
  );
};
