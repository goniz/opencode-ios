import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Part } from '../../api/types.gen';

interface MessageContentProps {
  role: string;
  part: Part;
}

export function MessageContent({ role, part }: MessageContentProps) {
  const renderPartContent = () => {
    switch (part.type) {
      case 'text':
        return (
          <Text style={[
            styles.contentText,
            role === 'user' ? styles.userText : styles.assistantText
          ]}>
            {part.text || ''}
          </Text>
        );

      case 'reasoning':
        return (
          <View style={styles.reasoningContainer}>
            <Text style={styles.reasoningLabel}>Thinking</Text>
            <Text style={styles.reasoningText}>
              {part.text || ''}
            </Text>
          </View>
        );

      case 'tool':
        const toolState = part.state;
        return (
          <View style={styles.toolContainer}>
            <Text style={styles.toolHeader}>
              {part.tool}
            </Text>
            {toolState.status === 'completed' && (
              <>
                <Text style={styles.toolTitle}>
                  {toolState.title}
                </Text>
                <Text style={styles.toolOutput}>
                  {toolState.output}
                </Text>
              </>
            )}
            {toolState.status === 'error' && (
              <Text style={styles.toolError}>
                Error: {toolState.error}
              </Text>
            )}
          </View>
        );

      case 'file':
        return (
          <View style={styles.fileContainer}>
            <Text style={styles.fileText}>
              📁 {part.filename || 'File attachment'}
            </Text>
          </View>
        );

      case 'step-start':
        return (
          <Text style={styles.stepText}>
            Starting task...
          </Text>
        );

      case 'agent':
        return (
          <Text style={styles.agentText}>
            Agent: {part.name}
          </Text>
        );

      default:
        return (
          <Text style={styles.contentText}>
            Unknown part type: {part.type}
          </Text>
        );
    }
  };

  return (
    <View style={styles.contentColumn}>
      {renderPartContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  contentColumn: {
    flex: 1,
    paddingLeft: 8,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#ffffff',
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#e5e7eb',
  },
  reasoningContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  reasoningLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#d1d5db',
    fontStyle: 'italic',
  },
  toolContainer: {
    backgroundColor: '#0f1419',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  toolHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  toolOutput: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#9ca3af',
    backgroundColor: '#000000',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  toolError: {
    fontSize: 14,
    color: '#ef4444',
    backgroundColor: '#1f1416',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  fileContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  fileText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  stepText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  agentText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});