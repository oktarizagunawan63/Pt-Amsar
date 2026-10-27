import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Box } from '../../capture/manifest';

const PAD = 10;

/** Outline around `box` (screenshot pixels), drawn inside the zoomed screenshot layer. */
export const Highlight: React.FC<{ box: Box; color: string; appearAt: number }> = ({ box, color, appearAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: frame - appearAt, fps, config: { damping: 16, mass: 0.6 } });
  const grow = interpolate(t, [0, 1], [1.06, 1]);
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x - PAD,
        top: box.y - PAD,
        width: box.width + PAD * 2,
        height: box.height + PAD * 2,
        border: `6px solid ${color}`,
        borderRadius: 16,
        boxShadow: `0 0 0 9999px rgba(15,23,42,${0.28 * t}), 0 0 40px ${color}`,
        opacity: t,
        transform: `scale(${grow})`,
      }}
    />
  );
};
