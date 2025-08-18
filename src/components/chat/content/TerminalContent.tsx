import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';

export interface TerminalContentProps {
  command: string;
  output: string;
  isLast?: boolean;
  hasError?: boolean;
}

export const TerminalContent: React.FC<TerminalContentProps> = ({
  command,
  output,
  isLast = false,
  hasError = false,
}) => {
  // Use expandable hook for terminal output
  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent,
    toggleExpanded,
  } = useExpandable({
    content: output,
    autoExpand: isLast || hasError,
    contentType: 'terminal',
  });

  return (
    <View style={styles.container}>
      {/* Terminal header with command */}
      <View style={styles.header}>
        <View style={styles.headerDots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotMiddle]} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.commandText} numberOfLines={1}>
          {command}
        </Text>
      </View>
      
      {/* Terminal output */}
      <View style={styles.outputContainer}>
        <Text style={[
          styles.outputText,
          hasError && styles.errorText
        ]}>
          {displayContent}
        </Text>
        
        {shouldShowExpandButton && (
          <ExpandButton
            isExpanded={isExpanded}
            onPress={toggleExpanded}
            expandText="Show full output"
            collapseText="Show less"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d3748',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#4a5568',
  },
  headerDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4a5568',
  },
  dotMiddle: {
    marginHorizontal: 4,
  },
  commandText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#e2e8f0',
    fontFamily: 'monospace',
  },
  outputContainer: {
    backgroundColor: '#1a202c',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  outputText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#e2e8f0',
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#fc8181',
  },
});