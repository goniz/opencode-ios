import React from 'react';
import { View, StyleSheet } from 'react-native';

import type { Part } from '../../../api/types.gen';
import { MessageStyles } from '../../../styles/messageStyles';

// Extended Part type to maintain backward compatibility with existing components
export type ExtendedPart = Part | {
  type: string;
  content?: string;
  result?: string;
  error?: string;
  file?: {
    path: string;
    content: string;
  };
  thinking?: string;
  step?: string;
  tool?: string;
  [key: string]: unknown;
};

export interface MessagePartProps {
  part: ExtendedPart;
  isLast?: boolean;
  messageRole?: 'user' | 'assistant';
  renderMode?: 'bubble' | 'expanded' | 'auto';
  messageId?: string;
  partIndex?: number;
  originalPart?: Part; // Original API part for access to full state information
}

export interface MessagePartStyleContext {
  messageRole: 'user' | 'assistant';
  renderMode: 'bubble' | 'expanded';
}

export interface ExpandableProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  shouldShowExpandButton?: boolean;
}

// Style helper functions for role-aware styling
export const getMessagePartStyles = (context: MessagePartStyleContext) => {
  const { messageRole, renderMode } = context;
  
  return {
    container: messageRole === 'user' && renderMode === 'bubble'
      ? MessageStyles.userBubbleContainer 
      : MessageStyles.expandedContainer,
    text: messageRole === 'user' && renderMode === 'bubble'
      ? MessageStyles.userBubbleText 
      : MessageStyles.assistantText,
    fileContainer: messageRole === 'user' && renderMode === 'bubble'
      ? MessageStyles.userFileContainer
      : MessageStyles.assistantFileContainer,
  };
};

// Helper function to determine render mode
export const getRenderMode = (
  renderMode: 'bubble' | 'expanded' | 'auto' | undefined,
  messageRole: 'user' | 'assistant' | undefined
): 'bubble' | 'expanded' => {
  if (renderMode && renderMode !== 'auto') {
    return renderMode;
  }
  
  return messageRole === 'user' ? 'bubble' : 'expanded';
};

export const MessagePartContainer: React.FC<{
  children: React.ReactNode;
  style?: object;
}> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
});