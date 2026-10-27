import { AbsoluteFill, useVideoConfig } from 'remotion';
import { Flowchart } from '../components/Flowchart';
import type { Role } from '../content/types';
import { COLORS, FONT } from '../theme';

export const MiniFlowchart: React.FC<{ role: Role }> = ({ role }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: COLORS.bg, fontFamily: FONT, color: COLORS.text, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 4, color: role.color }}>ALUR KERJA</div>
      <div style={{ fontSize: 60, fontWeight: 800, marginTop: 8, marginBottom: 90 }}>{role.name}</div>
      <Flowchart
        nodes={role.flow.map((label) => ({ label, color: role.color }))}
        layout="row"
        stagger={Math.floor((durationInFrames * 0.6) / role.flow.length)}
      />
    </AbsoluteFill>
  );
};
