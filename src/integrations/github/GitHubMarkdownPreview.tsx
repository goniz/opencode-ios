import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { layout } from '../../styles/layout';

interface MarkdownPart {
  name: string;
  content: string;
  title?: string; // Optional title for the section
}

interface GitHubMarkdownPreviewProps {
  visible: boolean;
  parts: MarkdownPart[];
  onClose: () => void;
}

export function GitHubMarkdownPreview({ 
  visible, 
  parts, 
  onClose 
}: GitHubMarkdownPreviewProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Markdown Preview</Text>
            <Text style={styles.subtitle}>{parts.length} file{parts.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={semanticColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
        >
          {parts.map((part, index) => (
            <View key={index} style={[styles.partContainer, index > 0 && styles.partContainerSpacing]}>
              <View style={styles.partHeader}>
                {part.title && <Text style={styles.partTitle}>{part.title}</Text>}
                <Text style={styles.partFileName}>{part.name}</Text>
              </View>
              <View style={styles.codeContainer}>
                <Text style={styles.codeText} selectable={true}>
                  {part.content}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={16} color={semanticColors.textMuted} />
            <Text style={styles.infoText}>
              These are the raw markdown files that will be attached to your message
            </Text>
          </View>
        </View>
      </View>
    </Modal>
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: semanticColors.textMuted,
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
  },
  contentContainer: {
    padding: spacing.lg,
  },
  codeContainer: {
    backgroundColor: semanticColors.cardBackground,
    borderRadius: layout.borderRadius.md,
    borderWidth: layout.borderWidth.DEFAULT,
    borderColor: semanticColors.border,
    padding: spacing.md,
  },
  codeText: {
    fontSize: 14,
    lineHeight: 20,
    color: semanticColors.textPrimary,
    fontFamily: 'SpaceMono-Regular',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: layout.borderWidth.DEFAULT,
    borderTopColor: semanticColors.border,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semanticColors.cardBackground,
    padding: spacing.md,
    borderRadius: layout.borderRadius.md,
  },
  infoText: {
    fontSize: 12,
    color: semanticColors.textMuted,
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: 16,
  },
  partContainer: {
    marginBottom: spacing.sm,
  },
  partContainerSpacing: {
    marginTop: spacing.lg,
  },
  partHeader: {
    backgroundColor: semanticColors.cardBackground,
    borderTopLeftRadius: layout.borderRadius.md,
    borderTopRightRadius: layout.borderRadius.md,
    borderWidth: layout.borderWidth.DEFAULT,
    borderBottomWidth: 0,
    borderColor: semanticColors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  partTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: semanticColors.textPrimary,
    marginBottom: spacing.xs,
  },
  partFileName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: semanticColors.textMuted,
  },
});