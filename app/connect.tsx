import { useState, useEffect, useCallback } from "react";
import { Text, View, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { sessionList } from '../src/api/sdk.gen';
import { createClient, createConfig } from '../src/api/client';

type ConnectionStatus = 'connecting' | 'connected' | 'error' | 'idle';

export default function Connect() {
  const params = useLocalSearchParams();
  const serverUrl = params.url as string;
  
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  const connectToServer = useCallback(async () => {
    if (!serverUrl) {
      setStatus('error');
      setErrorMessage('No server URL provided');
      return;
    }

    setStatus('connecting');
    setErrorMessage('');

    try {
      // Create client with the server URL
      const client = createClient(createConfig({
        baseUrl: `http://${serverUrl}`
      }));

      // Test connection by trying to list sessions
      const response = await sessionList({ client });
      
      if (response.error) {
        throw new Error(String(response.error));
      }
      setSessionCount(response.data?.length || 0);
      setStatus('connected');
    } catch (error) {
      console.error('Connection error:', error);
      setStatus('error');
      
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to connect to server');
      }
    }
  }, [serverUrl]);

  useEffect(() => {
    if (serverUrl) {
      connectToServer();
    }
  }, [serverUrl, connectToServer]);

  const retry = () => {
    connectToServer();
  };

  const goBack = () => {
    router.back();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'error': return '#ef4444';
      case 'connecting': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'error': return 'Connection Failed';
      default: return 'Ready';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>opencode</Text>
          <Text style={styles.subtitle}>Connection Status</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.serverInfo}>
            <Text style={styles.label}>Server URL</Text>
            <Text style={styles.serverUrl}>{serverUrl}</Text>
          </View>

          <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
              {status === 'connecting' && (
                <ActivityIndicator size="small" color={getStatusColor()} style={styles.spinner} />
              )}
            </View>

            {status === 'connected' && (
              <View style={styles.connectionDetails}>
                <Text style={styles.detailText}>
                  Active Sessions: {sessionCount}
                </Text>
                <Text style={styles.detailText}>
                  SDK Version: Connected
                </Text>
              </View>
            )}

            {status === 'error' && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <Text style={styles.errorHint}>
                  Make sure the server is running and accessible from this device.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {status === 'error' && (
              <TouchableOpacity style={styles.retryButton} onPress={retry}>
                <Text style={styles.retryButtonText}>Retry Connection</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: "300",
    color: "#ffffff",
    marginBottom: 8,
    fontFamily: "monospace",
  },
  subtitle: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "400",
  },
  content: {
    flex: 1,
  },
  serverInfo: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 8,
    fontWeight: "500",
  },
  serverUrl: {
    fontSize: 16,
    color: "#ffffff",
    fontFamily: "monospace",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  statusCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  spinner: {
    marginLeft: 8,
  },
  connectionDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  detailText: {
    fontSize: 14,
    color: "#e5e7eb",
    marginBottom: 4,
  },
  errorDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    marginBottom: 8,
    fontWeight: "500",
  },
  errorHint: {
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 16,
  },
  actions: {
    gap: 12,
  },
  retryButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#0a0a0a",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
});