import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolComponentProps } from './BaseToolComponent';
import { getRelativePath } from '../../../../utils/pathUtils';

export const ReadTool: React.FC<ToolComponentProps> = ({ 
  filePath, 
  hasError 
}) => {
  const relativePath = filePath ? getRelativePath(filePath) : 'file';

  if (hasError) {
    return (
      <MessagePartContainer>
        <View style={styles.container}>
          <View style={styles.errorHeader}>
            <Text style={styles.errorTitle}>
              Failed to read <Text style={styles.errorPath}>{relativePath}</Text>
            </Text>
          </View>
        </View>
      </MessagePartContainer>
    );
  }

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <View style={styles.readHeader}>
          <Text style={styles.readTitle}>
            Read <Text style={styles.readPath}>{relativePath}</Text>
          </Text>
        </View>
      </View>
    </MessagePartContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  readHeader: {
    marginBottom: 4,
  },
  readTitle: {
    fontSize: 13,
    color: '#e5e7eb',
    fontWeight: '500',
    lineHeight: 18,
  },
  readPath: {
    fontWeight: '600',
    color: '#60a5fa',
    fontFamily: 'monospace',
  },
  errorHeader: {
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 13,
    color: '#f87171',
    fontWeight: '500',
    lineHeight: 18,
  },
  errorPath: {
    fontWeight: '600',
    color: '#dc2626',
    fontFamily: 'monospace',
  },
});