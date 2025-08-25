import React from 'react';
import { View, Text } from 'react-native';
import type { Part, ToolPart } from '../../api/types.gen';
import type { Todo } from '../../types/todo';
import { PartComponentSelector } from './parts';
import { TodoTool } from './content/TodoTool';
import { MessageStyles } from '../../styles/messageStyles';

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
          <View style={MessageStyles.errorContainer}>
            <View style={MessageStyles.errorHeader}>
              <Text style={MessageStyles.errorIcon}>⚠️</Text>
              <Text style={MessageStyles.errorTitle}>Error</Text>
            </View>
            <Text style={MessageStyles.errorMessage}>{content}</Text>
          </View>
        </View>
      );
    }
    
    if (specialState === 'queued') {
      return (
        <View style={getContentContainerStyle(role, actualRenderMode)}>
          <View style={MessageStyles.queuedContainer}>
            <Text style={MessageStyles.queuedText}>{content}</Text>
          </View>
        </View>
      );
    }
    
    if (specialState === 'streaming') {
      return (
        <View style={getContentContainerStyle(role, actualRenderMode)}>
          <View style={MessageStyles.streamingContainer}>
            <Text style={MessageStyles.streamingText}>{content}</Text>
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
    return MessageStyles.userContentContainer;
  }
  return MessageStyles.assistantContentContainer;
};

// MessageContent no longer needs local styles - all styles are in unified MessageStyles