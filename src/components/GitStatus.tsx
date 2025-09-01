import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { semanticColors } from '../styles/colors';
import type { GitStatusInfo } from '../utils/gitStatus';

interface GitStatusProps {
  gitStatus: GitStatusInfo;
  compact?: boolean;
}

export function GitStatus({ gitStatus, compact = true }: GitStatusProps) {
  const { branch, ahead, behind, hasChanges, modified, deleted, untracked, error } = gitStatus;

  if (error) {
    return null; // Don't show anything if there's an error
  }

  const getStatusColor = () => {
    if (modified > 0 || deleted > 0 || untracked > 0) return semanticColors.warning;
    if (ahead > 0 || behind > 0) return semanticColors.info;
    return semanticColors.textMuted;
  };

  const renderAheadBehind = () => {
    if (ahead === 0 && behind === 0) return null;

    return (
      <View style={styles.countsContainer}>
        {ahead > 0 && (
          <View style={styles.countBadge}>
            <Ionicons
              name="arrow-up"
              size={compact ? 8 : 10}
              color={semanticColors.success}
            />
            <Text style={[styles.countText, { fontSize: compact ? 9 : 11 }]}>
              {ahead}
            </Text>
          </View>
        )}
        {behind > 0 && (
          <View style={styles.countBadge}>
            <Ionicons
              name="arrow-down"
              size={compact ? 8 : 10}
              color={semanticColors.error}
            />
            <Text style={[styles.countText, { fontSize: compact ? 9 : 11 }]}>
              {behind}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderChanges = () => {
    const totalChanges = modified + deleted;
    
    // Only render if there are changes to show
    if (totalChanges === 0 && untracked === 0) return null;

    return (
      <View style={styles.countsContainer}>
        {totalChanges > 0 && (
          <View style={styles.countBadge}>
            <Text style={[styles.countText, { fontSize: compact ? 9 : 11, color: semanticColors.warning }]}>
              ±{totalChanges}
            </Text>
          </View>
        )}
        {untracked > 0 && (
          <View style={styles.countBadge}>
            <Text style={[styles.countText, { fontSize: compact ? 9 : 11, color: semanticColors.info }]}>
              ?{untracked}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons
          name="git-branch"
          size={12}
          color={getStatusColor()}
          style={styles.branchIcon}
        />
        <Text style={[styles.branchText, { color: getStatusColor() }]} numberOfLines={1}>
          {branch}
        </Text>
        {renderAheadBehind()}
        {renderChanges()}
        {hasChanges && (
          <View style={styles.changesDot} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <View style={styles.branchRow}>
        <Ionicons 
          name="git-branch" 
          size={16} 
          color={getStatusColor()} 
          style={styles.branchIcon} 
        />
        <Text style={[styles.branchTextFull, { color: getStatusColor() }]}>
          {branch}
        </Text>
        {(modified > 0 || deleted > 0 || untracked > 0) && (
          <Text style={styles.changesText}>
            • {modified > 0 ? `${modified} modified ` : ''}
            {deleted > 0 ? `${deleted} deleted ` : ''}
            {untracked > 0 ? `${untracked} untracked` : ''}
          </Text>
        )}
      </View>
      {(ahead > 0 || behind > 0) && (
        <View style={styles.statusRow}>
          {ahead > 0 && (
            <View style={styles.statusItem}>
              <Ionicons name="arrow-up" size={14} color={semanticColors.success} />
              <Text style={styles.statusItemText}>
                {ahead} ahead
              </Text>
            </View>
          )}
          {behind > 0 && (
            <View style={styles.statusItem}>
              <Ionicons name="arrow-down" size={14} color={semanticColors.error} />
              <Text style={styles.statusItemText}>
                {behind} behind
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fullContainer: {
    backgroundColor: semanticColors.cardBackground,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: semanticColors.border,
  },
  branchIcon: {
    marginRight: 4,
  },
  branchText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'monospace',
    maxWidth: 180,
  },
  branchTextFull: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statusItemText: {
    fontSize: 12,
    color: semanticColors.textMuted,
    fontWeight: '400',
  },
  countsContainer: {
    flexDirection: 'row',
    marginLeft: 4,
    gap: 2,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    gap: 1,
  },
  countText: {
    color: semanticColors.textMuted,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  changesDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: semanticColors.warning,
    marginLeft: 4,
  },
  changesText: {
    fontSize: 12,
    color: semanticColors.warning,
    fontStyle: 'italic',
    marginLeft: 8,
  },
});