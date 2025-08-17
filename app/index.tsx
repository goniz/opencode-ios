import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar } from "react-native";
import * as Clipboard from 'expo-clipboard';

export default function Index() {
  const [serverUrl, setServerUrl] = useState("");

  const handleConnect = () => {
    if (!serverUrl.trim()) {
      Alert.alert("Error", "Please enter a server URL");
      return;
    }
    
    // TODO: Implement connection logic
    Alert.alert("Connect", `Connecting to: ${serverUrl}`);
  };

  const copyCommand = async () => {
    await Clipboard.setStringAsync("opencode serve --hostname 0.0.0.0");
    Alert.alert("Copied", "Command copied to clipboard");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
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

          <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    fontSize: 36,
    fontWeight: "300",
    color: "#ffffff",
    marginBottom: 12,
    fontFamily: "monospace",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#9ca3af",
    fontWeight: "400",
    lineHeight: 26,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 32,
  },
  step: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: "#9ca3af",
    marginBottom: 16,
    lineHeight: 24,
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
    marginBottom: 32,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 8,
  },
  connectButtonText: {
    color: "#0a0a0a",
    fontSize: 16,
    fontWeight: "600",
  },
});
