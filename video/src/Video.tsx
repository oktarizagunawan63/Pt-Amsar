import { getStaticFiles } from '@remotion/studio';
import { AbsoluteFill, Audio, interpolate, Series, staticFile, useVideoConfig } from 'remotion';
import type { Manifest } from '../capture/manifest';
import manifestJson from '../public/screens/manifest.json';
import { ROLES } from './content/roles';
import { BIG_FLOW_SEC, FPS, INTRO_SEC, OUTRO_SEC } from './lib/timing';
import { BigFlowchart } from './scenes/BigFlowchart';
import { Chapter } from './scenes/Chapter';
import { Intro } from './scenes/Intro';
import { Outro } from './scenes/Outro';
import { COLORS } from './theme';

const manifest = manifestJson as Manifest;
const hasMusic = getStaticFiles().some((f) => f.name === 'music.mp3');

export const Video: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const fade = 2 * FPS;
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Series>
        <Series.Sequence durationInFrames={INTRO_SEC * FPS}>
          <Intro />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BIG_FLOW_SEC * FPS}>
          <BigFlowchart />
        </Series.Sequence>
        {ROLES.map((role) => (
          <Series.Sequence key={role.id} durationInFrames={role.durationSec * FPS}>
            <Chapter role={role} manifest={manifest} />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={OUTRO_SEC * FPS}>
          <Outro />
        </Series.Sequence>
      </Series>
      {hasMusic && (
        <Audio
          src={staticFile('music.mp3')}
          loop
          volume={(f) =>
            0.5 * interpolate(f, [0, fade, durationInFrames - fade, durationInFrames], [0, 1, 1, 0], { extrapolateRight: 'clamp' })
          }
        />
      )}
    </AbsoluteFill>
  );
};
