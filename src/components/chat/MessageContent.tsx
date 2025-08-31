import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { Part, ToolPart } from '../../api/types.gen';
import type { Todo } from '../../types/todo';
import { PartComponentSelector } from './parts';
import { TodoTool } from './content/TodoTool';
import { MessageStyles } from '../../styles/messageStyles';
import { toast } from '../../utils/toast';

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

  // Copy functionality for assistant messages
  const handlePress = () => {
    if (role === 'assistant') {
      console.log('Assistant message pressed - long press to copy');
      toast.showInfo('Long press to copy full text');
    }
  };

  const handleCopyText = async () => {
    if (role === 'assistant' && 'text' in part) {
      const textToCopy = part.text || '';
      console.log('Assistant message long press - copying text:', textToCopy.substring(0, 50) + '...');
      try {
        await Clipboard.setStringAsync(textToCopy);
        toast.showSuccess('Text copied to clipboard');
      } catch (error) {
        console.error('Failed to copy text:', error);
        toast.showError('Failed to copy text');
      }
    }
  };
  
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
          // Extract file content from data URI (following pre-refactor working pattern)
          const extractFileContent = () => {
            // First try to get content from source if available (backward compatibility)
            if (part.source?.text?.value) {
              console.log('MessageContent - using source.text.value for file content');
              return part.source.text.value;
            }
            
            // Try to decode from data URI (like pre-refactor version)
            if (part.url && part.url.startsWith('data:') && part.url.includes(';base64,')) {
              try {
                const base64Data = part.url.split(',')[1];
                if (base64Data) {
                  const decodedContent = Buffer.from(base64Data, 'base64').toString('utf-8');
                  console.log('MessageContent - decoded content from data URI, length:', decodedContent.length);
                  return decodedContent;
                }
              } catch (error) {
                console.warn('MessageContent - failed to decode data URI:', error);
              }
            }
            
            console.log('MessageContent - no file content available');
            return '';
          };
          
          const fileContent = extractFileContent();
          const filePath = part.source?.path || part.filename || 'Unknown file';
          
          console.log('MessageContent - processing file part:', {
            hasSourceContent: !!part.source?.text?.value,
            hasDataUri: !!(part.url && part.url.startsWith('data:')),
            contentLength: fileContent.length,
            filePath: filePath,
            url: part.url?.substring(0, 50) + '...'
          });
          
          return {
            ...basePart,
            filename: part.filename ?? 'Unknown file',
            mime: part.mime ?? '',
            url: part.url ?? '',
            content: fileContent,
            file: {
              path: filePath,
              content: fileContent,
            },
            source: part.source, // Preserve the source for FilePart component
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

  const content = (
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

  // For assistant messages, wrap in TouchableOpacity for copy functionality
  if (role === 'assistant') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleCopyText}
        delayLongPress={300}
        style={MessageStyles.touchableContainer}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const getContentContainerStyle = (role: string, renderMode: string) => {
  if (role === 'user' && renderMode === 'bubble') {
    return MessageStyles.userContentContainer;
  }
  return MessageStyles.assistantContentContainer;
};

// MessageContent no longer needs local styles - all styles are in unified MessageStyles