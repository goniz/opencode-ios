import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../styles/spacing';
import { MessageDecoration } from './MessageDecoration';
import { MessageContent } from './MessageContent';
import { MessageTimestamp } from './MessageTimestamp';
import { MessageStyles } from '../../styles/messageStyles';
import { filterMessageParts } from '../../utils/messageFiltering';
import type { Message, Part, AssistantMessage } from '../../api/types.gen';

interface MessageWithParts {
  info: Message;
  parts: Part[];
}

interface MessageRowProps {
  message: MessageWithParts;
  index: number;
  currentSessionId?: string;
  isStreamConnected: boolean;
  isGenerating: boolean;
  totalMessages: number;
  specialState?: 'error' | 'queued' | 'streaming' | null;
}

const MessageRow: React.FC<MessageRowProps> = memo(({
  message,
  index,
  currentSessionId,
  isStreamConnected,
  isGenerating,
  totalMessages,
  specialState = null
}) => {
  // Filter parts using the existing filtering logic
  const { filteredParts, hasContent } = (() => {
    const filtered = filterMessageParts(message.parts);
    return {
      filteredParts: filtered,
      hasContent: filtered.length > 0
    };
  })();
  
  const isUser = message.info.role === 'user';
  const isAssistant = message.info.role === 'assistant';
  const isStreaming = isAssistant && !hasContent && isStreamConnected;
  const hasError = isAssistant && 'error' in message.info && message.info.error;
  const isQueued = isUser && isGenerating && index === totalMessages - 1;
  const isLastMessage = index === totalMessages - 1;

  // Create synthetic parts for special states using valid Part types
  let partsToRender = filteredParts;
  let currentSpecialState = specialState;
  
  if (hasError && 'error' in message.info) {
    const assistantInfo = message.info as AssistantMessage;
    const error = assistantInfo.error!;
    const errorTitle = error.name === 'ProviderAuthError' ? 'Authentication Error' :
          error.name === 'MessageOutputLengthError' ? 'Output Length Error' :
          error.name === 'MessageAbortedError' ? 'Message Aborted' :
          'Unknown Error';
    const errorMessage = error.name === 'ProviderAuthError' && 'data' in error ? error.data.message :
                 error.name === 'UnknownError' && 'data' in error ? error.data.message :
                 error.name === 'MessageAbortedError' ? 'The message was aborted before completion.' :
                 error.name === 'MessageOutputLengthError' ? 'The response exceeded the maximum length limit.' :
                 'An unexpected error occurred.';
    partsToRender = [{
      type: 'text',
      text: `${errorTitle}: ${errorMessage}`,
      id: `error-${message.info.id}`,
      sessionID: currentSessionId || '',
      messageID: message.info.id
    }];
    currentSpecialState = 'error';
  } else if (isQueued) {
    partsToRender = [{
      type: 'text',
      text: 'Queued...',
      id: `queued-${message.info.id}`,
      sessionID: currentSessionId || '',
      messageID: message.info.id
    }];
    currentSpecialState = 'queued';
  } else if (isStreaming) {
    partsToRender = [{
      type: 'text',
      text: 'Generating...',
      id: `streaming-${message.info.id}`,
      sessionID: currentSessionId || '',
      messageID: message.info.id
    }];
    currentSpecialState = 'streaming';
  } else if (filteredParts.length === 0 && isUser) {
    partsToRender = [{
      type: 'text',
      text: 'User message',
      id: `fallback-${message.info.id}`,
      sessionID: currentSessionId || '',
      messageID: message.info.id
    }];
  }

  // Single unified rendering path for all messages
  return (
    <View style={[MessageStyles.messageContainer, styles.messageRowContainer]}>
      {partsToRender.map((part, partIndex) => {
        const isFirstPart = partIndex === 0;
        const isLastPart = partIndex === partsToRender.length - 1;
        
        return (
          <View key={`${message.info.id}-${index}-part-${partIndex}`} style={getMessageRowStyle(isUser)}>
            {!isUser && (
              <MessageDecoration 
                role={message.info.role}
                part={part}
                isFirstPart={isFirstPart}
                isLastPart={isLastPart}
                providerID={message.info.role === 'assistant' ? (message.info as AssistantMessage).providerID : undefined}
                modelID={message.info.role === 'assistant' ? (message.info as AssistantMessage).modelID : undefined}
              />
            )}
            <View style={getContentColumnStyle(isUser)}>
              <MessageContent 
                role={message.info.role}
                part={part}
                isLast={isLastMessage}
                partIndex={partIndex}
                totalParts={partsToRender.length}
                messageId={message.info.id}
                renderMode={isUser ? 'bubble' : 'expanded'}
                specialState={currentSpecialState}
              />
              {isLastPart && (
                <MessageTimestamp 
                  timestamp={message.info.time.created}
                  compact={true}
                />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to avoid unnecessary re-renders
  return (
    prevProps.message.info.id === nextProps.message.info.id &&
    prevProps.index === nextProps.index &&
    prevProps.currentSessionId === nextProps.currentSessionId &&
    prevProps.isStreamConnected === nextProps.isStreamConnected &&
    prevProps.isGenerating === nextProps.isGenerating &&
    prevProps.totalMessages === nextProps.totalMessages &&
    prevProps.specialState === nextProps.specialState &&
    // Deep compare parts array
    JSON.stringify(prevProps.message.parts) === JSON.stringify(nextProps.message.parts)
  );
});

MessageRow.displayName = 'MessageRow';

// Helper functions for unified message rendering
const getMessageRowStyle = (isUser: boolean) => {
  return isUser ? MessageStyles.userMessageRow : MessageStyles.twoColumnLayout;
};

const getContentColumnStyle = (isUser: boolean) => {
  return isUser ? MessageStyles.userContentColumn : MessageStyles.assistantContentColumn;
};

const styles = StyleSheet.create({
  messageRowContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
});

export { MessageRow };
export type { MessageRowProps, MessageWithParts };