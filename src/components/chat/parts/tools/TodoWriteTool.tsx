import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';

export const TodoWriteTool: React.FC<ToolComponentProps> = ({ 
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

  // Extract todo count from input
  let todoCount = 0;
  
  if ('input' in part && typeof part.input === 'object' && part.input !== null) {
    const input = part.input as Record<string, unknown>;
    if (input.todos && Array.isArray(input.todos)) {
      todoCount = input.todos.length;
    }
  }

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <ToolHeader
          toolName={toolName}
          hasError={hasError}
        >
          {todoCount > 0 && (
            <View style={styles.todoCountBadge}>
              <Text style={styles.todoCountText}>
                {todoCount} {todoCount === 1 ? 'todo' : 'todos'}
              </Text>
            </View>
          )}
          {!hasError && (
            <View style={styles.todoBadge}>
              <Text style={styles.todoBadgeText}>Updated</Text>
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
                expandText="Show todos"
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
  todoCountBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  todoCountText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
  },
  todoBadge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  todoBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});