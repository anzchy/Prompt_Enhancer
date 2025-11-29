---

description: "Task list for multi-site button injection support (ChatGPT, Manus, Gemini)"
---

# Tasks: Multi-Site Button Injection Support

**Input**: Design documents from `/specs/002-multi-site-inject/`
**Prerequisites**: plan.md, spec.md, research.md
**Status**: Actionable tasks for implementation

**Tests**: No automated tests. Manual testing checklist included at end.

**Organization**: Tasks grouped by user story + code refactoring phase. Each user story (Manus, Gemini) can be completed independently after foundational refactoring.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1=Manus, US2=Gemini, US3=Code Reorganization)
- Include exact file paths

## Path Conventions

- `extension/src/content/` - Content script source directory
- `extension/src/content/sites/` - Site-specific handlers (new)
- `extension/src/content/shared/` - Shared utilities (new)
- `extension/dist/` - Build output

---

## Phase 1: Setup & Refactoring Foundation

**Purpose**: Extract shared logic and establish site handler pattern

**⚠️ CRITICAL**: This phase must complete before new site implementations

- [ ] T001 Create `extension/src/content/shared/` directory structure
- [ ] T002 [P] Extract `getPromptValue()` to `extension/src/content/shared/prompt-utils.ts`
- [ ] T003 [P] Extract `setPromptValue()` to `extension/src/content/shared/prompt-utils.ts`
- [ ] T004 [P] Create `extension/src/content/shared/types.ts` with `SiteHandler` interface
- [ ] T005 Create `extension/src/content/sites/` directory structure
- [ ] T006 Create `extension/src/content/shared/button-controller.ts` with extracted shared functions:
  - Extract `handleOptimize()` from current index.ts → button-controller.ts (responsible for sending optimization request to background, updating UI with result)
  - Extract `setLoading()` from current index.ts → button-controller.ts (manages button disabled state and text during async operations)
  - Create new `createButton()` function in button-controller.ts (creates button element with class and event listener)
- [ ] T007 [P] Add shared MutationObserver helper to prevent duplicate buttons and support re-mount after SPA navigation
- [ ] T008 Confirm `extension/manifest.json` includes host permissions for `https://manus.im/*` and `https://gemini.google.com/*` (add if missing)

**Checkpoint**: Shared infrastructure ready, base SiteHandler pattern established

---

## Phase 2: Foundational - Refactor ChatGPT to Handler Pattern

**Purpose**: Establish the ChatGPT handler as reference implementation for new sites

**Goal**: ChatGPT still works after refactoring with new handler pattern and shared controller

**Independent Test**:
- Load extension on chatgpt.com
- Verify button appears and functions identically to before refactoring
- Verify console logs show "Strategy 1 succeeded"

### Implementation for ChatGPT Refactoring

- [ ] T010 Create `extension/src/content/sites/chatgpt.ts` implementing `SiteHandler` interface
- [ ] T011 [P] [US3] Implement ChatGPT input selectors in chatgpt.ts:
  - `div[role="textbox"]`
  - `#prompt-textarea`
  - `textarea[placeholder*="Message"]`
- [ ] T012 [P] [US3] Implement ChatGPT insertion strategies in chatgpt.ts (4 strategies):
  - Strategy 1: `[data-testid="composer-plus-btn"]` → append to parent
  - Strategy 2: `[class*="grid-area:leading"]` → append to span.flex
  - Strategy 3: Insert before target's parent
  - Strategy 4: `insertAdjacentElement('beforebegin')`
- [ ] T013 [US3] Add console logging for strategy success/failure in chatgpt.ts
- [ ] T014 Update `extension/src/content/index.ts` to:
  - Import ChatGptHandler
  - Route to appropriate handler based on window.location.host
  - Remove old `selectorMap()`, `insertButton()` logic
  - Keep `handleOptimize()`, `setLoading()` calls the shared button-controller version (uniform states/shortcut)
- [ ] T015 Update `extension/src/content/index.ts` host gating to support all 3 sites:
  - chatgpt.com / chat.openai.com
  - manus.im
  - gemini.google.com
- [ ] T016 Verify ChatGPT still works after refactoring (manual test)

**Checkpoint**: ChatGPT refactored to handler pattern, still fully functional

---

