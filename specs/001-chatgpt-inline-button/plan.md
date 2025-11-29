# Implementation Plan: ChatGPT Inline Prompt Optimizer Button

**Branch**: `001-chatgpt-inline-button` | **Date**: 2025-11-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-chatgpt-inline-button/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature enhances the existing Chrome MV3 extension by improving the inline button injection for ChatGPT. The extension already has a working MVP with:
- Content script that injects "优化指令" button into chat interfaces
- Background service worker that handles LLM API calls
- Message passing infrastructure between content and background
- Configuration management via Options page

The new feature requirements focus on:
1. **Improved button positioning**: Move button to left side near ChatGPT's "+" button (currently appends after input)
2. **Keyboard shortcut support**: Add Ctrl+Shift+O (Cmd+Shift+O on Mac) to trigger optimization
3. **Dark mode adaptation**: Button styling must adapt to ChatGPT's light/dark themes automatically
4. **Better button styling**: Implement pill-style design matching ChatGPT's UI patterns

Technical approach: Enhance existing `extension/src/content/index.ts` with improved DOM insertion logic, register Chrome commands API for keyboard shortcuts (background relays to content), and implement CSS-in-JS dark mode detection.

## Technical Context

**Language/Version**: TypeScript targeting ES2020 (pure client-side, no backend)
**Primary Dependencies**: esbuild 0.23.0 (bundler only - no runtime dependencies)
**Storage**: chrome.storage.local (API keys), chrome.storage.sync (config)
**Testing**: Node.js built-in test runner for pure functions; manual testing for UI/Chrome APIs (per Constitution Principle VIII)
**Target Platform**: Chrome MV3 Extensions (Chrome 88+)
**Project Type**: Browser Extension (Chrome-only, desktop-focused)
**Performance Goals**: Button injection within 500ms, optimization API call 1-3 seconds
**Constraints**: <200KB bundle size, no layout shift on injection, graceful degradation on DOM changes
**Scale/Scope**: Single-user prototype, ChatGPT-only (Gemini/Manus deferred to v0.2)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Client-Side Only Architecture
- All code executes in extension sandbox (content script, background worker, options page)
- No backend services, no server deployments
- Deployable by loading unpacked `dist/` directory
- **Status**: PASS - feature only modifies client-side content script and manifest

### ✅ Principle II: Module Isolation by Domain
- Content script changes stay in `extension/src/content/`
- Shared utilities stay in `extension/src/shared/`
- No mixing of background/content/popup logic
- **Status**: PASS - button positioning and keyboard listener belong in content/, no cross-domain pollution

### ✅ Principle III: API Key Security (NON-NEGOTIABLE)
- API keys stored in chrome.storage.local only (existing implementation)
- No changes to security model in this feature
- **Status**: PASS - no modifications to config.ts or security infrastructure

### ✅ Principle IV: Progressive Enhancement for DOM Integration
- Must use centralized `selectorMap()` function (already exists)
- Must support immediate mount + MutationObserver fallback (already exists)
- Button position update requires DOM insertion logic changes only
- **Status**: PASS - enhances existing graceful degradation pattern

### ✅ Principle V: User Feedback for Async Operations
- Existing button shows loading states ("优化中…")
- No changes to feedback mechanism needed
- **Status**: PASS - no modifications to async feedback patterns

