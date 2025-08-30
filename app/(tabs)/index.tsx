import { useState, useEffect, useCallback } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as Clipboard from 'expo-clipboard';
import { getSavedServers, removeServer, SavedServer } from '../../src/utils/serverStorage';
import { appGet } from '../../src/api/sdk.gen';
import { useConnection } from '../../src/contexts/ConnectionContext';

export default function Index() {
  const { 
    connectionStatus, 
    connect, 
    lastError, 
    sessions, 
    client
  } = useConnection();
  const [serverUrl, setServerUrl] = useState("");
  const [savedServers, setSavedServers] = useState<SavedServer[]>([]);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [homePath, setHomePath] = useState<string | null>(null);

  const loadSavedServers = useCallback(async () => {
    const servers = await getSavedServers();
    setSavedServers(servers);
  }, []);

  useEffect(() => {
    loadSavedServers();
  }, [loadSavedServers]);

  const connectToServer = useCallback(async (urlToConnect: string) => {
    if (!urlToConnect) {
      return;
    }

    try {
      // Validate URL format
      const urlPattern = /^[^:\/]+:\d+$/;
      if (!urlPattern.test(urlToConnect)) {
        throw new Error('Invalid URL format. Expected: host:port (e.g., 192.168.1.100:3000)');
      }

      const baseUrl = `http://${urlToConnect}`;
      console.log('Attempting connection to:', baseUrl);

      // Use the connection context to connect
      await connect(baseUrl);

      // Fetch app info after successful connection
      if (client) {
        try {
          const appResponse = await appGet({ client });
          
          if (!appResponse.error && appResponse.data) {
            const appData = appResponse.data;
            const apiVersion = '1.0.0'; // From OpenAPI spec info.version
            const hostname = appData.hostname || 'localhost';
            const rootPathValue = appData.path?.root || 'unknown';
            const homePathValue = appData.path?.home || 'unknown';

            setAppVersion(`API v${apiVersion} (${hostname})`);
            setRootPath(rootPathValue);
            setHomePath(homePathValue);
          }
        } catch (error) {
          console.error('Failed to fetch app info:', error);
        }
      }

      // Reload saved servers to show the newly connected server
      loadSavedServers();

      // Auto-navigate to Sessions tab after successful connection
      setTimeout(() => {
        router.push('/(tabs)/sessions');
      }, 500);
    } catch (error) {
      console.error('Connection error:', error);
    }
  }, [connect, client, loadSavedServers]);

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
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'error': return '#ef4444';
      case 'connecting': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
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
    await Clipboard.setStringAsync("opencode serve --hostname 0.0.0.0 --port 4096 --print-logs");
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
               <Text style={styles.code}>opencode serve --hostname 0.0.0.0 --port 4096 --print-logs</Text>
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
              placeholder="192.168.1.100:4096"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity 
            style={[styles.connectButton, connectionStatus === 'connecting' && styles.connectButtonDisabled]} 
            onPress={handleConnect}
            disabled={connectionStatus === 'connecting'}
          >
            {connectionStatus === 'connecting' ? (
              <ActivityIndicator size="small" color="#0a0a0a" />
            ) : (
              <Text style={styles.connectButtonText}>Connect</Text>
            )}
          </TouchableOpacity>

          {connectionStatus !== 'idle' && (
            <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
              <View style={styles.statusHeader}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
                {connectionStatus === 'connecting' && (
                  <ActivityIndicator size="small" color={getStatusColor()} style={styles.spinner} />
                )}
              </View>

               {connectionStatus === 'connected' && (
                 <View style={styles.connectionDetails}>
                   <Text style={styles.detailText}>
                     Active Sessions: {sessions.length}
                   </Text>
                   <Text style={styles.detailText}>
                     Server: {appVersion || 'Connected'}
                   </Text>
                   <Text style={styles.detailText}>
                     Root Directory: {rootPath || 'Unknown'}
                   </Text>
                   <Text style={styles.detailText}>
                     Home Directory: {homePath || 'Unknown'}
                   </Text>
                 </View>
               )}

              {connectionStatus === 'error' && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorText}>{lastError || 'Unknown error occurred'}</Text>
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
    alignItems: "flex-start",
    minHeight: 56,
  },
  copyHint: {
    fontSize: 16,
    opacity: 0.6,
    alignSelf: "flex-start",
    marginTop: 2,
    marginLeft: 8,
  },
  prompt: {
    fontFamily: "monospace",
    fontSize: 14,
    color: "#6b7280",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  code: {
    fontFamily: "monospace",
    fontSize: 14,
    color: "#e5e7eb",
    flex: 1,
    lineHeight: 20,
    flexWrap: "wrap",
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
