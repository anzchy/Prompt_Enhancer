import { MessageType, OptimizePromptResponse, isTriggerOptimizeMessage } from '../shared/messages';
import { applyButtonStyles, observeThemeChanges } from './button-styles';

const BUTTON_CLASS = 'prompt-enhancer-btn';
const BUTTON_TEXT = '优化指令';

console.log('[Prompt Optimizer] Content script loaded on:', window.location.href);

function selectorMap(host: string): string[] {
  if (host.includes('chatgpt.com') || host.includes('chat.openai.com')) {
    return ['div[role="textbox"]', '#prompt-textarea', 'textarea[placeholder*="Message"]'];
  }
  if (host.includes('manus.im')) {
    return ['div[contenteditable="true"][role="textbox"]', 'textarea', 'div[role="textbox"]'];
  }
  if (host.includes('gemini.google.com')) {
    return ['textarea', 'div[contenteditable="true"]'];
  }
  return ['div[role="textbox"]', 'textarea', 'input[type="text"]'];
}

function findPromptInput(): HTMLElement | null {
  const selectors = selectorMap(window.location.host);
  console.log('[Prompt Optimizer] Trying selectors:', selectors);

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      console.log('[Prompt Optimizer] ✅ Found input element:', selector, el);
      return el;
    }
  }

  console.warn('[Prompt Optimizer] ❌ Could not find input element');
  return null;
}

function getPromptValue(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value || '';
  }
  return el.textContent || '';
}

