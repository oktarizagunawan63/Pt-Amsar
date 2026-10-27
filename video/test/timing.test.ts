import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLES } from '../src/content/roles.ts';
import { chapterSegments, totalFrames, FPS } from '../src/lib/timing.ts';

test('per-shot time is between 5 and 7.5 s for every role', () => {
  for (const r of ROLES) {
    const s = chapterSegments(r).shot / FPS;
    assert.ok(s >= 5 && s <= 7.5, `${r.id}: ${s}`);
  }
});

test('chapter segments sum to the role duration', () => {
  for (const r of ROLES) {
    const g = chapterSegments(r);
    assert.equal(g.silence + g.wipe + g.card + g.flow + g.shot * r.shots.length + g.recap, r.durationSec * FPS, r.id);
  }
});

test('total length is 300 s', () => {
  assert.equal(totalFrames(ROLES), 300 * FPS);
});
