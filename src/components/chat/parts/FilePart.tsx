import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessagePartProps, MessagePartContainer } from './MessagePart';

export const FilePart: React.FC<MessagePartProps> = ({ part, isLast = false }) => {
  const [isContentExpanded, setIsContentExpanded] = useState(isLast);
  
  const filePath = part.file?.path || 'Unknown file';
  const fileContent = part.file?.content || '';
  
  // Auto-expand last parts or small files
  const shouldAutoExpand = isLast || fileContent.length < 500;
  const shouldShowExpandButton = fileContent.length > 500 && !shouldAutoExpand;
  
  const toggleContent = () => {
    setIsContentExpanded(!isContentExpanded);
  };

  const displayContent = shouldShowExpandButton && !isContentExpanded 
    ? fileContent.substring(0, 300) + '...'
    : fileContent;

  // Extract file name from path
  const fileName = filePath.split('/').pop() || filePath;
  
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
              <TouchableOpacity 
                onPress={toggleContent}
                style={styles.expandButton}
              >
                <Text style={styles.expandButtonText}>
                  {isContentExpanded ? 'Show less' : 'Show full file'}
                </Text>
              </TouchableOpacity>
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
  expandButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '500',
  },
});