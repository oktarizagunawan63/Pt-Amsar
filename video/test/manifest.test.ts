import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLES } from '../src/content/roles.ts';
import { validateManifest, assertNotLoginPage, clipToViewport, type Box, type Manifest } from '../capture/manifest.ts';

function manifestWith(box: Box): Manifest {
  const m = {} as Manifest;
  for (const r of ROLES) {
    m[r.id] = {};
    for (const s of r.shots) m[r.id][s.id] = { file: `screens/${r.id}/${s.id}.png`, box };
  }
  return m;
}

test('accepts a complete manifest with on-screen boxes', () => {
  assert.deepEqual(validateManifest(manifestWith({ x: 100, y: 100, width: 300, height: 80 }), ROLES), []);
});

test('rejects zero-size boxes', () => {
  assert.match(validateManifest(manifestWith({ x: 0, y: 0, width: 0, height: 0 }), ROLES).join('\n'), /ukuran nol/);
});

test('rejects boxes outside the 1920×1080 viewport', () => {
  assert.match(validateManifest(manifestWith({ x: 1900, y: 10, width: 200, height: 50 }), ROLES).join('\n'), /di luar layar/);
});

test('reports shots in roles.ts missing from the manifest', () => {
  assert.match(validateManifest({} as Manifest, ROLES).join('\n'), /sales\/dashboard tidak ada/);
});

test('assertNotLoginPage throws with the role name when still on /login', () => {
  assert.throws(() => assertNotLoginPage('http://localhost:5173/login', 'engineer'), /engineer/);
  assert.doesNotThrow(() => assertNotLoginPage('http://localhost:5173/engineer/dashboard', 'engineer'));
});

test('clipToViewport keeps only the on-screen part of a tall panel', () => {
  assert.deepEqual(clipToViewport({ x: 300, y: 700, width: 1600, height: 900 }), { x: 300, y: 700, width: 1600, height: 380 });
});

test('clipToViewport turns a fully off-screen box into a zero-size one', () => {
  const b = clipToViewport({ x: 300, y: 1200, width: 100, height: 50 });
  assert.equal(b.height, 0);
});
