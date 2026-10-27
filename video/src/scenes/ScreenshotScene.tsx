import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Box } from '../../capture/manifest';
import { BrowserFrame } from '../components/BrowserFrame';
import { Caption } from '../components/Caption';
import { Highlight } from '../components/Highlight';
import type { Shot } from '../content/types';
import { fitScale, zoomTransform } from '../lib/zoom';
import { COLORS, SCREEN } from '../theme';

const CAPTURE = { width: 1920, height: 1080 };

export const ScreenshotScene: React.FC<{ shot: Shot; file: string; box: Box; color: string }> = ({ shot, file, box, color }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const target = zoomTransform(box, CAPTURE, fitScale(box, CAPTURE, shot.zoom ?? 1.6));
  // Ease into the zoom over the first half, hold it; the highlight lands as the zoom settles.
  const p = interpolate(frame, [10, durationInFrames * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const scale = 1 + (target.scale - 1) * p;
  const tx = target.translateX * p;
  const ty = target.translateY * p;
  const fade = interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0]);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, alignItems: 'center', justifyContent: 'center', opacity: fade }}>
      <BrowserFrame url={shot.route.replace(':id', '…')}>
        <div style={{ width: CAPTURE.width, height: CAPTURE.height, transform: `scale(${SCREEN.scale})`, transformOrigin: 'top left' }}>
          <div style={{ position: 'relative', width: CAPTURE.width, height: CAPTURE.height, transform: `scale(${scale}) translate(${tx}px, ${ty}px)` }}>
            <Img src={staticFile(file)} style={{ width: CAPTURE.width, height: CAPTURE.height }} />
            <Highlight box={box} color={color} appearAt={Math.round(durationInFrames * 0.4)} />
          </div>
        </div>
      </BrowserFrame>
      <Caption text={shot.caption} color={color} />
    </AbsoluteFill>
  );
};
