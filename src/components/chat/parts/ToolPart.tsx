import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartProps, MessagePartContainer } from './MessagePart';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';
import type { ToolPart as ToolPartType, ToolStateCompleted, ToolStateError } from '../../../api/types.gen';
import { getRelativePath } from '../../../utils/pathUtils';

// Extract file path from tool input for read/write tools
function extractFilePath(input: unknown): string | undefined {
  if (typeof input === 'object' && input !== null) {
    const toolInput = input as Record<string, unknown>;
    // Common parameter names for file paths in read/write tools
    return (toolInput.filePath || toolInput.path || toolInput.file) as string | undefined;
  }
  return undefined;
}

// Count lines in a string
function countLines(text: string): number {
  if (!text) return 0;
  return text.split('\n').length;
}

export const ToolPart: React.FC<MessagePartProps> = ({ part, isLast = false }) => {
  // Type guard to check if part is a ToolPart
  const isToolPart = part.type === 'tool';
  
  // Check if we're dealing with the converted format from MessageContent or original API format
  const isConvertedFormat = 'result' in part || 'error' in part;
  const toolPart = isToolPart && !isConvertedFormat ? part as ToolPartType : null;
  
  const toolName = ('tool' in part ? part.tool : 'unknown') || 'unknown';
  const hasError = isConvertedFormat ? !!part.error : toolPart?.state?.status === 'error';
  
  // Extract tool state details
  let result = '';
  let filePath: string | undefined = undefined;
  let lineCount: number | undefined = undefined;
  
  if (isConvertedFormat) {
    // Handle converted format from MessageContent
    result = (part.result as string) || '';
    
    // Extract file path from input if available
    if ('input' in part) {
      filePath = extractFilePath(part.input);
    }
    
    // Count lines for write tool output
    if (toolName === 'write' && result) {
      lineCount = countLines(result);
    }
  } else if (toolPart?.state?.status === 'completed') {
    const completedState = toolPart.state as ToolStateCompleted;
    result = completedState.output || '';
    filePath = extractFilePath(completedState.input);
    
    // Count lines for write tool output
    if (toolName === 'write' && result) {
      lineCount = countLines(result);
    }
  } else if (toolPart?.state?.status === 'error') {
    const errorState = toolPart.state as ToolStateError;
    filePath = extractFilePath(errorState.input);
  } else if (toolPart?.state?.status === 'running') {
    filePath = extractFilePath(toolPart.state.input);
  }
  
  // Special handling for read tool display
  const isReadTool = toolName === 'read';
  const relativePath = isReadTool && filePath ? getRelativePath(filePath) : filePath;
  
  // Use expandable hook for results - called unconditionally (only for non-read tools)
  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent: displayResult,
    toggleExpanded,
  } = useExpandable({
    content: result,
    autoExpand: (hasError || isLast) && isToolPart && !isReadTool,
    contentType: 'tool',
  });

  // Return null for non-tool parts
  if (!isToolPart) {
    return null;
  }

  // Special rendering for read tool
  if (isReadTool && !hasError) {
    return (
      <MessagePartContainer>
        <View style={styles.container}>
          {/* Read tool header */}
          <View style={styles.readHeader}>
            <Text style={styles.readTitle}>
              Read <Text style={styles.readPath}>{relativePath || 'file'}</Text>
            </Text>
          </View>
        </View>
      </MessagePartContainer>
    );
  }

  // Regular tool rendering
  return (
    <MessagePartContainer>
      <View style={styles.container}>
        {/* Tool execution header */}
        <View style={styles.header}>
          <Text style={styles.toolName}>{toolName}</Text>
          
          {/* File path for read/write tools */}
          {filePath && (
            <Text style={styles.filePath} numberOfLines={1}>
              {filePath}
            </Text>
          )}
          
          {/* Line count for write tool */}
          {lineCount !== undefined && (
            <Text style={styles.lineCount}>
              {lineCount} {lineCount === 1 ? 'line' : 'lines'}
            </Text>
          )}
          
          {hasError && (
            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>Error</Text>
            </View>
          )}
        </View>

        {/* Tool result content */}
        {(result || (hasError && (isConvertedFormat ? part.error : (toolPart?.state && (toolPart.state as ToolStateError).error)))) && (
          <View style={[
            styles.resultContainer,
            hasError && styles.errorContainer
          ]}>
            <Text style={[
              styles.resultText,
              hasError && styles.errorText
            ]}>
              {hasError ? (isConvertedFormat ? part.error : (toolPart?.state ? (toolPart.state as ToolStateError).error : '')) : displayResult}
            </Text>
            
            {shouldShowExpandButton && !hasError && (
              <ExpandButton
                isExpanded={isExpanded}
                onPress={toggleExpanded}
                expandText="Show results"
                collapseText="Show less"
                variant="tool"
              />
            )}
          </View>
        )}
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
    flexWrap: 'wrap',
  },
  toolName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'capitalize',
    marginRight: 8,
  },
  filePath: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginRight: 8,
  },
  lineCount: {
    fontSize: 11,
    color: '#6b7280',
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  errorBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  errorBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#374151',
  },
  errorContainer: {
    borderLeftColor: '#dc2626',
    backgroundColor: '#1f1214',
  },
  resultText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#d1d5db',
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#f87171',
  },
  
  // Read tool specific styles
  readHeader: {
    marginBottom: 4,
  },
  readTitle: {
    fontSize: 13,
    color: '#e5e7eb',
    fontWeight: '500',
    lineHeight: 18,
  },
  readPath: {
    fontWeight: '600',
    color: '#60a5fa',
    fontFamily: 'monospace',
  },


});