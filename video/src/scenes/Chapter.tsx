import { getStaticFiles } from '@remotion/studio';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import type { Manifest } from '../../capture/manifest';
import { ChapterMarker } from '../components/ChapterMarker';
import { Wipe } from '../components/Wipe';
import { ROLES } from '../content/roles';
import type { Role } from '../content/types';
import { chapterSegments } from '../lib/timing';
import { COLORS } from '../theme';
import { ChapterCard } from './ChapterCard';
import { MiniFlowchart } from './MiniFlowchart';
import { Recap } from './Recap';
import { ScreenshotScene } from './ScreenshotScene';

const hasWhoosh = getStaticFiles().some((f) => f.name === 'whoosh.mp3');

/** silence → wipe → chapter card → mini flowchart → screenshots → recap, with the chapter marker on top. */
export const Chapter: React.FC<{ role: Role; manifest: Manifest }> = ({ role, manifest }) => {
  const g = chapterSegments(role);
  const index = ROLES.findIndex((r) => r.id === role.id);
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Series>
        <Series.Sequence durationInFrames={g.silence}>
          <AbsoluteFill style={{ background: COLORS.bg }} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={g.wipe}>
          <Wipe color={role.color} />
          {hasWhoosh && <Audio src={staticFile('whoosh.mp3')} volume={0.6} />}
        </Series.Sequence>
        <Series.Sequence durationInFrames={g.card}>
          <ChapterCard role={role} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={g.flow}>
          <MiniFlowchart role={role} />
        </Series.Sequence>
        {role.shots.map((shot) => {
          const entry = manifest[role.id][shot.id];
          return (
            <Series.Sequence key={shot.id} durationInFrames={g.shot}>
              <ScreenshotScene shot={shot} file={entry.file} box={entry.box} color={role.color} />
            </Series.Sequence>
          );
        })}
        <Series.Sequence durationInFrames={g.recap}>
          <Recap role={role} />
        </Series.Sequence>
      </Series>
      <Series>
        {/* The marker stays off the full-color chapter card, where it would clash. */}
        <Series.Sequence durationInFrames={g.silence + g.wipe + g.card}>
          <></>
        </Series.Sequence>
        <Series.Sequence durationInFrames={g.flow + g.shot * role.shots.length + g.recap}>
          <ChapterMarker activeIndex={index} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
