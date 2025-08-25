import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { localStorage } from '../../utils/localStorage';

interface CrutesApiKeyInputProps {
  visible: boolean;
  onApiKeyProvided: (apiKey: string) => void;
  onCancel: () => void;
}

export function CrutesApiKeyInput({ visible, onApiKeyProvided, onCancel }: CrutesApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedApiKey = apiKey.trim();
    
    if (!trimmedApiKey) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    
    try {
      // Store the API key locally
      await localStorage.setChutesApiKey(trimmedApiKey);
      console.log('[Chutes] API key stored locally');
      
      // Clear the input
      setApiKey('');
      
      // Notify parent component
      onApiKeyProvided(trimmedApiKey);
    } catch (error) {
      console.error('Failed to store API key:', error);
      Alert.alert('Error', 'Failed to store API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setApiKey('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name="key-outline" size={24} color="#ffffff" />
            <Text style={styles.title}>Chutes API Key Required</Text>
          </View>
          
          <Text style={styles.description}>
            To display Chutes quota information, please enter your Chutes API key. 
            It will be stored securely on your device.
          </Text>
          
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your Chutes API key"
            placeholderTextColor="#6b7280"
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.submitButton, (!apiKey.trim() || isLoading) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!apiKey.trim() || isLoading}
            >
              <Text style={[styles.submitButtonText, (!apiKey.trim() || isLoading) && styles.submitButtonTextDisabled]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  cancelButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2563eb',
  },
  submitButtonDisabled: {
    backgroundColor: '#4a4a4a',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#9ca3af',
  },
});