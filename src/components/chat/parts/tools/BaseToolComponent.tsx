import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { ToolPart as ToolPartType } from '../../../../api/types.gen';

export interface ToolComponentProps {
  part: any;
  toolName: string;
  hasError: boolean;
  result: string;
  filePath?: string;
  lineCount?: number;
}

export interface BaseToolProps {
  toolPart: ToolPartType;
  isConvertedFormat: boolean;
  part: any;
  isLast: boolean;
}

export const ToolHeader: React.FC<{
  toolName: string;
  filePath?: string;
  lineCount?: number;
  hasError: boolean;
  children?: React.ReactNode;
}> = ({ toolName, filePath, lineCount, hasError, children }) => (
  <View style={styles.header}>
    <Text style={styles.toolName}>{toolName}</Text>
    
    {filePath && (
      <Text style={styles.filePath} numberOfLines={1}>
        {filePath}
      </Text>
    )}
    
    {lineCount !== undefined && (
      <Text style={styles.lineCount}>
        {lineCount} {lineCount === 1 ? 'line' : 'lines'}
      </Text>
    )}
    
    {hasError && (
      <View style={styles.errorBadge}>
        <Text style={styles.errorBadgeText}>Error</Text>
      </View>
    )}
    
    {children}
  </View>
);

export const ToolResult: React.FC<{
  result: string;
  hasError: boolean;
  error?: string;
  isExpanded?: boolean;
  shouldShowExpandButton?: boolean;
  onToggleExpanded?: () => void;
  expandText?: string;
  collapseText?: string;
  children?: React.ReactNode;
}> = ({ 
  result, 
  hasError, 
  error, 
  children 
}) => (
  <View style={[
    styles.resultContainer,
    hasError && styles.errorContainer
  ]}>
    <Text style={[
      styles.resultText,
      hasError && styles.errorText
    ]}>
      {hasError ? error : result}
    </Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  toolName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'capitalize',
    marginRight: 8,
  },
  filePath: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginRight: 8,
  },
  lineCount: {
    fontSize: 11,
    color: '#6b7280',
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  errorBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  errorBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#374151',
  },
  errorContainer: {
    borderLeftColor: '#dc2626',
    backgroundColor: '#1f1214',
  },
  resultText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#d1d5db',
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#f87171',
  },
});