import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';
import { getRelativePath } from '../../../../utils/pathUtils';

export const EditTool: React.FC<ToolComponentProps> = ({ 
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

  const relativePath = filePath ? getRelativePath(filePath) : undefined;

  // Extract edit details from input
  let oldString = '';
  let newString = '';
  
  if ('input' in part && typeof part.input === 'object' && part.input !== null) {
    const input = part.input as Record<string, unknown>;
    oldString = (input.oldString as string) || '';
    newString = (input.newString as string) || '';
  }

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <ToolHeader
          toolName={toolName}
          hasError={hasError}
        >
          {!hasError && (
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>Modified</Text>
            </View>
          )}
        </ToolHeader>
        
        {relativePath && (
          <View style={styles.filePathContainer}>
            <Text style={styles.filePathText}>{relativePath}</Text>
          </View>
        )}

        {(oldString || newString) && !hasError && (
          <View style={styles.editDetails}>
            {oldString && (
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>- Removed:</Text>
                <Text style={styles.oldText} numberOfLines={2}>
                  {oldString}
                </Text>
              </View>
            )}
            {newString && (
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>+ Added:</Text>
                <Text style={styles.newText} numberOfLines={2}>
                  {newString}
                </Text>
              </View>
            )}
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
                expandText="Show details"
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
  editBadge: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  editBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  editDetails: {
    marginBottom: 8,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    padding: 8,
  },
  editSection: {
    marginBottom: 6,
  },
  editLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  oldText: {
    fontSize: 11,
    color: '#f87171',
    fontFamily: 'monospace',
    backgroundColor: '#2d1b1b',
    padding: 4,
    borderRadius: 3,
  },
  newText: {
    fontSize: 11,
    color: '#34d399',
    fontFamily: 'monospace',
    backgroundColor: '#1b2d1b',
    padding: 4,
    borderRadius: 3,
  },
  filePathContainer: {
    marginBottom: 8,
  },
  filePathText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});