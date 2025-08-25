import React from 'react';
import { View, StyleSheet } from 'react-native';

import type { Part } from '../../../api/types.gen';
import { colors } from '../../../styles/colors';

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
      ? styles.userBubbleContainer 
      : styles.expandedContainer,
    text: messageRole === 'user' && renderMode === 'bubble'
      ? styles.userBubbleText 
      : styles.assistantText,
    fileContainer: messageRole === 'user' && renderMode === 'bubble'
      ? styles.userFileContainer
      : styles.assistantFileContainer,
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
  
// User message styles (bubble mode)
  userBubbleContainer: {
    backgroundColor: colors.primary[600],
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexShrink: 1,
    flexGrow: 1,
  },
  
  userBubbleText: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  
  userFileContainer: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    padding: 12,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexGrow: 1,
  },
  
  // Assistant message styles (expanded mode)
  expandedContainer: {
    flex: 1,
    paddingLeft: 6,
  },
  
  assistantText: {
    color: colors.gray[200],
    fontSize: 16,
    lineHeight: 22,
  },
  
  assistantFileContainer: {
    // Keep existing assistant file styling
    flex: 1,
    paddingLeft: 6,
  },
});