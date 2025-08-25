import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';
// Simple helper to make paths more readable by removing leading slash
const getDisplayPath = (filePath: string): string => {
  if (!filePath) return '';
  return filePath.startsWith('/') ? filePath.substring(1) : filePath;
};

export const WriteTool: React.FC<ToolComponentProps> = ({ 
  part, 
  toolName, 
  hasError, 
  result, 
  filePath,
  lineCount,
  toolPart
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

  const relativePath = filePath ? getDisplayPath(filePath) : undefined;

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <ToolHeader
          toolName={toolName}
          filePath={relativePath}
          lineCount={lineCount}
          hasError={hasError}
          toolPart={toolPart}
        >
          {!hasError && (
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>Written</Text>
            </View>
          )}
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
                expandText="Show content"
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
  successBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  successBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});