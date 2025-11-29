<!--
  Sync Impact Report:
  - Version: 1.1.0 → 1.2.0 (Refined testing principle to allow lightweight pure function tests)
  - Ratification Date: 2025-11-28
  - Modified principles:
    - Principle VIII: Changed from "No Testing Infrastructure" to "Lightweight Testing for Pure Functions"
    - Updated Testing Strategy section to allow Node.js built-in test runner for pure functions
  - Added sections: Test guidelines for pure functions
  - Removed sections: Blanket "no tests" restriction
  - Templates requiring updates:
    ✅ plan-template.md - May include test/ directory for pure function tests
    ✅ tasks-template.md - May include test tasks for pure functions only
  - Follow-up TODOs: None
-->

# Prompt Optimizer Extension Constitution

## Core Principles

### I. Client-Side Only Architecture

All functionality MUST execute in the browser extension sandbox (content scripts, background service worker, popup, options pages). No backend services, no server-side logic, no database servers. The extension MUST be deployable by loading the unpacked `dist/` directory into Chrome without any deployment infrastructure.

**Rationale**: This is a prototype Chrome Extension with frontend-only architecture. Maintaining zero backend dependencies ensures rapid iteration, eliminates deployment complexity, and keeps the project scope focused on browser extension capabilities.

### II. Module Isolation by Domain

Code MUST be organized into distinct domains within `extension/src/`:
- `background/` - Service worker, LLM API calls only
- `content/` - DOM manipulation, page integration only
- `popup/` - Standalone UI for prompt optimization
- `options/` - Configuration management only
- `shared/` - Cross-domain utilities (config, messages, LLM client)

Each domain MUST NOT contain logic belonging to another domain. Shared logic MUST live in `shared/` to prevent duplication between popup and content scripts.

**Rationale**: Chrome MV3 architecture enforces separation between content scripts, service workers, and extension pages. Clear boundaries prevent code duplication, simplify testing, and ensure each module can evolve independently.

### III. API Key Security (NON-NEGOTIABLE)

- API keys MUST be stored in `chrome.storage.local` only (never `sync`)
- API keys MUST NOT be injected into page window objects or exposed to target site scripts
- API keys MUST NOT appear in console logs, error messages shown to users, or committed to version control
- All LLM API calls MUST execute in the background service worker only, never in content scripts
- Options page MUST mask API key display (show partial value only)

**Rationale**: Compromised API keys can lead to financial cost and service abuse. Chrome's storage.local provides isolated storage that page scripts cannot access. Background workers provide a secure execution context separated from potentially malicious page scripts.

### IV. Progressive Enhancement for DOM Integration

Content script DOM integration MUST:
1. Use site-specific selectors defined in a centralized selector map (`selectorMap()` function)
2. Attempt immediate mount on page load
3. Fall back to `MutationObserver` if initial mount fails
4. Handle selector failures gracefully without breaking the page
5. Avoid modifying page layout or conflicting with existing styles

When target sites change their DOM structure, ONLY the selector map needs updating.

**Rationale**: Chat-based sites (ChatGPT, Gemini, Manus) frequently update their UIs. Centralized selectors and graceful degradation ensure the extension remains functional across site updates without requiring full rewrites.

### V. User Feedback for Async Operations

All asynchronous operations (LLM API calls, storage operations) MUST provide immediate visual feedback:
- Loading states: Button text changes (e.g., "优化中…"), disabled state during processing
- Success states: Temporary confirmation (1-2 seconds) then revert to normal
- Error states: Show user-friendly error message with specific action (e.g., "请先在 Options 页面配置 API Key")
- No silent failures: Every error MUST be surfaced to the user

**Rationale**: LLM API calls can take 1-5 seconds. Without feedback, users don't know if the extension is working. Clear error messages reduce support burden and improve UX.

### VI. Configuration Flexibility

The extension MUST support:
- Configurable API base URL (for OpenAI-compatible proxies)
- Configurable model name (to support different GPT models)
- Configurable system prompt (to customize optimization behavior)
- No hardcoded API endpoints or model names in business logic

All configuration MUST be editable via the Options page without code changes.

**Rationale**: This is a prototype for personal use. Users may want to use different LLM providers, test different models, or experiment with system prompts. Hardcoding these values would require rebuilding the extension for every change.

### VII. Minimal External Dependencies

- Use vanilla TypeScript for all logic (no React, Vue, or UI frameworks)
- Use esbuild for bundling (single dev dependency)
- Use Chrome APIs only (no polyfills for other browsers)
- Avoid libraries for functionality easily implemented in vanilla JS (HTTP fetch, DOM manipulation, storage)

Add external dependencies ONLY when they provide significant value and cannot be easily implemented.

**Rationale**: Browser extensions must load quickly and minimize bundle size. Framework overhead is unnecessary for simple UIs (popup, options). Fewer dependencies mean faster builds, smaller bundle size, and fewer security vulnerabilities.

