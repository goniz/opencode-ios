import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MessagePartProps, MessagePartContainer } from './MessagePart';
import { TextContent } from '../content/TextContent';

export const TextPart: React.FC<MessagePartProps> = ({ 
  part, 
  isLast = false, 
  messageRole = 'assistant',
  messageId = '',
  partIndex = 0
}) => {
  // Type guard for text parts
  const content = 'content' in part ? part.content || '' : '';

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <TextContent
          content={content}
          isMarkdown={messageRole === 'assistant'}
          isLast={isLast}
          variant={messageRole}
          messageId={messageId}
          partIndex={partIndex}
        />
      </View>
    </MessagePartContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});