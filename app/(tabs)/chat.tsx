import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConnection } from '../../src/contexts/ConnectionContext';

export default function ChatScreen() {
  const { connectionStatus, sessions } = useConnection();

  if (connectionStatus !== 'connected') {
    return (
      <View style={styles.container}>
        <Ionicons name="cloud-offline-outline" size={64} color="#6b7280" style={styles.icon} />
        <Text style={styles.title}>No Connection</Text>
        <Text style={styles.subtitle}>Connect to a server to start chatting</Text>
        <TouchableOpacity style={styles.connectButton} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.connectButtonText}>Go to Connect</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.container}>
        <Ionicons name="chatbubbles-outline" size={64} color="#6b7280" style={styles.icon} />
        <Text style={styles.title}>No Sessions</Text>
        <Text style={styles.subtitle}>Create a new chat from the Sessions tab</Text>
        <TouchableOpacity style={styles.connectButton} onPress={() => router.push('/(tabs)/sessions')}>
          <Text style={styles.connectButtonText}>Go to Sessions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat</Text>
      <Text style={styles.subtitle}>Chat functionality coming soon!</Text>
      <Text style={styles.sessionCount}>{sessions.length} session{sessions.length !== 1 ? 's' : ''} available</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  sessionCount: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  connectButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
});
