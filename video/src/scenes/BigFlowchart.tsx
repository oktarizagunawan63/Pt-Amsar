import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Flowchart } from '../components/Flowchart';
import { BIG_FLOW, ROLES } from '../content/roles';
import { COLORS, FONT } from '../theme';

const colorOf = (id: string) => ROLES.find((r) => r.id === id)!.color;

export const BigFlowchart: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Nodes arrive over the first ~75% of the scene; the rest lets the full chart sit on screen.
  const stagger = Math.floor((durationInFrames * 0.75) / BIG_FLOW.length);
  const fade = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0]);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, fontFamily: FONT, color: COLORS.text, alignItems: 'center', opacity: fade }}>
      <div style={{ marginTop: 70, fontSize: 24, fontWeight: 700, letterSpacing: 4, color: COLORS.muted }}>ALUR KERJA</div>
      <div style={{ marginTop: 10, fontSize: 54, fontWeight: 800 }}>Dari kunjungan sales sampai proyek selesai</div>
      <div style={{ marginTop: 70 }}>
        <Flowchart nodes={BIG_FLOW.map((n) => ({ label: n.label, color: colorOf(n.role) }))} layout="snake" stagger={stagger} />
      </div>
      <div style={{ position: 'absolute', bottom: 60, display: 'flex', gap: 34 }}>
        {ROLES.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, color: COLORS.muted }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: r.color }} />
            {r.name}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
