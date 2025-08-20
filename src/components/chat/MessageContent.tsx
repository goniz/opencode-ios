import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Part, ToolPart } from '../../api/types.gen';
import type { Todo } from '../../types/todo';
import { PartComponentSelector } from './parts';
import { TodoTool } from './content/TodoTool';

interface MessageContentProps {
  role: string;
  part: Part;
  isLast?: boolean;
  partIndex?: number;
  totalParts?: number;
  messageId?: string;
}

export function MessageContent({ 
  role, 
  part, 
  isLast = false, 
  partIndex = 0, 
  totalParts = 1,
  messageId = ''
}: MessageContentProps) {
  // Determine if this is the last part of the last message
  const isLastPart = isLast && partIndex === totalParts - 1;
  
  // Convert API part format to component part format
  const getComponentPart = () => {
    const basePart = {
      type: part.type,
    };

    switch (part.type) {
      case 'text':
        return {
          ...basePart,
          content: part.text ?? '',
        };
        
      case 'reasoning':
        return {
          ...basePart,
          content: part.text ?? '',
          thinking: part.text ?? '',
        };
        
      case 'tool':
        return {
          ...basePart,
          tool: part.tool ?? '',
          result: part.state?.status === 'completed' ? (part.state.output ?? '') : '',
          error: part.state?.status === 'error' ? part.state.error : undefined,
          input: part.state?.status === 'completed' || part.state?.status === 'error' || part.state?.status === 'running' 
            ? part.state.input : undefined,
        };
        
      case 'file':
        return {
          ...basePart,
          file: {
            path: part.filename ?? 'Unknown file',
            content: '', // File content would come from another source
          },
        };
        
      case 'step-start':
        return {
          ...basePart,
          step: 'Starting task...',
        };
        
        case 'agent':
        return {
          ...basePart,
          content: `Agent: ${(part as { name?: string }).name ?? 'Unknown'}`,
        };
        
      default:
        return {
          ...basePart,
          content: `Unknown part type: ${part.type}`,
        };
    }
  };

  const componentPart = getComponentPart();

  if (part.type === 'tool' && part.tool === 'todowrite') {
    const toolPart = part as ToolPart;
    if (toolPart.state?.status === 'completed') {
      const todos = (toolPart.state.input as { todos: Todo[] }).todos;
      return (
        <View style={styles.contentColumn}>
          <TodoTool todos={todos} />
        </View>
      );
    }
  }

  return (
    <View style={styles.contentColumn}>
      <PartComponentSelector
        part={componentPart}
        isLast={isLastPart}
        messageRole={role as 'user' | 'assistant'}
        messageId={messageId}
        partIndex={partIndex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contentColumn: {
    flex: 1,
    paddingLeft: 8,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#ffffff',
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#e5e7eb',
  },
  reasoningContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  reasoningLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#d1d5db',
    fontStyle: 'italic',
  },
  toolContainer: {
    backgroundColor: '#0f1419',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  toolHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  toolOutput: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#9ca3af',
    backgroundColor: '#000000',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  toolError: {
    fontSize: 14,
    color: '#ef4444',
    backgroundColor: '#1f1416',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  fileContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  fileText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  stepText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  agentText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});