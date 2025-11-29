# Research: Multi-Site Button Injection

**Feature**: 002-multi-site-inject
**Date**: 2025-11-29

## Executive Summary

This document captures the technical research for extending the Prompt Optimizer button injection to manus.im and gemini.google.com. The research is based on user-provided HTML snapshots and analysis of the existing ChatGPT implementation.

---

## 1. Existing ChatGPT Implementation Analysis

### Current Architecture

The content script (`index.ts`) handles everything in a single file:
- Host gating (line 178): Only activates on `chatgpt.com` and `chat.openai.com`
- Selector map (lines 9-20): Returns site-specific selectors
- Input detection (`findPromptInput`): Iterates through selectors
- Button insertion (`insertButton`): Uses 4 strategy fallbacks

### Insertion Strategies (ChatGPT)

1. **Strategy 1**: Find `[data-testid="composer-plus-btn"]`, append to parent
2. **Strategy 2**: Find `[class*="grid-area:leading"]`, append to `span.flex` child
3. **Strategy 3**: Insert before target's parent
4. **Strategy 4**: Use `insertAdjacentElement('beforebegin')`

### Key Functions

| Function | Purpose | Reusable? |
|----------|---------|-----------|
| `selectorMap()` | Return selectors for host | No - site-specific |
| `findPromptInput()` | Find input element | Yes - generic |
| `getPromptValue()` | Read text from input | Mostly - textarea vs contenteditable |
| `setPromptValue()` | Write text to input | Mostly - textarea vs contenteditable |
| `insertButton()` | Insert button into DOM | No - site-specific strategies |
| `handleOptimize()` | Button click handler | Yes - fully reusable |
| `setLoading()` | Button loading state | Yes - fully reusable |
| `mount()` | Initialization | Partially - host gating is site-specific |

---

## 2. Manus.im DOM Analysis

### HTML Structure (user-provided)

```html
<div class="flex flex-col gap-3 rounded-[22px] ...">
  <!-- Input container -->
  <div class="overflow-y-auto pl-4 pr-2">
    <textarea
      placeholder="Assign a task or ask anything"
      rows="2"
      style="height: 46px;"
    ></textarea>
  </div>

  <!-- Action bar -->
  <div class="px-3 flex gap-2 item-center">
    <!-- Left group: plus button, integrations -->
    <div class="flex gap-2 items-center flex-shrink-0">
      <button class="rounded-full border ...">
        <!-- Plus SVG icon -->
      </button>
      <div class="flex items-center ...">
        <!-- Integration icons -->
      </div>
    </div>

    <!-- Right group: mic, send -->
    <div class="min-w-0 flex gap-2 ml-auto ...">
      <!-- Mic button, Send button -->
    </div>
  </div>
</div>
```

### Decisions

**Decision**: Input Selector
- **Chosen**: `textarea[placeholder*="Assign"]` as primary, `textarea` as fallback
- **Rationale**: Placeholder text is unique and less likely to change than class names
- **Alternatives**:
  - Class-based selectors rejected (Tailwind classes are generated/minified)
  - Container-based selectors rejected (more fragile)

**Decision**: Button Insertion Point
- **Chosen**: Insert into `.flex.gap-2.items-center.flex-shrink-0` (left button group)
- **Rationale**:
  - Places button near plus button (consistent with ChatGPT positioning)
  - Uses flex layout, so button fits naturally
- **Alternatives**:
  - Right button group rejected (too close to send button, might interfere)
  - Before textarea rejected (different visual pattern from ChatGPT)

**Decision**: Value Handling
- **Chosen**: Standard `textarea.value` get/set with `input` event dispatch
- **Rationale**: Standard HTML textarea, no special handling needed

### Manus Selectors & Fallback Strategies

```typescript
const MANUS_SELECTORS = {
  inputSelectors: [
    'textarea[placeholder*="Assign"]',
    'textarea[placeholder*="ask"]',
    'textarea'
  ]
};
```

#### Manus Button Insertion Strategy (4-level fallback)

1. **Strategy 1 - Precise insertion**: Find left button group and append after plus button
   ```
   Find: div.flex.gap-2.items-center.flex-shrink-0
   Then: Find first button.rounded-full and append after it
   ```

