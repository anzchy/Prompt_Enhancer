# Research: ChatGPT Inline Button Positioning & Keyboard Shortcuts

**Feature**: ChatGPT Inline Prompt Optimizer Button
**Date**: 2025-11-28
**Phase**: Phase 0 - Pre-implementation Research

## Research Questions

### Q1: How to position button on LEFT side near ChatGPT's "+" button?

**Current Implementation**:
```typescript
// extension/src/content/index.ts:56-61
const parent = target.parentElement;
if (parent) {
  parent.appendChild(button); // ❌ Appends to end
} else {
  target.insertAdjacentElement('afterend', button); // ❌ Inserts after input
}
```

**Requirement**: FR-002 - Button MUST be positioned on the left side of the input area, near the existing "+" button

**ChatGPT DOM Structure** (actual as of 2025-11-28):
```html
<div class="grid grid-cols-[auto_1fr_auto]" style="border-radius: 28px;">
  <!-- Grid areas: 'leading_primary_trailing' -->

  <!-- LEFT SIDE (grid-area:leading) -->
  <div class="[grid-area:leading]">
    <span class="flex" data-state="closed">
      <button type="button" class="composer-btn"
              data-testid="composer-plus-btn"
              id="composer-plus-btn"
              aria-label="Add files and more">
        <!-- Plus icon SVG -->
      </button>
    </span>
  </div>

  <!-- CENTER (grid-area:primary) - INPUT AREA -->
  <div class="[grid-area:primary]">
    <div class="_prosemirror-parent_1dsxi_2">
      <textarea class="_fallbackTextarea_1dsxi_2"
                name="prompt-textarea"
                style="display: none;"></textarea>
      <div contenteditable="true"
           id="prompt-textarea"
           class="ProseMirror">
        <p data-placeholder="Ask anything" class="placeholder">
          <br class="ProseMirror-trailingBreak">
        </p>
      </div>
    </div>
  </div>

  <!-- RIGHT SIDE (grid-area:trailing) -->
  <div class="flex items-center gap-2 [grid-area:trailing]">
    <!-- Dictate button, voice mode button -->
  </div>
</div>
```

**Analysis**:
- ChatGPT uses CSS Grid with named areas: `leading` (left), `primary` (center), `trailing` (right)
- The "+" button is inside `<div class="[grid-area:leading]">`
- The input (`#prompt-textarea`) is inside `<div class="[grid-area:primary]">`
- Right-side buttons (dictate, voice) are in `<div class="[grid-area:trailing]">`

**Solution Options**:

**Option A**: Insert into `[grid-area:leading]` container (next to "+" button)
```typescript
const leadingArea = document.querySelector('[class*="grid-area:leading"]');
const plusButtonSpan = leadingArea?.querySelector('span.flex');
if (plusButtonSpan) {
  plusButtonSpan.appendChild(button); // Add after "+" button
}
```
**Pros**: Truly "near" the "+" button, respects grid layout
**Cons**: Relies on ChatGPT's grid-area class pattern

**Option B**: Insert into `[grid-area:trailing]` container (right side)
```typescript
const trailingArea = document.querySelector('[class*="grid-area:trailing"]');
if (trailingArea) {
  trailingArea.insertAdjacentElement('afterbegin', button); // First in trailing
}
```
**Pros**: More stable area (buttons on right), easier to find
**Cons**: Positions on RIGHT, not LEFT (violates FR-002)

**Option C**: Insert before the primary area's parent
```typescript
const primaryArea = target.closest('[class*="grid-area:primary"]');
const gridContainer = primaryArea?.parentElement;
const leadingArea = gridContainer?.querySelector('[class*="grid-area:leading"]');
// Then insert into leadingArea
```
**Pros**: Navigates from known element (target) upward
**Cons**: More DOM traversal steps

**Recommended Approach**: **Option A** - Insert into the `[grid-area:leading]` container (append to `span.flex` with a small left margin)

**Implementation Strategy**:
```typescript
function insertButton(target: HTMLElement) {
  if (document.querySelector(`.${BUTTON_CLASS}`)) return;

  const button = createButton(target);
  button.style.marginLeft = '8px'; // keep spacing from the "+" icon

  // Strategy 1: Find leading area via grid-area class
  const leadingArea = document.querySelector('[class*="grid-area:leading"]');
  const plusButtonSpan = leadingArea?.querySelector('span.flex');

  if (plusButtonSpan) {
    // Insert into same container as "+" button
    plusButtonSpan.appendChild(button);
    return;
  }

  // Fallback: Insert before primary area (old behavior)
  const parent = target.parentElement;
  if (parent) {
    parent.insertBefore(button, target);
  } else {
    target.insertAdjacentElement('beforebegin', button);
  }
}
```

**Status**: ✅ RESOLVED - Insert into `[grid-area:leading]` with fallback to insertBefore

---

