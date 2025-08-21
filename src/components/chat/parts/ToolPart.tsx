import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartProps, MessagePartContainer } from './MessagePart';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';
import type { ToolPart as ToolPartType, ToolStateCompleted, ToolStateError } from '../../../api/types.gen';

import {
  BashTool,
  ReadTool,
  WriteTool,
  EditTool,
  TodoWriteTool,
  TaskTool,
  GlobTool,
  GrepTool,
  ListTool,
  WebFetchTool,
} from './tools';
import { ToolStateIndicator } from './tools/ToolStateIndicator';

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

export const ToolPart: React.FC<MessagePartProps> = ({ part, originalPart }) => {
  // Type guard to check if part is a ToolPart
  const isToolPart = part.type === 'tool';
  
  // Return null for non-tool parts
  if (!isToolPart) {
    return null;
  }

  // Check if we're dealing with the converted format from MessageContent or original API format
  const isConvertedFormat = 'result' in part || 'error' in part;
  const toolPart = isToolPart && !isConvertedFormat ? part as ToolPartType : null;
  
  // Use original part if available and it's a tool part for better state access
  const apiToolPart = originalPart?.type === 'tool' ? originalPart as ToolPartType : toolPart;
  
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

  // Common props for all tool components
  const toolProps = {
    part,
    toolName,
    hasError,
    result,
    filePath,
    lineCount,
    toolPart: apiToolPart || undefined,
  };

  // Render specific tool component based on tool name
  switch (toolName) {
    case 'bash':
      return <BashTool {...toolProps} />;
    case 'read':
      return <ReadTool {...toolProps} />;
    case 'write':
      return <WriteTool {...toolProps} />;
    case 'edit':
      return <EditTool {...toolProps} />;
    case 'todowrite':
      return <TodoWriteTool {...toolProps} />;
    case 'task':
      return <TaskTool {...toolProps} />;
    case 'glob':
      return <GlobTool {...toolProps} />;
    case 'grep':
      return <GrepTool {...toolProps} />;
    case 'list':
      return <ListTool {...toolProps} />;
    case 'webfetch':
      return <WebFetchTool {...toolProps} />;
    default:
      // Fallback to generic tool rendering for unknown tools
      return <GenericTool {...toolProps} />;
  }
};

// Fallback generic tool component for unknown tool types
const GenericTool: React.FC<{
  part: { error?: string; [key: string]: unknown };
  toolName: string;
  hasError: boolean;
  result: string;
  filePath?: string;
  lineCount?: number;
  toolPart?: ToolPartType;
}> = ({ part, toolName, hasError, result, filePath, lineCount, toolPart }) => {
  // Use the provided toolPart which is already the best available (original or converted)
  const apiToolPart = toolPart;
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

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        {/* Tool execution header */}
        <View style={styles.header}>
          <Text style={styles.toolName}>{toolName}</Text>
          
          {/* Dynamic state indicator for API format tool parts */}
          {apiToolPart?.state && (
            <ToolStateIndicator state={apiToolPart.state} />
          )}
          
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
          
          {hasError && !apiToolPart?.state && (
            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>Error</Text>
            </View>
          )}
        </View>

        {/* Tool result content */}
        {(result || hasError) && (
          <View style={[
            styles.resultContainer,
            hasError && styles.errorContainer
          ]}>
            <Text style={[
              styles.resultText,
              hasError && styles.errorText
            ]}>
              {hasError ? part.error || 'An error occurred' : displayResult}
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
});