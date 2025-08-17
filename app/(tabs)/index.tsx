import { useState, useEffect, useCallback } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as Clipboard from 'expo-clipboard';
import { getSavedServers, removeServer, SavedServer, saveServer } from '../../src/utils/serverStorage';
import { sessionList, appGet } from '../../src/api/sdk.gen';
import { createClient, createConfig } from '../../src/api/client';

type ConnectionStatus = 'connecting' | 'connected' | 'error' | 'idle';

export default function Index() {
  const [serverUrl, setServerUrl] = useState("");
  const [savedServers, setSavedServers] = useState<SavedServer[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [rootPath, setRootPath] = useState<string | null>(null);

  useEffect(() => {
    loadSavedServers();
  }, []);

  const loadSavedServers = async () => {
    const servers = await getSavedServers();
    setSavedServers(servers);
  };

  const connectToServer = useCallback(async (urlToConnect: string) => {
    if (!urlToConnect) {
      setStatus('error');
      setErrorMessage('No server URL provided');
      return;
    }

    setStatus('connecting');
    setErrorMessage('');

    try {
      // Validate URL format
      const urlPattern = /^[^:\/]+:\d+$/;
      if (!urlPattern.test(urlToConnect)) {
        throw new Error('Invalid URL format. Expected: host:port (e.g., 192.168.1.100:3000)');
      }

      const baseUrl = `http://${urlToConnect}`;
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
        url: urlToConnect,
        lastConnected: Date.now(),
        connectionDetails: {
          appVersion: `API v${apiVersion} (${hostname})`,
          rootPath: rootPathValue,
          sessionCount: sessionResponse.data?.length || 0,
        }
      });

      // Reload saved servers to show the newly connected server
      loadSavedServers();
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
  }, []);

  const handleConnect = () => {
    if (!serverUrl.trim()) {
      Alert.alert("Error", "Please enter a server URL");
      return;
    }
    
    connectToServer(serverUrl.trim());
  };

  const handleQuickConnect = (url: string) => {
    setServerUrl(url);
    connectToServer(url);
  };

  const retry = () => {
    if (serverUrl.trim()) {
      connectToServer(serverUrl.trim());
    }
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

  const handleRemoveServer = async (url: string) => {
    Alert.alert(
      "Remove Server",
      "Are you sure you want to remove this server from your saved list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeServer(url);
            loadSavedServers();
          }
        }
      ]
    );
  };

  const copyCommand = async () => {
    await Clipboard.setStringAsync("opencode serve --hostname 0.0.0.0");
    Alert.alert("Copied", "Command copied to clipboard");
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>opencode</Text>
          <Text style={styles.subtitle}>The AI coding agent built for the terminal.</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Setup Instructions</Text>
          
          <View style={styles.step}>
            <Text style={styles.stepTitle}>1. Start the server</Text>
            <Text style={styles.stepDescription}>Run this command on your computer:</Text>
            <TouchableOpacity style={styles.codeBlock} onPress={copyCommand}>
              <Text style={styles.prompt}>$ </Text>
              <Text style={styles.code}>opencode serve --hostname 0.0.0.0</Text>
              <Text style={styles.copyHint}>📋</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepTitle}>2. Connect to server</Text>
            <Text style={styles.stepDescription}>Enter your server URL:</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="192.168.1.100:3000"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity 
            style={[styles.connectButton, status === 'connecting' && styles.connectButtonDisabled]} 
            onPress={handleConnect}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? (
              <ActivityIndicator size="small" color="#0a0a0a" />
            ) : (
              <Text style={styles.connectButtonText}>Connect</Text>
            )}
          </TouchableOpacity>

          {status !== 'idle' && (
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
                  <TouchableOpacity style={styles.retryButton} onPress={retry}>
                    <Text style={styles.retryButtonText}>Retry Connection</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {savedServers.length > 0 && (
            <View style={styles.savedServersSection}>
              <Text style={styles.savedServersTitle}>Recent Servers</Text>
              {savedServers.slice(0, 5).map((server) => (
                <View key={server.url} style={styles.savedServerItem}>
                  <TouchableOpacity 
                    style={styles.savedServerButton}
                    onPress={() => handleQuickConnect(server.url)}
                  >
                    <View style={styles.savedServerInfo}>
                      <Text style={styles.savedServerUrl}>{server.url}</Text>
                      <Text style={styles.savedServerDetails}>
                        Last connected: {new Date(server.lastConnected).toLocaleDateString()}
                        {server.connectionDetails?.sessionCount !== undefined && 
                          ` • ${server.connectionDetails.sessionCount} sessions`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeServerButton}
                    onPress={() => handleRemoveServer(server.url)}
                  >
                    <Text style={styles.removeServerText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 24,
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
    textAlign: "center",
    color: "#9ca3af",
    fontWeight: "400",
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  step: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 12,
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
  },
  copyHint: {
    fontSize: 16,
    opacity: 0.6,
  },
  prompt: {
    fontFamily: "monospace",
    fontSize: 16,
    color: "#6b7280",
  },
  code: {
    fontFamily: "monospace",
    fontSize: 16,
    color: "#e5e7eb",
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#ffffff",
    fontFamily: "monospace",
  },
  connectButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 4,
  },
  connectButtonText: {
    color: "#0a0a0a",
    fontSize: 16,
    fontWeight: "600",
  },
  savedServersSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  savedServersTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  savedServerItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  savedServerButton: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  savedServerInfo: {
    flex: 1,
  },
  savedServerUrl: {
    fontSize: 16,
    color: "#ffffff",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  savedServerDetails: {
    fontSize: 12,
    color: "#9ca3af",
  },
  removeServerButton: {
    marginLeft: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  removeServerText: {
    fontSize: 18,
    color: "#9ca3af",
    fontWeight: "bold",
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  statusCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    marginTop: 16,
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
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#0a0a0a",
    fontSize: 14,
    fontWeight: "600",
  },
});
