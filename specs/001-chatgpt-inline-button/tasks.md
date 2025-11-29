# Tasks: ChatGPT Inline Prompt Optimizer Button

**Input**: Design documents from `/specs/001-chatgpt-inline-button/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per Constitution Principle VIII - Pure function tests using Node.js built-in test runner; manual testing for UI/Chrome APIs.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Browser Extension**: `extension/src/` (background/, content/, popup/, options/, shared/)
- Paths shown below follow existing Chrome MV3 extension structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and add keyboard shortcut registration

- [X] T001 Verify extension builds successfully with `npm run build` in extension/
- [X] T002 [P] Add keyboard shortcut command to extension/manifest.json commands section
- [X] T003 [P] Add TRIGGER_OPTIMIZE message type to extension/src/shared/messages.ts for background→content command relay
- [X] T003b [P] Create extension/test/ directory and add npm test script to extension/package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create button styling utility module in extension/src/content/button-styles.ts
- [X] T005 [P] Implement isDarkMode() detection function in extension/src/content/button-styles.ts
- [X] T005b [P] Write unit test for isDarkMode() in extension/test/button-styles.test.js
- [X] T006 [P] Implement applyButtonStyles() function with dark mode support in extension/src/content/button-styles.ts
- [X] T006b [P] Write unit test for applyButtonStyles() color logic in extension/test/button-styles.test.js
- [X] T007 [P] Add theme change observer (MutationObserver for dark mode class changes) in extension/src/content/button-styles.ts
- [X] T008 Add keyboard shortcut command listener in extension/src/background/index.ts
- [X] T008b Query active tab and relay optimize-prompt command to content script in extension/src/background/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Inline Prompt Optimization (Priority: P1) 🎯 MVP

**Goal**: Users can optimize prompts via button click OR keyboard shortcut (Ctrl+Shift+O / Cmd+Shift+O) with button positioned on left side near "+" button

**Independent Test**: Type prompt in ChatGPT, click button OR press Ctrl+Shift+O, verify optimization works and button is positioned left of input

### Implementation for User Story 1

- [X] T009 [US1] Modify insertButton() to find `[grid-area:leading]` container and anchor on `span.flex` next to "+" in extension/src/content/index.ts
- [X] T010 [US1] Implement primary insertion strategy (append to span.flex inside leading area with 8px spacing) in extension/src/content/index.ts
- [X] T011 [US1] Implement fallback insertion strategy with MutationObserver for DOM mount (honor selector priority: `div[role="textbox"]` then `textarea` placeholder fallback) in extension/src/content/index.ts
- [X] T011b [P] [US1] Write unit test for selector priority logic in extension/test/selectors.test.js
- [X] T012 [US1] Update styleButton() to use button-styles module in extension/src/content/index.ts
- [X] T013 [US1] Handle `chrome.commands` background relay message in content script to trigger optimization in extension/src/content/index.ts
- [X] T014 [US1] Update handleOptimize() to support both click and command-triggered paths in extension/src/content/index.ts
- [X] T015 [US1] Ensure background→content messaging path exists for `optimize-prompt` command (background/index.ts and messages.ts if needed)
- [X] T015b [P] [US1] Write unit test for message validation (isOptimizePromptRequest) in extension/test/messages.test.js
- [X] T016 [US1] Add host gating logic (chatgpt.com and chat.openai.com only) in extension/src/content/index.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently via quickstart.md Test 1, 2, 3

---

## Phase 4: User Story 2 - Visual Feedback During Optimization (Priority: P2)

**Goal**: Users see clear loading/error/success states with proper timing and visual feedback

**Independent Test**: Click button with empty input, no API key, network error scenarios - verify button text changes and timing

### Implementation for User Story 2

- [X] T017 [US2] Verify setLoading() properly sets button disabled state in extension/src/content/index.ts
- [X] T018 [US2] Verify empty prompt validation shows "请输入内容" for 1.2 seconds in extension/src/content/index.ts
- [X] T019 [US2] Verify network error shows "请求错误" for 1.4 seconds in extension/src/content/index.ts
- [X] T020 [US2] Verify API key error message displays correctly in extension/src/content/index.ts
- [X] T021 [US2] Test rapid click prevention (button disabled during processing) in extension/src/content/index.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently per quickstart.md Tests 4-8

---

## Phase 5: User Story 3 - Button Position and Styling (Priority: P3)

**Goal**: Button integrates seamlessly with ChatGPT UI in both light and dark modes with pill-style design

**Independent Test**: Load ChatGPT in light mode, verify button styling, toggle to dark mode, verify button adapts automatically

### Implementation for User Story 3

- [X] T022 [US3] Implement hover state styling (opacity 0.7) in extension/src/content/button-styles.ts
- [X] T023 [US3] Add transition effects for smooth hover/state changes in extension/src/content/button-styles.ts
- [X] T024 [US3] Verify pill-style design (border-radius 9999px, height 36px) in extension/src/content/button-styles.ts
- [X] T025 [US3] Verify margin-left (8px) is applied in primary insertion path (set by T010) in extension/src/content/index.ts
- [X] T026 [US3] Test dark mode adaptation (bg/text color flip) with theme observer in extension/src/content/button-styles.ts
- [X] T027 [US3] Verify zero layout shift on button injection in extension/src/content/index.ts

**Checkpoint**: All user stories should now be independently functional per quickstart.md Tests 1-10

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T028 [P] Run pure function tests with `node --test extension/test/**/*.test.js` and verify all pass
- [ ] T029 [P] Manual testing per quickstart.md Test 1-10 scenarios
- [ ] T030 [P] Verify button appears within 500ms of page load (SC-002)
- [ ] T031 [P] Verify optimization completes in under 3 seconds (SC-001)
- [ ] T032 [P] Test on both chatgpt.com and chat.openai.com (SC-006)
- [X] T033 Code cleanup: Remove unused imports and console.log statements
- [X] T034 Verify bundle size remains under 200KB after build
- [ ] T035 Test edge cases: ChatGPT DOM changes, navigation during optimization, rapid clicks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1 (visual feedback already exists in MVP)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses button-styles module created in Foundational

### Within Each User Story

- Foundational phase must complete first (button-styles module)
- Button positioning before styling fine-tuning
- Keyboard shortcut can be implemented in parallel with button positioning
- Theme observer setup in Foundational enables US3 dark mode testing

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational tasks together:
Task: "Create button styling utility module in extension/src/content/button-styles.ts"
Task: "Implement isDarkMode() detection function in extension/src/content/button-styles.ts"
Task: "Implement applyButtonStyles() function in extension/src/content/button-styles.ts"
Task: "Add theme change observer setup in extension/src/content/button-styles.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently per quickstart.md
5. Load unpacked extension and verify on chatgpt.com

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Manual verification (MVP!)
3. Add User Story 2 → Test independently → Manual verification
4. Add User Story 3 → Test independently → Manual verification
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (button positioning + keyboard)
   - Developer B: User Story 2 (visual feedback refinement)
   - Developer C: User Story 3 (dark mode + styling polish)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Pure function tests using Node.js built-in test runner (Constitution Principle VIII)
- Manual testing required per quickstart.md for all UI and Chrome API interactions
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All changes confined to extension/src/content/, extension/src/background/, extension/src/shared/messages.ts, extension/test/, and extension/manifest.json (plus new button-styles.ts module)
- Total tasks: 40 (T001-T035 + T003b, T005b, T006b, T008b, T011b, T015b)
