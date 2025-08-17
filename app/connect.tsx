import { useState, useEffect, useCallback } from "react";
import { Text, View, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { sessionList, appGet } from '../src/api/sdk.gen';
import { createClient, createConfig } from '../src/api/client';
import { saveServer } from '../src/utils/serverStorage';

type ConnectionStatus = 'connecting' | 'connected' | 'error' | 'idle';

export default function Connect() {
  const params = useLocalSearchParams();
  const serverUrl = params.url as string;
  
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [rootPath, setRootPath] = useState<string | null>(null);

  const connectToServer = useCallback(async () => {
    if (!serverUrl) {
      setStatus('error');
      setErrorMessage('No server URL provided');
      return;
    }

    setStatus('connecting');
    setErrorMessage('');

    try {
      // Validate URL format
      const urlPattern = /^[^:\/]+:\d+$/;
      if (!urlPattern.test(serverUrl)) {
        throw new Error('Invalid URL format. Expected: host:port (e.g., 192.168.1.100:3000)');
      }

      const baseUrl = `http://${serverUrl}`;
      console.log('Attempting connection to:', baseUrl);

      // First, try a simple fetch to test basic connectivity
      try {
        const testController = new AbortController();
        const testTimeoutId = setTimeout(() => testController.abort(), 5000); // 5 second timeout
        
        const testResponse = await fetch(baseUrl, {
          method: 'HEAD',
          signal: testController.signal,
        });
        clearTimeout(testTimeoutId);
        console.log('Basic connectivity test:', testResponse.status);
      } catch (testError: unknown) {
        const errorMessage = testError instanceof Error ? testError.message : 'Unknown error';
        console.log('Basic connectivity failed:', errorMessage);
        // Continue anyway as the server might not support HEAD requests
      }

      // Create client with the server URL
      const client = createClient(createConfig({
        baseUrl,
        // Add timeout and better error handling
        fetch: async (request: Request) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
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

      // Test connection and fetch app info
      const [sessionResponse, appResponse] = await Promise.all([
        sessionList({ client }),
        appGet({ client })
      ]);
      
      if (sessionResponse.error) {
        console.error('Session API Error:', sessionResponse.error);
        throw new Error(`Session API Error: ${JSON.stringify(sessionResponse.error)}`);
      }

      if (appResponse.error) {
        console.error('App API Error:', appResponse.error);
        throw new Error(`App API Error: ${JSON.stringify(appResponse.error)}`);
      }
      
      setSessionCount(sessionResponse.data?.length || 0);
      
      // Try to get version from app response or fallback
      const appData = appResponse.data;
      
      // Since there's no version endpoint, show API version and hostname
      const apiVersion = '1.0.0'; // From OpenAPI spec info.version
      const hostname = appData?.hostname || 'localhost';
      const rootPathValue = appData?.path?.root || 'unknown';
      
      setAppVersion(`API v${apiVersion} (${hostname})`);
      setRootPath(rootPathValue);
      
      setStatus('connected');
      console.log('Successfully connected to server');
      
      await saveServer({
        url: serverUrl,
        lastConnected: Date.now(),
        connectionDetails: {
          appVersion: `API v${apiVersion} (${hostname})`,
          rootPath: rootPathValue,
          sessionCount: sessionResponse.data?.length || 0,
        }
      });
    } catch (error) {
      console.error('Connection error:', error);
      setStatus('error');
      
      let errorMsg = 'Failed to connect to server';
      
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMsg = 'Network error - check if server is running and reachable from this device';
        } else if (error.message.includes('timeout')) {
          errorMsg = 'Connection timeout - server may be slow or unreachable';
        } else if (error.message.includes('ECONNREFUSED')) {
          errorMsg = 'Connection refused - server is not listening on this port';
        } else if (error.message.includes('ENOTFOUND')) {
          errorMsg = 'Host not found - check the server address';
        } else {
          errorMsg = error.message;
        }
      }
      
      setErrorMessage(errorMsg);
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

  const handleSessions = () => {
    // TODO: Navigate to sessions page
    console.log('Navigate to sessions');
  };

  const handleNewChat = () => {
    // TODO: Navigate to new chat page
    console.log('Start new chat');
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
                  Server: {appVersion || 'Connected'}
                </Text>
                <Text style={styles.detailText}>
                  Root Path: {rootPath || 'Unknown'}
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
            {status === 'connected' && (
              <>
                <TouchableOpacity style={styles.primaryButton} onPress={handleNewChat}>
                  <Text style={styles.primaryButtonText}>New Chat</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryButton} onPress={handleSessions}>
                  <Text style={styles.secondaryButtonText}>Sessions</Text>
                </TouchableOpacity>
              </>
            )}
            
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
  primaryButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#0a0a0a",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
});