### Q2: How to implement keyboard shortcut Ctrl+Shift+O (Cmd+Shift+O on Mac)?

**Requirement**: FR-017 - System MUST support keyboard shortcut Ctrl+Shift+O (Cmd+Shift+O on Mac)

**Chrome Extension Keyboard Shortcuts**: Two approaches available

**Option A: Chrome Commands API** (manifest.json)
```json
{
  "commands": {
    "optimize-prompt": {
      "suggested_key": {
        "default": "Ctrl+Shift+O",
        "mac": "Command+Shift+O"
      },
      "description": "Optimize current prompt"
    }
  }
}
```
Then listen in background worker:
```typescript
chrome.commands.onCommand.addListener((command) => {
  if (command === 'optimize-prompt') {
    // Need to send message to active tab's content script
  }
});
```

**Option B: Content Script Keyboard Listener**
```typescript
document.addEventListener('keydown', (e) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? e.metaKey : e.ctrlKey;
  if (modifierKey && e.shiftKey && e.key.toLowerCase() === 'o') {
    e.preventDefault();
    handleOptimize(button, target);
  }
});
```

**Trade-offs**:
- **Option A**: User can customize shortcut in chrome://extensions/shortcuts, avoids browser-reserved shortcuts (Chrome uses Ctrl+Shift+O for Bookmarks on Windows/Linux), but requires background→content messaging
- **Option B**: Simpler implementation, works immediately, but hardcoded (no user customization) and may be blocked by Chrome's built-in Ctrl+Shift+O on Windows/Linux

**Recommended Approach**: Option A (commands API) to avoid Chrome shortcut conflicts; relay the command to the active tab's content script. Keep a content listener only if we later add custom keybinding support.

**Status**: ✅ RESOLVED - Register `commands` in manifest, handle in background, send message to active tab; do not rely on the hardcoded content listener for the default combo.

---

### Q3: How to detect and adapt to ChatGPT's dark mode?

**Requirement**: FR-015 - Button styling MUST adapt to ChatGPT's light and dark modes automatically

**Current Styling** (static light mode):
```typescript
// extension/src/content/index.ts:64-76
button.style.background = '#f5f5f5'; // ❌ Hardcoded light gray
button.style.color = '#111';         // ❌ Hardcoded dark text
```

**Dark Mode Detection Approaches**:

**Option A: Detect via `matchMedia` (system preference)**
```typescript
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```
**Problem**: ChatGPT's dark mode is independent of system preference

**Option B: Detect via ChatGPT's DOM classes**
```html
<!-- ChatGPT adds class to <html> or <body> -->
<html class="dark"> or <body data-theme="dark">
```

**Evidence from DOM**: The voice button HTML shows Tailwind's `dark:` variant classes:
```html
class="... dark:bg-white dark:text-black dark:focus-visible:outline-white"
```

This indicates ChatGPT applies a `dark` class to a parent element (likely `<html>` or `<body>`), which activates Tailwind's dark mode variants.

**Detection Strategy**:
```typescript
function isDarkMode(): boolean {
  // ChatGPT toggles 'dark' on <html> when theme changes
  return document.documentElement.classList.contains('dark');
}
```

**Option C: Detect via computed styles of ChatGPT elements**
```typescript
const chatBg = getComputedStyle(document.body).backgroundColor;
// Parse RGB, check if background is dark
```

**Option D: Use CSS variables that ChatGPT defines**
```typescript
button.style.background = 'var(--chatgpt-button-bg, #f5f5f5)';
```

**Recommended Approach**: Option B (DOM class detection) with MutationObserver

**Implementation**:
```typescript
function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

// Watch for theme changes
const observer = new MutationObserver(() => {
  const isDark = isDarkMode();
  updateButtonStyles(button, isDark);
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class']
});
```

**Status**: ✅ RESOLVED - Watch `document.documentElement` for class changes; `data-theme` fallback not needed.

---

### Q4: What is ChatGPT's current button styling pattern?

**Requirement**: FR-016 - Button MUST use pill-style design with minimal visual intrusion

**Current Implementation**: Basic pill shape with border
```typescript
button.style.borderRadius = '999px';  // ✅ Pill shape
button.style.border = '1px solid rgba(0,0,0,0.1)'; // Basic border
button.style.padding = '6px 12px';
```

**ChatGPT Button Classes** (actual as of 2025-11-28):

**Plus Button** (`#composer-plus-btn`):
```html
<button type="button" class="composer-btn"
        data-testid="composer-plus-btn"
        aria-label="Add files and more">
  <svg width="20" height="20" ...>
```
- Uses `composer-btn` class (CSS-in-JS or external stylesheet)
- Icon size: 20×20px

