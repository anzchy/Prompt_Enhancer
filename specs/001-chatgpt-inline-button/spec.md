# Feature Specification: ChatGPT Inline Prompt Optimizer Button

**Feature Branch**: `001-chatgpt-inline-button`
**Created**: 2025-11-28
**Status**: Draft
**Input**: User description: "Inject inline optimize button into ChatGPT chat interface for seamless prompt enhancement without using popup window"

## Background & Context

When using ChatGPT and similar LLM products, prompt quality directly determines response quality. However, several pain points exist in real workflows:

1. Users often type questions hastily into the input box without taking time to structure them, add context, or define constraints
2. Creating high-quality prompts requires manually copying text elsewhere (Notion, IDE) for refinement, then pasting back - a fragmented workflow
3. Existing prompt optimization tools are mostly web-based or CLI tools that cannot seamlessly integrate with ChatGPT's interface

**Current State**: The Prompt Optimizer extension already provides a popup-based workflow where users can paste prompts, optimize them, and copy results. While functional, this requires opening the popup each time, which interrupts the conversation flow.

**Goal**: Enable one-click prompt optimization directly within the ChatGPT chat interface by injecting an inline "优化指令" button near the input area. This minimizes workflow interruption while using the existing extension infrastructure (background worker, API configuration, LLM client).

## User Profile

**Target Users**: Knowledge workers who frequently use ChatGPT - developers, analysts, product managers, researchers

**User Characteristics**:
- Understand that prompt quality matters but don't want to manually craft prompts each time
- Familiar with Chrome extension installation and basic configuration
- Already have access to OpenAI API or compatible proxy endpoints
- Value workflow efficiency and minimal context switching

## Clarifications

### Session 2025-11-28

