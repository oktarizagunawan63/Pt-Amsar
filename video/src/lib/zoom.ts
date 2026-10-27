import type { Box } from '../../capture/manifest.ts';

export interface ZoomTransform {
  scale: number;
  /** Screenshot pixels, applied as `scale(s) translate(x, y)` with transform-origin at the center. */
  translateX: number;
  translateY: number;
}

// With origin c, a point p lands at c + s·(p − c + t). Centering the box center b needs t = c − b;
// keeping the screenshot edges on screen limits |t| to c − size/(2s).
function axis(start: number, length: number, size: number, scale: number): number {
  const center = size / 2;
  const limit = center - size / (2 * scale);
  const t = center - (start + length / 2);
  return Math.min(limit, Math.max(-limit, t)) + 0; // + 0 turns -0 into 0
}

export function zoomTransform(box: Box, viewport: { width: number; height: number }, scale: number): ZoomTransform {
  return {
    scale,
    translateX: axis(box.x, box.width, viewport.width, scale),
    translateY: axis(box.y, box.height, viewport.height, scale),
  };
}
