import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Switch, TextInput, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConnection } from '../../src/contexts/ConnectionContext';
import { getSavedServers, clearAllServers } from '../../src/utils/serverStorage';
import { localStorage } from '../../src/utils/localStorage';
import { secureSettings } from '../../src/utils/secureSettings';


// Import version from package.json
const packageJson = require('../../package.json');

export default function SettingsScreen() {
  const { connectionStatus, disconnect } = useConnection();
  const [savedServersCount, setSavedServersCount] = useState(0);
  const [darkMode, setDarkMode] = useState(true); // App is currently dark mode only
  const [notifications, setNotifications] = useState(true);
  const [chutesApiKey, setChutesApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [showGithubTokenModal, setShowGithubTokenModal] = useState(false);
  const [githubTokenInput, setGithubTokenInput] = useState('');
  const [isLoadingGithubToken, setIsLoadingGithubToken] = useState(false);
  const [isTestingGithubToken, setIsTestingGithubToken] = useState(false);

  useEffect(() => {
    loadSavedServersCount();
    loadChutesApiKey();
    loadGithubToken();
  }, []);

  const loadSavedServersCount = async () => {
    const servers = await getSavedServers();
    setSavedServersCount(servers.length);
  };

  const loadChutesApiKey = async () => {
    try {
      const apiKey = await localStorage.getChutesApiKey();
      setChutesApiKey(apiKey);
    } catch (error) {
      console.error('Failed to load Chutes API key:', error);
    }
  };

  const loadGithubToken = async () => {
    try {
      const token = await secureSettings.getGitHubToken();
      setGithubToken(token);
    } catch (error) {
      console.error('Failed to load GitHub token:', error);
    }
  };

  const handleDisconnect = () => {
    if (connectionStatus === 'connected') {
      Alert.alert(
        'Disconnect',
        'Are you sure you want to disconnect from the server?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => {
              disconnect();
            }
          }
        ]
      );
    }
  };

  const handleClearServers = () => {
    if (savedServersCount === 0) {
      Alert.alert('No Servers', 'There are no saved servers to clear.');
      return;
    }

    Alert.alert(
      'Clear All Servers',
      `Are you sure you want to remove all ${savedServersCount} saved servers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllServers();
            setSavedServersCount(0);
            Alert.alert('Cleared', 'All saved servers have been removed.');
          }
        }
      ]
    );
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'error': return '#ef4444';
      case 'connecting': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'error': return 'Connection Failed';
      default: return 'Not Connected';
    }
  };

  const handleSaveApiKey = async () => {
    const trimmedApiKey = apiKeyInput.trim();
    
    if (!trimmedApiKey) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    setIsLoadingApiKey(true);
    
    try {
      await localStorage.setChutesApiKey(trimmedApiKey);
      setChutesApiKey(trimmedApiKey);
      setApiKeyInput('');
      setShowApiKeyModal(false);
      Alert.alert('Success', 'Chutes API key has been saved securely');
    } catch (error) {
      console.error('Failed to save API key:', error);
      Alert.alert('Error', 'Failed to save API key. Please try again.');
    } finally {
      setIsLoadingApiKey(false);
    }
  };

  const handleRemoveApiKey = () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your Chutes API key? This will disable Chutes quota features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await localStorage.removeChutesApiKey();
              setChutesApiKey(null);
              Alert.alert('Removed', 'Chutes API key has been removed');
            } catch (error) {
              console.error('Failed to remove API key:', error);
              Alert.alert('Error', 'Failed to remove API key. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditApiKey = () => {
    setApiKeyInput('');
    setShowApiKeyModal(true);
  };

  const handleCancelApiKeyModal = () => {
    setApiKeyInput('');
    setShowApiKeyModal(false);
  };

  const handleSaveGithubToken = async () => {
    const trimmedToken = githubTokenInput.trim();
    
    if (!trimmedToken) {
      Alert.alert('Error', 'Please enter a valid GitHub token');
      return;
    }

    setIsLoadingGithubToken(true);
    
    try {
      await secureSettings.setGitHubToken(trimmedToken);
      setGithubToken(trimmedToken);
      setGithubTokenInput('');
      setShowGithubTokenModal(false);
      Alert.alert('Success', 'GitHub token has been saved securely');
    } catch (error) {
      console.error('Failed to save GitHub token:', error);
      Alert.alert('Error', 'Failed to save GitHub token. Please try again.');
    } finally {
      setIsLoadingGithubToken(false);
    }
  };

  const handleTestGithubConnection = async () => {
    const tokenToTest = githubTokenInput.trim() || githubToken;
    
    if (!tokenToTest) {
      Alert.alert('Error', 'Please enter a GitHub token to test');
      return;
    }

    setIsTestingGithubToken(true);
    
    try {
      const result = await secureSettings.testGitHubConnection(tokenToTest);
      
      if (result.success) {
        const message = result.user 
          ? `Connected successfully as ${result.user.name || result.user.login}` 
          : 'Connection successful';
        Alert.alert('Success', message);
      } else {
        Alert.alert('Connection Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Failed to test GitHub connection:', error);
      Alert.alert('Error', 'Failed to test connection. Please try again.');
    } finally {
      setIsTestingGithubToken(false);
    }
  };

  const handleRemoveGithubToken = () => {
    Alert.alert(
      'Remove GitHub Token',
      'Are you sure you want to remove your GitHub token? This will disable GitHub integration features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await secureSettings.removeGitHubToken();
              setGithubToken(null);
              Alert.alert('Removed', 'GitHub token has been removed');
            } catch (error) {
              console.error('Failed to remove GitHub token:', error);
              Alert.alert('Error', 'Failed to remove GitHub token. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditGithubToken = () => {
    setGithubTokenInput('');
    setShowGithubTokenModal(true);
  };

  const handleCancelGithubTokenModal = () => {
    setGithubTokenInput('');
    setShowGithubTokenModal(false);
  };

  const handleOpenGithubTokenCreation = () => {
    const url = 'https://github.com/settings/tokens/new?scopes=repo,read:org&description=opencode-mobile';
    Linking.openURL(url).catch(err => console.error('Failed to open GitHub URL:', err));
  };

  const maskApiKey = (apiKey: string): string => {
    if (apiKey.length <= 8) return '••••••••';
    return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Connection Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: getConnectionStatusColor() }]} />
                <Text style={[styles.statusText, { color: getConnectionStatusColor() }]}>
                  {getConnectionStatusText()}
                </Text>
              </View>
            </View>
          </View>

          {connectionStatus === 'connected' && (
            <TouchableOpacity style={styles.actionButton} onPress={handleDisconnect}>
              <Ionicons name="power-outline" size={20} color="#ef4444" />
              <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* API Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Chutes API Key</Text>
              <Text style={styles.settingDescription}>
                {chutesApiKey ? 'Required for Chutes quota features' : 'Not configured'}
              </Text>
              {chutesApiKey && (
                <Text style={styles.apiKeyMasked}>{maskApiKey(chutesApiKey)}</Text>
              )}
            </View>
            <View style={styles.apiKeyActions}>
              {chutesApiKey ? (
                <>
                  <TouchableOpacity style={styles.iconButton} onPress={handleEditApiKey}>
                    <Ionicons name="pencil-outline" size={18} color="#10b981" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={handleRemoveApiKey}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.iconButton} onPress={handleEditApiKey}>
                  <Ionicons name="add-outline" size={18} color="#10b981" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>GitHub Token</Text>
              <Text style={styles.settingDescription}>
                {githubToken ? 'Required for GitHub integration features' : 'Not configured'}
              </Text>
              {githubToken && (
                <Text style={styles.apiKeyMasked}>{maskApiKey(githubToken)}</Text>
              )}
            </View>
            <View style={styles.apiKeyActions}>
              {githubToken ? (
                <>
                  <TouchableOpacity style={styles.iconButton} onPress={handleEditGithubToken}>
                    <Ionicons name="pencil-outline" size={18} color="#10b981" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={handleRemoveGithubToken}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.iconButton} onPress={handleEditGithubToken}>
                  <Ionicons name="add-outline" size={18} color="#10b981" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Saved Servers</Text>
              <Text style={styles.settingValue}>{savedServersCount} servers</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleClearServers}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Clear All Servers</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Currently enabled (app default)</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#2a2a2a', true: '#10b981' }}
              thumbColor={darkMode ? '#ffffff' : '#6b7280'}
              disabled={true} // Disabled since app is dark mode only
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>Enable connection status notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#2a2a2a', true: '#10b981' }}
              thumbColor={notifications ? '#ffffff' : '#6b7280'}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>opencode Mobile</Text>
              <Text style={styles.settingDescription}>AI coding agent client for mobile devices</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingValue}>{packageJson.version}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* API Key Modal */}
      <Modal
        visible={showApiKeyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelApiKeyModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="key-outline" size={24} color="#ffffff" />
              <Text style={styles.modalTitle}>
                {chutesApiKey ? 'Update Chutes API Key' : 'Add Chutes API Key'}
              </Text>
            </View>
            
            <Text style={styles.modalDescription}>
              Enter your Chutes API key to enable quota tracking and other Chutes features. 
              The key will be stored securely on your device.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="Enter your Chutes API key"
              placeholderTextColor="#6b7280"
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoadingApiKey}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={handleCancelApiKeyModal}
                disabled={isLoadingApiKey}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalSaveButton, 
                  (!apiKeyInput.trim() || isLoadingApiKey) && styles.modalSaveButtonDisabled
                ]}
                onPress={handleSaveApiKey}
                disabled={!apiKeyInput.trim() || isLoadingApiKey}
              >
                <Text style={[
                  styles.modalSaveButtonText, 
                  (!apiKeyInput.trim() || isLoadingApiKey) && styles.modalSaveButtonTextDisabled
                ]}>
                  {isLoadingApiKey ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* GitHub Token Modal */}
      <Modal
        visible={showGithubTokenModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelGithubTokenModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="logo-github" size={24} color="#ffffff" />
              <Text style={styles.modalTitle}>
                {githubToken ? 'Update GitHub Token' : 'Add GitHub Token'}
              </Text>
            </View>
            
            <Text style={styles.modalDescription}>
              Enter your GitHub Personal Access Token (classic) to enable GitHub integration features. 
              The token will be stored securely on your device.
            </Text>
            
            <TouchableOpacity 
              style={styles.githubLinkButton} 
              onPress={handleOpenGithubTokenCreation}
            >
              <Ionicons name="open-outline" size={16} color="#10b981" />
              <Text style={styles.githubLinkText}>Create Classic Token</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.modalInput}
              value={githubTokenInput}
              onChangeText={setGithubTokenInput}
              placeholder="Enter your GitHub Personal Access Token (classic)"
              placeholderTextColor="#6b7280"
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoadingGithubToken && !isTestingGithubToken}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={handleCancelGithubTokenModal}
                disabled={isLoadingGithubToken || isTestingGithubToken}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalTestButton]}
                onPress={handleTestGithubConnection}
                disabled={!githubTokenInput.trim() && !githubToken || isLoadingGithubToken || isTestingGithubToken}
              >
                <Text style={styles.modalTestButtonText}>
                  {isTestingGithubToken ? 'Testing...' : 'Test'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalSaveButton, 
                  (!githubTokenInput.trim() || isLoadingGithubToken || isTestingGithubToken) && styles.modalSaveButtonDisabled
                ]}
                onPress={handleSaveGithubToken}
                disabled={!githubTokenInput.trim() || isLoadingGithubToken || isTestingGithubToken}
              >
                <Text style={[
                  styles.modalSaveButtonText, 
                  (!githubTokenInput.trim() || isLoadingGithubToken || isTestingGithubToken) && styles.modalSaveButtonTextDisabled
                ]}>
                  {isLoadingGithubToken ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 18,
  },
  settingValue: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  apiKeyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiKeyMasked: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  modalCancelButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSaveButton: {
    backgroundColor: '#10b981',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#4a4a4a',
  },
  modalSaveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButtonTextDisabled: {
    color: '#9ca3af',
  },
  githubLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  githubLinkText: {
    fontSize: 14,
    color: '#10b981',
    marginLeft: 6,
  },
  modalTestButton: {
    backgroundColor: '#3b82f6',
  },
  modalTestButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
