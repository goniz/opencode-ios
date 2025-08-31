import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GHIssue, GHPull, PreviewOptions } from './GitHubTypes';
import { GitHubClient } from './GitHubClient';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { layout } from '../../styles/layout';


interface GitHubPreviewProps {
  item: GHIssue | GHPull;
  client: GitHubClient;
  onAttach: (options: PreviewOptions) => void;
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

export function GitHubPreview({ item, client, onAttach, onClose }: GitHubPreviewProps) {
  const [includeComments, setIncludeComments] = useState(false);
  const [includeReviews, setIncludeReviews] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullItem, setFullItem] = useState<GHIssue | GHPull>(item);

  const stateColor = getStateColor(item.state);
  const stateIcon = getStateIcon(item.state, item.kind);

  useEffect(() => {
    const fetchFullContent = async () => {
      if (!includeComments && !(item.kind === 'pull' && includeReviews)) {
        setFullItem(item);
        return;
      }

      setLoading(true);
      try {
        const repoInfo = GitHubClient.parseRepoFromUrl(item.url);
        if (!repoInfo) return;

        if (item.kind === 'issue') {
          if (includeComments) {
            const issueWithComments = await client.getIssueWithComments(repoInfo.owner, repoInfo.repo, item.number!);
            setFullItem(issueWithComments);
          }
        } else if (item.kind === 'pull') {
          if (includeComments || includeReviews) {
            const prWithContent = await client.getPRWithCommentsAndReviews(repoInfo.owner, repoInfo.repo, item.number!);
            setFullItem(prWithContent);
          }
        }
      } catch (error) {
        console.error('Failed to fetch full content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFullContent();
  }, [includeComments, includeReviews, item, client]);

  const handleOpenInBrowser = () => {
    Linking.openURL(item.url);
  };

  const handleAttach = () => {
    onAttach({ includeComments, includeReviews });
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

        {/* Comments Toggle */}
        {item.commentCount > 0 && (
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Include {item.commentCount} comments</Text>
            <Switch
              value={includeComments}
              onValueChange={setIncludeComments}
              trackColor={{ false: semanticColors.border, true: semanticColors.primary }}
              thumbColor={includeComments ? semanticColors.background : semanticColors.textMuted}
            />
          </View>
        )}

        {/* Reviews Toggle (PR only) */}
        {item.kind === 'pull' && item.reviewCount > 0 && (
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Include {item.reviewCount} reviews</Text>
            <Switch
              value={includeReviews}
              onValueChange={setIncludeReviews}
              trackColor={{ false: semanticColors.border, true: semanticColors.primary }}
              thumbColor={includeReviews ? semanticColors.background : semanticColors.textMuted}
            />
          </View>
        )}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={semanticColors.primary} />
            <Text style={styles.loadingText}>Loading content...</Text>
          </View>
        )}

        {/* Comments Display */}
        {includeComments && fullItem.comments && fullItem.comments.length > 0 && (
          <View style={styles.commentsContainer}>
            <Text style={styles.sectionTitle}>Comments ({fullItem.comments.length})</Text>
            {fullItem.comments.slice(0, 5).map((comment, index) => (
              <View key={comment.id} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                <Text style={styles.commentBody} numberOfLines={3}>
                  {comment.body}
                </Text>
                {index < fullItem.comments!.length - 1 && <View style={styles.commentSeparator} />}
              </View>
            ))}
            {fullItem.comments.length > 5 && (
              <Text style={styles.moreText}>... and {fullItem.comments.length - 5} more comments</Text>
            )}
          </View>
        )}

        {/* Reviews Display (PR only) */}
        {includeReviews && fullItem.kind === 'pull' && fullItem.reviews && fullItem.reviews.length > 0 && (
          <View style={styles.reviewsContainer}>
            <Text style={styles.sectionTitle}>Reviews ({fullItem.reviews.length})</Text>
            {fullItem.reviews.slice(0, 3).map((review, index) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewState}>{review.state}</Text>
                  <Text style={styles.reviewAuthor}>by {review.author}</Text>
                  <Text style={styles.reviewDate}>{formatDate(review.submittedAt)}</Text>
                </View>
                {review.body && (
                  <Text style={styles.reviewBody} numberOfLines={2}>
                    {review.body}
                  </Text>
                )}
                {review.comments && review.comments.length > 0 && (
                  <Text style={styles.reviewComments}>
                    {review.comments.length} review comment{review.comments.length !== 1 ? 's' : ''}
                  </Text>
                )}
                {index < fullItem.reviews!.length - 1 && <View style={styles.reviewSeparator} />}
              </View>
            ))}
            {fullItem.reviews.length > 3 && (
              <Text style={styles.moreText}>... and {fullItem.reviews.length - 3} more reviews</Text>
            )}
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
        <TouchableOpacity style={styles.attachButton} onPress={handleAttach}>
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: semanticColors.cardBackground,
    borderRadius: layout.borderRadius.md,
    marginBottom: spacing.sm,
  },
  toggleLabel: {
    fontSize: 14,
    color: semanticColors.textPrimary,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: semanticColors.textMuted,
    marginLeft: spacing.sm,
  },
  commentsContainer: {
    marginTop: spacing.md,
  },
  reviewsContainer: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: semanticColors.textPrimary,
    marginBottom: spacing.sm,
  },
  commentItem: {
    marginBottom: spacing.sm,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: semanticColors.primary,
  },
  commentDate: {
    fontSize: 12,
    color: semanticColors.textMuted,
    marginBottom: spacing.xs,
  },
  commentBody: {
    fontSize: 14,
    color: semanticColors.textSecondary,
    lineHeight: 20,
  },
  commentSeparator: {
    height: layout.borderWidth.DEFAULT,
    backgroundColor: semanticColors.border,
    marginVertical: spacing.sm,
  },
  reviewItem: {
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewState: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: semanticColors.primary,
    backgroundColor: semanticColors.cardBackground,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: layout.borderRadius.sm,
    marginRight: spacing.sm,
  },
  reviewAuthor: {
    fontSize: 14,
    color: semanticColors.textPrimary,
    marginRight: spacing.sm,
  },
  reviewDate: {
    fontSize: 12,
    color: semanticColors.textMuted,
  },
  reviewBody: {
    fontSize: 14,
    color: semanticColors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  reviewComments: {
    fontSize: 12,
    color: semanticColors.textMuted,
    fontStyle: 'italic',
  },
  reviewSeparator: {
    height: layout.borderWidth.DEFAULT,
    backgroundColor: semanticColors.border,
    marginVertical: spacing.sm,
  },
  moreText: {
    fontSize: 12,
    color: semanticColors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});