2. **Strategy 2 - Container insertion**: Append to left button group
   ```
   Find: div.flex.gap-2.items-center.flex-shrink-0
   Action: appendChild(button)
   ```

3. **Strategy 3 - Action bar insertion**: Append to entire action bar container
   ```
   Find: div.px-3.flex.gap-2
   Action: appendChild(button)
   ```

4. **Strategy 4 - Generic fallback**: Insert before textarea parent
   ```
   Find: textarea parent element
   Action: insertBefore(button, textarea)
   ```

**Rationale for fallbacks**:
- Strategy 1 breaks if plus button class changes
- Strategy 2 breaks if button group structure changes
- Strategy 3 breaks if action bar is restructured
- Strategy 4 is generic positioning (less ideal but always works)

---

## 3. Gemini DOM Analysis

### HTML Structure (user-provided)

```html
<div class="text-input-field ...">
  <!-- Text area wrapper -->
  <div class="text-input-field_textarea-wrapper">
    <div class="text-input-field-main-area">
      <div class="text-input-field_textarea-inner">
        <rich-textarea class="text-input-field_textarea ql-container ...">
          <div class="ql-editor textarea new-input-ui"
               contenteditable="true"
               role="textbox"
               aria-label="Enter a prompt here"
               data-placeholder="Ask Gemini">
            <p><br></p>
          </div>
          <div class="ql-clipboard" contenteditable="true" tabindex="-1"></div>
        </rich-textarea>
      </div>
    </div>
  </div>

  <!-- Leading actions: upload, tools -->
  <div class="leading-actions-wrapper ...">
    <uploader class="upload-button">
      <button mat-icon-button aria-label="Open upload file menu">
        <mat-icon fonticon="add_2"></mat-icon>
      </button>
    </uploader>
    <toolbox-drawer>
      <button class="toolbox-drawer-button">
        <span>Tools</span>
      </button>
    </toolbox-drawer>
  </div>

  <!-- Trailing actions: model picker, mic, send -->
  <div class="trailing-actions-wrapper">
    <!-- Model picker, mic button, send button -->
  </div>
</div>
```

### Decisions

**Decision**: Input Selector
- **Chosen**: `div.ql-editor[contenteditable="true"]` as primary
- **Rationale**:
  - Quill editor uses `.ql-editor` class (stable library convention)
  - `contenteditable` ensures we get the editable element
  - `role="textbox"` is too generic
- **Alternatives**:
  - `[aria-label*="prompt"]` - Could work but less reliable
  - `rich-textarea` custom element - Not the actual input

**Decision**: Button Insertion Point
- **Chosen**: Insert into `.leading-actions-wrapper` after uploader
- **Rationale**:
  - Consistent with ChatGPT (button near left side controls)
  - Angular Material buttons have consistent styling we can match
  - Separated from send button (right side)
- **Alternatives**:
  - Before rich-textarea rejected (breaks input layout)
  - In trailing-actions rejected (too crowded with model picker)

**Decision**: Value Handling
- **Chosen**: Custom getter/setter for Quill editor
- **Rationale**:
  - Quill stores content in `<p>` elements
  - Direct `textContent` works for reading
  - Setting may need Quill API or `innerHTML`
- **Implementation**:
  ```typescript
  getPromptValue(input: HTMLElement): string {
    return input.innerText?.trim() || '';
  }

  setPromptValue(input: HTMLElement, value: string): void {
    // Clear existing paragraphs and set new content
    input.innerHTML = `<p>${value}</p>`;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  ```

### Gemini Selectors & Fallback Strategies

```typescript
const GEMINI_SELECTORS = {
  inputSelectors: [
    'div.ql-editor[contenteditable="true"]',
    'div[role="textbox"][aria-label*="prompt"]',
    'div.ql-editor',
    'rich-textarea div[contenteditable="true"]'
  ]
};
```

#### Gemini Button Insertion Strategy (5-level fallback)

1. **Strategy 1 - Precise leading actions insertion**: Prepend to leading-actions-wrapper
   ```
   Find: div.leading-actions-wrapper
   Action: insertBefore(button, firstChild) to prepend
   ```

