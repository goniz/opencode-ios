import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartProps, MessagePartContainer } from './MessagePart';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';

export const TextPart: React.FC<MessagePartProps> = ({ 
  part, 
  isLast = false, 
  messageRole = 'assistant' 
}) => {
  const content = part.content || '';
  
  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent,
    toggleExpanded,
  } = useExpandable({
    content,
    maxLines: 3,
    autoExpand: isLast,
    contentType: 'text',
  });

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <Text style={[
          styles.text,
          messageRole === 'user' ? styles.userText : styles.assistantText
        ]}>
          {displayContent}
        </Text>
        
        {shouldShowExpandButton && (
          <ExpandButton
            isExpanded={isExpanded}
            onPress={toggleExpanded}
            expandText="Show more"
            collapseText="Show less"
          />
        )}
      </View>
    </MessagePartContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e5e7eb',
  },
  userText: {
    color: '#e5e7eb',
  },
  assistantText: {
    color: '#e5e7eb',
  },
});