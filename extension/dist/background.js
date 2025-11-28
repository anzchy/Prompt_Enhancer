// src/shared/config.ts
var SYNC_KEY = "promptEnhancerConfig";
var LOCAL_KEY = "promptEnhancerSecrets";
var DEFAULT_CONFIG = {
  apiBaseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4.1-mini",
  systemPrompt: "You upgrade user prompts into concise, structured prompts with clear inputs, outputs, and constraints. Return only the improved prompt."
};
function readFromStorage(area, key) {
  return new Promise((resolve) => {
    const storageArea = chrome?.storage?.[area];
    if (!storageArea) {
      resolve(void 0);
      return;
    }
    storageArea.get(key, (result) => resolve(result?.[key]));
  });
}
async function loadConfig() {
  const [syncConfig, localSecrets] = await Promise.all([
    readFromStorage("sync", SYNC_KEY),
    readFromStorage("local", LOCAL_KEY)
  ]);
  return {
    ...DEFAULT_CONFIG,
    ...syncConfig,
    apiKey: localSecrets?.apiKey ?? syncConfig?.apiKey ?? ""
  };
}
function normalizeApiBase(url) {
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_CONFIG.apiBaseUrl;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

// src/shared/llm.ts
async function requestOptimizedPrompt(config, originalPrompt, pageHost) {
  if (!originalPrompt.trim()) {
    throw new Error("Prompt is empty");
  }
  if (!config.apiKey) {
    throw new Error("API key is missing");
  }
  const endpoint = `${normalizeApiBase(config.apiBaseUrl)}/chat/completions`;
  const systemPrompt = config.systemPrompt || "";
  const userContent = buildUserContent(originalPrompt, pageHost);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ]
    })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Model request failed (${response.status}): ${text || "unknown error"}`);
  }
  const data = await response.json();
  const optimized = data?.choices?.[0]?.message?.content?.trim();
  if (!optimized) {
    throw new Error("Model returned no content");
  }
  return optimized;
}
function buildUserContent(originalPrompt, pageHost) {
  const hostLine = pageHost ? `Target host: ${pageHost}
` : "";
  return `${hostLine}Optimize the following prompt. Return only the improved prompt:

${originalPrompt}`;
}

// src/shared/messages.ts
var MessageType = {
  OptimizePrompt: "OPTIMIZE_PROMPT",
  TriggerOptimize: "TRIGGER_OPTIMIZE"
};
function isOptimizePromptRequest(message) {
  if (!message || typeof message !== "object") return false;
  const typed = message;
  return typed.type === MessageType.OptimizePrompt && Boolean(typed.payload?.originalPrompt);
}

// src/background/index.ts
chrome.commands.onCommand.addListener((command) => {
  if (command === "optimize-prompt") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const message = { type: MessageType.TriggerOptimize };
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isOptimizePromptRequest(message)) return;
  handleOptimize(message).then((response) => sendResponse(response)).catch(
    (error) => sendResponse({
      success: false,
      error: error?.message || "Unknown error"
    })
  );
  return true;
});
async function handleOptimize(message) {
  const config = await loadConfig();
  if (!config.apiKey) {
    return { success: false, error: "\u8BF7\u5148\u5728 Options \u9875\u9762\u914D\u7F6E API Key" };
  }
  const optimizedPrompt = await requestOptimizedPrompt(config, message.payload.originalPrompt, message.payload.pageHost);
  return { success: true, optimizedPrompt };
}
//# sourceMappingURL=background.js.map
