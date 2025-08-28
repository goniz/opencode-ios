import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { semanticColors } from '../../styles/colors';

interface ChatErrorBannerProps {
  error: string | null;
  isDismissed: boolean;
  onDismiss: () => void;
}

export function ChatErrorBanner({ error, isDismissed, onDismiss }: ChatErrorBannerProps) {
  if (!error || isDismissed) {
    return null;
  }

  return (
    <View style={styles.sessionErrorBanner} testID="chat-error-banner">
      <Ionicons name="warning-outline" size={20} color="#ef4444" />
      <View style={styles.sessionErrorContent}>
        <Text style={styles.sessionErrorTitle}>Connection Error</Text>
        <Text style={styles.sessionErrorText}>{error}</Text>
      </View>
      <TouchableOpacity style={styles.sessionErrorDismiss} onPress={onDismiss} testID="dismiss-button">
        <Ionicons name="close" size={20} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sessionErrorBanner: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: semanticColors.error,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionErrorContent: {
    flex: 1,
    marginLeft: 8,
  },
  sessionErrorTitle: {
    color: semanticColors.error,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionErrorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  sessionErrorDismiss: {
    marginLeft: 12,
    padding: 4,
  },
});