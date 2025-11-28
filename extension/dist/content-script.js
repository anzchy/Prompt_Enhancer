// src/shared/messages.ts
var MessageType = {
  OptimizePrompt: "OPTIMIZE_PROMPT",
  TriggerOptimize: "TRIGGER_OPTIMIZE"
};
function isTriggerOptimizeMessage(message) {
  if (!message || typeof message !== "object") return false;
  const typed = message;
  return typed.type === MessageType.TriggerOptimize;
}

// src/content/button-styles.ts
function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}
function applyButtonStyles(button) {
  console.log("[Prompt Optimizer] Button styles applied via CSS");
}
function observeThemeChanges(button) {
  const observer = new MutationObserver(() => {
    const isDark = isDarkMode();
    console.log("[Prompt Optimizer] Theme changed to:", isDark ? "dark" : "light");
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"]
  });
  return observer;
}

// src/content/index.ts
var BUTTON_CLASS = "prompt-enhancer-btn";
var BUTTON_TEXT = "\u4F18\u5316\u6307\u4EE4";
console.log("[Prompt Optimizer] Content script loaded on:", window.location.href);
function selectorMap(host) {
  if (host.includes("chatgpt.com") || host.includes("chat.openai.com")) {
    return ['div[role="textbox"]', "#prompt-textarea", 'textarea[placeholder*="Message"]'];
  }
  if (host.includes("manus.im")) {
    return ['div[contenteditable="true"][role="textbox"]', "textarea", 'div[role="textbox"]'];
  }
  if (host.includes("gemini.google.com")) {
    return ["textarea", 'div[contenteditable="true"]'];
  }
  return ['div[role="textbox"]', "textarea", 'input[type="text"]'];
}
function findPromptInput() {
  const selectors = selectorMap(window.location.host);
  console.log("[Prompt Optimizer] Trying selectors:", selectors);
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      console.log("[Prompt Optimizer] \u2705 Found input element:", selector, el);
      return el;
    }
  }
  console.warn("[Prompt Optimizer] \u274C Could not find input element");
  return null;
}
function getPromptValue(el) {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value || "";
  }
  return el.textContent || "";
}
function setPromptValue(el, value) {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  el.textContent = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
function insertButton(target) {
  if (document.querySelector(`.${BUTTON_CLASS}`)) {
    console.log("[Prompt Optimizer] Button already exists");
    return;
  }
  console.log("[Prompt Optimizer] Creating button...");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = BUTTON_TEXT;
  button.className = BUTTON_CLASS;
  applyButtonStyles(button);
  observeThemeChanges(button);
  button.addEventListener("click", () => handleOptimize(button, target));
  console.log("[Prompt Optimizer] Trying insertion strategies...");
  const plusButtonEl = document.querySelector('[data-testid="composer-plus-btn"]');
  console.log("[Prompt Optimizer] Strategy 1 - Plus button found:", plusButtonEl);
  if (plusButtonEl) {
    const plusContainer = plusButtonEl.parentElement;
    console.log("[Prompt Optimizer] Plus button container:", plusContainer);
    if (plusContainer) {
      plusContainer.appendChild(button);
      console.log("[Prompt Optimizer] \u2705 Button inserted via Strategy 1 (next to + button)");
      return;
    }
  }
  const leadingArea = document.querySelector('[class*="grid-area:leading"]');
  console.log("[Prompt Optimizer] Strategy 2 - Leading area:", leadingArea);
  if (leadingArea) {
    const plusButtonSpan = leadingArea.querySelector("span.flex");
    console.log("[Prompt Optimizer] Plus button span:", plusButtonSpan);
    if (plusButtonSpan) {
      plusButtonSpan.appendChild(button);
      console.log("[Prompt Optimizer] \u2705 Button inserted via Strategy 2 (grid-area:leading)");
      return;
    }
  }
  const parent = target.parentElement;
  console.log("[Prompt Optimizer] Strategy 3 - Target parent:", parent);
  if (parent) {
    parent.insertBefore(button, target);
    console.log("[Prompt Optimizer] \u2705 Button inserted via Strategy 3 (before target)");
    return;
  }
  target.insertAdjacentElement("beforebegin", button);
  console.log("[Prompt Optimizer] \u2705 Button inserted via Strategy 4 (insertAdjacentElement)");
}
async function handleOptimize(button, target) {
  console.log("[Prompt Optimizer] Optimize triggered");
  const originalPrompt = getPromptValue(target).trim();
  if (!originalPrompt) {
    console.warn("[Prompt Optimizer] Empty prompt");
    button.textContent = "\u8BF7\u8F93\u5165\u5185\u5BB9";
    setTimeout(() => button.textContent = BUTTON_TEXT, 1200);
    return;
  }
  console.log("[Prompt Optimizer] Original prompt:", originalPrompt.substring(0, 50) + "...");
  setLoading(button, true);
  try {
    console.log("[Prompt Optimizer] Sending request to background...");
    const response = await chrome.runtime.sendMessage({
      type: MessageType.OptimizePrompt,
      payload: { originalPrompt, source: "content-script", pageHost: window.location.host }
    });
    console.log("[Prompt Optimizer] Response:", response);
    if (!response?.success || !response.optimizedPrompt) {
      const msg = response?.error || "\u4F18\u5316\u5931\u8D25";
      console.error("[Prompt Optimizer] Failed:", msg);
      button.textContent = msg;
      setTimeout(() => button.textContent = BUTTON_TEXT, 1400);
      return;
    }
    console.log("[Prompt Optimizer] \u2705 Success, updating prompt");
    setPromptValue(target, response.optimizedPrompt);
  } catch (error) {
    console.error("[Prompt Optimizer] Error:", error);
    button.textContent = "\u8BF7\u6C42\u9519\u8BEF";
    setTimeout(() => button.textContent = BUTTON_TEXT, 1400);
  } finally {
    setLoading(button, false);
  }
}
function setLoading(button, loading) {
  button.disabled = loading;
  button.textContent = loading ? "\u4F18\u5316\u4E2D\u2026" : BUTTON_TEXT;
  if (loading) {
    button.classList.add("loading");
  } else {
    button.classList.remove("loading");
  }
}
function mount() {
  console.log("[Prompt Optimizer] mount() called");
  const host = window.location.host;
  const supportedHosts = ["chatgpt.com", "chat.openai.com"];
  const isSupported = supportedHosts.some((h) => host.includes(h));
  if (!isSupported) {
    console.log("[Prompt Optimizer] Unsupported host:", host);
    return;
  }
  console.log("[Prompt Optimizer] \u2705 Supported host:", host);
  const input = findPromptInput();
  if (input) {
    console.log("[Prompt Optimizer] Input found immediately");
    insertButton(input);
    return;
  }
  console.log("[Prompt Optimizer] Setting up MutationObserver...");
  let attempts = 0;
  const maxAttempts = 100;
  const observer = new MutationObserver(() => {
    attempts++;
    const found = findPromptInput();
    if (found) {
      console.log("[Prompt Optimizer] \u2705 Input found via observer (attempt", attempts, ")");
      insertButton(found);
      observer.disconnect();
    } else if (attempts >= maxAttempts) {
      console.error("[Prompt Optimizer] \u274C Failed after", maxAttempts, "attempts");
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
if (document.readyState === "complete" || document.readyState === "interactive") {
  console.log("[Prompt Optimizer] Document ready, mounting...");
  mount();
} else {
  console.log("[Prompt Optimizer] Waiting for DOMContentLoaded...");
  window.addEventListener("DOMContentLoaded", () => {
    console.log("[Prompt Optimizer] DOMContentLoaded fired");
    mount();
  });
}
setTimeout(() => {
  console.log("[Prompt Optimizer] Delayed mount attempt (2s)");
  mount();
}, 2e3);
chrome.runtime.onMessage.addListener((message) => {
  if (isTriggerOptimizeMessage(message)) {
    console.log("[Prompt Optimizer] Keyboard shortcut triggered");
    const button = document.querySelector(`.${BUTTON_CLASS}`);
    const target = findPromptInput();
    if (button && target) {
      handleOptimize(button, target);
    } else {
      console.warn("[Prompt Optimizer] Cannot handle shortcut - button or input missing");
    }
  }
});
console.log("[Prompt Optimizer] Content script initialized");
//# sourceMappingURL=content-script.js.map
