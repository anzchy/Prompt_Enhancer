import { loadConfig } from '../shared/config';
import { requestOptimizedPrompt } from '../shared/llm';
import { isOptimizePromptRequest, OptimizePromptResponse, MessageType, TriggerOptimizeMessage } from '../shared/messages';

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener((command) => {
  if (command === 'optimize-prompt') {
    // Query active tab and send TRIGGER_OPTIMIZE message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const message: TriggerOptimizeMessage = { type: MessageType.TriggerOptimize };
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isOptimizePromptRequest(message)) return;

  handleOptimize(message)
    .then((response) => sendResponse(response))
    .catch((error: Error) =>
      sendResponse({
        success: false,
        error: error?.message || 'Unknown error'
      } satisfies OptimizePromptResponse)
    );

  return true; // keep the message channel open for async responses
});

async function handleOptimize(message: Parameters<typeof isOptimizePromptRequest>[0]): Promise<OptimizePromptResponse> {
  const config = await loadConfig();
  if (!config.apiKey) {
    return { success: false, error: '请先在 Options 页面配置 API Key' };
  }
  const optimizedPrompt = await requestOptimizedPrompt(config, message.payload.originalPrompt, message.payload.pageHost);
  return { success: true, optimizedPrompt };
}
