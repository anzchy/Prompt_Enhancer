# Quickstart: Manual Testing Guide

**Feature**: ChatGPT Inline Prompt Optimizer Button
**Date**: 2025-11-28
**Purpose**: Manual testing checklist (NO automated tests per Constitution Principle VIII)

## Prerequisites

1. Chrome browser installed (version 88+)
2. OpenAI API key or compatible proxy endpoint
3. Extension built and loaded as unpacked extension

## Setup

### 1. Build Extension

```bash
cd extension
npm install         # First time only
npm run build       # Production build (or npm run dev for watch mode)
```

Output: `extension/dist/` directory with bundled files

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension/dist/` directory
5. Verify "Prompt Optimizer" appears in extensions list

### 3. Configure API Key

1. Click extension icon in toolbar → Options
2. Fill in:
   - **API Base URL**: `https://api.openai.com/v1` (or your proxy)
   - **API Key**: Your OpenAI API key
   - **Model**: `gpt-4.1-mini` (or preferred model)
   - **System Prompt**: (can use default)
3. Click Save

## Manual Testing Checklist

### Test 1: Button Injection (FR-001, FR-002)

**Steps**:
1. Navigate to https://chatgpt.com
2. Wait for page to load completely
3. Observe the chat input area

**Expected**:
- [ ] "优化指令" button appears within 500ms (SC-002)
- [ ] Button is positioned on LEFT side of input area, near the "+" button (FR-002)
- [ ] Button does NOT overlap or break existing ChatGPT UI (SC-005)
- [ ] Button has pill-style shape (border-radius: 999px) (FR-016)

**Fallback Test**:
1. Refresh page rapidly during load
2. Button should still appear via MutationObserver fallback (FR-013)

---

### Test 2: Button Click Optimization (FR-004, FR-005, FR-006, FR-007)

**Steps**:
1. Type prompt: "写个 Python 脚本抓取网站"
2. Click "优化指令" button

**Expected**:
- [ ] Button text changes to "优化中…" immediately (FR-005)
- [ ] Button becomes disabled (cannot click again) (FR-005)
- [ ] Within 1-3 seconds, optimized prompt appears in input box (SC-001)
- [ ] Original prompt is replaced with detailed, structured prompt (FR-007)
- [ ] Button returns to "优化指令" state (FR-014)
- [ ] Optimized prompt is editable (cursor can be placed, text can be changed) (FR-008)

---

### Test 3: Keyboard Shortcut (FR-017)

**Platform**: Windows/Linux

**Steps**:
1. Type prompt: "帮我写个网页"
2. Press `Ctrl+Shift+O`

**Expected**:
- [ ] Optimization triggers (same as clicking button)
- [ ] Button shows loading state
- [ ] Prompt is optimized and replaced

**Platform**: macOS

**Steps**:
1. Type prompt: "帮我写个网页"
2. Press `Cmd+Shift+O`

**Expected**:
- [ ] Optimization triggers (same as clicking button)

---

### Test 4: Empty Input Validation (FR-011)

**Steps**:
1. Clear input box (empty)
2. Click "优化指令" button

**Expected**:
- [ ] Button text changes to "请输入内容" (FR-011)
- [ ] After 1.2 seconds, button reverts to "优化指令" (FR-014)
- [ ] No API call is made (check Network tab)

---

### Test 5: Missing API Key Error (FR-009)

**Steps**:
1. Open Options page → Clear API Key field → Save
2. Go to chatgpt.com
3. Type prompt and click "优化指令"

**Expected**:
- [ ] Button shows "请先在 Options 页面配置 API Key" error (FR-009)
- [ ] After 1.4 seconds, button reverts to "优化指令"

---

### Test 6: Network Error Handling (FR-010)

**Steps**:
1. Configure invalid API base URL: `https://invalid-url-12345.com/v1`
2. Type prompt and click "优化指令"

**Expected**:
- [ ] Button shows "请求错误" or similar error message (FR-010)
- [ ] After 1.4 seconds, button reverts to "优化指令"
- [ ] Original prompt remains unchanged

---

### Test 7: Dark Mode Adaptation (FR-015, SC-007)

**Steps**:
1. Go to chatgpt.com
2. Observe button in light mode
3. Click ChatGPT settings → Enable dark mode
4. Observe button styling

**Expected**:
- [ ] In light mode: Button has light background, dark text
- [ ] In dark mode: Button adapts to dark theme (background/text colors change)
- [ ] Button remains readable and matches ChatGPT's design (FR-015)
- [ ] Transition happens automatically without manual configuration (SC-007)

---

### Test 8: Rapid Click Prevention (Edge Case)

**Steps**:
1. Type prompt
2. Click "优化指令" button rapidly 5 times in succession

**Expected**:
- [ ] Only ONE API call is made (button disabled during processing)
- [ ] Button remains disabled until first request completes

---

### Test 9: Multi-Site Support (FR-012, SC-006)

**Steps**:
1. Test on https://chatgpt.com
2. Test on https://chat.openai.com

**Expected**:
- [ ] Button appears on both URLs (FR-012)
- [ ] Functionality identical on both sites (SC-006)
- [ ] No code duplication needed (SC-006)

---

### Test 10: Page Navigation During Optimization (Edge Case)

**Steps**:
1. Type prompt and click "优化指令"
2. While loading (during "优化中…" state), navigate to a different conversation

**Expected**:
- [ ] No console errors
- [ ] Request completes gracefully or is cancelled
- [ ] No UI breakage in new conversation

---

## Performance Validation

After all tests pass, verify success criteria:

- [ ] **SC-001**: Optimization completes in under 3 seconds (measure with DevTools Network tab)
- [ ] **SC-002**: Button appears within 500ms of page load (measure with Performance tab)
- [ ] **SC-003**: Button injection succeeds on first DOM query in 95% of page loads
- [ ] **SC-004**: Loading/error/success states are distinguishable within 1 second
- [ ] **SC-005**: Zero layout shift (no page jump when button appears)

## Debugging Tips

**Button doesn't appear**:
1. Open Console (F12) → Check for errors
2. Check selector: `document.querySelector('div[role="textbox"]')` should find input
3. Verify extension is loaded: Check chrome://extensions/

**Optimization fails silently**:
1. Open Console → Check for "API key is missing" errors
2. Verify Options page has valid API key
3. Check Network tab → Look for failed requests to OpenAI API

**Keyboard shortcut doesn't work**:
1. Verify focus is on ChatGPT page (not in DevTools)
2. Check Console for event listener errors
3. Test in incognito mode (extensions might be disabled)

## Cleanup

After testing:
1. Restore valid API configuration in Options page
2. Close test tabs
3. Optionally unload extension from chrome://extensions/

## Notes

- **NO automated tests** per Constitution Principle VIII
- Manual testing is REQUIRED before each commit
- Test on BOTH chatgpt.com and chat.openai.com
- Test on BOTH light and dark modes
- Test on BOTH Windows/Linux (Ctrl) and Mac (Cmd) if possible
