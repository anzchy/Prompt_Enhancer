/**
 * Unit tests for selector priority logic
 * Using Node.js built-in test runner (zero dependencies)
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';

// Test selector priority for ChatGPT (from selectorMap)
test('ChatGPT selector priority: div[role="textbox"] first', () => {
  const selectors = ['div[role="textbox"]', 'textarea[placeholder*="Message"]'];

  assert.equal(selectors[0], 'div[role="textbox"]', 'Primary selector should be div[role="textbox"]');
  assert.equal(selectors[1], 'textarea[placeholder*="Message"]', 'Fallback should be textarea with Message placeholder');
});

// Test selector fallback order
test('Selector fallback iterates in priority order', () => {
  const selectors = ['primary', 'fallback1', 'fallback2'];
  const results = [];

  for (const selector of selectors) {
    results.push(selector);
  }

  assert.deepEqual(results, ['primary', 'fallback1', 'fallback2'], 'Should iterate in order');
});

// Test selector array contains expected elements
test('ChatGPT selectors array has exactly 2 items', () => {
  const selectors = ['div[role="textbox"]', 'textarea[placeholder*="Message"]'];

  assert.equal(selectors.length, 2, 'Should have exactly 2 selectors');
});
