import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,

  ActivityIndicator,
  Modal,
  SafeAreaView,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GitHubClient } from './GitHubClient';
import { GitHubPreview } from './GitHubPreview';
import { GHIssue, GHPull, FilePartLike } from './GitHubTypes';
import { githubIssueToMessagePart, githubPullToMessagePart } from '../../components/chat/adapters/githubToMessagePart';
import { detectCurrentGitHubRepository, formatRepositoryQuery, type GitHubRepository } from '../../utils/github';
import type { Client } from '../../api/client/types.gen';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { layout } from '../../styles/layout';

interface GitHubPickerProps {
  visible: boolean;
  onClose: () => void;
  onAttach: (filePart: FilePartLike) => void;
  githubToken: string;
  client: Client;
}

type TabType = 'issues' | 'pulls';

interface SearchResult {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  updated_at: string;
  repository_url: string;
  pull_request?: unknown;
}

export function GitHubPicker({ visible, onClose, onAttach, githubToken, client }: GitHubPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('issues');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GHIssue | GHPull | null>(null);
  const [githubClient, setGithubClient] = useState<GitHubClient | null>(null);
  const [currentRepository, setCurrentRepository] = useState<GitHubRepository | null>(null);


  useEffect(() => {
    if (githubToken) {
      setGithubClient(new GitHubClient(githubToken));
    }
  }, [githubToken]);

  const loadRepositoryItems = useCallback(async (repo: GitHubRepository, client: GitHubClient) => {
    if (!client) return;
    
    setLoading(true);
    try {
      // Load only open/merged items by default (exclude closed)
      const query = formatRepositoryQuery(repo, activeTab === 'issues' ? 'issue' : 'pr', false);
      const result = await client.searchIssuesPRs(query);
      setSearchResults(result.items);
    } catch (error) {
      Alert.alert('Error', `Failed to load ${activeTab}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Detect current repository when visible
  useEffect(() => {
    const detectRepository = async () => {
      if (!visible || !client) return;
      
      try {
        const repo = await detectCurrentGitHubRepository(client);
        setCurrentRepository(repo);
        
        if (repo) {
          console.log('Detected GitHub repository:', repo.fullName);
          // Load repository issues/PRs by default
          if (githubClient) {
            await loadRepositoryItems(repo, githubClient);
          }
        }
      } catch (error) {
        console.error('Failed to detect repository:', error);
      }
    };

    detectRepository();
  }, [visible, client, githubClient, loadRepositoryItems]);

  // Auto-reload when tab changes for current repository
  useEffect(() => {
    if (currentRepository && githubClient && visible) {
      loadRepositoryItems(currentRepository, githubClient);
    }
  }, [activeTab, currentRepository, githubClient, visible, loadRepositoryItems]);

  const formatDate = (isoDate: string): string => {
    return new Date(isoDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const extractRepoName = (repositoryUrl: string): string => {
    const match = repositoryUrl.match(/repos\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : 'Unknown repo';
  };

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'open':
        return semanticColors.success;
      case 'closed':
        return semanticColors.error;
      default:
        return semanticColors.textMuted;
    }
  };

  const handleSearch = useCallback(async () => {
    if (!githubClient || !searchQuery.trim()) return;

    setLoading(true);
    try {
      let query = searchQuery;
      
      // If we have a current repository and the search query doesn't already include repo scope,
      // automatically scope to current repository with state filtering
      if (currentRepository && !query.includes('repo:')) {
        const type = activeTab === 'issues' ? 'issue' : 'pr';
        query = `${query} repo:${currentRepository.fullName} type:${type}`;
        
        // Add state filter to show only open items unless user specified state explicitly
        if (!query.includes('state:')) {
          query += ' state:open';
        }
      } else {
        // Add type filter if not repository-scoped
        const type = activeTab === 'issues' ? 'issue' : 'pr';
        if (!query.includes('type:')) {
          query += ` type:${type}`;
        }
        
        // Add state filter for global searches too unless user specified state explicitly
        if (!query.includes('state:')) {
          query += ' state:open';
        }
      }
      
      const result = await githubClient.searchIssuesPRs(query);
      setSearchResults(result.items);
    } catch (error) {
      Alert.alert('Search Error', error instanceof Error ? error.message : 'Failed to search');
    } finally {
      setLoading(false);
    }
  }, [githubClient, searchQuery, activeTab, currentRepository]);

  const handleItemPress = useCallback(async (item: SearchResult) => {
    if (!githubClient) return;

    setLoading(true);
    try {
      const repoInfo = GitHubClient.parseRepoFromApiUrl(item.repository_url);
      if (!repoInfo) {
        Alert.alert('Error', 'Could not parse repository information');
        return;
      }

      let detailedItem: GHIssue | GHPull;
      
      if (item.pull_request) {
        detailedItem = await githubClient.getPullRequest(repoInfo.owner, repoInfo.repo, item.number);
      } else {
        detailedItem = await githubClient.getIssue(repoInfo.owner, repoInfo.repo, item.number);
      }

      setSelectedItem(detailedItem);
    } catch (error) {
      Alert.alert('Error', `Failed to load details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [githubClient]);

  const handleAttach = useCallback(() => {
    if (!selectedItem) return;

    let filePart: FilePartLike;
    if (selectedItem.kind === 'issue') {
      filePart = githubIssueToMessagePart(selectedItem);
    } else {
      filePart = githubPullToMessagePart(selectedItem);
    }

    onAttach(filePart);
    setSelectedItem(null);
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  }, [selectedItem, onAttach, onClose]);

  const handleClosePreview = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.resultHeader}>
        <View style={styles.resultTitleContainer}>
          <Ionicons
            name={item.pull_request ? 'git-pull-request-outline' : 'radio-button-on-outline'}
            size={16}
            color={getStateColor(item.state)}
          />
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        <Text style={styles.resultNumber}>#{item.number}</Text>
      </View>
      
      <View style={styles.resultMeta}>
        <Text style={styles.resultRepo}>{extractRepoName(item.repository_url)}</Text>
        <Text style={styles.resultDate}>{formatDate(item.updated_at)}</Text>
        <View style={[styles.stateBadge, { backgroundColor: getStateColor(item.state) }]}>
          <Text style={styles.stateText}>{item.state}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (selectedItem) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <GitHubPreview
          item={selectedItem}
          onAttach={handleAttach}
          onClose={handleClosePreview}
        />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Attach from GitHub</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={semanticColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'issues' && styles.activeTab]}
            onPress={() => setActiveTab('issues')}
          >
            <Text style={[styles.tabText, activeTab === 'issues' && styles.activeTabText]}>
              Issues
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pulls' && styles.activeTab]}
            onPress={() => setActiveTab('pulls')}
          >
            <Text style={[styles.tabText, activeTab === 'pulls' && styles.activeTabText]}>
              Pull Requests
            </Text>
          </TouchableOpacity>
        </View>

        {currentRepository && (
          <View style={styles.repositoryHeader}>
            <View style={styles.repoInfo}>
              <Ionicons name="book-outline" size={16} color={semanticColors.textMuted} />
              <Text style={styles.repoName}>{currentRepository.fullName}</Text>
            </View>
            <Text style={styles.repoSubtext}>Current repository</Text>
          </View>
        )}

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={semanticColors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={currentRepository 
                ? `Search open ${activeTab} in ${currentRepository.fullName}...`
                : `Search open ${activeTab === 'issues' ? 'issues' : 'pull requests'}...`
              }
              placeholderTextColor={semanticColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading || !searchQuery.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color={semanticColors.background} />
            ) : (
              <Ionicons name="search" size={16} color={semanticColors.background} />
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id.toString()}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && searchResults.length === 0 && searchQuery ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={semanticColors.textMuted} />
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
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
  headerTitle: {
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: layout.borderWidth.DEFAULT,
    borderBottomColor: semanticColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: semanticColors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: semanticColors.textMuted,
  },
  activeTabText: {
    color: semanticColors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semanticColors.cardBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: layout.borderRadius.md,
    borderWidth: layout.borderWidth.DEFAULT,
    borderColor: semanticColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: semanticColors.textPrimary,
    marginLeft: spacing.sm,
  },
  searchButton: {
    backgroundColor: semanticColors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  resultsList: {
    flex: 1,
  },
  resultsContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  resultItem: {
    backgroundColor: semanticColors.cardBackground,
    padding: spacing.md,
    borderRadius: layout.borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: layout.borderWidth.DEFAULT,
    borderColor: semanticColors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  resultTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: spacing.sm,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: semanticColors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  resultNumber: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: semanticColors.textMuted,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultRepo: {
    fontSize: 12,
    color: semanticColors.textMuted,
    flex: 1,
  },
  resultDate: {
    fontSize: 12,
    color: semanticColors.textMuted,
  },
  stateBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.sm,
  },
  stateText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: semanticColors.background,
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: semanticColors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: semanticColors.textMuted,
    marginTop: spacing.xs,
  },
  repositoryHeader: {
    backgroundColor: semanticColors.cardBackground,
    padding: spacing.md,
    borderBottomWidth: layout.borderWidth.DEFAULT,
    borderBottomColor: semanticColors.border,
  },
  repoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  repoName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: semanticColors.textPrimary,
    marginLeft: spacing.xs,
  },
  repoSubtext: {
    fontSize: 12,
    color: semanticColors.textMuted,
  },
});