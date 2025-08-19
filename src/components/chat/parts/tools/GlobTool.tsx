import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';

export const GlobTool: React.FC<ToolComponentProps> = ({ 
  part, 
  toolName, 
  hasError, 
  result 
}) => {
  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent: displayResult,
    toggleExpanded,
  } = useExpandable({
    content: result,
    autoExpand: false,
    contentType: 'tool',
  });

  // Extract search pattern from input
  let pattern = '';
  
  if ('input' in part && typeof part.input === 'object' && part.input !== null) {
    const input = part.input as Record<string, unknown>;
    pattern = (input.pattern as string) || '';
  }

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <ToolHeader
          toolName={toolName}
          hasError={hasError}
        >
          {pattern && (
            <View style={styles.patternContainer}>
              <Text style={styles.patternLabel}>Pattern:</Text>
              <Text style={styles.patternText}>{pattern}</Text>
            </View>
          )}
        </ToolHeader>

        {(result || hasError) && (
          <ToolResult
            result={displayResult}
            hasError={hasError}
            error={hasError ? (part as any).error : undefined}
          >
            {shouldShowExpandButton && !hasError && (
              <ExpandButton
                isExpanded={isExpanded}
                onPress={toggleExpanded}
                expandText="Show matches"
                collapseText="Show less"
                variant="tool"
              />
            )}
          </ToolResult>
        )}
      </View>
    </MessagePartContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  patternContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  patternLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginRight: 6,
    fontWeight: '600',
  },
  patternText: {
    fontSize: 11,
    color: '#fbbf24',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});