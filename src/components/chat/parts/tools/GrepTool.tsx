import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';

export const GrepTool: React.FC<ToolComponentProps> = ({ 
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
  let include = '';
  
  if ('input' in part && typeof part.input === 'object' && part.input !== null) {
    const input = part.input as Record<string, unknown>;
    pattern = (input.pattern as string) || '';
    include = (input.include as string) || '';
  }

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <ToolHeader
          toolName={toolName}
          hasError={hasError}
        >
          {pattern && (
            <View style={styles.searchContainer}>
              <Text style={styles.searchLabel}>Search:</Text>
              <Text style={styles.patternText}>{pattern}</Text>
              {include && (
                <>
                  <Text style={styles.searchLabel}>in</Text>
                  <Text style={styles.includeText}>{include}</Text>
                </>
              )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
    flexWrap: 'wrap',
  },
  searchLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginRight: 6,
    fontWeight: '600',
  },
  patternText: {
    fontSize: 11,
    color: '#f59e0b',
    fontFamily: 'monospace',
    fontWeight: '600',
    marginRight: 6,
  },
  includeText: {
    fontSize: 11,
    color: '#10b981',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});