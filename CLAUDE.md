# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome Manifest V3 extension that optimizes prompts inline on chat-based websites (ChatGPT, Manus, Gemini) and via a popup interface. The extension uses configurable LLM endpoints (OpenAI-compatible APIs) to enhance user prompts.

## Repository Structure

- `docs/` — Product requirements (`docs/prd/v0.1.md`), implementation plans (`docs/plans/v0.1-plan.md`), and roadmap
- `extension/` — Extension source code and build artifacts
  - `src/` — TypeScript source organized by domain:
    - `background/` — Service worker handling LLM API calls
    - `content/` — Content scripts injecting optimize buttons into target sites
    - `popup/` — Popup UI for standalone prompt optimization
    - `options/` — Options page for configuring API settings
    - `shared/` — Shared utilities (config, messages, LLM client)
  - `scripts/build.js` — esbuild bundler
  - `dist/` — Build output (not committed)

## Development Commands

All commands run from the `extension/` directory:

```bash
# Install dependencies
npm install

# Development (watch mode, rebuilds on changes)
npm run dev

# Production build
npm run build

# Clean build artifacts
npm run clean
```

After building, load the unpacked extension from `extension/dist/` in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

## Architecture

### Message Flow
1. Content script reads prompt from DOM → sends `OPTIMIZE_PROMPT` message to background worker
2. Background worker loads config from `chrome.storage` → calls LLM endpoint
3. LLM returns optimized prompt → background sends response back
4. Content script or popup updates UI with optimized text

### Storage Strategy
- API key stored in `chrome.storage.local` (not synced, more secure)
- Other config (API base URL, model, system prompt) in `chrome.storage.sync`
- See `src/shared/config.ts` for implementation

### Content Script Selectors
The extension targets specific DOM elements on each supported site. Selectors are defined in `src/content/index.ts:6-17` in the `selectorMap()` function:
- ChatGPT: `div[role="textbox"]`, `textarea[placeholder*="Message"]`
- Manus: `div[contenteditable="true"][role="textbox"]`, `textarea`, `div[role="textbox"]`
- Gemini: `textarea`, `div[contenteditable="true"]`

If a site updates its DOM structure, update these selectors in `src/content/index.ts`.

### LLM Client
`src/shared/llm.ts` implements OpenAI-compatible chat completions API:
- Endpoint: `{apiBaseUrl}/chat/completions`
- Sends system prompt + user prompt with optional host context
- Supports any model that follows OpenAI's response format

## Configuration

Users configure the extension via Options page:
- API Base URL (default: `https://api.openai.com/v1`, no trailing slash)
- API Key (required, stored locally)
- Model (default: `gpt-4.1-mini`)
- System Prompt (default: prompt upgrading instructions)

Defaults are in `src/shared/config.ts:11-17`.

## Build System

Custom esbuild configuration in `scripts/build.js`:
- Bundles 4 entry points: background, content-script, popup, options
- Outputs ES modules targeting ES2020
- Copies static files (manifest, HTML) to `dist/`
- Generates sourcemaps
- Watch mode available via `--watch` flag

## Code Conventions

From `extension/AGENTS.md`:
- TypeScript ES modules, 2-space indentation
- Filenames: `kebab-case` for scripts (`find-prompt-input.ts`)
- Keep DOM selectors centralized in `src/shared/selectors.ts` (if added)
- Use Conventional Commits (`feat:`, `fix:`, `chore:`)
- Test files: `*.test.ts` pattern (when testing is configured)

## Target Sites

Manifest declares host permissions and content script matches for:
- `https://chatgpt.com/*`
- `https://chat.openai.com/*`
- `https://manus.im/*`
- `https://gemini.google.com/*`

To add support for new sites, update `manifest.json` and add selectors to `selectorMap()` in `src/content/index.ts`.

## Security

- Never commit API keys
- API keys stored in `chrome.storage.local` only
- Strip verbose logging from production builds
- Avoid exposing secrets in error messages shown to users
