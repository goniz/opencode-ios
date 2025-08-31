import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessagePartContainer } from '../MessagePart';
import { ToolHeader, ToolResult, ToolComponentProps } from './BaseToolComponent';
import { useExpandable } from '../../../../hooks/useExpandable';
import { ExpandButton } from '../../ExpandButton';
import { getRelativePath } from '../../../../utils/pathUtils';
import { parseLSPDiagnostics } from '../../../../utils/diagnosticParser';

export const EditTool: React.FC<ToolComponentProps> = ({ 
  part, 
  toolName, 
  hasError, 
  result, 
  filePath 
}) => {
  const { fileDiagnostics, projectDiagnostics, cleanResult } = parseLSPDiagnostics(result);
  const [isDiffExpanded, setIsDiffExpanded] = useState(false);
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
          <TouchableOpacity 
            style={styles.diffContainer}
            onPress={() => setIsDiffExpanded(!isDiffExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.diffSummaryHeader}>
              {!isDiffExpanded ? (
                <View style={styles.diffSummary}>
                  {oldString && (
                    <View style={styles.diffSummaryItem}>
                      <View style={styles.compactDiffIcon}>
                        <Text style={styles.diffIconText}>-</Text>
                      </View>
                      <Text style={styles.diffSummaryText}>
                        {oldString.split('\n').length}
                      </Text>
                    </View>
                  )}
                  {newString && (
                    <View style={styles.diffSummaryItem}>
                      <View style={[styles.compactDiffIcon, styles.addedIcon]}>
                        <Text style={styles.diffIconText}>+</Text>
                      </View>
                      <Text style={styles.diffSummaryText}>
                        {newString.split('\n').length}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.expandedTitle}>Diff Details</Text>
              )}
              <View style={styles.expandHintContainer}>
                <Text style={styles.expandHint}>
                  {isDiffExpanded ? '◀' : '▶'}
                </Text>
              </View>
            </View>
            
            {isDiffExpanded && (
              <View style={styles.diffDetails}>
                {oldString && (
                  <View style={styles.diffSection}>
                    <View style={styles.diffHeader}>
                      <View style={styles.diffIcon}>
                        <Text style={styles.diffIconText}>-</Text>
                      </View>
                      <Text style={styles.diffLabel}>Removed:</Text>
                    </View>
                    <View style={styles.diffContentWrapper}>
                      <View style={styles.diffLineNumbers}>
                        {oldString.split('\n').map((_, index) => (
                          <Text key={index} style={styles.lineNumber}>
                            {index + 1}
                          </Text>
                        ))}
                      </View>
                      <Text style={styles.oldText}>
                        {oldString}
                      </Text>
                    </View>
                  </View>
                )}
                {newString && (
                  <View style={styles.diffSection}>
                    <View style={styles.diffHeader}>
                      <View style={[styles.diffIcon, styles.addedIcon]}>
                        <Text style={styles.diffIconText}>+</Text>
                      </View>
                      <Text style={styles.diffLabel}>Added:</Text>
                    </View>
                    <View style={styles.diffContentWrapper}>
                      <View style={styles.diffLineNumbers}>
                        {newString.split('\n').map((_, index) => (
                          <Text key={index} style={styles.lineNumber}>
                            {index + 1}
                          </Text>
                        ))}
                      </View>
                      <Text style={styles.newText}>
                        {newString}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        )}

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
  diffContainer: {
    marginBottom: 8,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  diffSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  diffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  diffIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addedIcon: {
    backgroundColor: '#16a34a',
  },
  diffIconText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  diffLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  diffContentWrapper: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
  },
  diffLineNumbers: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  lineNumber: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  oldText: {
    fontSize: 12,
    color: '#f87171',
    fontFamily: 'monospace',
    backgroundColor: '#2d1b1b',
    padding: 12,
    flex: 1,
    lineHeight: 16,
  },
  newText: {
    fontSize: 12,
    color: '#34d399',
    fontFamily: 'monospace',
    backgroundColor: '#1b2d1b',
    padding: 12,
    flex: 1,
    lineHeight: 16,
  },
  filePathContainer: {
    marginBottom: 8,
  },
  filePathText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
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
  diffSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  diffSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  diffSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  diffSummaryText: {
    fontSize: 12,
    color: '#e2e8f0',
    marginLeft: 4,
    fontWeight: '500',
  },
  compactDiffIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandHintContainer: {
    paddingLeft: 8,
  },
  expandHint: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  diffDetails: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  diagnosticsDetails: {
    borderTopWidth: 1,
    borderTopColor: '#dc2626',
  },
  expandedTitle: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '500',
    flex: 1,
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