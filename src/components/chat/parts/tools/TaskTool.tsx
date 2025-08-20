import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';

export const TaskTool: React.FC<ToolComponentProps> = ({ 
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

  // Extract task details from input
  let description = '';
  let subagentType = '';
  
  if ('input' in part && typeof part.input === 'object' && part.input !== null) {
    const input = part.input as Record<string, unknown>;
    description = (input.description as string) || '';
    subagentType = (input.subagent_type as string) || '';
  }

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <ToolHeader
          toolName={toolName}
          hasError={hasError}
        >
          {subagentType && (
            <View style={styles.agentBadge}>
              <Text style={styles.agentBadgeText}>{subagentType}</Text>
            </View>
          )}
        </ToolHeader>

        {description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Task:</Text>
            <Text style={styles.descriptionText}>{description}</Text>
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
                expandText="Show agent output"
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
  agentBadge: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  agentBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  descriptionLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 12,
    color: '#e2e8f0',
    lineHeight: 16,
  },
});