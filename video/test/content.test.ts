import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, BIG_FLOW } from '../src/content/roles.ts';

test('five roles in spec order with spec colors and durations', () => {
  assert.deepEqual(
    ROLES.map((r) => [r.id, r.color, r.durationSec]),
    [
      ['sales', '#2563EB', 55],
      ['sales_manager', '#7C3AED', 50],
      ['site_manager', '#EA580C', 45],
      ['engineer', '#0D9488', 40],
      ['administrator', '#15803D', 50],
    ],
  );
});

test('chapter numbers are 01..05', () => {
  assert.deepEqual(ROLES.map((r) => r.number), ['01', '02', '03', '04', '05']);
});

test('each role has 3–5 flow steps and at least 4 shots', () => {
  for (const r of ROLES) {
    assert.ok(r.flow.length >= 3 && r.flow.length <= 5, r.id);
    assert.ok(r.shots.length >= 4, r.id);
  }
});

test('shot ids are unique per role', () => {
  for (const r of ROLES) assert.equal(new Set(r.shots.map((s) => s.id)).size, r.shots.length, r.id);
});

test('big flowchart has the 11 steps of spec §5 and ends with administrator', () => {
  assert.equal(BIG_FLOW.length, 11);
  assert.equal(BIG_FLOW.at(-1)!.role, 'administrator');
});
