const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Horizontal offset (%) of the wipe band: from fully off-screen left to covering the screen.
 * It stops covered so the chapter card, which has the same color, takes over seamlessly.
 */
export function wipeOffset(frame: number, durationInFrames: number): number {
  const t = Math.min(1, Math.max(0, frame / durationInFrames));
  return -110 + 110 * easeInOutCubic(t) + 0;
}
