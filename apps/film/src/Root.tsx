import { Composition } from 'remotion';
import { VerticalSlice, SLICE_DURATION, FPS } from './VerticalSlice';

export const Root: React.FC = () => {
  return (
    <Composition
      id="VerticalSlice"
      component={VerticalSlice}
      durationInFrames={SLICE_DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
