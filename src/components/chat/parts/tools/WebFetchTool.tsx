import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';

export const WebFetchTool: React.FC<ToolComponentProps> = ({ 
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

  // Extract URL from input
  let url = '';
  let format = '';
  
  if ('input' in part && typeof part.input === 'object' && part.input !== null) {
    const input = part.input as Record<string, unknown>;
    url = (input.url as string) || '';
    format = (input.format as string) || '';
  }

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <ToolHeader
          toolName={toolName}
          hasError={hasError}
        />

        {url && (
          <View style={styles.urlContainer}>
            <Text style={styles.urlLabel}>🌐</Text>
            <Text style={styles.urlText}>
              {url}
            </Text>
            {format && (
              <View style={styles.formatBadge}>
                <Text style={styles.formatText}>{format}</Text>
              </View>
            )}
          </View>
        )}

        {(result || hasError) && (
          <ToolResult
            result={displayResult}
            hasError={hasError}
            error={hasError ? (part as { error?: string }).error : undefined}
          >
            {shouldShowExpandButton && !hasError && (
              <ExpandButton
                isExpanded={isExpanded}
                onPress={toggleExpanded}
                expandText="Show content"
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
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  urlLabel: {
    fontSize: 12,
    marginRight: 6,
  },
  urlText: {
    fontSize: 11,
    color: '#60a5fa',
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 6,
    flexWrap: 'wrap',
  },
  formatBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  formatText: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});