import { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sessionList, sessionCreate } from '../../src/api/sdk.gen';
import { createClient, createConfig } from '../../src/api/client';
import { getSavedServers } from '../../src/utils/serverStorage';
import { toast } from '../../src/utils/toast';
import type { Session } from '../../src/api/types.gen';

type SessionsState = 'loading' | 'loaded' | 'error' | 'no-connection';

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [state, setState] = useState<SessionsState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');

  const loadSessions = useCallback(async () => {
    try {
      setState('loading');
      setError('');

      // Get the most recent server connection
      const savedServers = await getSavedServers();
      if (!savedServers.length) {
        setState('no-connection');
        return;
      }

      const mostRecent = savedServers[0];
      const baseUrl = `http://${mostRecent.url}`;
      
      const client = createClient(createConfig({
        baseUrl,
        fetch: async (request: Request) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          try {
            const response = await fetch(request, {
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
          } catch (error: unknown) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Connection timeout - server may be unreachable');
            }
            throw error;
          }
        }
      }));

      const response = await sessionList({ client });
      
      if (response.error) {
        console.error('Sessions API Error:', response.error);
        throw new Error(`Failed to fetch sessions: ${JSON.stringify(response.error)}`);
      }

      setSessions(response.data || []);
      setState('loaded');
    } catch (error) {
      console.error('Error loading sessions:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to load sessions';
      setError(errorMsg);
      setState('error');
      toast.showError('Failed to load sessions', errorMsg);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, [loadSessions]);

  const handleNewChat = async () => {
    try {
      // Get the most recent server connection
      const savedServers = await getSavedServers();
      if (!savedServers.length) {
        Alert.alert('No Connection', 'Please connect to a server first');
        router.push('/(tabs)');
        return;
      }

      const mostRecent = savedServers[0];
      const baseUrl = `http://${mostRecent.url}`;
      
      const client = createClient(createConfig({
        baseUrl,
        fetch: async (request: Request) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          try {
            const response = await fetch(request, {
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
          } catch (error: unknown) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Connection timeout - server may be unreachable');
            }
            throw error;
          }
        }
      }));

      const response = await sessionCreate({ client });
      
      if (response.error) {
        console.error('Session creation error:', response.error);
        throw new Error(`Failed to create session: ${JSON.stringify(response.error)}`);
      }

      // Refresh sessions list to show the new session
      await loadSessions();
      
      // Navigate to chat tab (for future implementation)
      router.push('/(tabs)/chat');
    } catch (error) {
      console.error('Error creating session:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create session';
      toast.showError('Failed to create chat', errorMsg);
    }
  };

  const handleSessionPress = (session: Session) => {
    // For now, just show session details
    Alert.alert(
      session.title,
      `Created: ${new Date(session.time.created).toLocaleDateString()}\nUpdated: ${new Date(session.time.updated).toLocaleDateString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Chat', onPress: () => router.push('/(tabs)/chat') }
      ]
    );
  };

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const renderSession = ({ item }: { item: Session }) => (
    <TouchableOpacity style={styles.sessionItem} onPress={() => handleSessionPress(item)}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle} numberOfLines={1}>
          {item.title || 'Untitled Session'}
        </Text>
        <Text style={styles.sessionTime}>
          {new Date(item.time.updated).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.sessionId} numberOfLines={1}>
        ID: {item.id}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#6b7280" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No sessions yet</Text>
      <Text style={styles.emptySubtitle}>
        Start your first conversation by tapping &quot;New Chat&quot; above
      </Text>
    </View>
  );

  const renderNoConnection = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cloud-offline-outline" size={64} color="#6b7280" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No server connection</Text>
      <Text style={styles.emptySubtitle}>
        Connect to a server first to see your sessions
      </Text>
      <TouchableOpacity style={styles.connectButton} onPress={() => router.push('/(tabs)')}>
        <Text style={styles.connectButtonText}>Go to Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyState}>
      <Ionicons name="warning-outline" size={64} color="#ef4444" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>Failed to load sessions</Text>
      <Text style={styles.emptySubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadSessions}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (state === 'no-connection') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sessions</Text>
        </View>
        {renderNoConnection()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sessions</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Ionicons name="add" size={24} color="#0a0a0a" />
          <Text style={styles.newChatButtonText}>New Chat</Text>
        </TouchableOpacity>
      </View>

      {state === 'loading' && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : state === 'error' ? (
        renderError()
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          style={styles.sessionsList}
          contentContainerStyle={sessions.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
              colors={['#ffffff']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newChatButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  sessionsList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sessionItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  sessionTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sessionId: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  connectButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
});
