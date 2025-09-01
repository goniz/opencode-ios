import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useConnection } from '../../contexts/ConnectionContext';
import { semanticColors } from '../../styles/colors';
import { ChatFlashList } from './ChatFlashList';
import { ImagePreview } from './ImagePreview';
import { CrutesApiKeyInput } from './CrutesApiKeyInput';
import { useSessionManager } from '../../hooks/useSessionManager';
import { useModelSelection } from '../../hooks/useModelSelection';
import { useMessageOperations } from '../../hooks/useMessageOperations';
import { useCommandExecution } from '../../hooks/useCommandExecution';
import { useChutesIntegration } from '../../hooks/useChutesIntegration';
import { useConnectionRecovery } from '../../hooks/useConnectionRecovery';
import { calculateTokenInfo } from '../../utils/chat/tokenCalculation';
import { getGitStatus, type GitStatusInfo } from '../../utils/gitStatus';
import { ChatHeader } from './ChatHeader';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatErrorBanner } from './ChatErrorBanner';
import { ChatInputBar } from './ChatInputBar';

export default function ChatScreen({ sessionId }: { sessionId?: string }) {
  // Connection context
  const connection = useConnection();
  
  // Local state
  const [gitStatus, setGitStatus] = useState<GitStatusInfo | null>(null);
  
  // Custom hooks
  const sessionManager = useSessionManager(connection, sessionId);
  const modelSelection = useModelSelection(connection, sessionManager.currentSession, connection.messages);
  const messageOps = useMessageOperations(connection, sessionManager.currentSession);
  const commands = useCommandExecution(
    connection, 
    sessionManager.currentSession, 
    modelSelection.currentModel, 
    connection.loadMessages
  );
  const chutes = useChutesIntegration(connection, modelSelection.currentModel);
  const recovery = useConnectionRecovery(connection, sessionManager.currentSession);
  
  // Load providers and models when connected
  useEffect(() => {
    modelSelection.loadProvidersAndModels();
  }, [connection.connectionStatus, connection.client, modelSelection]);

  // Load git status when connected and session changes
  useEffect(() => {
    if (connection.connectionStatus === 'connected' && connection.client && sessionManager.currentSession) {
      const loadGitStatus = async () => {
        try {
          const status = await getGitStatus(connection.client!);
          setGitStatus(status);
        } catch (error) {
          console.warn('Failed to load git status:', error);
          setGitStatus(null);
        }
      };

      loadGitStatus();
      
      // Refresh git status every 30 seconds
      const interval = setInterval(loadGitStatus, 30000);
      
      return () => clearInterval(interval);
    } else {
      setGitStatus(null);
    }
  }, [connection.connectionStatus, connection.client, sessionManager.currentSession]);

  // Subscribe to session idle events to refresh git status
  useEffect(() => {
    if (connection.connectionStatus !== 'connected' || !connection.client) {
      return;
    }

    console.log('Subscribing to session idle events for git status refresh');
    const unsubscribe = connection.onSessionIdle((sessionId: string) => {
      console.log(`[Git] Session ${sessionId} became idle, refreshing git status`);
      // Trigger git status refresh
      getGitStatus(connection.client!).then(setGitStatus).catch(error => {
        console.warn('Failed to refresh git status on session idle:', error);
        setGitStatus(null);
      });
    });
    
    return unsubscribe;
  }, [connection]);

  // Handle session URL copy
  const handleUrlCopy = useCallback(async () => {
    if (sessionManager.currentSession?.share?.url) {
      try {
        await Clipboard.setStringAsync(sessionManager.currentSession.share.url);
        // In a real implementation, we would show a toast or update command status
      } catch (error) {
        console.error('Failed to copy URL to clipboard:', error);
      }
    }
  }, [sessionManager.currentSession?.share?.url]);

  // Handle command execution for text input
  const handleTextCommandExecution = useCallback((text: string) => {
    if (text.startsWith('/')) {
      commands.handleCommandExecution(text);
      return true;
    }
    return false;
  }, [commands]);

  // Handle send message with command checking
  const handleSendMessage = useCallback(() => {
    // Check if this is a command
    if (handleTextCommandExecution(messageOps.inputText)) {
      // Clear input for commands
      messageOps.setInputText('');
      return;
    }
    
    // Otherwise send as regular message
    messageOps.handleSendMessage();
  }, [messageOps, handleTextCommandExecution]);

  // Calculate context info
  const contextInfo = calculateTokenInfo(
    connection.messages.map(m => m.info),
    modelSelection.availableModels,
    modelSelection.currentModel || undefined
  );

  // Simplified render
  if (connection.connectionStatus !== 'connected') {
    return (
      <ChatEmptyState 
        connectionStatus={connection.connectionStatus} 
        currentSession={sessionManager.currentSession}
        sessionsCount={connection.sessions.length}
      />
    );
  }

  if (!sessionManager.currentSession) {
    return (
      <ChatEmptyState 
        connectionStatus={connection.connectionStatus} 
        currentSession={sessionManager.currentSession}
        sessionsCount={connection.sessions.length}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ChatHeader
          session={sessionManager.currentSession}
          connectionStatus={connection.connectionStatus}
          isStreamConnected={connection.isStreamConnected}
          isGenerating={messageOps.isGenerating}
          currentProvider={modelSelection.currentProvider || undefined}
          currentModel={modelSelection.currentModel || undefined}
          onProviderSelect={() => {
            // In a real implementation, this would show the provider selection dialog
            Alert.alert('Provider Selection', 'Provider selection would be implemented here');
          }}
          onModelSelect={() => {
            // In a real implementation, this would show the model selection dialog
            Alert.alert('Model Selection', 'Model selection would be implemented here');
          }}
          contextInfo={contextInfo || undefined}
          chutesQuota={chutes.chutesQuota || undefined}
          commandStatus={commands.commandStatus || undefined}
          sessionUrl={sessionManager.currentSession.share?.url || undefined}
          gitStatus={gitStatus || undefined}
          onUrlCopy={handleUrlCopy}
          availableProviders={modelSelection.availableProviders}
          availableModels={modelSelection.currentProviderModels}
        />
        
        <ChatErrorBanner
          error={recovery.lastError}
          isDismissed={recovery.isDismissed}
          onDismiss={recovery.handleDismiss}
        />
        
        {connection.isLoadingMessages ? (
          <View style={styles.loadingContainer}>
            {/* In a real implementation, we would show a loading indicator */}
          </View>
        ) : (
          <ChatFlashList
            messages={messageOps.messages}
            currentSessionId={sessionManager.currentSession?.id}
            isStreamConnected={connection.isStreamConnected}
            isGenerating={messageOps.isGenerating}
            onLoadOlder={undefined}
            hasMoreOlder={false}
            isLoadingOlder={false}
          />
        )}
        
        <ImagePreview
          images={messageOps.selectedImages}
          onRemoveImage={messageOps.handleRemoveImage}
        />
        
        <CrutesApiKeyInput
          visible={chutes.showApiKeyInput}
          onApiKeyProvided={chutes.handleApiKeyProvided}
          onCancel={chutes.handleApiKeyInputCancel}
        />
        
        <ChatInputBar
          inputText={messageOps.inputText}
          onTextChange={messageOps.setInputText}
          selectedImages={messageOps.selectedImages}
          onImageSelected={messageOps.handleImageSelected}
          onSend={handleSendMessage}
          onInterrupt={messageOps.handleInterrupt}
          isGenerating={messageOps.isGenerating}
          isSending={messageOps.isSending}
          onCommandSelect={commands.handleCommandSelect}
          onMenuCommandSelect={commands.handleMenuCommandSelect}
          userCommands={connection.commands}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});