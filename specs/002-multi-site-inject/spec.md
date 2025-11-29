# Feature Specification: Multi-Site Button Injection Support

**Feature Branch**: `002-multi-site-inject`
**Created**: 2025-11-29
**Status**: Draft
**Input**: User description: "增加对 https://manus.im/ 和 https://gemini.google.com/ 的支持，同样的也是把"优化指令" button inject 其中，目前 chrome extension 文件目录相对简单，看是否要重新组织文件目录，chatgpt.com，manus.im 和 gemini 三个的 button 注入相关 logic 分为不同的文件，放在一个文件夹中。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Optimize Prompt on Manus.im (Priority: P1)

Users who visit manus.im want to enhance their prompts using the same "优化指令" button that is available on ChatGPT. When a user navigates to manus.im and starts typing a prompt, the optimization button should appear in an accessible location near the input area, allowing one-click prompt enhancement.

**Why this priority**: Manus.im is explicitly requested as a new supported site. Users need feature parity with ChatGPT experience.

**Independent Test**: Can be fully tested by visiting manus.im, typing a prompt, clicking the "优化指令" button, and verifying the prompt is enhanced and replaced in the input field.

**Acceptance Scenarios**:

1. **Given** a user is on manus.im with the extension installed, **When** the page loads and an input field is detected, **Then** the "优化指令" button appears near the input area.
2. **Given** the button is visible on manus.im, **When** the user types a prompt and clicks the button, **Then** the prompt is sent for optimization and the result replaces the original text.
3. **Given** the user clicks the button with an empty input, **When** no text is present, **Then** a brief "请输入内容" message is shown instead of making an API call.

---

### User Story 2 - Optimize Prompt on Gemini (Priority: P1)

Users who visit gemini.google.com want the same prompt optimization functionality. The button should integrate naturally with Gemini's UI and function identically to the ChatGPT implementation.

**Why this priority**: Gemini is explicitly requested as a new supported site. Users need feature parity with ChatGPT experience.

**Independent Test**: Can be fully tested by visiting gemini.google.com, typing a prompt, clicking the "优化指令" button, and verifying the prompt is enhanced and replaced in the input field.

**Acceptance Scenarios**:

1. **Given** a user is on gemini.google.com with the extension installed, **When** the page loads and an input field is detected, **Then** the "优化指令" button appears near the input area.
2. **Given** the button is visible on Gemini, **When** the user types a prompt and clicks the button, **Then** the prompt is sent for optimization and the result replaces the original text.
3. **Given** the API call is in progress, **When** waiting for response, **Then** the button shows "优化中…" and is disabled to prevent duplicate requests.

---

### User Story 3 - Reorganize Code by Site (Priority: P2)

Developers maintaining the extension need the codebase to be organized so that site-specific button injection logic is separated into individual files per site. This makes the code easier to maintain, extend, and debug.

**Why this priority**: Code organization is an internal improvement that enables easier future maintenance and extensibility, but is not user-facing.

**Independent Test**: Can be verified by examining the file structure and ensuring each supported site (ChatGPT, Manus, Gemini) has its own dedicated file in a common folder.

**Acceptance Scenarios**:

1. **Given** the extension source code, **When** a developer looks at the content script folder, **Then** there is a dedicated folder containing separate files for each site's button injection logic.
2. **Given** the refactored codebase, **When** the extension is built and tested, **Then** all sites function exactly as before with no regression.
3. **Given** a new site needs to be added in the future, **When** a developer creates a new site-specific file following the established pattern, **Then** adding support requires minimal changes to shared code.

---

### User Story 4 - Consistent Button Behavior Across Sites (Priority: P2)

Users expect the button to behave consistently across all supported sites - same appearance, same loading states, same error handling, and same keyboard shortcuts.

**Why this priority**: Consistency enhances user experience but is secondary to core functionality.

**Independent Test**: Can be verified by testing the button on all three sites and confirming identical behavior for loading states, error messages, and keyboard shortcuts.

**Acceptance Scenarios**:

