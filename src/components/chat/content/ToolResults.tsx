import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';

export interface ToolResultsProps {
  results: string;
  toolName: string;
  isLast?: boolean;
  hasError?: boolean;
  resultCount?: number;
}

export const ToolResults: React.FC<ToolResultsProps> = ({
  results,
  toolName,
  isLast = false,
  hasError = false,
  resultCount,
}) => {
  // Use expandable hook for tool results
  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent,
    toggleExpanded,
  } = useExpandable({
    content: results,
    autoExpand: isLast || hasError,
    contentType: 'tool',
  });

  // Format result count display
  const resultCountText = resultCount 
    ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`
    : null;

  return (
    <View style={styles.container}>
      {/* Tool results header */}
      <View style={styles.header}>
        <Text style={styles.toolName}>{toolName}</Text>
        {resultCountText && (
          <Text style={styles.resultCount}>{resultCountText}</Text>
        )}
        {hasError && (
          <View style={styles.errorBadge}>
            <Text style={styles.errorBadgeText}>Error</Text>
          </View>
        )}
      </View>
      
      {/* Tool results content */}
      <View style={[
        styles.resultsContainer,
        hasError && styles.errorContainer
      ]}>
        <Text style={[
          styles.resultsText,
          hasError && styles.errorText
        ]}>
          {displayContent}
        </Text>
        
        {shouldShowExpandButton && !hasError && (
          <ExpandButton
            isExpanded={isExpanded}
            onPress={toggleExpanded}
            expandText="Show results"
            collapseText="Show less"
            variant="tool"
          />
        )}
      </View>
    </View>
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
  toolName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'capitalize',
    marginRight: 8,
  },
  resultCount: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
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
  resultsContainer: {
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
  resultsText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#d1d5db',
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#f87171',
  },
});