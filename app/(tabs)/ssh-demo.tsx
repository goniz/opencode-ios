import { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ExpoSSHModule from '../../modules/expo-ssh/src/ExpoSSHModule';

export default function SSHDemoScreen() {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [command, setCommand] = useState('ls -la');
  const [output, setOutput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    // Add event listeners for SSH events
    const onConnectedSubscription = ExpoSSHModule.addListener('onSSHConnected', (event) => {
      console.log('SSH Connected:', event);
      setIsConnected(true);
      setIsConnecting(false);
      setOutput(prev => prev + `\n✅ Connected to ${event.host}:${event.port}\n`);
    });

    const onDisconnectedSubscription = ExpoSSHModule.addListener('onSSHDisconnected', () => {
      console.log('SSH Disconnected');
      setIsConnected(false);
      setIsConnecting(false);
      setOutput(prev => prev + '\n❌ Disconnected from SSH server\n');
    });

    const onOutputSubscription = ExpoSSHModule.addListener('onSSHOutput', (event) => {
      console.log('SSH Output:', event);
      setOutput(prev => prev + event.output);
    });

    const onErrorSubscription = ExpoSSHModule.addListener('onSSHError', (event) => {
      console.log('SSH Error:', event);
      setIsConnecting(false);
      setIsExecuting(false);
      setOutput(prev => prev + `\n❌ Error: ${event.error}\n`);
    });

    return () => {
      onConnectedSubscription.remove();
      onDisconnectedSubscription.remove();
      onOutputSubscription.remove();
      onErrorSubscription.remove();
    };
  }, []);

  const handleConnect = async () => {
    if (!host.trim() || !username.trim()) {
      Alert.alert('Error', 'Please enter host and username');
      return;
    }

    setIsConnecting(true);
    setOutput(prev => prev + `\n🔄 Connecting to ${host}:${port}...\n`);

    try {
      await ExpoSSHModule.connect(
        host.trim(),
        parseInt(port) || 22,
        username.trim(),
        password.trim() || undefined,
        undefined // privateKey - not implemented in this demo
      );
    } catch (error) {
      setIsConnecting(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setOutput(prev => prev + `\n❌ Connection failed: ${errorMessage}\n`);
      Alert.alert('Connection Failed', errorMessage);
    }
  };

  const handleDisconnect = async () => {
    try {
      await ExpoSSHModule.disconnect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setOutput(prev => prev + `\n❌ Disconnect failed: ${errorMessage}\n`);
    }
  };

  const handleExecuteCommand = async () => {
    if (!command.trim()) {
      Alert.alert('Error', 'Please enter a command');
      return;
    }

    setIsExecuting(true);
    setOutput(prev => prev + `\n$ ${command}\n`);

    try {
      const result = await ExpoSSHModule.executeCommand(command.trim());
      setOutput(prev => prev + result + '\n');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setOutput(prev => prev + `❌ Command failed: ${errorMessage}\n`);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearOutput = () => {
    setOutput('');
  };

  const fillSampleData = () => {
    setHost('192.168.1.100');
    setUsername('pi');
    setPassword('raspberry');
    setCommand('uname -a');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name="terminal-outline" size={32} color="#10b981" />
          <Text style={styles.title}>SSH Demo</Text>
          <TouchableOpacity style={styles.sampleButton} onPress={fillSampleData}>
            <Ionicons name="flask-outline" size={16} color="#3b82f6" />
            <Text style={styles.sampleButtonText}>Sample Data</Text>
          </TouchableOpacity>
        </View>

        {/* Connection Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Settings</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Host</Text>
              <TextInput
                style={styles.textInput}
                value={host}
                onChangeText={setHost}
                placeholder="192.168.1.100"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isConnected && !isConnecting}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 0.3 }]}>
              <Text style={styles.inputLabel}>Port</Text>
              <TextInput
                style={styles.textInput}
                value={port}
                onChangeText={setPort}
                placeholder="22"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                editable={!isConnected && !isConnecting}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isConnected && !isConnecting}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              placeholder="password (optional)"
              placeholderTextColor="#6b7280"
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isConnected && !isConnecting}
            />
          </View>

          {/* Connection Status */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator, 
              { 
                backgroundColor: isConnected ? '#10b981' : 
                                isConnecting ? '#f59e0b' : '#ef4444' 
              }
            ]} />
            <Text style={[
              styles.statusText, 
              { 
                color: isConnected ? '#10b981' : 
                       isConnecting ? '#f59e0b' : '#ef4444' 
              }
            ]}>
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </Text>
          </View>

          {/* Connection Buttons */}
          <View style={styles.buttonRow}>
            {!isConnected ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.connectButton]}
                onPress={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="link-outline" size={20} color="#ffffff" />
                )}
                <Text style={styles.actionButtonText}>
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionButton, styles.disconnectButton]}
                onPress={handleDisconnect}
              >
                <Ionicons name="unlink-outline" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Disconnect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Command Execution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Command Execution</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Command</Text>
            <TextInput
              style={styles.textInput}
              value={command}
              onChangeText={setCommand}
              placeholder="ls -la"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isExecuting}
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.executeButton,
              (!isConnected || isExecuting) && styles.disabledButton
            ]}
            onPress={handleExecuteCommand}
            disabled={!isConnected || isExecuting}
          >
            {isExecuting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="play-outline" size={20} color="#ffffff" />
            )}
            <Text style={styles.actionButtonText}>
              {isExecuting ? 'Executing...' : 'Execute'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Output Section */}
        <View style={styles.section}>
          <View style={styles.outputHeader}>
            <Text style={styles.sectionTitle}>Output</Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearOutput}>
              <Ionicons name="trash-outline" size={16} color="#6b7280" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.outputContainer} nestedScrollEnabled={true}>
            <Text style={styles.outputText}>
              {output || 'No output yet. Connect to an SSH server and run commands to see output here.'}
            </Text>
          </ScrollView>
        </View>

        {/* Demo Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.infoTitle}>Demo Info</Text>
          </View>
          <Text style={styles.infoText}>
            This demo showcases the native SSH functionality using Swift NIO SSH library. 
            Connect to any SSH server and execute commands remotely.
          </Text>
          <Text style={styles.infoText}>
            • Password authentication is supported{'\n'}
            • Commands are executed in a session context{'\n'}
            • Real-time output streaming{'\n'}
            • Secure connection management
          </Text>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#ffffff',
    fontFamily: 'monospace',
    marginLeft: 12,
    flex: 1,
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  sampleButtonText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    fontFamily: 'monospace',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#10b981',
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
  },
  executeButton: {
    backgroundColor: '#3b82f6',
  },
  disabledButton: {
    backgroundColor: '#4a4a4a',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  outputContainer: {
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  outputText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'monospace',
    padding: 16,
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: '#0f1419',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e3a8a',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});