function setPromptValue(el: HTMLElement, value: string) {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  el.textContent = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertButton(target: HTMLElement) {
  if (document.querySelector(`.${BUTTON_CLASS}`)) {
    console.log('[Prompt Optimizer] Button already exists');
    return;
  }

  console.log('[Prompt Optimizer] Creating button...');

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = BUTTON_TEXT;
  button.className = BUTTON_CLASS;

  // Apply styles (CSS handles most styling now)
  applyButtonStyles(button);
  observeThemeChanges(button);

  button.addEventListener('click', () => handleOptimize(button, target));

  console.log('[Prompt Optimizer] Trying insertion strategies...');

  // Strategy 1: Try to anchor next to ChatGPT "+" button
  const plusButtonEl = document.querySelector('[data-testid="composer-plus-btn"]');
  console.log('[Prompt Optimizer] Strategy 1 - Plus button found:', plusButtonEl);

  if (plusButtonEl) {
    const plusContainer = plusButtonEl.parentElement;
    console.log('[Prompt Optimizer] Plus button container:', plusContainer);

    if (plusContainer) {
      plusContainer.appendChild(button);
      console.log('[Prompt Optimizer] ✅ Button inserted via Strategy 1 (next to + button)');
      return;
    }
  }

  // Strategy 2: Try grid-area:leading container
  const leadingArea = document.querySelector('[class*="grid-area:leading"]');
  console.log('[Prompt Optimizer] Strategy 2 - Leading area:', leadingArea);

  if (leadingArea) {
    const plusButtonSpan = leadingArea.querySelector('span.flex');
    console.log('[Prompt Optimizer] Plus button span:', plusButtonSpan);

    if (plusButtonSpan) {
      plusButtonSpan.appendChild(button);
      console.log('[Prompt Optimizer] ✅ Button inserted via Strategy 2 (grid-area:leading)');
      return;
    }
  }

  // Strategy 3: Insert before target's parent
  const parent = target.parentElement;
  console.log('[Prompt Optimizer] Strategy 3 - Target parent:', parent);

  if (parent) {
    parent.insertBefore(button, target);
    console.log('[Prompt Optimizer] ✅ Button inserted via Strategy 3 (before target)');
    return;
  }

  // Strategy 4: Last resort
  target.insertAdjacentElement('beforebegin', button);
  console.log('[Prompt Optimizer] ✅ Button inserted via Strategy 4 (insertAdjacentElement)');
}

async function handleOptimize(button: HTMLButtonElement, target: HTMLElement) {
  console.log('[Prompt Optimizer] Optimize triggered');

  const originalPrompt = getPromptValue(target).trim();
  if (!originalPrompt) {
    console.warn('[Prompt Optimizer] Empty prompt');
    button.textContent = '请输入内容';
    setTimeout(() => (button.textContent = BUTTON_TEXT), 1200);
    return;
  }

  console.log('[Prompt Optimizer] Original prompt:', originalPrompt.substring(0, 50) + '...');

  setLoading(button, true);
  try {
    console.log('[Prompt Optimizer] Sending request to background...');
    const response = (await chrome.runtime.sendMessage({
      type: MessageType.OptimizePrompt,
      payload: { originalPrompt, source: 'content-script', pageHost: window.location.host }
    })) as OptimizePromptResponse;

    console.log('[Prompt Optimizer] Response:', response);

    if (!response?.success || !response.optimizedPrompt) {
      const msg = response?.error || '优化失败';
      console.error('[Prompt Optimizer] Failed:', msg);
      button.textContent = msg;
      setTimeout(() => (button.textContent = BUTTON_TEXT), 1400);
      return;
    }

    console.log('[Prompt Optimizer] ✅ Success, updating prompt');
    setPromptValue(target, response.optimizedPrompt);
  } catch (error) {
    console.error('[Prompt Optimizer] Error:', error);
    button.textContent = '请求错误';
    setTimeout(() => (button.textContent = BUTTON_TEXT), 1400);
  } finally {
    setLoading(button, false);
  }
}

function setLoading(button: HTMLButtonElement, loading: boolean) {
  button.disabled = loading;
  button.textContent = loading ? '优化中…' : BUTTON_TEXT;
  if (loading) {
    button.classList.add('loading');
  } else {
    button.classList.remove('loading');
  }
}

function mount() {
  console.log('[Prompt Optimizer] mount() called');

  // Host gating
  const host = window.location.host;
  const supportedHosts = ['chatgpt.com', 'chat.openai.com'];
  const isSupported = supportedHosts.some(h => host.includes(h));

  if (!isSupported) {
    console.log('[Prompt Optimizer] Unsupported host:', host);
    return;
  }

  console.log('[Prompt Optimizer] ✅ Supported host:', host);

  // Try to find input immediately
  const input = findPromptInput();
  if (input) {
    console.log('[Prompt Optimizer] Input found immediately');
    insertButton(input);
    return;
  }

  // Use MutationObserver if not found
  console.log('[Prompt Optimizer] Setting up MutationObserver...');

  let attempts = 0;
  const maxAttempts = 100;

  const observer = new MutationObserver(() => {
    attempts++;
    const found = findPromptInput();

    if (found) {
      console.log('[Prompt Optimizer] ✅ Input found via observer (attempt', attempts, ')');
      insertButton(found);
      observer.disconnect();
    } else if (attempts >= maxAttempts) {
      console.error('[Prompt Optimizer] ❌ Failed after', maxAttempts, 'attempts');
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Initialize on page load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('[Prompt Optimizer] Document ready, mounting...');
  mount();
} else {
  console.log('[Prompt Optimizer] Waiting for DOMContentLoaded...');
  window.addEventListener('DOMContentLoaded', () => {
    console.log('[Prompt Optimizer] DOMContentLoaded fired');
    mount();
  });
}

// Delayed retry for SPAs
setTimeout(() => {
  console.log('[Prompt Optimizer] Delayed mount attempt (2s)');
  mount();
}, 2000);

// Handle keyboard shortcut
chrome.runtime.onMessage.addListener((message) => {
  if (isTriggerOptimizeMessage(message)) {
    console.log('[Prompt Optimizer] Keyboard shortcut triggered');
    const button = document.querySelector<HTMLButtonElement>(`.${BUTTON_CLASS}`);
    const target = findPromptInput();

    if (button && target) {
      handleOptimize(button, target);
    } else {
      console.warn('[Prompt Optimizer] Cannot handle shortcut - button or input missing');
    }
  }
});

console.log('[Prompt Optimizer] Content script initialized');
