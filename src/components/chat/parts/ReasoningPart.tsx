import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessagePartProps, MessagePartContainer } from './MessagePart';

export const ReasoningPart: React.FC<MessagePartProps> = ({ part, isLast = false }) => {
  const [isExpanded, setIsExpanded] = useState(isLast);
  
  const thinkingContent = part.thinking || part.content || '';
  
  // Auto-expand last parts
  const shouldAutoExpand = isLast;
  const shouldShowExpandButton = thinkingContent.length > 400 && !shouldAutoExpand;
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const displayContent = shouldShowExpandButton && !isExpanded 
    ? thinkingContent.substring(0, 400) + '...'
    : thinkingContent;

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        {/* Reasoning header */}
        <View style={styles.header}>
          <View style={styles.thinkingIcon}>
            <Text style={styles.thinkingIconText}>🤔</Text>
          </View>
          <Text style={styles.headerText}>AI Reasoning</Text>
        </View>

        {/* Thinking content */}
        <View style={styles.contentContainer}>
          <Text style={styles.contentText}>
            {displayContent}
          </Text>
          
          {shouldShowExpandButton && (
            <TouchableOpacity 
              onPress={toggleExpanded}
              style={styles.expandButton}
            >
              <Text style={styles.expandButtonText}>
                {isExpanded ? 'Show less' : 'Show full reasoning'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </MessagePartContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  thinkingIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  thinkingIconText: {
    fontSize: 14,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a855f7',
  },
  contentContainer: {
    backgroundColor: '#1e1b4b',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed',
  },
  contentText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#e0e7ff',
    fontStyle: 'italic',
  },
  expandButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '500',
  },
});