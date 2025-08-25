import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
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
  renderMode?: 'bubble' | 'expanded' | 'auto';
  specialState?: 'error' | 'queued' | 'streaming' | null;
}

export function MessageContent({ 
  role, 
  part, 
  isLast = false, 
  partIndex = 0, 
  totalParts = 1,
  messageId = '',
  renderMode = 'auto',
  specialState = null
}: MessageContentProps) {
  const actualRenderMode = renderMode === 'auto' 
    ? (role === 'user' ? 'bubble' : 'expanded')
    : renderMode;
    
  const isLastPart = isLast && partIndex === totalParts - 1;
  
  // Handle special states with styled containers
  if (specialState) {
    const content = 'text' in part ? part.text || '' : '';
    
    if (specialState === 'error') {
      return (
        <View style={getContentContainerStyle(role, actualRenderMode)}>
          <View style={styles.errorContainer}>
            <View style={styles.errorHeader}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Error</Text>
            </View>
            <Text style={styles.errorMessage}>{content}</Text>
          </View>
        </View>
      );
    }
    
    if (specialState === 'queued') {
      return (
        <View style={getContentContainerStyle(role, actualRenderMode)}>
          <View style={styles.queuedContainer}>
            <Text style={styles.queuedText}>{content}</Text>
          </View>
        </View>
      );
    }
    
    if (specialState === 'streaming') {
      return (
        <View style={getContentContainerStyle(role, actualRenderMode)}>
          <View style={styles.streamingContainer}>
            <Text style={styles.streamingText}>{content}</Text>
          </View>
        </View>
      );
    }
  }
  
  // Convert API part format to component part format
  const getComponentPart = () => {
    console.log('MessageContent - processing part:', {
      type: part.type,
      filename: 'filename' in part ? part.filename : 'no filename',
      mime: 'mime' in part ? part.mime : 'no mime',
      url: 'url' in part ? (part.url?.substring(0, 20) + '...') : 'no url'
    });
    
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
          filename: part.filename ?? 'Unknown file',
          mime: part.mime ?? '',
          url: part.url ?? '',
          file: {
            path: part.filename ?? 'Unknown file',
            content: '', // File content would come from another source
          },
        };
        
      case 'step-start':
        return {
          ...basePart,
          step: '',
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

  // Handle special todo tool case
  if (part.type === 'tool' && part.tool === 'todowrite') {
    const toolPart = part as ToolPart;
    if (toolPart.state?.status === 'completed') {
      const todos = (toolPart.state.input as { todos: Todo[] }).todos;
        
      if (role === 'user' && actualRenderMode === 'bubble') {
        return <TodoTool todos={todos} />;
      }
      
      return (
        <View style={getContentContainerStyle(role, actualRenderMode)}>
          <TodoTool todos={todos} />
        </View>
      );
    }
  }

  return (
    <View style={getContentContainerStyle(role, actualRenderMode)}>
      <PartComponentSelector
        part={componentPart}
        isLast={isLastPart}
        messageRole={role as 'user' | 'assistant'}
        renderMode={actualRenderMode}
        messageId={messageId}
        partIndex={partIndex}
        originalPart={part}
      />
    </View>
  );
}

const getContentContainerStyle = (role: string, renderMode: string) => {
  if (role === 'user' && renderMode === 'bubble') {
    return styles.userContentContainer;
  }
  return styles.assistantContentContainer;
};

const styles = StyleSheet.create({
  contentColumn: {
    flexShrink: 1,
    paddingLeft: 6,
  },
  userContentContainer: {
    // User message styles (bubble mode) - no flex: 1 to prevent huge bubbles
    flexShrink: 1,
    alignSelf: 'flex-end',
  },
  assistantContentContainer: {
    // Assistant message styles (expanded mode)
    flex: 1,
    paddingLeft: 6,
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
  errorContainer: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  errorMessage: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 20,
  },
  queuedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queuedText: {
    color: '#9ca3af',
    fontSize: 16,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  streamingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streamingText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
    fontStyle: 'italic',
    opacity: 0.8,
  },
});