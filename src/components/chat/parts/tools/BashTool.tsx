import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';

export const BashTool: React.FC<ToolComponentProps> = ({ 
  part, 
  toolName, 
  hasError, 
  result, 
  filePath,
  toolPart
}) => {
  const [isCommandExpanded, setIsCommandExpanded] = useState(false);
  
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

  // Extract command and description from tool input
  let command = '';
  let description = '';
  
  if ('input' in part && typeof part.input === 'object' && part.input !== null) {
    const input = part.input as Record<string, unknown>;
    command = (input.command as string) || '';
    description = (input.description as string) || '';
  }

  const commandLines = command.split('\n');
  const isMultilineCommand = commandLines.length > 1;
  const hasLongCommand = command.length > 60;
  const shouldTruncateCommand = hasLongCommand && !isCommandExpanded;

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <ToolHeader
          toolName={toolName}
          filePath={filePath}
          hasError={hasError}
          toolPart={toolPart}
          hideStateTitle={true}
        />

        {description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        )}

        {command && (
          <TouchableOpacity 
            style={styles.commandContainer}
            onPress={() => setIsCommandExpanded(!isCommandExpanded)}
            activeOpacity={hasLongCommand || isMultilineCommand ? 0.7 : 1}
            disabled={!hasLongCommand && !isMultilineCommand}
          >
            <View style={styles.commandHeader}>
              <View style={styles.promptContainer}>
                <Text style={styles.commandLabel}>$</Text>
              </View>
              <View style={styles.commandContentContainer}>
                <Text 
                  style={styles.commandText}
                  numberOfLines={shouldTruncateCommand ? 1 : undefined}
                >
                  {command}
                </Text>
                {(hasLongCommand || isMultilineCommand) && (
                  <Text style={styles.expandHint}>
                    {isCommandExpanded ? 'Tap to collapse' : 'Tap to expand'}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
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
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
    overflow: 'hidden',
  },
  commandHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  promptContainer: {
    marginRight: 8,
    paddingTop: 2,
  },
  commandLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22d3ee',
    fontFamily: 'monospace',
  },
  commandContentContainer: {
    flex: 1,
  },
  commandText: {
    fontSize: 13,
    color: '#e2e8f0',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  expandHint: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  descriptionContainer: {
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  descriptionText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});