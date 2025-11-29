# Message Protocol Contracts

**Feature**: ChatGPT Inline Button
**Date**: 2025-11-28
**Status**: No changes required - using existing protocol

## Overview

This feature does NOT introduce new message types. It reuses the existing `OPTIMIZE_PROMPT` message protocol defined in `extension/src/shared/messages.ts`.

## Existing Message: OPTIMIZE_PROMPT

**Direction**: Content Script → Background Worker → Content Script

### Request Schema

```typescript
type OptimizePromptRequest = {
  type: 'OPTIMIZE_PROMPT';
  payload: {
    originalPrompt: string;        // Required: User's input text
    styleId?: string;              // Optional: Style preset (unused in v0.1)
    source?: 'content-script' | 'popup';  // Source of request
    pageHost?: string;             // e.g., "chatgpt.com"
  };
};
```

**Example Request** (from content script):
```json
{
  "type": "OPTIMIZE_PROMPT",
  "payload": {
    "originalPrompt": "写个 Python 脚本抓取网站",
    "source": "content-script",
    "pageHost": "chatgpt.com"
  }
}
```

### Response Schema

```typescript
type OptimizePromptResponse = {
  success: boolean;
  optimizedPrompt?: string;      // Present if success=true
  error?: string;                // Present if success=false
};
```

**Example Success Response**:
```json
{
  "success": true,
  "optimizedPrompt": "请编写一个 Python 脚本，实现以下功能：\n\n输入：目标网站 URL\n输出：抓取的新闻标题和链接列表\n\n要求：\n1. 使用 requests 和 BeautifulSoup 库\n2. 处理常见的网络错误（超时、404等）\n3. 输出格式为 JSON\n4. 添加合理的请求延迟避免被封\n\n请给出完整代码和使用示例。"
}
```

**Example Error Response**:
```json
{
  "success": false,
  "error": "请先在 Options 页面配置 API Key"
}
```

## Validation

**Request Validation** (background/index.ts):
```typescript
function isOptimizePromptRequest(message: unknown): message is OptimizePromptRequest {
  if (!message || typeof message !== 'object') return false;
  const typed = message as OptimizePromptRequest;
  return typed.type === MessageType.OptimizePrompt
    && Boolean(typed.payload?.originalPrompt);
}
```

## Error Handling

**Error Types**:
1. **Empty Prompt**: Validated in content script before sending message
   - Content script shows: "请输入内容" (1.2 seconds)

2. **Missing API Key**: Validated in background worker
   - Background returns: `{ success: false, error: "请先在 Options 页面配置 API Key" }`

3. **API Request Failed**: Network or API error
   - Background catches error and returns: `{ success: false, error: error.message }`

4. **Empty API Response**: Model returns no content
   - Background throws: "Model returned no content"

## Keyboard Shortcut Impact

**No Protocol Changes**: Keyboard shortcut (Ctrl+Shift+O) will trigger the same `handleOptimize()` function that the button click triggers. The message protocol remains identical.

```typescript
// content/index.ts
button.addEventListener('click', () => handleOptimize(button, target));

// NEW: Keyboard listener will call same function
document.addEventListener('keydown', (e) => {
  if (isOptimizeShortcut(e)) {
    e.preventDefault();
    handleOptimize(button, target); // ← Same function
  }
});
```

## Notes

- No new message types needed for this feature
- No changes to `extension/src/shared/messages.ts` required
- Existing type guards and validation logic remain unchanged
- Both button click and keyboard shortcut use identical message flow