### VIII. Lightweight Testing for Pure Functions

**Testing Philosophy**:
- Unit tests for **pure functions only** (deterministic, no side effects, no DOM/Chrome APIs)
- Use Node.js built-in test runner (zero dependencies, no test frameworks)
- NO integration tests, NO browser automation, NO mocking frameworks
- Manual testing remains primary verification method for UI and Chrome API interactions

**What SHOULD be tested**:
- ✅ Pure utility functions (isDarkMode detection, selector priority logic)
- ✅ Message type guards and validation functions
- ✅ Configuration parsing and normalization
- ✅ State machine logic (button state transitions if extracted to pure functions)

**What should NOT be tested**:
- ❌ DOM manipulation and injection
- ❌ Chrome extension APIs (storage, messaging, commands)
- ❌ MutationObserver behavior
- ❌ UI interactions and styling
- ❌ Background-content message passing
- ❌ Any code requiring browser context

**Test Infrastructure**:
- Tests live in `extension/test/` directory (parallel to `src/`)
- Run with: `node --test extension/test/**/*.test.js`
- Test files written in plain JavaScript (no TypeScript compilation needed for tests)
- Keep total test code under 200 lines (lightweight constraint)
- Tests must run in under 100ms total

**Rationale**: Pure functions are deterministic and trivial to test without dependencies. Testing them catches logic bugs early (selector priority, dark mode detection, message validation) while avoiding the complexity and maintenance burden of UI/integration testing. This balances reliability with simplicity for a prototype.

## Security Requirements

### Secrets Management

- Never commit `.env` files, API keys, or credentials
- Use `config.example.ts` pattern if configuration templates needed
- Strip verbose logging in production builds (`npm run build`)
- Validate all user input in Options page before storage
- Sanitize error messages before displaying to users (no stack traces, no API keys in error text)

### Content Security

- Content scripts MUST NOT execute arbitrary code from page context
- Content scripts MUST NOT eval() user input or LLM responses
- Use `textContent` assignment for updating DOM (avoid `innerHTML` with user/LLM data)
- Validate message types in background worker before processing

## Development Workflow

### Build & Test Process

- Development: `cd extension && npm run dev` (watch mode with auto-rebuild)
- Production: `cd extension && npm run build` (outputs to `extension/dist/`)
- Test loading: Load `extension/dist/` as unpacked extension in Chrome
- After code changes: Rebuild → Click "Reload" in `chrome://extensions` for the unpacked extension

### Code Style

- TypeScript strict mode enabled (`tsconfig.json`)
- 2-space indentation, LF line endings
- Filenames: `kebab-case` for scripts (e.g., `find-prompt-input.ts`)
- Use ES modules only (no CommonJS)
- Conventional Commits format (`feat:`, `fix:`, `chore:`)

### Testing Strategy

**Pure Function Tests** (automated):
- Run `node --test extension/test/**/*.test.js` before commits
- Tests must pass for pure utility functions (isDarkMode, selector logic, message validation)
- Keep tests simple: no mocking, no complex setup, deterministic only

**Manual Testing** (required before commits):
- Load unpacked extension in Chrome
- Test on chatgpt.com: verify button injection, positioning, optimization flow
- Verify API key error handling
- Test keyboard shortcut (Ctrl+Shift+O / Cmd+Shift+O)
- Toggle ChatGPT dark mode, verify button adapts

**Manual Verification Checklist**:
- Load unpacked → Configure options → Test content button → Test popup flow → Verify keyboard shortcut
- Test on both chatgpt.com and chat.openai.com

### Documentation

- PRDs versioned in `docs/prd/` (e.g., `v0.1.md`)
- Implementation plans in `docs/plans/` (e.g., `v0.1-plan.md`)
- Developer guidance in `extension/AGENTS.md`
- User guidance in `extension/README.md`
- Architecture overview in `CLAUDE.md` (for AI assistants)

## Governance

This constitution supersedes all other development practices. When conflicts arise between this constitution and other documentation, the constitution takes precedence.

### Amendment Process

- Amendments require documentation of rationale
- Version bump according to semantic versioning (MAJOR.MINOR.PATCH)
- Update all dependent templates in `.specify/templates/` to maintain alignment
- Document changes in Sync Impact Report (HTML comment at top of this file)

### Compliance Review

- All features MUST align with "Client-Side Only Architecture" (Principle I)
- All PRs MUST verify API keys are not exposed (Principle III)
- All selector changes MUST update centralized `selectorMap()` (Principle IV)
- Complexity violations MUST be justified in plan.md "Complexity Tracking" section

### Runtime Development Guidance

For day-to-day development decisions not covered by this constitution, refer to:
- `extension/AGENTS.md` - Coding style, commit guidelines, testing practices
- `CLAUDE.md` - Architecture overview, common commands, selector patterns

**Version**: 1.2.0 | **Ratified**: 2025-11-28 | **Last Amended**: 2025-11-28
