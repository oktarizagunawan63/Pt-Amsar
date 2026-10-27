import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zoomTransform } from '../src/lib/zoom.ts';

const VIEW = { width: 1920, height: 1080 };

test('a box already in the middle needs no translation', () => {
  assert.deepEqual(zoomTransform({ x: 860, y: 490, width: 200, height: 100 }, VIEW, 2), { scale: 2, translateX: 0, translateY: 0 });
});

test('a box in the top-left corner is clamped so nothing outside the screenshot shows', () => {
  assert.deepEqual(zoomTransform({ x: 0, y: 0, width: 100, height: 50 }, VIEW, 2), { scale: 2, translateX: 480, translateY: 270 });
});

test('a box in the bottom-right corner is clamped the other way', () => {
  assert.deepEqual(zoomTransform({ x: 1820, y: 1030, width: 100, height: 50 }, VIEW, 2), { scale: 2, translateX: -480, translateY: -270 });
});

test('scale 1 never translates', () => {
  assert.deepEqual(zoomTransform({ x: 0, y: 0, width: 10, height: 10 }, VIEW, 1), { scale: 1, translateX: 0, translateY: 0 });
});
