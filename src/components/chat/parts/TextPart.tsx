import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessagePartProps, MessagePartContainer } from './MessagePart';

export const TextPart: React.FC<MessagePartProps> = ({ 
  part, 
  isLast = false, 
  messageRole = 'assistant' 
}) => {
  const [isExpanded, setIsExpanded] = useState(isLast);
  const content = part.content || '';
  
  // Simple line estimation for collapse logic
  const estimatedLines = Math.ceil(content.length / 50);
  const shouldShowExpandButton = estimatedLines > 3 && !isLast;
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const displayContent = shouldShowExpandButton && !isExpanded 
    ? content.substring(0, 150) + '...'
    : content;

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
          <TouchableOpacity 
            onPress={toggleExpanded}
            style={styles.expandButton}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Show less' : 'Show more'}
            </Text>
          </TouchableOpacity>
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
  expandButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '500',
  },
});