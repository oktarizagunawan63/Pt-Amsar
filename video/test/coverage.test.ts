import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLES } from '../src/content/roles.ts';
import { validateManifest, type Manifest } from '../capture/manifest.ts';
import manifest from '../public/screens/manifest.json' with { type: 'json' };

test('every shot in roles.ts exists in the captured manifest with a valid highlight box', () => {
  assert.deepEqual(validateManifest(manifest as Manifest, ROLES), []);
});
