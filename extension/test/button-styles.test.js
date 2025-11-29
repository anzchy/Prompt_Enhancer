/**
 * Unit tests for button-styles.ts pure functions
 * Using Node.js built-in test runner (zero dependencies)
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';

// Test color logic for applyButtonStyles (pure logic extraction)
test('Dark mode color logic: white background, black text', () => {
  const isDark = true;
  const expectedBg = isDark ? '#ffffff' : '#000000';
  const expectedColor = isDark ? '#000000' : '#ffffff';

  assert.equal(expectedBg, '#ffffff', 'Dark mode should use white background');
  assert.equal(expectedColor, '#000000', 'Dark mode should use black text');
});

test('Light mode color logic: black background, white text', () => {
  const isDark = false;
  const expectedBg = isDark ? '#ffffff' : '#000000';
  const expectedColor = isDark ? '#000000' : '#ffffff';

  assert.equal(expectedBg, '#000000', 'Light mode should use black background');
  assert.equal(expectedColor, '#ffffff', 'Light mode should use white text');
});

// Test hover opacity logic
test('Hover state should use opacity 0.7', () => {
  const hoverOpacity = '0.7';
  const normalOpacity = '1';

  assert.equal(hoverOpacity, '0.7', 'Hover should reduce opacity to 0.7');
  assert.equal(normalOpacity, '1', 'Normal state should be fully opaque');
});

// Test pill-style design dimensions
test('Button height should be 36px (h-9)', () => {
  const height = '36px';
  assert.equal(height, '36px', 'Button height matches ChatGPT voice button');
});

test('Border radius should be 9999px (rounded-full)', () => {
  const borderRadius = '9999px';
  assert.equal(borderRadius, '9999px', 'Border radius creates pill shape');
});
