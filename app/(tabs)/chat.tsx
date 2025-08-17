import { useState, useEffect, useRef } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConnection } from '../../src/contexts/ConnectionContext';
import { toast } from '../../src/utils/toast';
import { filterMessageParts } from '../../src/utils/messageFiltering';
import { MessageDecoration } from '../../src/components/chat/MessageDecoration';
import { MessageContent } from '../../src/components/chat/MessageContent';
import { MessageTimestamp } from '../../src/components/chat/MessageTimestamp';
import { ConnectionStatus } from '../../src/components/chat/ConnectionStatus';
import type { Message, Part } from '../../src/api/types.gen';

interface MessageWithParts {
  info: Message;
  parts: Part[];
}

export default function ChatScreen() {
  const { 
    connectionStatus, 
    sessions,
    currentSession, 
    messages, 
    isLoadingMessages,
    isStreamConnected,
    loadMessages, 
    sendMessage,
    setCurrentSession
  } = useConnection();
  
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Debug logging
  useEffect(() => {
    console.log('Chat screen - currentSession:', currentSession);
    console.log('Chat screen - sessions count:', sessions.length);
    console.log('Chat screen - connectionStatus:', connectionStatus);
  }, [currentSession, sessions, connectionStatus]);

  // Auto-select the most recent session if none is selected but sessions exist
  useEffect(() => {
    if (!currentSession && sessions.length > 0 && connectionStatus === 'connected') {
      // Sort sessions by updated time and select the most recent
      const mostRecentSession = [...sessions].sort((a, b) => b.time.updated - a.time.updated)[0];
      setCurrentSession(mostRecentSession);
    }
  }, [currentSession, sessions, connectionStatus, setCurrentSession]);

  useEffect(() => {
    if (currentSession) {
      console.log('Loading messages for session:', currentSession.id, currentSession.title);
      loadMessages(currentSession.id).catch(error => {
        console.error('Failed to load messages:', error);
        toast.showError('Failed to load messages', error.message);
      });
    } else {
      console.log('No current session set');
    }
  }, [currentSession, loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentSession || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendMessage(currentSession.id, messageText);
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to send message';
      toast.showError('Failed to send message', errorMsg);
      // Restore the input text if sending failed
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: MessageWithParts; index: number }) => {
    // Filter parts using the existing filtering logic
    const { filteredParts, hasContent } = (() => {
      const filtered = filterMessageParts(item.parts);
      return {
        filteredParts: filtered,
        hasContent: filtered.length > 0
      };
    })();
    
    const isAssistant = item.info.role === 'assistant';
    const isStreaming = isAssistant && !hasContent && isStreamConnected;
    // const isLastMessage = index === messages.length - 1;
    
    // Handle streaming state
    if (isStreaming) {
      return (
        <View style={styles.messageContainer}>
          <View style={styles.twoColumnLayout}>
            <MessageDecoration 
              role={item.info.role} 
              isFirstPart={true}
              isLastPart={true}
            />
            <View style={styles.contentColumn}>
              <View style={styles.streamingContainer}>
                <ActivityIndicator size="small" color="#9ca3af" />
                <Text style={[styles.messageText, styles.assistantText, styles.streamingText]}>
                  Thinking...
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    // Handle empty content (fallback for user messages without parts)
    if (filteredParts.length === 0 && item.info.role === 'user') {
      return (
        <View style={styles.messageContainer}>
          <View style={styles.twoColumnLayout}>
            <MessageDecoration 
              role={item.info.role} 
              isFirstPart={true}
              isLastPart={true}
            />
            <View style={styles.contentColumn}>
              <Text style={[styles.messageText, styles.userText]}>
                {item.info.role === 'user' ? 'User message' : 'Assistant response'}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // Render each part as a separate row in the two-column layout
    return (
      <View style={styles.messageContainer}>
        {filteredParts.map((part, partIndex) => {
          const isFirstPart = partIndex === 0;
          const isLastPart = partIndex === filteredParts.length - 1;
          
          return (
            <View key={`${item.info.id}-${partIndex}`} style={styles.twoColumnLayout}>
              <MessageDecoration 
                role={item.info.role}
                part={part}
                isFirstPart={isFirstPart}
                isLastPart={isLastPart}
                providerID={item.info.role === 'assistant' ? (item.info as any).providerID : undefined}
                modelID={item.info.role === 'assistant' ? (item.info as any).modelID : undefined}
              />
              <MessageContent 
                role={item.info.role}
                part={part}
                isLast={index === messages.length - 1}
                partIndex={partIndex}
                totalParts={filteredParts.length}
              />
            </View>
          );
        })}
        {/* Show timestamp for last assistant message */}
        {index === messages.length - 1 && item.info.role === 'assistant' && 'time' in item.info && item.info.time.completed && (
          <MessageTimestamp 
            timestamp={item.info.time.completed}
          />
        )}
      </View>
    );
  };

  if (connectionStatus !== 'connected') {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color="#6b7280" style={styles.icon} />
          <Text style={styles.title}>No Connection</Text>
          <Text style={styles.subtitle}>Connect to a server to start chatting</Text>
          <TouchableOpacity style={styles.connectButton} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.connectButtonText}>Go to Connect</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentSession) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#6b7280" style={styles.icon} />
          <Text style={styles.title}>No Session Selected</Text>
          <Text style={styles.subtitle}>
            {sessions.length === 0 
              ? "Create your first chat session to get started" 
              : "Select a session from the Sessions tab to continue chatting"
            }
          </Text>
          <TouchableOpacity style={styles.connectButton} onPress={() => router.push('/(tabs)/sessions')}>
            <Text style={styles.connectButtonText}>
              {sessions.length === 0 ? "Create New Chat" : "Go to Sessions"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1}>{currentSession.title}</Text>
          <ConnectionStatus 
            status={connectionStatus}
            style={styles.connectionStatus}
          />
        </View>
        <View style={styles.headerRight}>
          {isStreamConnected && (
            <View style={styles.streamStatus}>
              <View style={styles.streamIndicator} />
              <Text style={styles.streamText}>Live</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => router.push('/(tabs)/sessions')}>
            <Ionicons name="list" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoadingMessages ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.info.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#6b7280"
          multiline
          maxLength={4000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#0a0a0a" />
          ) : (
            <Ionicons name="send" size={20} color="#0a0a0a" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streamStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#1a2e1a',
    borderRadius: 8,
  },
  streamIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  streamText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  connectionStatus: {
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  icon: {
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  connectButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  twoColumnLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 8,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#ffffff',
  },
  assistantBubble: {
    backgroundColor: '#2a2a2a',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#0a0a0a',
  },
  assistantText: {
    color: '#ffffff',
  },
  streamingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streamingText: {
    marginLeft: 8,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    backgroundColor: '#0a0a0a',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#ffffff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4a4a4a',
  },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
    marginRight: 8,
  },
});
