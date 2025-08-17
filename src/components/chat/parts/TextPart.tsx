import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MessagePartProps, MessagePartContainer } from './MessagePart';
import { TextContent } from '../content/TextContent';

export const TextPart: React.FC<MessagePartProps> = ({ 
  part, 
  isLast = false, 
  messageRole = 'assistant' 
}) => {
  const content = part.content || '';

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <TextContent
          content={content}
          isMarkdown={messageRole === 'assistant'}
          isLast={isLast}
          variant={messageRole}
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