2. **Strategy 2 - Insert after upload button**: Find uploader and insert after it
   ```
   Find: uploader.upload-button or div.uploader-button-container
   Action: insertAfter(button) into parent.leading-actions-wrapper
   ```

3. **Strategy 3 - Container fallback**: Append to leading-actions-wrapper
   ```
   Find: div.leading-actions-wrapper
   Action: appendChild(button)
   ```

4. **Strategy 4 - Text input wrapper insertion**: Insert into text-input-field_textarea-wrapper
   ```
   Find: div.text-input-field_textarea-wrapper
   Action: insertAfter(rich-textarea)
   ```

5. **Strategy 5 - Generic fallback**: Insert before input container parent
   ```
   Find: ql-editor parent
   Action: insertBefore(button, parent)
   ```

**Rationale for fallbacks**:
- Strategy 1 breaks if leading-actions-wrapper is removed
- Strategy 2 breaks if uploader structure changes
- Strategy 3 works if wrapper exists but doesn't ensure good positioning
- Strategy 4 works if wrapper is still present
- Strategy 5 is generic positioning (less ideal but always works)

---

## 4. Theme Support Analysis

### ChatGPT
- **Detection**: `html.dark` class on document root
- **Button colors**: `#000000` (light) / `#ffffff` (dark)
- **Already implemented** in `content-script.css`

### Manus.im
- **Detection**: Uses CSS custom properties, no explicit dark mode class needed
- **Relevant variables**:
  - `--fill-input-chat` - Input background
  - `--border-main` - Border color
  - `--text-secondary` - Secondary text
  - `--icon-primary` - Icon color
- **Strategy**: Let button inherit from CSS variables or use neutral styling

### Gemini
- **Detection**: Google uses Material theming
- **Indicators**: Check for theme attributes or `data-theme` on body
- **Strategy**: Use neutral styling that works with both themes

### CSS Updates Needed

```css
/* Extend current CSS for multi-site */

/* Manus.im - uses rounded pill buttons */
[class*="manus"] .prompt-enhancer-btn,
textarea[placeholder*="Assign"] ~ * .prompt-enhancer-btn {
  border-radius: 9999px;
  border: 1px solid var(--border-main, rgba(0,0,0,0.1));
}

/* Gemini - uses Material-style buttons */
.leading-actions-wrapper .prompt-enhancer-btn,
rich-textarea ~ * .prompt-enhancer-btn {
  height: 40px;
  border-radius: 24px;
  font-family: 'Google Sans', sans-serif;
}
```

---

## 5. MutationObserver Considerations

### Issue
All three sites are SPAs that may:
1. Load input elements after initial page load
2. Replace DOM elements during navigation
3. Use lazy loading for UI components

### Current Solution (ChatGPT)
```typescript
const observer = new MutationObserver(() => {
  const found = findPromptInput();
  if (found) {
    insertButton(found);
    observer.disconnect();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
```

### Enhancements Needed

1. **Re-observe on URL change** (SPA navigation)
   ```typescript
   let lastUrl = location.href;
   new MutationObserver(() => {
     if (location.href !== lastUrl) {
       lastUrl = location.href;
       mount(); // Re-run mount on navigation
     }
   }).observe(document, { subtree: true, childList: true });
   ```

2. **Button removal detection** (if input is removed, button becomes orphaned)
   ```typescript
   if (!document.contains(button)) {
     mount(); // Re-inject if button was removed
   }
   ```

---

## 6. File Organization Recommendation

Based on the analysis, the recommended file structure:

```
extension/src/content/
├── index.ts                      # Entry point, host routing
├── button-styles.ts              # Unchanged
├── content-script.css            # Extended with Manus/Gemini rules
├── shared/
│   ├── types.ts                  # SiteHandler interface
│   ├── button-controller.ts      # createButton, handleOptimize, setLoading
│   └── prompt-utils.ts           # getPromptValue, setPromptValue (defaults)
└── sites/
    ├── chatgpt.ts                # ChatGPT handler (extracted from current)
    ├── manus.ts                  # Manus handler (new)
    └── gemini.ts                 # Gemini handler (new)
```

