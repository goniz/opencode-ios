import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import type { ContextInfo, ChutesQuota } from '../../types/chat';

interface ChatStatusBarProps {
  contextInfo?: ContextInfo;
  chutesQuota?: ChutesQuota;
  commandStatus?: string;
  sessionUrl?: string;
  onUrlCopy: () => void;
}

export function ChatStatusBar({
  contextInfo,
  chutesQuota,
  commandStatus,
  sessionUrl,
  onUrlCopy,
}: ChatStatusBarProps) {
  // Helper function to format large numbers in human-readable form (matches official OpenCode TUI)
  const formatTokenCount = (count: number): string => {
    if (count >= 1000000) {
      const formatted = `${(count / 1000000).toFixed(1)}M`;
      return formatted.replace('.0M', 'M');
    } else if (count >= 1000) {
      const formatted = `${(count / 1000).toFixed(1)}K`;
      return formatted.replace('.0K', 'K');
    }
    return Math.floor(count).toString();
  };

  if (!contextInfo && !chutesQuota && !commandStatus && !sessionUrl) {
    return null;
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.md,
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
});