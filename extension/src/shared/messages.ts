export const MessageType = {
  OptimizePrompt: 'OPTIMIZE_PROMPT',
  TriggerOptimize: 'TRIGGER_OPTIMIZE'
} as const;

export type MessageKind = typeof MessageType[keyof typeof MessageType];

export type OptimizePromptRequest = {
  type: typeof MessageType.OptimizePrompt;
  payload: {
    originalPrompt: string;
    styleId?: string;
    source?: 'content-script' | 'popup';
    pageHost?: string;
  };
};

export type OptimizePromptResponse = {
  success: boolean;
  optimizedPrompt?: string;
  error?: string;
};

export type TriggerOptimizeMessage = {
  type: typeof MessageType.TriggerOptimize;
};

export function isOptimizePromptRequest(message: unknown): message is OptimizePromptRequest {
  if (!message || typeof message !== 'object') return false;
  const typed = message as OptimizePromptRequest;
  return typed.type === MessageType.OptimizePrompt && Boolean(typed.payload?.originalPrompt);
}

export function isTriggerOptimizeMessage(message: unknown): message is TriggerOptimizeMessage {
  if (!message || typeof message !== 'object') return false;
  const typed = message as TriggerOptimizeMessage;
  return typed.type === MessageType.TriggerOptimize;
}
