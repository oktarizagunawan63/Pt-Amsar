import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Role } from '../content/types';
import { ROLES } from '../content/roles';
import { FONT } from '../theme';

/** Full-screen chapter break in the role's color: "02 / 05", the role, who they are, their main job. */
export const ChapterCard: React.FC<{ role: Role }> = ({ role }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (delay: number) => spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: role.color, fontFamily: FONT, color: '#fff', justifyContent: 'center', paddingLeft: 180 }}>
      <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.85, transform: `translateX(${interpolate(t(0), [0, 1], [-40, 0])}px)` }}>
        BAB {role.number} / {String(ROLES.length).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1, marginTop: 10, opacity: t(6), transform: `translateX(${interpolate(t(6), [0, 1], [-60, 0])}px)` }}>
        {role.name}
      </div>
      <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 40, opacity: t(18) }}>
        <div>
          <span style={{ opacity: 0.75 }}>Siapa: </span>
          <b>{role.who}</b>
        </div>
        <div>
          <span style={{ opacity: 0.75 }}>Tugas utama: </span>
          <b>{role.mainTask}</b>
        </div>
      </div>
    </AbsoluteFill>
  );
};
