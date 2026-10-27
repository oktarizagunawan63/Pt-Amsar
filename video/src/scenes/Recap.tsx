import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Role } from '../content/types';
import { COLORS, FONT } from '../theme';

/** Two-second bridge to the next chapter: "<role> selesai" and where the work goes next. */
export const Recap: React.FC<{ role: Role }> = ({ role }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: COLORS.bg, fontFamily: FONT, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: role.color, letterSpacing: 2 }}>{role.name.toUpperCase()} SELESAI</div>
      <div style={{ fontSize: 58, fontWeight: 800, color: COLORS.text, opacity: t, transform: `translateY(${(1 - t) * 24}px)` }}>{role.recap}</div>
    </AbsoluteFill>
  );
};
