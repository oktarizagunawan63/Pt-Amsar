import { Composition } from 'remotion';
import { Video } from './Video';
import { ROLES } from './content/roles';
import { FPS, totalFrames } from './lib/timing';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="AmsarDemo"
    component={Video}
    durationInFrames={totalFrames(ROLES)}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