1. **Given** the button exists on any supported site, **When** an API error occurs, **Then** the same error message pattern is displayed regardless of site.
2. **Given** the user presses the keyboard shortcut on any site, **When** an input field is focused, **Then** the optimization is triggered identically.
3. **Given** the button is rendered on any site, **When** the user observes the button, **Then** the styling and text are consistent across sites.

---

### Edge Cases

- What happens when Manus.im or Gemini changes their DOM structure? The extension should use fallback strategies and continue to attempt button insertion.
- How does the system handle sites that dynamically load input fields via JavaScript? A MutationObserver should detect newly added input fields.
- What happens if the button is injected but the input field is later removed (e.g., page navigation in SPA)? The extension should detect this and clean up or re-inject as needed.
- What if multiple input fields exist on the same page? The extension should inject a button for the primary/main chat input only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect and inject the "优化指令" button on manus.im pages containing a chat input field
- **FR-002**: System MUST detect and inject the "优化指令" button on gemini.google.com pages containing a chat input field
- **FR-003**: System MUST maintain existing ChatGPT button injection functionality with no regression
- **FR-004**: System MUST organize site-specific injection logic into separate files, one file per supported site (ChatGPT, Manus, Gemini)
- **FR-005**: Site-specific files MUST be placed in a dedicated folder within the content scripts directory
- **FR-006**: System MUST use consistent button styling across all sites, adapting only to site-specific theme requirements
- **FR-007**: System MUST handle dynamic DOM changes via MutationObserver for all supported sites
- **FR-008**: System MUST support the keyboard shortcut trigger on all newly supported sites
- **FR-009**: Button MUST display loading state ("优化中…") during API calls on all sites
- **FR-010**: Button MUST display error messages consistently across all sites
- **FR-011**: manifest.json MUST include host permissions for `https://manus.im/*` and `https://gemini.google.com/*`
- **FR-012**: Site-specific handlers MUST use the documented selector priority and insertion anchors:
  - Manus: `textarea[placeholder="Assign a task or ask anything"]` (fallback: `textarea`), insert after the plus button inside `.flex.gap-2.items-center.flex-shrink-0`
  - Gemini: `.ql-editor.textarea[contenteditable="true"][data-placeholder="Ask Gemini"]` (fallback: `div[role="textbox"][aria-label*="Enter a prompt here"]`), insert into `.leading-actions-wrapper` after the upload button
- **FR-013**: Gemini handler MUST set and get prompt text reliably for the Quill editor (update inner HTML/value and dispatch appropriate events)
- **FR-014**: MutationObserver logic MUST prevent duplicate buttons and re-inject after SPA navigation or input removal on all supported sites

### Key Entities

- **Site Handler**: Represents the site-specific logic for detecting input fields, finding insertion points, and adapting to the site's DOM structure
- **Button Controller**: Shared component managing button state, styling, click handling, and loading indicators
- **Selector Configuration**: Per-site configuration defining CSS selectors for input detection and button insertion points

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Button appears and functions correctly on manus.im chat pages under normal loads, with fallback via MutationObserver if initial query fails
- **SC-002**: Button appears and functions correctly on gemini.google.com chat pages under normal loads, with fallback via MutationObserver if initial query fails
- **SC-003**: All existing ChatGPT functionality continues to work with no reported regressions
- **SC-004**: Codebase has dedicated site-specific files for all three sites (ChatGPT, Manus, Gemini) in a shared folder structure
- **SC-005**: Adding support for a new site requires creating only one new file following the established pattern
- **SC-006**: Users can successfully optimize prompts on all three sites with identical user experience

## Assumptions

- Manus.im and Gemini use contenteditable divs or textarea elements for chat input (consistent with existing selector patterns in the codebase)
- The existing LLM API integration and background service worker require no changes for multi-site support
- The manifest.json will include host permissions for manus.im and gemini.google.com before implementation is considered complete
- Site-specific files will follow a consistent interface/pattern allowing the main content script to delegate to the appropriate handler
- The button styling system (button-styles.ts) will work across all sites with minimal site-specific adjustments
- Keyboard shortcut uses the Chrome commands API and should work identically on all supported hosts
