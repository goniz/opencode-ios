import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilePartLike } from '../../integrations/github/GitHubTypes';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { layout } from '../../styles/layout';

interface FilePreviewProps {
  files: FilePartLike[];
  onRemoveFile?: (index: number) => void;
}

export function FilePreview({ files, onRemoveFile }: FilePreviewProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {files.map((file, index) => (
          <View key={index} style={styles.fileCard}>
            <View style={styles.fileIcon}>
              <Ionicons 
                name="document-text-outline" 
                size={20} 
                color={semanticColors.primary} 
              />
            </View>
            <Text style={styles.fileName} numberOfLines={2}>
              {file.name}
            </Text>
            <Text style={styles.fileMeta}>
              {file.mimeType === 'text/markdown' ? 'Markdown' : 'File'}
            </Text>
            {file.metadata?.github && (
              <View style={styles.githubBadge}>
                <Ionicons name="logo-github" size={12} color={semanticColors.background} />
                <Text style={styles.githubBadgeText}>
                  {file.metadata.github.kind}
                </Text>
              </View>
            )}
            {onRemoveFile && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemoveFile(index)}
                testID={`remove-file-${index}`}
              >
                <Ionicons name="close" size={16} color={semanticColors.background} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    borderBottomWidth: layout.borderWidth.DEFAULT,
    borderBottomColor: semanticColors.border,
  },
  scrollContainer: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  fileCard: {
    backgroundColor: semanticColors.cardBackground,
    borderRadius: layout.borderRadius.md,
    padding: spacing.sm,
    borderWidth: layout.borderWidth.DEFAULT,
    borderColor: semanticColors.border,
    width: 120,
    alignItems: 'center',
    position: 'relative',
  },
  fileIcon: {
    backgroundColor: semanticColors.primary + '20',
    borderRadius: layout.borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: semanticColors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  fileMeta: {
    fontSize: 10,
    color: semanticColors.textMuted,
    textAlign: 'center',
  },
  githubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semanticColors.success,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.sm,
    marginTop: spacing.xs,
  },
  githubBadgeText: {
    fontSize: 8,
    fontWeight: '500' as const,
    color: semanticColors.background,
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: semanticColors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: semanticColors.background,
  },
});