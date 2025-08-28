import type { Message, AssistantMessage } from '../../api/types.gen';
import type { ContextInfo } from '../../types/chat';

// Helper function to format large numbers in human-readable form (matches official OpenCode TUI)
export function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    const formatted = `${(count / 1000000).toFixed(1)}M`;
    return formatted.replace('.0M', 'M');
  } else if (count >= 1000) {
    const formatted = `${(count / 1000).toFixed(1)}K`;
    return formatted.replace('.0K', 'K');
  }
  return Math.floor(count).toString();
}

export function calculateTokenInfo(
  messages: Message[], 
  availableModels: {providerID: string, modelID: string, displayName: string, contextLimit: number}[], 
  currentModel?: {providerID: string, modelID: string}
): ContextInfo | null {
  // Calculate tokens and cost following official OpenCode TUI implementation
  let totalTokens = 0;
  let totalCost = 0;
  
  // Iterate forward through messages (like official implementation)
  for (const msg of messages) {
    if (msg.role === 'assistant' && 'tokens' in msg && msg.tokens) {
      const assistant = msg as AssistantMessage;
      const usage = assistant.tokens;
      
      // Sum cost from all assistant messages
      totalCost += assistant.cost || 0;
      
      // Overwrite tokens with each message that has output > 0 (like official implementation)
      if (usage && usage.output > 0) {
        if (assistant.summary) {
          totalTokens = usage.output || 0;
          continue; // Skip to next message for summary
        }
        totalTokens = (usage.input || 0) + 
                     (usage.cache?.read || 0) + 
                     (usage.cache?.write || 0) + 
                     (usage.output || 0) + 
                     (usage.reasoning || 0);
      }
    }
  }

  // Get the current model's context limit
  const currentModelInfo = currentModel && availableModels.length > 0 
    ? availableModels.find(m => m.providerID === currentModel.providerID && m.modelID === currentModel.modelID)
    : null;

  // Check if current model is a subscription model (cost is 0 for both input and output)
  const isSubscriptionModel = currentModelInfo && 
    availableModels.length > 0 &&
    // We'd need to check the model's cost structure, but for now assume non-subscription
    false;
  
  if (currentModelInfo && totalTokens > 0) {
    return {
        currentTokens: totalTokens,
        maxTokens: currentModelInfo.contextLimit,
        percentage: Math.floor((totalTokens / currentModelInfo.contextLimit) * 100),
        sessionCost: totalCost,
        isSubscriptionModel: isSubscriptionModel || false,
      };
  }
  
  return null;
}