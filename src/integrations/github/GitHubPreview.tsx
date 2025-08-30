import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GHIssue, GHPull } from './GitHubTypes';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { layout } from '../../styles/layout';


interface GitHubPreviewProps {
  item: GHIssue | GHPull;
  onAttach: () => void;
  onClose: () => void;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getStateColor(state: string): string {
  switch (state) {
    case 'open':
      return semanticColors.success;
    case 'closed':
      return semanticColors.error;
    case 'merged':
      return semanticColors.primary;
    default:
      return semanticColors.textMuted;
  }
}

function getStateIcon(state: string, kind: 'issue' | 'pull'): keyof typeof Ionicons.glyphMap {
  if (kind === 'issue') {
    return state === 'open' ? 'radio-button-on-outline' : 'checkmark-circle-outline';
  } else {
    switch (state) {
      case 'open':
        return 'git-pull-request-outline';
      case 'merged':
        return 'git-merge-outline';
      case 'closed':
        return 'close-circle-outline';
      default:
        return 'git-pull-request-outline';
    }
  }
}

export function GitHubPreview({ item, onAttach, onClose }: GitHubPreviewProps) {
  const stateColor = getStateColor(item.state);
  const stateIcon = getStateIcon(item.state, item.kind);

  const handleOpenInBrowser = () => {
    Linking.openURL(item.url);
  };

  const truncateBody = (body: string, maxLength: number = 500): string => {
    if (body.length <= maxLength) {
      return body;
    }
    return body.slice(0, maxLength) + '...';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{item.kind === 'issue' ? 'Issue' : 'Pull Request'} Preview</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={semanticColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metadata}>
          <View style={styles.repoInfo}>
            <Ionicons name="book-outline" size={16} color={semanticColors.textMuted} />
            <Text style={styles.repoName}>{item.repo}</Text>
            <Text style={styles.number}>#{item.number}</Text>
          </View>
          
          <View style={styles.stateInfo}>
            <Ionicons name={stateIcon} size={16} color={stateColor} />
            <Text style={[styles.state, { color: stateColor }]}>{item.state}</Text>
            <Text style={styles.updatedAt}>Updated {formatDate(item.updatedAt)}</Text>
          </View>
        </View>

        <Text style={styles.itemTitle}>{item.title}</Text>

        {item.body && (
          <View style={styles.bodyContainer}>
            <Text style={styles.bodyLabel}>Description:</Text>
            <Text style={styles.bodyText}>{truncateBody(item.body)}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.linkButton} onPress={handleOpenInBrowser}>
          <Ionicons name="open-outline" size={16} color={semanticColors.primary} />
          <Text style={styles.linkText}>View on GitHub</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.attachButton} onPress={onAttach}>
          <Ionicons name="attach-outline" size={16} color={semanticColors.background} />
          <Text style={styles.attachText}>Attach</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: layout.borderWidth.DEFAULT,
    borderBottomColor: semanticColors.border,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: semanticColors.textPrimary,
  },
  closeButton: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  metadata: {
    marginBottom: spacing.lg,
  },
  repoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  repoName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: semanticColors.textPrimary,
    marginLeft: spacing.xs,
  },
  number: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: semanticColors.textMuted,
    marginLeft: spacing.xs,
  },
  stateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  state: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginLeft: spacing.xs,
    textTransform: 'capitalize',
  },
  updatedAt: {
    fontSize: 12,
    color: semanticColors.textMuted,
    marginLeft: spacing.sm,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: semanticColors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  bodyContainer: {
    marginBottom: spacing.lg,
  },
  bodyLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: semanticColors.textPrimary,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontSize: 14,
    color: semanticColors.textSecondary,
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: 14,
    color: semanticColors.primary,
    marginLeft: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: layout.borderWidth.DEFAULT,
    borderTopColor: semanticColors.border,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: layout.borderRadius.md,
    borderWidth: layout.borderWidth.DEFAULT,
    borderColor: semanticColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: semanticColors.textPrimary,
  },
  attachButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: layout.borderRadius.md,
    backgroundColor: semanticColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  attachText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: semanticColors.background,
  },
});