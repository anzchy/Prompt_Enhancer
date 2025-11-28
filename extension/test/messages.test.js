/**
 * Unit tests for message validation (type guards)
 * Using Node.js built-in test runner (zero dependencies)
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';

// Mock the messages module's type guards logic
function isOptimizePromptRequest(message) {
  if (!message || typeof message !== 'object') return false;
  return message.type === 'OPTIMIZE_PROMPT' && Boolean(message.payload?.originalPrompt);
}

function isTriggerOptimizeMessage(message) {
  if (!message || typeof message !== 'object') return false;
  return message.type === 'TRIGGER_OPTIMIZE';
}

// Tests for isOptimizePromptRequest
test('isOptimizePromptRequest accepts valid message', () => {
  const validMessage = {
    type: 'OPTIMIZE_PROMPT',
    payload: {
      originalPrompt: 'test prompt',
      source: 'content-script',
      pageHost: 'chatgpt.com'
    }
  };

  assert.equal(isOptimizePromptRequest(validMessage), true, 'Should accept valid OPTIMIZE_PROMPT message');
});

test('isOptimizePromptRequest rejects message without prompt', () => {
  const invalidMessage = {
    type: 'OPTIMIZE_PROMPT',
    payload: {
      originalPrompt: '',
      source: 'content-script'
    }
  };

  assert.equal(isOptimizePromptRequest(invalidMessage), false, 'Should reject message with empty prompt');
});

test('isOptimizePromptRequest rejects wrong type', () => {
  const wrongType = {
    type: 'TRIGGER_OPTIMIZE',
    payload: { originalPrompt: 'test' }
  };

  assert.equal(isOptimizePromptRequest(wrongType), false, 'Should reject non-OPTIMIZE_PROMPT type');
});

test('isOptimizePromptRequest rejects null/undefined', () => {
  assert.equal(isOptimizePromptRequest(null), false, 'Should reject null');
  assert.equal(isOptimizePromptRequest(undefined), false, 'Should reject undefined');
  assert.equal(isOptimizePromptRequest('string'), false, 'Should reject non-object');
});

// Tests for isTriggerOptimizeMessage
test('isTriggerOptimizeMessage accepts valid message', () => {
  const validMessage = {
    type: 'TRIGGER_OPTIMIZE'
  };

  assert.equal(isTriggerOptimizeMessage(validMessage), true, 'Should accept valid TRIGGER_OPTIMIZE message');
});

test('isTriggerOptimizeMessage rejects wrong type', () => {
  const wrongType = {
    type: 'OPTIMIZE_PROMPT',
    payload: {}
  };

  assert.equal(isTriggerOptimizeMessage(wrongType), false, 'Should reject non-TRIGGER_OPTIMIZE type');
});

test('isTriggerOptimizeMessage rejects null/undefined', () => {
  assert.equal(isTriggerOptimizeMessage(null), false, 'Should reject null');
  assert.equal(isTriggerOptimizeMessage(undefined), false, 'Should reject undefined');
});
