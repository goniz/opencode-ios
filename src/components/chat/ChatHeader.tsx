import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import type { Session } from '../../api/types.gen';
import type { ContextInfo, ChutesQuota } from '../../types/chat';

interface ChatHeaderProps {
  session: Session;
  connectionStatus: string;
  isStreamConnected: boolean;
  isGenerating: boolean;
  currentProvider?: string;
  currentModel?: { providerID: string; modelID: string };
  onProviderSelect: () => void;
  onModelSelect: () => void;
  contextInfo?: ContextInfo;
  chutesQuota?: ChutesQuota;
  commandStatus?: string;
  sessionUrl?: string;
  onUrlCopy: () => void;
  availableProviders: { id: string; name: string }[];
  availableModels: { modelID: string; name: string }[];
}

export function ChatHeader({
  session,
  connectionStatus,
  isStreamConnected,
  isGenerating,
  currentProvider,
  currentModel,
  onProviderSelect,
  onModelSelect,
  contextInfo,
  chutesQuota,
  commandStatus,
  sessionUrl,
  onUrlCopy,
  availableProviders,
  availableModels,
}: ChatHeaderProps) {
  const handleProviderSelect = () => {
    if (availableProviders.length > 0) {
      Alert.alert(
        'Select Provider',
        'Choose a provider for this conversation',
        [
          ...availableProviders.map(provider => ({
            text: provider.name,
            onPress: () => {
              // This should call a function to set the provider
              // For now, we'll just trigger the callback
              onProviderSelect();
            }
          })),
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleModelSelect = () => {
    if (availableModels.length > 0) {
      Alert.alert(
        'Select Model',
        'Choose a model for this conversation',
        [
          ...availableModels.map(model => ({
            text: model.name,
            onPress: () => {
              // This should call a function to set the model
              // For now, we'll just trigger the callback
              onModelSelect();
            }
          })),
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {session.title}
        </Text>
      </View>
      <View style={styles.headerBottom}>
        {connectionStatus === 'connected' && (
          <View style={[styles.streamStatus, !isStreamConnected && styles.streamStatusOffline]}>
            <View style={[styles.streamIndicator, !isStreamConnected && styles.streamIndicatorOffline]} />
            <Text style={[styles.streamText, !isStreamConnected && styles.streamTextOffline]}>
              {isStreamConnected ? 'Live' : 'Offline'}
            </Text>
          </View>
        )}
        <TouchableOpacity onPress={handleProviderSelect}>
          <View style={styles.providerSelector}>
            <Text style={styles.providerSelectorText} numberOfLines={1}>
              {currentProvider ? 
                availableProviders.find(p => p.id === currentProvider)?.name || currentProvider : 
                'Select Provider'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {currentProvider && (
          <TouchableOpacity onPress={handleModelSelect}>
            <View style={styles.modelSelector}>
              <Text style={styles.modelSelectorText} numberOfLines={1}>
                {currentModel ? 
                  availableModels.find(m => m.modelID === currentModel.modelID)?.name || currentModel.modelID : 
                  'Select Model'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Compact generating indicator */}
        {isGenerating && (
          <View style={styles.generatingContainer}>
            <Ionicons name="stop" size={12} color={semanticColors.warning} style={styles.generatingIcon} />
            <Text style={styles.generatingText}>Generating...</Text>
          </View>
        )}
      </View>
      
      {/* Token/cost/quota info row */}
      {(contextInfo || chutesQuota || commandStatus || sessionUrl) && !isGenerating && (
        <View style={styles.headerInfoRow}>
          {contextInfo && (
            <Text style={styles.tokenInfoCompact}>
              {contextInfo.isSubscriptionModel
                ? `${formatTokenCount(contextInfo.currentTokens)}/${contextInfo.percentage}%`
                : `${formatTokenCount(contextInfo.currentTokens)}/${contextInfo.percentage}% ($${contextInfo.sessionCost.toFixed(2)})`
              }
            </Text>
          )}
          {chutesQuota && (
            <Text style={styles.tokenInfoCompact}>
              Chutes: {chutesQuota.used}/{chutesQuota.quota}
            </Text>
          )}
          {commandStatus && (
            <Text style={styles.commandStatusText}>
              {commandStatus}
            </Text>
          )}
          {sessionUrl && (
            <TouchableOpacity onPress={onUrlCopy}>
              <Text style={styles.sessionUrlText}>
                🔗 Session Link
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// Helper function to format large numbers in human-readable form (matches official OpenCode TUI)
function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    const formatted = `${(count / 1000000).toFixed(1)}M`;
    return formatted.replace('.0M', 'M');
  } else if (count >= 1000) {
    const formatted = `${(count / 1000).toFixed(1)}K`;
    return formatted.replace('.0K', 'K');
  }
  return Math.floor(count).toString();
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: semanticColors.border,
  },
  headerTop: {
    marginBottom: spacing.xs,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: semanticColors.textPrimary,
  },
  streamStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#1a2e1a',
    borderRadius: 8,
  },
  streamStatusOffline: {
    backgroundColor: '#2a1a1a',
  },
  streamIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: semanticColors.success,
    marginRight: 4,
  },
  streamIndicatorOffline: {
    backgroundColor: semanticColors.error,
  },
  streamText: {
    fontSize: 10,
    color: semanticColors.success,
    fontWeight: '500',
  },
  streamTextOffline: {
    color: semanticColors.error,
  },
  providerSelector: {
    backgroundColor: semanticColors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: semanticColors.border,
    marginLeft: 12,
    maxWidth: 100,
  },
  providerSelectorText: {
    fontSize: 11,
    color: semanticColors.textPrimary,
    fontWeight: '500',
  },
  modelSelector: {
    backgroundColor: semanticColors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: semanticColors.border,
    marginLeft: 8,
    maxWidth: 120,
  },
  modelSelectorText: {
    fontSize: 11,
    color: semanticColors.textPrimary,
    fontWeight: '500',
  },
  tokenInfoCompact: {
    fontSize: 11,
    color: semanticColors.textMuted,
    fontWeight: '400',
  },
  commandStatusText: {
    fontSize: 11,
    color: semanticColors.warning,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  sessionUrlText: {
    fontSize: 11,
    color: semanticColors.textLink,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  generatingIcon: {
    marginRight: 4,
  },
  generatingText: {
    fontSize: 11,
    color: semanticColors.warning,
    fontWeight: '500',
  },
});