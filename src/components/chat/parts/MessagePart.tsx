import React from 'react';
import { View, StyleSheet } from 'react-native';

import type { Part } from '../../../api/types.gen';

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
  messageId?: string;
  partIndex?: number;
  originalPart?: Part; // Original API part for access to full state information
}

export interface ExpandableProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  shouldShowExpandButton?: boolean;
}

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