### ✅ Principle VI: Configuration Flexibility
- No new configuration required
- Keyboard shortcut registered via Chrome commands API (default Ctrl+Shift+O / Cmd+Shift+O, user-overridable in chrome://extensions/shortcuts)
- **Status**: PASS - no config changes

### ✅ Principle VII: Minimal External Dependencies
- No new dependencies required
- Pure vanilla TypeScript + Chrome APIs
- **Status**: PASS - feature uses existing dependencies only

### ✅ Principle VIII: Lightweight Testing for Pure Functions
- Pure function tests using Node.js built-in test runner (zero dependencies)
- Tests for isDarkMode(), selector logic, message validation
- Manual testing for all UI and Chrome API interactions
- **Status**: PASS - feature includes tests for pure utility functions only

**Constitution Compliance**: ALL CHECKS PASSED ✅

## Project Structure

### Documentation (this feature)

```text
specs/001-chatgpt-inline-button/
├── spec.md              # Feature specification (DONE)
├── plan.md              # This file
├── research.md          # Phase 0: DOM structure analysis (NEXT)
├── data-model.md        # Phase 1: Button state model (minimal)
├── contracts/           # Phase 1: Message protocol (no changes needed)
│   └── notes.md         # Documents existing OPTIMIZE_PROMPT message
├── quickstart.md        # Phase 1: Manual testing guide
└── tasks.md             # Phase 2: Generated by /speckit.tasks (NOT by /speckit.plan)
```

### Source Code (repository root)

```text
extension/
├── manifest.json                    # Chrome MV3 manifest (add commands API)
├── package.json                     # Dependencies (no changes)
├── tsconfig.json                    # TypeScript config (no changes)
├── scripts/
│   └── build.js                     # esbuild bundler (no changes)
├── test/                            # NEW: Pure function tests (Node.js built-in test runner)
│   ├── button-styles.test.js        # Tests for isDarkMode(), color logic
│   ├── selectors.test.js            # Tests for selector priority
│   └── messages.test.js             # Tests for message validation
└── src/
    ├── background/
    │   └── index.ts                 # MODIFY: Add keyboard shortcut command listener and relay to content
    ├── content/
    │   ├── index.ts                 # MODIFY: Button positioning, keyboard listener, dark mode
    │   └── button-styles.ts         # NEW: Centralized button styling logic
    ├── popup/
    │   ├── index.html               # Popup UI (no changes)
    │   └── index.ts                 # Popup logic (no changes)
    ├── options/
    │   ├── index.html               # Options UI (no changes)
    │   └── index.ts                 # Options logic (no changes)
    ├── shared/
    │   ├── config.ts                # Config management (no changes)
    │   ├── llm.ts                   # LLM API client (no changes)
    │   └── messages.ts              # Message protocol (no changes)
    └── types.d.ts                   # Type definitions (may add Chrome commands)
```

**Structure Decision**: Single browser extension project with domain-isolated modules. The existing structure already follows Constitution Principle II (Module Isolation). This feature only modifies `content/` module (button injection logic) and `manifest.json` (keyboard shortcut registration via commands API).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All changes align with constitutional principles.

---

## Planning Status

**Phase 0 - Research**: ✅ COMPLETE
- [research.md](./research.md) - DOM structure analysis, keyboard shortcut approaches, dark mode detection

**Phase 1 - Design Artifacts**: ✅ COMPLETE
- [data-model.md](./data-model.md) - Button state model, keyboard config, dark mode state
- [contracts/notes.md](./contracts/notes.md) - Existing OPTIMIZE_PROMPT protocol documentation
- [quickstart.md](./quickstart.md) - Manual testing guide with 10 test scenarios

**Phase 2 - Task Generation**: ⏳ NEXT STEP
- Run `/speckit.tasks` to generate [tasks.md](./tasks.md) based on user stories from spec.md

## Next Steps

1. Run `/speckit.tasks` to generate actionable task list
2. Tasks will be organized by user story priority (P1 → P2 → P3)
3. Each task will map to specific files in `extension/src/content/`
4. Manual testing using quickstart.md after implementation

## Key Design Decisions

1. **Button Positioning**: Insert into `[grid-area:leading]` container (same area as ChatGPT's "+" button)
   - Primary: Find `div[class*="grid-area:leading"]` and append to the `span.flex` inside
   - Fallback: Use `insertBefore(button, target)` if grid-area not found

2. **Keyboard Shortcut**: Chrome commands API (single source of truth)
   - Default binding: Ctrl+Shift+O / Cmd+Shift+O (user-overridable in chrome://extensions/shortcuts)
   - Background listens for `optimize-prompt` command and relays to active tab content script to trigger `handleOptimize()`

3. **Dark Mode**: Check for `dark` class on `document.documentElement`
   - ChatGPT uses Tailwind's dark mode (class-based strategy)
   - Use MutationObserver to watch for theme changes

4. **Styling**: Match ChatGPT's voice button pattern
   - Height: 36px (h-9 in Tailwind)
   - Border radius: 9999px (rounded-full)
   - Light mode: `bg-black text-white`
   - Dark mode: `bg-white text-black`
   - Hover: `opacity: 0.7`

All design decisions prioritize simplicity and align with Constitution Principle VII (Minimal External Dependencies).

## Host & Selector Assumptions

- Host gating: Inject only on `https://chatgpt.com/*` and `https://chat.openai.com/*` (existing permissions; content script should no-op elsewhere).
- Input selector priority: `div[role="textbox"]` (ProseMirror) as primary, fallback to `textarea[placeholder*="Message"]` per spec FR-003.
- Button placement anchor: `[class*="grid-area:leading"] > span.flex` (same container as "+"); fallback to `insertBefore` near the input if anchor missing.

**Research Status**: ✅ COMPLETE - Actual ChatGPT DOM structure analyzed, all implementation strategies finalized.
