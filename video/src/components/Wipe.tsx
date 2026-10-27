import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

/** A band of the next role's color sweeping left → right across its whole sequence. */
export const Wipe: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const x = interpolate(frame, [0, durationInFrames], [-110, 110], { easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: color, transform: `translateX(${x}%) skewX(-12deg)` }} />
    </AbsoluteFill>
  );
};