---

## 8. Comprehensive Fallback Strategy Matrix

### Fallback Strategy Philosophy

The extension should never fail to inject the button due to minor DOM changes. Each site has 4-5 fallback strategies organized by:

1. **Ideal** - Best UX placement near action buttons
2. **Good** - Container-based, fits naturally in layout
3. **Acceptable** - Different container, still functional
4. **Last Resort** - Generic positioning, less polished but works
5. **Emergency** (Gemini only) - Handles major restructuring

### Site Comparison: Strategy Count & Robustness

| Site | Strategies | Robustness | DOM Change Handling |
|------|-----------|-----------|-------------------|
| ChatGPT | 4 | High | Already proven in production |
| Manus | 4 | High | Simple Tailwind structure |
| Gemini | 5 | Very High | Handles Angular Material complexity |

**Gemini has 5 strategies** because it uses Angular Material with custom elements (`rich-textarea`, `uploader`, `mat-menu`) that may restructure more frequently.

### Strategy Success Logging

Each handler logs which strategy succeeded for debugging:

```typescript
// In SiteHandler base class
private logStrategySuccess(strategyNum: number, siteName: string): void {
  console.log(`[Prompt Optimizer] ${siteName}: Strategy ${strategyNum} succeeded`);
}
```

When site DOM changes, console shows which strategy the extension falls back to, helping identify when selectors need updating.

---

## 9. Implementation & Testing Strategy for Fallback Strategies

### Testing Each Fallback Strategy

For robustness, each handler should be tested manually on both "normal" and "degraded" DOM states:

#### Manus Testing Matrix

| Test Case | Scenario | Expected Result | Strategy |
|-----------|----------|-----------------|----------|
| Strategy 1 | Plus button exists, class intact | Button next to plus button | Primary |
| Strategy 2 | Plus button class changes | Button in left button group | Secondary |
| Strategy 3 | Action bar divs unchanged | Button in action bar | Tertiary |
| Strategy 4 | All above fail | Button before textarea | Fallback |
| SPA Nav | Full navigation cycle | Button re-injects correctly | All |

#### Gemini Testing Matrix

| Test Case | Scenario | Expected Result | Strategy |
|-----------|----------|-----------------|----------|
| Strategy 1 | leading-actions-wrapper exists | Button prepended to wrapper | Primary |
| Strategy 2 | Uploader class changes | Button after uploader | Secondary |
| Strategy 3 | Wrapper exists (append) | Button appended to wrapper | Tertiary |
| Strategy 4 | Text wrapper patterns change | Button near textarea wrapper | Fallback |
| Strategy 5 | All above fail | Button before input parent | Emergency |
| SPA Nav | Full navigation cycle | Button re-injects correctly | All |
| Theme Change | Light/dark toggle | Button styling adapts | CSS |

### Console Debugging Output

**Success case**:
```
[Prompt Optimizer] Manus.im: Strategy 1 succeeded
[Prompt Optimizer] Gemini: Strategy 2 succeeded
```

**Fallback case** (DOM changed):
```
[Prompt Optimizer] Gemini: Strategy 1 failed (no leading-actions-wrapper)
[Prompt Optimizer] Gemini: Strategy 2 failed (no uploader)
[Prompt Optimizer] Gemini: Strategy 3 succeeded
```

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Gemini Quill editor API changes | Low | High | Use innerText/innerHTML fallback |
| Manus DOM structure changes | Medium | Medium | Multiple fallback selectors (4 strategies) |
| Button styling conflicts | Low | Low | Use unique class, specific CSS selectors |
| SPA navigation breaks injection | Medium | High | URL change detection + re-mount |
| Selector fatigue | Low | Medium | Strategy 5 for Gemini handles major restructuring |

---

## Conclusion

The implementation is straightforward with moderate complexity:
1. **Manus**: Standard textarea, easy injection
2. **Gemini**: Quill editor needs custom value handling, but insertion is clean
3. **Refactoring**: Extract shared logic, create site handlers

No blocking issues identified. Ready for task generation.
