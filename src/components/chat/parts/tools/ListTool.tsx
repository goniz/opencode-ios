import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';
import { getRelativePath } from '../../../../utils/pathUtils';

export const ListTool: React.FC<ToolComponentProps> = ({ 
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

  // Extract path from input
  let listPath = filePath;
  
  if (!listPath && 'input' in part && typeof part.input === 'object' && part.input !== null) {
    const input = part.input as Record<string, unknown>;
    listPath = (input.path as string) || '';
  }

  const relativePath = listPath ? getRelativePath(listPath) : '.';

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <ToolHeader
          toolName={toolName}
          hasError={hasError}
        >
          <View style={styles.pathContainer}>
            <Text style={styles.pathLabel}>📁</Text>
            <Text style={styles.pathText}>{relativePath}</Text>
          </View>
        </ToolHeader>

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
                expandText="Show contents"
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
  pathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  pathLabel: {
    fontSize: 12,
    marginRight: 6,
  },
  pathText: {
    fontSize: 12,
    color: '#60a5fa',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});