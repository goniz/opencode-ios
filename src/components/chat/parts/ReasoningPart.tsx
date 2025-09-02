import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartProps, MessagePartContainer, getRenderMode, getMessagePartStyles } from './MessagePart';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';
import { secureSettings } from '../../../utils/secureSettings';

export const ReasoningPart: React.FC<MessagePartProps> = ({ 
  part, 
  isLast = false,
  messageRole = 'assistant',
  renderMode = 'auto'
}) => {
  const [showThinking, setShowThinking] = useState(true);
  const actualRenderMode = getRenderMode(renderMode, messageRole);

  useEffect(() => {
    const loadShowThinking = async () => {
      try {
        const show = await secureSettings.getShowThinking();
        setShowThinking(show);
      } catch (error) {
        console.error('Failed to load show thinking setting:', error);
      }
    };
    
    loadShowThinking();
  }, []);
  
  // Type guard for reasoning parts
  const thinkingContent = ('thinking' in part ? part.thinking : undefined) || 
                         ('content' in part ? part.content : undefined) || '';
  
  // Use expandable hook for reasoning content (always call to maintain hook order)
  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent,
    toggleExpanded,
  } = useExpandable({
    content: thinkingContent,
    autoExpand: isLast,
    contentType: 'reasoning',
  });
  
  // Don't render thinking blocks if the setting is disabled
  if (!showThinking) {
    return null;
  }

  // For user messages in bubble mode, show a simplified version
  if (messageRole === 'user' && actualRenderMode === 'bubble') {
    return (
      <MessagePartContainer>
        <View style={getMessagePartStyles({ messageRole: 'user', renderMode: 'bubble' }).container}>
          <Text style={getMessagePartStyles({ messageRole: 'user', renderMode: 'bubble' }).text}>
            {thinkingContent}
          </Text>
        </View>
      </MessagePartContainer>
    );
  }

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
            <ExpandButton
              isExpanded={isExpanded}
              onPress={toggleExpanded}
              expandText="Show full reasoning"
              collapseText="Show less"
              variant="reasoning"
            />
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

});