## Phase 3: User Story 1 - Optimize Prompt on Manus.im (Priority: P1)

**Goal**: Button injection support for manus.im with selector priority and anchored insertion

**Independent Test**:
- Load extension on manus.im chat page
- Verify button appears near plus button or in button group
- Type prompt, click button, verify optimization works
- Verify console logs show which strategy succeeded (ideally Strategy 1)

### Implementation for Manus.im Support

- [ ] T017 [P] [US1] Create `extension/src/content/sites/manus.ts` implementing `SiteHandler`
- [ ] T018 [P] [US1] Implement Manus input selectors with priority order:
  - `textarea[placeholder="Assign a task or ask anything"]` ← exact match, current stable placeholder
  - `textarea[placeholder*="Assign"]` ← partial match, handles placeholder text variations
  - `textarea[placeholder*="ask"]` ← partial match, case-insensitive fallback
  - `textarea` ← generic fallback, will match any textarea (least specific, always succeeds)
  - **Note**: Use CSS partial match `*=` for robustness; if placeholder text changes (e.g., i18n or UI update), selectors 2-4 will catch it before falling back to generic textarea
- [ ] T019 [US1] Implement Manus insertion primary:
  - Find `.flex.gap-2.items-center.flex-shrink-0`
  - Locate first `button.rounded-full` (plus)
  - Insert button after plus (with spacing)
- [ ] T020 [US1] Implement Manus insertion secondary:
  - Find `.flex.gap-2.items-center.flex-shrink-0`
  - Append button as last child
- [ ] T021 [US1] Implement Manus insertion tertiary:
  - Find `.px-3.flex.gap-2` (action bar)
  - Append button as last child
- [ ] T022 [US1] Implement Manus insertion fallback:
  - Insert before textarea parent
- [ ] T023 [US1] Add console logging for each strategy attempt/success in manus.ts
- [ ] T024 [US1] Override `getPromptValue()` and `setPromptValue()` if needed for Manus (likely not needed - standard textarea)
- [ ] T025 [US1] Update `extension/src/content/index.ts` to import and use ManusHandler
- [ ] T026 [US1] Test button injection on manus.im (manual):
  - Strategy 1: Verify button appears next to plus button
  - Strategy 2+: Test with DevTools to simulate DOM changes, verify fallbacks work

**Checkpoint**: Manus.im support complete with 4-level fallback strategy

---

## Phase 4: User Story 2 - Optimize Prompt on Gemini (Priority: P1)

**Goal**: Button injection support for gemini.google.com with selector priority and anchored insertion

**Independent Test**:
- Load extension on gemini.google.com chat page
- Verify button appears in leading actions area
- Type prompt, click button, verify optimization works
- Verify console logs show which strategy succeeded (ideally Strategy 1)

### Implementation for Gemini Support

- [ ] T027 [P] [US2] Create `extension/src/content/sites/gemini.ts` implementing `SiteHandler`
- [ ] T028 [P] [US2] Implement Gemini input selectors with priority order:
  - `.ql-editor.textarea[contenteditable="true"][data-placeholder="Ask Gemini"]`
  - `div[role="textbox"][aria-label*="Enter a prompt here"]`
  - `div.ql-editor[contenteditable="true"]`
  - `rich-textarea div[contenteditable="true"]`
- [ ] T029 [US2] Implement Gemini insertion primary:
  - Find `.leading-actions-wrapper`
  - Insert after upload button (or prepend if upload absent)
- [ ] T030 [US2] Implement Gemini insertion secondary:
  - Find `.leading-actions-wrapper`
  - Append button as last child
- [ ] T031 [US2] Implement Gemini insertion fallback 1:
  - Find `.text-input-field_textarea-wrapper`
  - Insert after `rich-textarea`
- [ ] T032 [US2] Implement Gemini insertion fallback 2:
  - Insert before ql-editor parent element
- [ ] T034 [US2] Override `getPromptValue()` for Gemini Quill editor:
  - Use textContent/innerText to read current prompt (trim whitespace)
- [ ] T035 [US2] Override `setPromptValue()` for Gemini Quill editor:
  - Update innerHTML/text with optimized content (preserve simple paragraph)
  - Dispatch `input` (and/or `change`) event so Gemini registers the change
