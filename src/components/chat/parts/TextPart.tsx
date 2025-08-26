import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MessagePartProps, MessagePartContainer, getRenderMode, getMessagePartStyles } from './MessagePart';
import { TextContent } from '../content/TextContent';
import { toast } from '../../../utils/toast';

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

  const handleCopyText = async () => {
    try {
      await Clipboard.setStringAsync(content);
      toast.showSuccess('Text copied to clipboard');
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast.showError('Failed to copy text');
    }
  };

  const handlePress = () => {
    // Provide immediate feedback for regular press
    toast.showInfo('Long press to copy full text');
  };

  if (messageRole === 'user' && actualRenderMode === 'bubble') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleCopyText}
        delayLongPress={300}
        style={getMessagePartStyles({ messageRole: 'user', renderMode: 'bubble' }).container}
        activeOpacity={0.7}
      >
        <Text
          style={getMessagePartStyles({ messageRole: 'user', renderMode: 'bubble' }).text}
          selectable={true}
        >
          {content}
        </Text>
      </TouchableOpacity>
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