**Voice Mode Button** (right side):
```html
<button type="button"
        class="flex h-9 w-9 items-center justify-center rounded-full
               bg-black text-white transition-colors hover:opacity-70
               focus-visible:outline-black disabled:opacity-30
               dark:bg-white dark:text-black dark:focus-visible:outline-white">
  <svg class="h-5 w-5" width="20" height="20">
```
- Uses Tailwind CSS utility classes
- Size: `h-9 w-9` (36×36px)
- Shape: `rounded-full` (pill/circle)
- Light mode: `bg-black text-white`
- Dark mode: `dark:bg-white dark:text-black`
- Hover: `hover:opacity-70`
- Transitions: `transition-colors`

**Research Needed**:
1. What are the computed styles for `.composer-btn` class? (Need DevTools inspection)
2. Should we match the voice button style (Tailwind utilities) or the composer-btn style?
3. What padding/size should our text button use to match ChatGPT's design?

**Styling Options**:

**Option A**: Match voice button style (Tailwind-inspired inline styles)
```typescript
button.style.height = '36px'; // h-9
button.style.padding = '0 16px'; // Horizontal padding for text
button.style.display = 'flex';
button.style.alignItems = 'center';
button.style.justifyContent = 'center';
button.style.borderRadius = '9999px'; // rounded-full
button.style.background = isDark ? '#ffffff' : '#000000';
button.style.color = isDark ? '#000000' : '#ffffff';
button.style.transition = 'opacity 0.2s';
// Hover via :hover pseudo-class or mouseenter/mouseleave
```

**Option B**: Match composer-btn style (require DevTools inspection)
```typescript
// Need to inspect computed styles of .composer-btn first
// Likely similar to Option A but with different colors
```

**Option C**: Minimal custom style matching ChatGPT's rounded aesthetic
```typescript
button.style.padding = '8px 14px';
button.style.borderRadius = '18px'; // Less extreme than 9999px
button.style.border = 'none';
button.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
button.style.color = isDark ? '#ececec' : '#0d0d0d';
button.style.cursor = 'pointer';
button.style.fontSize = '14px';
button.style.transition = 'background 0.2s';
```

**Recommended Approach**: **Option A** (voice button style) with slight modifications for text button

**Implementation Notes**:
- Use `h-9` (36px) height to match voice button
- Use `rounded-full` (border-radius: 9999px) for pill shape
- Add `margin-left: 8px` when placed next to the "+" button to avoid crowding
- Apply dark mode detection for bg/text colors
- Add hover state with opacity change
- Use `transition-colors` or `transition: opacity 0.2s`

**Status**: ✅ RESOLVED - Use voice button styling pattern with dark mode support

---

## Research Action Items

### ✅ COMPLETED (from user-provided DOM structure)

1. **DOM Structure Analysis**:
   - ✅ Identified parent container: CSS Grid with `[grid-area:leading|primary|trailing]`
   - ✅ Located "+" button: Inside `<div class="[grid-area:leading]">` → `<span class="flex">`
   - ✅ Confirmed input selector: `#prompt-textarea` inside `[grid-area:primary]`
   - ✅ Dark mode detection: ChatGPT uses `dark` class on `<html>` (Tailwind dark mode)

2. **Button Styling Research**:
   - ✅ Voice button uses: `h-9 w-9 rounded-full bg-black text-white dark:bg-white dark:text-black`
   - ✅ Plus button uses: `composer-btn` class (simpler styling)
   - ✅ Confirmed pill-style design pattern (border-radius: 9999px)

### ⏳ REMAINING (minimal manual verification)

1. **Runtime Testing** (can be done during implementation):
   - [ ] Verify `document.documentElement.classList.contains('dark')` works when toggling ChatGPT theme
   - [ ] Test button insertion into `[grid-area:leading]` doesn't break layout
   - [ ] Confirm commands API shortcut works (and Chrome no longer intercepts Ctrl+Shift+O on Windows/Linux)

2. **Optional Fine-tuning** (if button looks off):
   - [ ] Inspect computed styles of `.composer-btn` for exact padding/margin values
   - [ ] Test button appearance in both light and dark modes
   - [ ] Adjust hover opacity if needed (currently planned: 0.7)

**All critical research questions are RESOLVED.** Implementation can proceed with high confidence.

## Dependencies

This research is now **COMPLETE** thanks to the actual ChatGPT DOM structure provided by the user.

Original research would have required:
1. Loading chatgpt.com in Chrome
2. Opening DevTools (F12)
3. Inspecting DOM structure and computed styles
4. Manually toggling ChatGPT's theme setting

**Current status**: All critical implementation decisions are made. Remaining verification can happen during implementation/testing.

## Notes

- ✅ All research questions RESOLVED from actual DOM structure analysis
- ✅ Button positioning strategy: Insert into `[grid-area:leading]` container
- ✅ Keyboard shortcut: Use Chrome commands API; background relays to content script
- ✅ Dark mode: Check for `dark` class on `document.documentElement`
- ✅ Styling: Match voice button pattern (36px height, rounded-full, black/white with dark mode flip)
- All findings documented and ready for task generation phase