- [ ] T036 [US2] Add console logging for each strategy attempt/success in gemini.ts
- [ ] T037 [US2] Update `extension/src/content/index.ts` to import and use GeminiHandler
- [ ] T038 [US2] Test button injection on gemini.google.com (manual):
  - Strategy 1: Verify button appears in leading actions
  - Strategy 2+: Test with DevTools to simulate DOM changes, verify fallbacks work
  - Verify Quill editor value read/write works correctly

**Checkpoint**: Gemini support complete with 5-level fallback strategy, Quill editor integration working

---

## Phase 5: User Story 3 - Code Reorganization & Maintainability (Priority: P2)

**Goal**: Clean up index.ts, finalize site handler pattern, enable easy future site additions

**Independent Test**:
- All 3 sites still work: ChatGPT, Manus, Gemini
- Console logs show appropriate strategy for each site
- Adding a new site requires only: create `extension/src/content/sites/newsite.ts` + import in index.ts

### Implementation for Code Organization

- [ ] T039 [US3] Clean up `extension/src/content/index.ts`:
  - Remove old `selectorMap()` function
  - Remove old `insertButton()` logic
  - Keep only: mount(), MutationObserver setup, keyboard shortcut handler
  - Delegate input finding and button injection to handlers
- [ ] T040 [US3] Create handler registry/selector in index.ts:
  - Array of handlers with host patterns
  - Select appropriate handler based on `window.location.host`
  - Fall back to generic handler if no match
- [ ] T041 [US3] Add re-injection logic for SPA navigation (per site):
  - Detect URL changes via MutationObserver
  - Re-run mount() when URL changes (for Gemini, Manus SPA navigation)
- [ ] T042 [US3] Add button cleanup logic to avoid duplicates:
  - Remove orphaned button if input field is removed
  - Re-inject if needed on next mount
- [ ] T043 [US3] Update `extension/src/content/content-script.css`:
  - Ensure button styles work across all 3 sites
  - Add theme support for Manus (CSS variables) and Gemini (Material)
  - Test all 3 sites for consistent button appearance
- [ ] T044 [US3] Create documentation in `extension/AGENTS.md`:
  - How to add support for a new site (copy Manus handler as template)
  - Site handler interface requirements
  - Strategy pattern explanation
  - Fallback strategy testing approach
- [ ] T045 [US3] Final integration test (manual):
  - ChatGPT: Button appears and functions
  - Manus: Button appears and functions
  - Gemini: Button appears and functions
  - All 3: Dark mode detection works
  - All 3: Keyboard shortcut (Cmd/Ctrl+Shift+O) triggers optimization

**Checkpoint**: Code reorganization complete, extension ready for future site additions

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T046 [P] Review all console logs for clarity and consistency:
  - Format: `[Prompt Optimizer] {SITE}: Strategy {N} {status}`
  - Update any inconsistent logs
- [ ] T047 [P] Verify no API keys exposed in error messages or logs
- [ ] T048 Update `CLAUDE.md` architecture section with new site handler pattern
- [ ] T049 Run through extension/README.md manually:
  - Verify installation instructions still accurate
  - Update supported sites list
- [ ] T050 Build extension and verify dist/ output:
  - `npm run build` in extension/
  - Verify all 4 entry points bundled: background, content-script, popup, options
- [ ] T051 Load unpacked extension and test all 3 sites one final time:
  - ChatGPT: Cold load → button appears within 2s
  - Manus: Cold load → button appears within 2s
  - Gemini: Cold load → button appears within 2s
- [ ] T052 Test dark mode toggle on each site (if applicable)
- [ ] T053 Test keyboard shortcut on each site
- [ ] T054 Verify button styling is consistent across sites
- [ ] T055 Check console for any errors or warnings

**Checkpoint**: Extension fully tested and ready for release

---

## Manual Testing Checklist

### Pre-Implementation
- [ ] Baseline: ChatGPT button works on current codebase
- [ ] DevTools open: Observe console logs during testing

### After Phase 1 (Refactoring Foundation)
- [ ] ChatGPT still injects button (refactored code)
- [ ] Console shows: `[Prompt Optimizer] ChatGPT: Strategy 1 succeeded`

### After Phase 2 (ChatGPT Handler Pattern)
- [ ] ChatGPT still fully functional
- [ ] All 4 ChatGPT strategies confirmed working

