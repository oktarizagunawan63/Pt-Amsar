import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { wipeOffset } from '../lib/wipe';

/** A band of the next role's color sweeping in from the left until it covers the screen. */
export const Wipe: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {/* Wider than the screen so the skewed edge never leaves a gap once it has arrived. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '-15%',
          width: '130%',
          background: color,
          transform: `translateX(${wipeOffset(frame, durationInFrames)}%) skewX(-12deg)`,
        }}
      />
    </AbsoluteFill>
  );
};
