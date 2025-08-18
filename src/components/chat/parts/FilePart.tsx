import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartProps, MessagePartContainer } from './MessagePart';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';

export const FilePart: React.FC<MessagePartProps> = ({ part, isLast = false }) => {
  // Handle both the MessagePartProps interface and actual API FilePart type
  const filePart = part as any;
  
  // Try to get file info from different possible sources
  const filePath = filePart.file?.path || filePart.source?.path || filePart.filename || 'Unknown file';
  const fileContent = filePart.file?.content || filePart.source?.text?.value || '';
  
  // Fallback if no content is available
  if (!filePath && !fileContent) {
    return null;
  }
  
  // Use expandable hook for file content
  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent,
    toggleExpanded,
  } = useExpandable({
    content: fileContent,
    autoExpand: isLast || fileContent.length < 500,
    contentType: 'text',
    maxLines: 10,
    estimatedCharsPerLine: 60,
  });

  // Extract file name from path
  const fileName = filePath ? filePath.split('/').pop() || filePath : 'Unknown file';
  
  // Simple file extension detection for styling
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const isCodeFile = ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'css', 'html', 'json'].includes(fileExtension);

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        {/* File header */}
        <View style={styles.header}>
          <View style={styles.fileIcon}>
            <Text style={styles.fileIconText}>📄</Text>
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{fileName}</Text>
            <Text style={styles.filePath}>{filePath}</Text>
          </View>
        </View>

        {/* File content */}
        {fileContent && (
          <View style={styles.contentContainer}>
            <Text style={[
              styles.contentText,
              isCodeFile && styles.codeText
            ]}>
              {displayContent}
            </Text>
            
            {shouldShowExpandButton && (
              <ExpandButton
                isExpanded={isExpanded}
                onPress={toggleExpanded}
                expandText="Show full file"
                collapseText="Show less"
              />
            )}
          </View>
        )}
      </View>
    </MessagePartContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileIconText: {
    fontSize: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 2,
  },
  filePath: {
    fontSize: 12,
    color: '#9ca3af',
  },
  contentContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  contentText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#d1d5db',
  },
  codeText: {
    fontFamily: 'monospace',
  },

});