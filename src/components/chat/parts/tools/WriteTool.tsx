import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';
import { getRelativePath } from '../../../../utils/pathUtils';
import { parseLSPDiagnostics } from '../../../../utils/diagnosticParser';

export const WriteTool: React.FC<ToolComponentProps> = ({ 
  part, 
  toolName, 
  hasError, 
  result, 
  filePath,
  lineCount,
  toolPart
}) => {
  const { fileDiagnostics, projectDiagnostics, cleanResult } = parseLSPDiagnostics(result);
  const [isFileDiagnosticsExpanded, setIsFileDiagnosticsExpanded] = useState(false);
  const [isProjectDiagnosticsExpanded, setIsProjectDiagnosticsExpanded] = useState(false);
  
  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent: displayResult,
    toggleExpanded,
  } = useExpandable({
    content: cleanResult,
    autoExpand: false,
    contentType: 'tool',
  });

  const relativePath = filePath ? getRelativePath(filePath) : undefined;

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

        {fileDiagnostics && fileDiagnostics.length > 0 && (
          <TouchableOpacity 
            style={styles.diagnosticsContainer}
            onPress={() => setIsFileDiagnosticsExpanded(!isFileDiagnosticsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.diagnosticsHeader}>
              <Text style={styles.diagnosticsTitle}>File Diagnostics</Text>
              <View style={styles.diagnosticsCount}>
                <Text style={styles.diagnosticsCountText}>
                  {fileDiagnostics.length}
                </Text>
              </View>
              <View style={styles.expandHintContainer}>
                <Text style={styles.expandHint}>
                  {isFileDiagnosticsExpanded ? '◀' : '▶'}
                </Text>
              </View>
            </View>
            
            {isFileDiagnosticsExpanded && (
              <View style={styles.diagnosticsDetails}>
                {fileDiagnostics.map((diagnostic, index) => (
                  <View key={index} style={styles.diagnosticItem}>
                    <View style={styles.diagnosticHeader}>
                      <View style={[styles.severityBadge, { backgroundColor: diagnostic.severity === 'ERROR' ? '#dc2626' : diagnostic.severity === 'WARN' ? '#f59e0b' : '#3b82f6' }]}>
                        <Text style={styles.severityText}>{diagnostic.severity}</Text>
                      </View>
                      <Text style={styles.locationText}>
                        {diagnostic.line}:{diagnostic.column}
                      </Text>
                    </View>
                    <Text style={styles.diagnosticMessage}>
                      {diagnostic.message}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}

        {projectDiagnostics && projectDiagnostics.length > 0 && (
          <TouchableOpacity 
            style={styles.projectDiagnosticsContainer}
            onPress={() => setIsProjectDiagnosticsExpanded(!isProjectDiagnosticsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.diagnosticsHeader}>
              <Text style={styles.projectDiagnosticsTitle}>Project Diagnostics</Text>
              <View style={styles.projectDiagnosticsCount}>
                <Text style={styles.diagnosticsCountText}>
                  {projectDiagnostics.length}
                </Text>
              </View>
              <View style={styles.expandHintContainer}>
                <Text style={styles.expandHint}>
                  {isProjectDiagnosticsExpanded ? '◀' : '▶'}
                </Text>
              </View>
            </View>
            
            {isProjectDiagnosticsExpanded && (
              <View style={styles.diagnosticsDetails}>
                {projectDiagnostics.map((diagnostic, index) => (
                  <View key={index} style={styles.diagnosticItem}>
                    <View style={styles.diagnosticHeader}>
                      <View style={[styles.severityBadge, { backgroundColor: diagnostic.severity === 'ERROR' ? '#dc2626' : diagnostic.severity === 'WARN' ? '#f59e0b' : '#3b82f6' }]}>
                        <Text style={styles.severityText}>{diagnostic.severity}</Text>
                      </View>
                      <Text style={styles.locationText}>
                        {getRelativePath(diagnostic.file)}:{diagnostic.line}:{diagnostic.column}
                      </Text>
                    </View>
                    <Text style={styles.diagnosticMessage}>
                      {diagnostic.message}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}

        {(displayResult || hasError) && displayResult.length > 0 && (
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
  diagnosticsContainer: {
    marginBottom: 12,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    overflow: 'hidden',
  },
  diagnosticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#dc2626',
  },
  diagnosticsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f87171',
  },
  diagnosticsCount: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diagnosticsCountText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  diagnosticItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  severityBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 8,
  },
  severityText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '700',
  },
  locationText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  diagnosticMessage: {
    fontSize: 11,
    color: '#e2e8f0',
    lineHeight: 16,
  },
  expandHintContainer: {
    paddingLeft: 8,
  },
  expandHint: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  diagnosticsDetails: {
    borderTopWidth: 1,
    borderTopColor: '#dc2626',
  },
  projectDiagnosticsContainer: {
    marginBottom: 12,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
    overflow: 'hidden',
  },
  projectDiagnosticsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
  },
  projectDiagnosticsCount: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});