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

/** Largest zoom (≤ max, ≥ 1) at which the box still fills at most 80% of the frame on both axes. */
export function fitScale(box: Box, viewport: { width: number; height: number }, max: number): number {
  // (size · 4) / (length · 5) rather than 0.8 · size / length keeps round results exact.
  const fit = Math.min((viewport.width * 4) / (box.width * 5), (viewport.height * 4) / (box.height * 5));
  return Math.min(max, Math.max(1, fit));
}

export function zoomTransform(box: Box, viewport: { width: number; height: number }, scale: number): ZoomTransform {
  return {
    scale,
    translateX: axis(box.x, box.width, viewport.width, scale),
    translateY: axis(box.y, box.height, viewport.height, scale),
  };
}
