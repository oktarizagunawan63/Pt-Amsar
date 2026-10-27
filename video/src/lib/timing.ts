import type { Role } from '../content/types.ts';

export const FPS = 30;

// Chapter anatomy from the spec (seconds): silence → wipe → card → mini flowchart → shots → recap.
const SILENCE = 0.5;
const WIPE = 1;
const CARD = 4;
const FLOW = 6;
const RECAP = 2;

export interface ChapterSegments {
  silence: number;
  wipe: number;
  card: number;
  flow: number;
  /** Frames per screenshot. */
  shot: number;
  recap: number;
}

export function chapterSegments(role: Role): ChapterSegments {
  const silence = SILENCE * FPS;
  const wipe = WIPE * FPS;
  const card = CARD * FPS;
  const flow = FLOW * FPS;
  const recapBase = RECAP * FPS;
  const rest = role.durationSec * FPS - silence - wipe - card - flow - recapBase;
  const shot = Math.floor(rest / role.shots.length);
  // The rounding remainder goes to the recap so the chapter keeps its exact length.
  return { silence, wipe, card, flow, shot, recap: recapBase + (rest - shot * role.shots.length) };
}

export const INTRO_SEC = 10;
export const BIG_FLOW_SEC = 30;
export const OUTRO_SEC = 20;

export function totalFrames(roles: Role[]): number {
  const chapters = roles.reduce((sum, r) => sum + r.durationSec, 0);
  return (INTRO_SEC + BIG_FLOW_SEC + chapters + OUTRO_SEC) * FPS;
}
