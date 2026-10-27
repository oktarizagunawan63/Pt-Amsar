import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT } from '../theme';

/** Lower-third caption that slides up at the start of its sequence. */
export const Caption: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: frame - 6, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 34,
        transform: `translate(-50%, ${interpolate(t, [0, 1], [40, 0])}px)`,
        opacity: t,
        display: 'flex',
        alignItems: 'stretch',
        maxWidth: 1500,
        borderRadius: 14,
        overflow: 'hidden',
        background: 'rgba(11,18,32,0.94)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{ width: 10, background: color }} />
      <div style={{ padding: '18px 30px', color: COLORS.text, fontFamily: FONT, fontSize: 38, fontWeight: 600, lineHeight: 1.25 }}>
        {text}
      </div>
    </div>
  );
};
