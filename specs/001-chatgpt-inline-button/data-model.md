# Data Model: ChatGPT Inline Button

**Feature**: ChatGPT Inline Prompt Optimizer Button
**Date**: 2025-11-28
**Phase**: Phase 1 - Design Artifacts

## Overview

This feature is primarily UI-focused (button positioning, keyboard shortcuts, styling). There are minimal data entities beyond what already exists in the MVP implementation.

## Entities

### OptimizeButton (UI Component)

**Description**: The injected "优化指令" button that appears in ChatGPT's input area

**Attributes**:
- `element`: HTMLButtonElement - The DOM button element
- `state`: ButtonState - Current button state (normal, loading, error, success)
- `textContent`: string - Current button text ("优化指令", "优化中…", error messages)
- `disabled`: boolean - Whether button is clickable
- `targetInput`: HTMLElement - Reference to the chat input element this button controls

**State Transitions**:
```
Normal ("优化指令")
  → Loading ("优化中…", disabled=true) [user clicks or presses Ctrl+Shift+O]
  → Success (restore "优化指令", disabled=false) [API returns optimized prompt]
  OR
  → Error ("请输入内容" | "请求错误" | error message) [validation fails or API error]
  → Normal (restore after 1.2-1.4 seconds)
```

**No Persistence**: Button state is ephemeral (resets on page reload)

---

### KeyboardShortcutConfig (Runtime Configuration)

**Description**: Keyboard shortcut binding for optimization trigger

**Attributes**:
- `key`: string - Always "o" (lowercase)
- `ctrlKey`: boolean - true on Windows/Linux
- `metaKey`: boolean - true on Mac
- `shiftKey`: boolean - Always true

**Platform Detection**:
```typescript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modifierKey = isMac ? 'metaKey' : 'ctrlKey';
```

**No Persistence**: Hardcoded per spec (Ctrl+Shift+O on Windows/Linux, Cmd+Shift+O on Mac)

---

### DarkModeState (Runtime Detection)

**Description**: Detected dark mode state for button styling

**Attributes**:
- `isDarkMode`: boolean - Whether ChatGPT is in dark mode
- `detectionMethod`: 'dom-class' | 'computed-bg' | 'fallback' - How dark mode was detected

**Detection Logic** (from research.md):
1. Check for ChatGPT's dark mode class/attribute on `<html>` or `<body>`
2. Fallback: Analyze `document.body` background color brightness
3. Use MutationObserver to react to theme changes

**No Persistence**: Detected on mount and theme change, not stored

---

## Existing Entities (No Changes)

These entities already exist in the MVP and are NOT modified by this feature:

### ExtensionConfig (extension/src/shared/config.ts)
- apiBaseUrl: string
- apiKey: string
- model: string
- systemPrompt: string

### OptimizePromptRequest (extension/src/shared/messages.ts)
- type: "OPTIMIZE_PROMPT"
- payload: { originalPrompt, styleId?, source?, pageHost? }

### OptimizePromptResponse (extension/src/shared/messages.ts)
- success: boolean
- optimizedPrompt?: string
- error?: string

---

## Data Flow

```
User Action (Click or Keyboard)
  ↓
Content Script: getPromptValue(targetInput)
  ↓
Content Script: chrome.runtime.sendMessage(OptimizePromptRequest)
  ↓
Background Worker: loadConfig() → requestOptimizedPrompt()
  ↓
Background Worker: sendResponse(OptimizePromptResponse)
  ↓
Content Script: setPromptValue(targetInput, optimized)
  ↓
User sees optimized prompt in input (can edit before sending)
```

**No database, no files, no persistent storage for this feature.**

## Notes

- This feature adds NO new persisted data
- All state is ephemeral (button UI state, keyboard event handling)
- Existing config and message types are reused without modification
- Dark mode detection is runtime-only (no storage needed)