- Q: Where should the "优化指令" button be positioned relative to the ChatGPT input box? → A: Left side of input area, near existing "+" button (follows ChatGPT's action button pattern)
- Q: User requested keyboard shortcut support to avoid clicking button → A: Add keyboard shortcut functionality
- Q: Which keyboard shortcut should trigger prompt optimization? → A: Ctrl+Shift+O (or Cmd+Shift+O on Mac) - follows common browser extension shortcut patterns

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Inline Prompt Optimization (Priority: P1)

Users can optimize their prompts directly within ChatGPT's chat interface without opening a separate popup window, enabling a seamless workflow for improving prompt quality before sending to ChatGPT.

**Example Scenario**: User hastily types "写个 Python 脚本抓取某个网站的新闻" in ChatGPT, clicks the inline "优化指令" button, and the extension transforms it into a detailed, structured prompt with clear input/output format specifications and error handling requirements - all without leaving the chat page.

**Why this priority**: This is the core value proposition - reducing friction in the prompt optimization workflow. Currently, users must click the extension icon to open a popup, which interrupts their conversation flow with ChatGPT.

**Independent Test**: Can be fully tested by typing a prompt in ChatGPT's input box, clicking the injected "优化指令" button, and verifying the prompt is replaced with the optimized version inline.

**Acceptance Scenarios**:

1. **Given** user is on chatgpt.com with a new conversation, **When** user types "写个 Python 脚本抓取网站", **Then** the "优化指令" button appears visible in the chat input area
2. **Given** user has typed a prompt in ChatGPT input, **When** user clicks "优化指令" button, **Then** button shows loading state ("优化中…") and becomes disabled
3. **Given** optimization is processing, **When** API returns optimized prompt, **Then** original prompt text is replaced with optimized version in the input box and button returns to normal state
4. **Given** optimized prompt is in input box, **When** user presses Enter, **Then** prompt is sent to ChatGPT as a normal message
5. **Given** user has not configured API key, **When** user clicks "优化指令" button, **Then** error message "请先在 Options 页面配置 API Key" is displayed
6. **Given** user has typed a prompt in ChatGPT input, **When** user presses Ctrl+Shift+O (or Cmd+Shift+O on Mac), **Then** optimization triggers with the same behavior as clicking the button

---

### User Story 2 - Visual Feedback During Optimization (Priority: P2)

Users receive clear visual feedback about the optimization process status, including loading states, success, and error conditions.

**Why this priority**: Essential for usability but secondary to core functionality. Users need to know what's happening during the 1-5 second API call.

**Independent Test**: Can be tested by clicking "优化指令" with various scenarios (valid prompt, empty prompt, no API key, network error) and observing button text/state changes.

**Acceptance Scenarios**:

1. **Given** user clicks "优化指令" with empty input, **When** validation runs, **Then** button shows temporary message "请输入内容" for 1.2 seconds
2. **Given** API call fails with network error, **When** error is caught, **Then** button shows "请求错误" for 1.4 seconds then reverts to "优化指令"
3. **Given** API call succeeds, **When** prompt is replaced, **Then** user sees the new text immediately without additional confirmation dialogs

---

### User Story 3 - Button Position and Styling (Priority: P3)

The injected button integrates seamlessly with ChatGPT's existing UI without breaking the layout or conflicting with ChatGPT's own buttons.

**Why this priority**: Important for professional appearance and avoiding user confusion, but the button can function with basic styling initially.

**Independent Test**: Can be tested by loading ChatGPT, observing button placement, and testing on both light and dark themes.

**Acceptance Scenarios**:

1. **Given** user loads ChatGPT page, **When** content script injects button, **Then** button appears in a consistent location near the input area without overlapping existing UI elements
2. **Given** ChatGPT is in dark mode, **When** user views the page, **Then** "优化指令" button styling matches the dark theme
3. **Given** user hovers over "优化指令" button, **When** mouse enters button area, **Then** button shows subtle visual feedback (hover state)

---

### Edge Cases

- What happens when ChatGPT updates their DOM structure? Button injection should fail gracefully using MutationObserver fallback
- What happens when user clicks "优化指令" multiple times rapidly? Only one API call should be active (button disabled during processing)
- What happens when API returns empty or malformed response? Show error message and preserve original prompt
- What happens when user navigates to a different conversation while optimization is in progress? Cancel pending request or handle completion gracefully
- What happens on chatgpt.com vs chat.openai.com? Both URLs should be supported with same selector strategy

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST inject a visible "优化指令" button into ChatGPT's chat input area
- **FR-002**: Button MUST be positioned on the left side of the input area, near the existing "+" button, following ChatGPT's action button pattern
- **FR-003**: System MUST detect the ChatGPT prompt input element using site-specific selectors (priority: `div[role="textbox"]`, fallback: `textarea[placeholder*="Message"]` per original PRD)
- **FR-004**: When user clicks "优化指令" button, system MUST read current prompt text from the input element
- **FR-005**: System MUST show loading state ("优化中…") and disable button while API request is processing
- **FR-006**: System MUST send prompt text to background service worker via OPTIMIZE_PROMPT message
- **FR-007**: System MUST replace original prompt text with optimized version returned from API
- **FR-008**: Optimized prompt MUST preserve user's ability to edit before sending (no auto-submit)
- **FR-009**: System MUST show error message if API key is not configured
- **FR-010**: System MUST show error message if API request fails
- **FR-011**: System MUST handle empty prompt input with user-friendly message
- **FR-012**: Button MUST only inject on supported URLs (chatgpt.com/*, chat.openai.com/*)
- **FR-013**: Button injection MUST use MutationObserver fallback if immediate mount fails
- **FR-014**: System MUST revert button to normal state after showing temporary error/success messages
- **FR-015**: Button styling MUST adapt to ChatGPT's light and dark modes without manual configuration
- **FR-016**: Button MUST use pill-style design with minimal visual intrusion into existing UI (per original PRD design specs)
- **FR-017**: System MUST support keyboard shortcut Ctrl+Shift+O (Cmd+Shift+O on Mac) to trigger optimization without clicking button

### Key Entities

- **Optimize Button Element**: Injected button displaying "优化指令" text, with state management for normal/loading/error states
- **Chat Input Element**: ChatGPT's existing prompt textarea (ProseMirror contenteditable div), identified by id="prompt-textarea"
- **Optimization Request**: Message containing original prompt text, sent from content script to background worker
- **Optimization Response**: Message containing optimized prompt or error information, returned from background worker

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can optimize prompts in under 3 seconds from clicking "优化指令" to seeing optimized text (1-3 seconds is acceptable wait time per original PRD)
- **SC-002**: Button appears within 500ms of page load on ChatGPT
- **SC-003**: 95% of button injection attempts succeed on first DOM query (remaining 5% succeed via MutationObserver) - measured via manual observation during quickstart.md testing across 20+ page loads
- **SC-004**: Users can distinguish between loading, success, and error states within 1 second of state change
- **SC-005**: Zero layout shift or overlap with ChatGPT's existing UI elements after button injection
- **SC-006**: Feature works on both chatgpt.com and chat.openai.com without code duplication
- **SC-007**: Button styling adapts to ChatGPT's light and dark modes automatically
- **SC-008**: All pure utility functions (isDarkMode, selector priority, message validation) have passing unit tests

## Assumptions *(optional)*

### Technical Assumptions

- ChatGPT uses a contenteditable div or textarea for the main input area
- Selector strategy: Try `div[role="textbox"]` first, fallback to `textarea[placeholder*="Message"]` (per original PRD)
- The input container structure allows button insertion near the input without breaking layout
- Existing background service worker and message passing infrastructure from MVP is functional
- API configuration (base URL, API key, model) is already stored in chrome.storage from MVP
- Extension bundle size remains lightweight (JS should not slow down ChatGPT page load)

### User Assumptions

- Users have already configured API key via Options page (from MVP functionality)
- Users are familiar with the existing popup-based prompt optimization workflow
- Users want inline optimization to reduce context switching

### Scope Assumptions

- This feature focuses on ChatGPT only; Gemini and Manus support is explicitly deferred to future iterations
- Button will be injected in a fixed position (not customizable by user in v1)
- Only one optimization request can be active at a time per browser tab

## Dependencies *(optional)*

### External Dependencies

- ChatGPT's DOM structure remains stable (specifically the #prompt-textarea element and grid layout)
- Extension has host permissions for chatgpt.com and chat.openai.com (already in manifest)
- Background service worker can make external API calls to GPT-4.1 endpoint

### Internal Dependencies

- Existing content script infrastructure (`extension/src/content/`)
- Existing background worker LLM client (`extension/src/shared/llm.ts`)
- Existing message protocol (`extension/src/shared/messages.ts` - OPTIMIZE_PROMPT message type)
- Existing config management (`extension/src/shared/config.ts`)

## Out of Scope *(optional)*

### Explicitly Deferred to Future Versions

- Gemini.google.com button injection (v0.2 per original PRD roadmap)
- Manus.im button injection (v0.2 per original PRD roadmap)
- Multiple optimization style presets with dropdown selector (v0.2 - secondary goal in original PRD)
- Original vs optimized prompt comparison view (v0.3 - secondary goal in original PRD)

### Not Planned

- Customizable button position or styling
- Multiple optimization requests in parallel
- Undo/redo functionality for optimized prompts
- Mobile responsive design (Chrome extensions primarily desktop-focused)
- Popup window modifications (popup already exists from MVP, this feature is purely inline button)

### Non-Goals from Original PRD

- Complete prompt management system (version control, cloud sync, favorites library)
- User account system or multi-device sync
- Model API proxy or paid service offering (users provide their own API keys)
