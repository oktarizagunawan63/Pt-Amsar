import { AbsoluteFill, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ROLES } from '../content/roles';
import { COLORS, FONT } from '../theme';

// Rows: every sidebar label, in first-seen order across the roles (from Sidebar.jsx via roles.ts).
const ROWS = [...new Set(ROLES.flatMap((r) => r.menu))];

const Matrix: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: COLORS.bg, fontFamily: FONT, color: COLORS.text, alignItems: 'center', paddingTop: 50 }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, color: COLORS.muted }}>RINGKASAN</div>
      <div style={{ fontSize: 50, fontWeight: 800, marginTop: 6, marginBottom: 26 }}>Siapa mengakses apa</div>
      <table style={{ borderCollapse: 'collapse', fontSize: 23 }}>
        <thead>
          <tr>
            <th style={{ width: 300 }} />
            {ROLES.map((r) => (
              <th key={r.id} style={{ width: 230, padding: '8px 0', color: r.color, fontWeight: 800 }}>
                {r.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((label, row) => {
            const t = spring({ frame: frame - 10 - row * 4, fps, config: { damping: 20 } });
            return (
              <tr key={label} style={{ opacity: t, borderTop: `1px solid ${COLORS.line}` }}>
                <td style={{ padding: '7px 16px', color: COLORS.muted, fontWeight: 600 }}>{label}</td>
                {ROLES.map((r) => (
                  <td key={r.id} style={{ textAlign: 'center' }}>
                    {r.menu.includes(label) ? (
                      <span style={{ color: r.color, fontSize: 28, fontWeight: 800 }}>✓</span>
                    ) : (
                      <span style={{ color: COLORS.line }}>—</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </AbsoluteFill>
  );
};

const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 18 } });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 40%, #14532D 0%, ${COLORS.bg} 65%)`,
        fontFamily: FONT,
        color: COLORS.text,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut,
      }}
    >
      <Img src={staticFile('logo.png')} style={{ height: 170, opacity: t }} />
      <div style={{ marginTop: 36, fontSize: 38, fontWeight: 600, color: '#BBF7D0', opacity: t }}>PT Amsar Prima Mandiri</div>
      <div style={{ marginTop: 10, fontSize: 64, fontWeight: 800, opacity: t }}>Proyek &amp; Penjualan dalam satu dashboard</div>
    </AbsoluteFill>
  );
};

export const Outro: React.FC = () => {
  const { durationInFrames, fps } = useVideoConfig();
  const closing = 6 * fps;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={durationInFrames - closing}>
        <Matrix />
      </Sequence>
      <Sequence from={durationInFrames - closing}>
        <Closing />
      </Sequence>
    </AbsoluteFill>
  );
};
