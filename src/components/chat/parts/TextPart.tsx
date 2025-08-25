import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartProps, MessagePartContainer, getRenderMode, getMessagePartStyles } from './MessagePart';
import { TextContent } from '../content/TextContent';

export const TextPart: React.FC<MessagePartProps> = ({ 
  part, 
  isLast = false, 
  messageRole = 'assistant',
  renderMode = 'auto',
  messageId = '',
  partIndex = 0
}) => {
  const actualRenderMode = getRenderMode(renderMode, messageRole);
  const content = 'content' in part ? part.content || '' : '';
  
  if (messageRole === 'user' && actualRenderMode === 'bubble') {
    return (
      <MessagePartContainer>
        <View style={getMessagePartStyles({ messageRole: 'user', renderMode: 'bubble' }).container}>
          <Text style={getMessagePartStyles({ messageRole: 'user', renderMode: 'bubble' }).text}>
            {content}
          </Text>
        </View>
      </MessagePartContainer>
    );
  }
  
  // Existing complex rendering for assistant messages
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