import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';

export const BashTool: React.FC<ToolComponentProps> = ({ 
  part, 
  toolName, 
  hasError, 
  result, 
  filePath 
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

  // Extract command from tool input
  let command = '';
  let description = '';
  
  if ('input' in part && typeof part.input === 'object' && part.input !== null) {
    const input = part.input as Record<string, unknown>;
    command = (input.command as string) || '';
    description = (input.description as string) || '';
  }

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <ToolHeader
          toolName={toolName}
          filePath={filePath}
          hasError={hasError}
        />

        {description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        )}

        {command && (
          <View style={styles.commandContainer}>
            <Text style={styles.commandLabel}>$</Text>
            <Text style={styles.commandText} numberOfLines={1}>
              {command}
            </Text>
          </View>
        )}

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
                expandText="Show output"
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
  commandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  commandLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22d3ee',
    marginRight: 6,
    fontFamily: 'monospace',
  },
  commandText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontFamily: 'monospace',
    flex: 1,
  },
  descriptionContainer: {
    marginBottom: 6,
    paddingLeft: 4,
  },
  descriptionText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});