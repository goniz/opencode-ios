import { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sessionCreate } from '../../src/api/sdk.gen';
import { useConnection } from '../../src/contexts/ConnectionContext';
import { toast } from '../../src/utils/toast';
import type { Session } from '../../src/api/types.gen';

type ListItem = 
  | { type: 'session'; data: Session }
  | { type: 'date'; date: string; displayDate: string };

export default function SessionsScreen() {
  const { 
    connectionStatus, 
    sessions, 
    client, 
    refreshSessions, 
    lastError
  } = useConnection();
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const groupSessionsByDate = useCallback((sessions: Session[]): ListItem[] => {
    if (!sessions.length) return [];

    // Sort sessions by updated time (newest first)
    const sortedSessions = [...sessions].sort((a, b) => b.time.updated - a.time.updated);
    
    // Group by date
    const grouped = new Map<string, Session[]>();
    sortedSessions.forEach(session => {
      const date = new Date(session.time.updated);
      const dateKey = date.toDateString(); // "Mon Dec 25 2023"
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(session);
    });

    // Create mixed array with date separators
    const result: ListItem[] = [];
    grouped.forEach((sessions, dateKey) => {
      const date = new Date(dateKey);
      const displayDate = date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Add date separator
      result.push({ type: 'date', date: dateKey, displayDate });
      
      // Add sessions for this date
      sessions.forEach(session => {
        result.push({ type: 'session', data: session });
      });
    });

    return result;
  }, []);

  const loadSessions = useCallback(async () => {
    if (connectionStatus !== 'connected' || !client) {
      return;
    }

    try {
      await refreshSessions();
    } catch (error) {
      console.error('Error refreshing sessions:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to load sessions';
      toast.showError('Failed to load sessions', errorMsg);
    }
  }, [connectionStatus, client, refreshSessions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, [loadSessions]);

  const handleNewChat = async () => {
    if (connectionStatus !== 'connected' || !client) {
      Alert.alert('No Connection', 'Please connect to a server first');
      router.push('/(tabs)');
      return;
    }

    try {
      console.log('Creating new session...');
      const response = await sessionCreate({ client });
      
      if (response.error) {
        console.error('Session creation error:', response.error);
        throw new Error(`Failed to create session: ${JSON.stringify(response.error)}`);
      }

      if (response.data) {
        console.log('New session created:', response.data.id, response.data.title);
        
        // Refresh sessions list to show the new session
        await loadSessions();
        
        // Navigate directly to chat with the new session ID - no need to set current session manually
        console.log('Navigating to chat with session:', response.data.id);
        router.push(`/(tabs)/chat?sessionId=${response.data.id}`);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create session';
      toast.showError('Failed to create chat', errorMsg);
    }
  };

  const handleSessionPress = (session: Session) => {
    console.log('Session selected:', session.id, session.title);
    // Navigate directly to chat with session ID - the chat screen will handle setting currentSession
    router.push(`/(tabs)/chat?sessionId=${session.id}`);
  };

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Update grouped list when sessions change
  useEffect(() => {
    setListItems(groupSessionsByDate(sessions));
  }, [sessions, groupSessionsByDate]);

  // Load sessions when connection is established
  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadSessions();
    }
  }, [connectionStatus, loadSessions]);

  const renderSession = (session: Session) => (
    <TouchableOpacity style={styles.sessionItem} onPress={() => handleSessionPress(session)}>
      <Text style={styles.sessionTitle} numberOfLines={2}>
        {session.title || 'Untitled Session'}
      </Text>
    </TouchableOpacity>
  );

  const renderDateSeparator = (displayDate: string) => (
    <View style={styles.dateSeparator}>
      <Text style={styles.dateText}>{displayDate}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'date') {
      return renderDateSeparator(item.displayDate);
    }
    return renderSession(item.data);
  };

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
      <Text style={styles.emptySubtitle}>{lastError || 'Unknown error occurred'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadSessions}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (connectionStatus === 'idle' || connectionStatus === 'error') {
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

      {connectionStatus === 'connecting' && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : lastError ? (
        renderError()
      ) : (
        <FlatList
          data={listItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.type === 'date' ? `date-${item.date}` : `session-${item.data.id}`}
          style={styles.sessionsList}
          contentContainerStyle={listItems.length === 0 ? styles.emptyContainer : styles.listContent}
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
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#ffffff',
  },
  dateSeparator: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
