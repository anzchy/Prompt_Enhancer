// src/shared/messages.ts
var MessageType = {
  OptimizePrompt: "OPTIMIZE_PROMPT",
  TriggerOptimize: "TRIGGER_OPTIMIZE"
};

// src/popup/index.ts
var inputEl = document.getElementById("inputPrompt");
var outputEl = document.getElementById("outputPrompt");
var statusEl = document.getElementById("statusText");
var optimizeBtn = document.getElementById("optimizeBtn");
var copyBtn = document.getElementById("copyBtn");
var clearBtn = document.getElementById("clearBtn");
var styleSelect = document.getElementById("styleSelect");
optimizeBtn?.addEventListener("click", optimizePrompt);
copyBtn?.addEventListener("click", copyOutput);
clearBtn?.addEventListener("click", clearFields);
function setStatus(text) {
  if (!statusEl) return;
  statusEl.textContent = text;
}
async function optimizePrompt() {
  const prompt = inputEl?.value.trim() || "";
  if (!prompt) {
    setStatus("\u8BF7\u8F93\u5165\u9700\u8981\u4F18\u5316\u7684 Prompt");
    return;
  }
  setLoading(true);
  setStatus("\u4F18\u5316\u4E2D...");
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.OptimizePrompt,
      payload: { originalPrompt: prompt, styleId: styleSelect?.value, source: "popup" }
    });
    if (!response?.success || !response.optimizedPrompt) {
      setStatus(response?.error || "\u4F18\u5316\u5931\u8D25");
      return;
    }
    if (outputEl) outputEl.value = response.optimizedPrompt;
    setStatus("\u5B8C\u6210\uFF0C\u53EF\u590D\u5236\u6216\u7F16\u8F91");
  } catch (error) {
    console.error("Optimize failed", error);
    setStatus("\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E");
  } finally {
    setLoading(false);
  }
}
function copyOutput() {
  const value = outputEl?.value || "";
  if (!value) {
    setStatus("\u6682\u65E0\u53EF\u590D\u5236\u5185\u5BB9");
    return;
  }
  navigator.clipboard.writeText(value).then(() => setStatus("\u5DF2\u590D\u5236")).catch(() => setStatus("\u590D\u5236\u5931\u8D25"));
}
function clearFields() {
  if (inputEl) inputEl.value = "";
  if (outputEl) outputEl.value = "";
  setStatus("");
}
function setLoading(loading) {
  optimizeBtn.disabled = loading;
  copyBtn.disabled = loading;
  clearBtn.disabled = loading;
  optimizeBtn.textContent = loading ? "\u4F18\u5316\u4E2D\u2026" : "\u2728 \u4F18\u5316";
}
//# sourceMappingURL=popup.js.map
