import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessagePartProps, MessagePartContainer } from './MessagePart';

export const ToolPart: React.FC<MessagePartProps> = ({ part, isLast = false }) => {
  const [isResultExpanded, setIsResultExpanded] = useState(false);
  
  const toolName = part.tool || 'unknown';
  const result = part.result || '';
  const error = part.error;
  const hasError = !!error;
  
  // Auto-expand errors and last parts
  const shouldAutoExpand = hasError || isLast;
  const shouldShowExpandButton = result.length > 200 && !shouldAutoExpand;
  
  const toggleResult = () => {
    setIsResultExpanded(!isResultExpanded);
  };

  const displayResult = shouldShowExpandButton && !isResultExpanded 
    ? result.substring(0, 200) + '...'
    : result;

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        {/* Tool execution header */}
        <View style={styles.header}>
          <Text style={styles.toolName}>{toolName}</Text>
          {hasError && (
            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>Error</Text>
            </View>
          )}
        </View>

        {/* Tool result content */}
        {(result || error) && (
          <View style={[
            styles.resultContainer,
            hasError && styles.errorContainer
          ]}>
            <Text style={[
              styles.resultText,
              hasError && styles.errorText
            ]}>
              {hasError ? error : displayResult}
            </Text>
            
            {shouldShowExpandButton && !hasError && (
              <TouchableOpacity 
                onPress={toggleResult}
                style={styles.expandButton}
              >
                <Text style={styles.expandButtonText}>
                  {isResultExpanded ? 'Show less' : 'Show results'}
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
  toolName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'capitalize',
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