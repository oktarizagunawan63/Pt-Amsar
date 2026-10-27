import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wipeOffset } from '../src/lib/wipe.ts';

test('the wipe starts fully off-screen to the left', () => {
  assert.equal(wipeOffset(0, 30), -110);
});

test('the wipe ends covering the screen, so the same-colored chapter card follows without a dark flash', () => {
  assert.equal(wipeOffset(30, 30), 0);
});
