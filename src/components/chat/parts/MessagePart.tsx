import React from 'react';
import { View, StyleSheet } from 'react-native';

export interface MessagePartProps {
  part: {
    type: string;
    content?: string;
    tool?: string;
    result?: string;
    error?: string;
    file?: {
      path: string;
      content: string;
    };
    thinking?: string;
    step?: string;
    [key: string]: unknown;
  };
  isLast?: boolean;
  messageRole?: 'user' | 'assistant';
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