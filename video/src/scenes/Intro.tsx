import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ROLES } from '../content/roles';
import { COLORS, FONT } from '../theme';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const at = (delay: number) => spring({ frame: frame - delay, fps, config: { damping: 18 } });
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 30% 20%, #14532D 0%, ${COLORS.bg} 60%)`,
        fontFamily: FONT,
        color: COLORS.text,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 34, opacity: at(0), transform: `translateY(${(1 - at(0)) * 30}px)` }}>
        <Img src={staticFile('logo.png')} style={{ height: 150 }} />
        <div>
          <div style={{ fontSize: 34, fontWeight: 600, color: '#BBF7D0', letterSpacing: 1 }}>PT Amsar Prima Mandiri</div>
          <div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.05 }}>Dashboard Proyek &amp; Penjualan</div>
        </div>
      </div>
      <div style={{ marginTop: 46, fontSize: 36, color: COLORS.muted, maxWidth: 1300, textAlign: 'center', lineHeight: 1.4, opacity: at(25) }}>
        Kunjungan sales, deal, proyek, dan laporan lapangan tercatat dan terpantau dalam satu sistem.
      </div>
      <div style={{ marginTop: 70, display: 'flex', gap: 20 }}>
        {ROLES.map((role, i) => {
          const t = at(60 + i * 12);
          return (
            <div
              key={role.id}
              style={{
                padding: '14px 28px',
                borderRadius: 40,
                border: `3px solid ${role.color}`,
                background: `${role.color}33`,
                fontSize: 28,
                fontWeight: 700,
                opacity: t,
                transform: `scale(${0.8 + 0.2 * t})`,
              }}
            >
              {role.name}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 26, fontSize: 24, color: COLORS.muted, opacity: at(130) }}>5 peran, satu alur kerja</div>
    </AbsoluteFill>
  );
};
