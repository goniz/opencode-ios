import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

import type { Session } from '../../api/types.gen';

interface ChatEmptyStateProps {
  connectionStatus: string;
  currentSession: Session | null;
  sessionsCount: number;
}

export function ChatEmptyState({ connectionStatus, currentSession, sessionsCount }: ChatEmptyStateProps) {
  if (connectionStatus !== 'connected') {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color="#6b7280" style={styles.icon} />
          <Text style={styles.title}>No Connection</Text>
          <Text style={styles.subtitle}>Connect to a server to start chatting</Text>
          <TouchableOpacity style={styles.connectButton} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.connectButtonText}>Go to Connect</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentSession) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#6b7280" style={styles.icon} />
          <Text style={styles.title}>No Session Selected</Text>
          <Text style={styles.subtitle}>
            {sessionsCount === 0
              ? "Create your first chat session to get started"
              : "Select a session from the Sessions tab to continue chatting"
            }
          </Text>
          <TouchableOpacity style={styles.connectButton} onPress={() => router.push('/(tabs)/sessions')}>
            <Text style={styles.connectButtonText}>Go to Sessions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.background,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: semanticColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: semanticColors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  icon: {
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: semanticColors.textPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  connectButtonText: {
    color: semanticColors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});