import type { Message, AssistantMessage } from '../../api/types.gen';
import type { ProviderModel } from '../../types/chat';

export function findLastAssistantMessage(messages: Message[]): AssistantMessage | null {
  // Find the last assistant message in the current session
  if (messages.length > 0) {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find(msg => msg.role === 'assistant');
    
    // Type guard to ensure it's actually an AssistantMessage
    if (lastAssistantMessage && 
        'providerID' in lastAssistantMessage && 
        'modelID' in lastAssistantMessage) {
      return lastAssistantMessage as AssistantMessage;
    }
  }
  
  return null;
}

export function extractProviderModel(message: AssistantMessage): ProviderModel | null {
  if (message.providerID && message.modelID) {
    return {
      providerID: message.providerID,
      modelID: message.modelID
    };
  }
  
  return null;
}