### After Phase 3 (Manus Support)
- [ ] Visit manus.im chat page
- [ ] Button appears (ideally next to plus button, or in button group)
- [ ] Type prompt → click button → verify optimization happens
- [ ] Console shows strategy progression

### After Phase 4 (Gemini Support)
- [ ] Visit gemini.google.com chat page
- [ ] Button appears in leading actions
- [ ] Type prompt → click button → verify optimization happens
- [ ] Quill editor value read/write works correctly
- [ ] Console shows strategy progression

### After Phase 5 (Code Reorganization)
- [ ] All 3 sites still work
- [ ] Test SPA navigation (Gemini, Manus) - button re-injects correctly
- [ ] Dark mode toggle on each site
- [ ] Keyboard shortcut (Cmd/Ctrl+Shift+O) works on all 3 sites

### Final Integration Test
- [ ] Unload and reload extension
- [ ] ChatGPT: Button appears within 2 seconds
- [ ] Manus: Button appears within 2 seconds
- [ ] Gemini: Button appears within 2 seconds
- [ ] Each button is functional and styled consistently
- [ ] No console errors or warnings

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **ChatGPT Refactoring (Phase 2)**: Depends on Phase 1 - BLOCKS all new site work
- **Manus (Phase 3, P1)**: Depends on Phase 1 & 2 - Can proceed after refactoring
- **Gemini (Phase 4, P1)**: Depends on Phase 1 & 2 - Can proceed after refactoring, PARALLEL with Phase 3
- **Code Org (Phase 5, P2)**: Depends on Phases 3 & 4 - After both sites working
- **Polish (Phase 6)**: Depends on all above

### Within Each Phase

- All [P] tasks can run in parallel (different files, no dependencies)
- Non-parallel tasks must follow dependency order shown

### Parallel Opportunities

**After Phase 1 completion**:
- Phases 3 & 4 (Manus + Gemini) can be worked on in parallel by different developers
- Both depend on Phase 2 (ChatGPT refactoring) but not on each other

**Within each phase**:
- T018, T019, T020, T021, T023 (Manus selectors/strategies) mostly independent
- T028, T029, T030, T031, T032, T034, T035 (Gemini selectors/strategies) mostly independent
- Different developer can work on Manus while another does Gemini

### Critical Path

```
Phase 1 (Shared) → Phase 2 (ChatGPT) → [Phase 3 (Manus) + Phase 4 (Gemini)] → Phase 5 (Org) → Phase 6 (Polish)
```

---

## Implementation Strategy

### MVP First (Minimal Viable Product)

1. **Complete Phase 1**: Shared infrastructure refactored
2. **Complete Phase 2**: ChatGPT still works with new handler pattern
3. **Complete Phase 3**: Manus support added
4. **STOP and VALIDATE**: Test Manus independently
5. **Deploy**: Extension with ChatGPT + Manus support

### Incremental Delivery

1. **Release 1**: ChatGPT (refactored) + Manus (P1)
   - Phases 1-2-3 complete
   - Covers 2 sites, core functionality

2. **Release 2**: Add Gemini support
   - Phase 4 complete
   - All 3 sites supported

3. **Release 3**: Code cleanup + documentation
   - Phase 5 complete
   - Easier to add more sites

### Timeline per Phase

| Phase | Work | Effort | Time |
|-------|------|--------|------|
| 1 | Shared utilities extraction | Low | 1-2 hours |
| 2 | ChatGPT refactoring | Medium | 2-3 hours |
| 3 | Manus implementation | Medium | 2-3 hours |
| 4 | Gemini implementation | Medium-High | 3-4 hours (Quill editor) |
| 5 | Code organization | Low | 1-2 hours |
| 6 | Polish & testing | Low | 1-2 hours |
| **Total** | | | **10-17 hours** |

---

## Notes

- Each task must be specific enough that an LLM can complete it without asking clarification questions
- All file paths are absolute from `extension/` directory
- Test manually at each checkpoint (no automated tests requested)
- Console logging is critical for debugging fallback strategy selection
- Verify no regressions in ChatGPT during refactoring
- Strategy pattern enables adding new sites with minimal code duplication
- Check existing code before implementing (avoid reimplementing shared functions)
