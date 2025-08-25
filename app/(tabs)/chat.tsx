import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConnection } from '../../src/contexts/ConnectionContext';
import { toast } from '../../src/utils/toast';
import { filterMessageParts } from '../../src/utils/messageFiltering';
import { MessageDecoration } from '../../src/components/chat/MessageDecoration';
import { MessageContent } from '../../src/components/chat/MessageContent';
import { MessageTimestamp } from '../../src/components/chat/MessageTimestamp';

import { ImageAwareTextInput } from '../../src/components/chat/ImageAwareTextInput';
import { ImagePreview } from '../../src/components/chat/ImagePreview';
import { CrutesApiKeyInput } from '../../src/components/chat/CrutesApiKeyInput';
import type { Message, Part, AssistantMessage } from '../../src/api/types.gen';
import { configProviders, sessionCommand } from '../../src/api/sdk.gen';
import type { CommandSuggestion } from '../../src/utils/commandMentions';
import { ChutesApiKeyInvalidError, fetchChutesQuota } from '../../src/utils/chutes';
import { localStorage } from '../../src/utils/localStorage';

interface MessageWithParts {
  info: Message;
  parts: Part[];
}

// Helper function to format large numbers in human-readable form (matches official OpenCode TUI)
function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    const formatted = `${(count / 1000000).toFixed(1)}M`;
    return formatted.replace('.0M', 'M');
  } else if (count >= 1000) {
    const formatted = `${(count / 1000).toFixed(1)}K`;
    return formatted.replace('.0K', 'K');
  }
  return Math.floor(count).toString();
}

export default function ChatScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { 
    connectionStatus, 
    sessions,
    currentSession, 
    messages,
    isLoadingMessages,
    isStreamConnected,
    isGenerating,
    lastError,
    clearError,
    loadMessages, 
    sendMessage,
    abortSession,
    setCurrentSession,
    client,
    latestProviderModel,
    onSessionIdle
  } = useConnection();
  
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<{providerID: string, modelID: string} | null>(null);
  const [availableProviders, setAvailableProviders] = useState<{id: string, name: string}[]>([]);
  const [availableModels, setAvailableModels] = useState<{providerID: string, modelID: string, displayName: string, contextLimit: number}[]>([]);
  const [currentProviderModels, setCurrentProviderModels] = useState<{modelID: string, name: string}[]>([]);
   const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
   const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);
   const [isUserAtBottom, setIsUserAtBottom] = useState(true);
   const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
   const [hasNewMessages, setHasNewMessages] = useState(false);
   const [chutesQuota, setChutesQuota] = useState<{used: number, quota: number} | null>(null);
   const [showApiKeyInput, setShowApiKeyInput] = useState(false);
   const [pendingApiKeyRequest, setPendingApiKeyRequest] = useState<{providerID: string, modelID: string} | null>(null);
   const flatListRef = useRef<FlatList>(null);
   const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle session ID from navigation parameters
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      console.log('Chat screen - sessionId from params:', sessionId);
      const targetSession = sessions.find(s => s.id === sessionId);
      if (targetSession && (!currentSession || currentSession.id !== sessionId)) {
        console.log('Chat screen - Setting session from params:', targetSession.id, targetSession.title);
        setCurrentSession(targetSession);
      } else if (!targetSession) {
        console.warn('Chat screen - Session not found for ID:', sessionId);
      }
    }
  }, [sessionId, sessions, currentSession, setCurrentSession]);

  // Debug logging
  useEffect(() => {
    console.log('Chat screen - currentSession:', currentSession);
    console.log('Chat screen - sessions count:', sessions.length);
    console.log('Chat screen - connectionStatus:', connectionStatus);
    console.log('Chat screen - messages count:', messages.length);
    console.log('Chat screen - isStreamConnected:', isStreamConnected);
    console.log('Chat screen - sessionId param:', sessionId);
    console.log('🎯 Chat screen - isGenerating:', isGenerating);
  }, [currentSession, sessions, connectionStatus, messages.length, isStreamConnected, sessionId, isGenerating]);

  // Load available providers and models when connected
  useEffect(() => {
    const loadProvidersAndModels = async () => {
      if (connectionStatus === 'connected' && client) {
        try {
          const response = await configProviders({ client });
          if (response.data) {
            const providers: {id: string, name: string}[] = [];
            const models: {providerID: string, modelID: string, displayName: string, contextLimit: number}[] = [];
            
            // Extract providers and models
            response.data.providers.forEach(provider => {
              providers.push({
                id: provider.id,
                name: provider.name
              });
              
              Object.keys(provider.models).forEach(modelKey => {
                const model = provider.models[modelKey];
                models.push({
                  providerID: provider.id,
                  modelID: model.id,
                  displayName: `${provider.name} / ${model.name}`,
                  contextLimit: model.limit.context
                });
              });
            });
            
            setAvailableProviders(providers);
            setAvailableModels(models);
          }
        } catch (error) {
          console.error('Failed to load providers and models:', error);
          toast.showError('Failed to load providers and models', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    };

    loadProvidersAndModels();
  }, [connectionStatus, client]);

  // Load Chutes quota when current model changes
  useEffect(() => {
    const loadChutesQuota = async () => {
      console.log(`[Chutes] Checking quota - Connection: ${connectionStatus}, Has client: ${!!client}, Has model: ${!!currentModel}`);
      if (connectionStatus === 'connected' && client && currentModel) {
        console.log(`[Chutes] Current model - Provider: ${currentModel.providerID}, Model: ${currentModel.modelID}`);
        
        // Only check quota for Chutes providers
        const shouldCheckQuota = currentModel.providerID === 'chutes';
        
        if (shouldCheckQuota) {
          try {
            console.log(`[Chutes] Requesting quota for model: ${currentModel.modelID}`);
            
            // Get API key from localStorage
            const storedKey = await localStorage.getChutesApiKey();
            if (!storedKey) {
              console.log('[Chutes] No API key in localStorage, showing input dialog');
              setPendingApiKeyRequest({
                providerID: currentModel.providerID,
                modelID: currentModel.modelID
              });
              setShowApiKeyInput(true);
              setChutesQuota(null);
              return;
            }
            
            // Pass model ID as chute ID for quota checking
            const quota = await fetchChutesQuota(client, currentModel.modelID, storedKey);
            console.log(`[Chutes] Quota updated - Used: ${quota.used}, Quota: ${quota.quota}`);
            setChutesQuota(quota);
          } catch (error) {
            console.error('Failed to fetch Chutes quota:', error);
            
            // Check if this is an API key invalid error
            if (error instanceof ChutesApiKeyInvalidError) {
              console.log('[Chutes] API key invalid, showing input dialog');
              setPendingApiKeyRequest({
                providerID: currentModel.providerID,
                modelID: currentModel.modelID
              });
              setShowApiKeyInput(true);
            }
            
            setChutesQuota(null);
          }
        } else {
          console.log(`[Chutes] Skipping quota check for provider ${currentModel.providerID}`);
          setChutesQuota(null);
        }
      } else {
        console.log(`[Chutes] Skipping quota check - Connection: ${connectionStatus}, Has client: ${!!client}, Has model: ${!!currentModel}`);
        setChutesQuota(null);
      }
    };
    


    loadChutesQuota();
    
    // Also subscribe to session.idle events to refresh quota
    const unsubscribe = onSessionIdle((sessionId: string) => {
      console.log(`[Chutes] Session ${sessionId} became idle, refreshing quota`);
      loadChutesQuota();
    });
    
    return unsubscribe;
  }, [connectionStatus, client, currentModel, onSessionIdle]);

  // Session-scoped provider and model selection - update when session or messages change
  useEffect(() => {
    // Only set model selection if we have providers and a current session
    if (availableProviders.length === 0 || !currentSession) {
      return;
    }

    // Find the last assistant message in the current session
    if (messages.length > 0) {
      const lastAssistantMessage = [...messages]
        .reverse()
        .find(msg => msg.info.role === 'assistant');

      // Type guard to ensure it's actually an AssistantMessage
      if (lastAssistantMessage && 
          'providerID' in lastAssistantMessage.info && 
          'modelID' in lastAssistantMessage.info) {
        const assistantMessage = lastAssistantMessage.info as AssistantMessage;
        
        if (assistantMessage.providerID && assistantMessage.modelID) {
          const providerExists = availableProviders.find(p => p.id === assistantMessage.providerID);
          if (providerExists) {
            console.log('🎯 Setting session-scoped model:', assistantMessage.providerID, assistantMessage.modelID, 'for session:', currentSession.id);
            setCurrentProvider(assistantMessage.providerID);
            setCurrentModel({
              providerID: assistantMessage.providerID,
              modelID: assistantMessage.modelID
            });
            return;
          }
        }
      }
    }
    
    // Fallback to latest provider/model from connection context if no messages in session
    if (latestProviderModel) {
      const providerExists = availableProviders.find(p => p.id === latestProviderModel.providerID);
      if (providerExists) {
        console.log('🎯 Using fallback model from context:', latestProviderModel.providerID, latestProviderModel.modelID);
        setCurrentProvider(latestProviderModel.providerID);
        setCurrentModel({
          providerID: latestProviderModel.providerID,
          modelID: latestProviderModel.modelID
        });
      }
    }
  }, [messages, availableProviders, currentSession, latestProviderModel]);

  // Update available models for current provider
  useEffect(() => {
    if (currentProvider && availableModels.length > 0) {
      const providerModels = availableModels
        .filter(model => model.providerID === currentProvider)
        .map(model => ({
          modelID: model.modelID,
          name: model.displayName.split(' / ')[1] // Extract just the model name
        }));
      setCurrentProviderModels(providerModels);
      
      // Only reset current model when provider changes if no model is set
      if (!currentModel || currentModel.providerID !== currentProvider) {
        setCurrentModel(null);
      }
    } else {
      setCurrentProviderModels([]);
    }
  }, [currentProvider, availableModels, currentModel]);



  // Reset model selection when session changes to ensure session-scoped selection
  useEffect(() => {
    if (currentSession && currentSession.id !== loadedSessionId) {
      console.log('🔄 Session changed, resetting model selection for session:', currentSession.id, currentSession.title);
      // Reset model selection so it gets set from the new session's messages
      setCurrentProvider(null);
      setCurrentModel(null);
    }
  }, [currentSession, loadedSessionId]);

  useEffect(() => {
    if (currentSession && currentSession.id !== loadedSessionId) {
      console.log('Loading messages for session:', currentSession.id, currentSession.title);
      setLoadedSessionId(currentSession.id);
      loadMessages(currentSession.id).catch(error => {
        console.error('Failed to load messages:', error);
        toast.showError('Failed to load messages', error instanceof Error ? error.message : 'Unknown error');
      });
    } else if (!currentSession) {
      console.log('No current session set');
      setLoadedSessionId(null);
    }
   }, [currentSession, currentSession?.id, loadMessages, loadedSessionId]);

   // Unified scrolling function with improved reliability
   const scrollToBottom = useCallback((animated = true, immediate = false) => {
     if (!flatListRef.current || !shouldAutoScroll) return;

     // Clear any existing timeout
     if (scrollTimeoutRef.current) {
       clearTimeout(scrollTimeoutRef.current);
     }

     const performScroll = () => {
       try {
         flatListRef.current?.scrollToEnd({ animated });
         setIsUserAtBottom(true);
       } catch (error) {
         console.warn('Failed to scroll to bottom:', error);
       }
     };

     if (immediate) {
       performScroll();
     } else {
       // Use a consistent delay for better reliability
       // Slightly longer delay for content changes to ensure rendering is complete
       scrollTimeoutRef.current = setTimeout(performScroll, 150);
     }
   }, [shouldAutoScroll]);

   // Handle scroll events to track user position
   const handleScroll = useCallback((event: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
     const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
     const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20; // 20px threshold

     setIsUserAtBottom(isAtBottom);
     setShouldAutoScroll(isAtBottom);
   }, []);

   // Manual scroll to bottom (for when user wants to return to latest messages)
   const scrollToBottomManual = useCallback(() => {
     setShouldAutoScroll(true);
     setHasNewMessages(false);
     scrollToBottom(true, true);
   }, [scrollToBottom]);

   // Auto-scroll to bottom when messages change
   useEffect(() => {
     if (messages.length > 0) {
       if (shouldAutoScroll) {
         scrollToBottom(true, false);
         setHasNewMessages(false);
       } else {
         // User is not at bottom, show new messages indicator
         setHasNewMessages(true);
       }
     }
   }, [messages, shouldAutoScroll, scrollToBottom]);

  // Generation state is now tracked by step-start/step-end SSE events in ConnectionContext

   // Scroll to newest message on session load
   useEffect(() => {
     if (currentSession && !isLoadingMessages && messages.length > 0 && shouldAutoScroll) {
       // Use immediate scroll for session load, then auto-scroll for new messages
       scrollToBottom(false, true);
     }
   }, [currentSession, isLoadingMessages, messages.length, shouldAutoScroll, scrollToBottom]);

   // Debug logging for selected images
   useEffect(() => {
     console.log('Selected images changed:', selectedImages);
   }, [selectedImages]);

   // Cleanup scroll timeout on unmount
   useEffect(() => {
     return () => {
       if (scrollTimeoutRef.current) {
         clearTimeout(scrollTimeoutRef.current);
       }
     };
   }, []);

  const handleImageSelected = useCallback((imageUri: string) => {
    console.log('Image selected:', imageUri);
    setSelectedImages(prev => {
      const newImages = [...prev, imageUri];
      console.log('Updated selected images:', newImages);
      return newImages;
    });
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDismissError = useCallback(() => {
    if (lastError) {
      setDismissedErrors(prev => new Set(prev).add(lastError));
      clearError();
    }
  }, [lastError, clearError]);

   const handleInterrupt = useCallback(async () => {
     if (currentSession && isGenerating) {
       console.log('Interrupting session:', currentSession.id);
       try {
         const success = await abortSession(currentSession.id);
         if (success) {
           console.log('Generation interrupted successfully');
         } else {
           console.error('Failed to interrupt generation');
         }
       } catch (error) {
         console.error('Failed to interrupt session:', error);
       }
     }
   }, [currentSession, isGenerating, abortSession]);

   const handleSendMessage = async () => {
    console.log('handleSendMessage called', {
      inputText: inputText.trim(),
      selectedImagesCount: selectedImages.length,
      currentSession: currentSession?.id,
      isSending,
      currentModel
    });

    if ((!inputText.trim() && selectedImages.length === 0) || !currentSession || isSending) {
      console.log('Early return due to validation');
      return;
    }

    const messageText = inputText.trim();
    
    // Check if this is a command
    if (messageText.startsWith('/')) {
      await handleCommandExecution(messageText);
      return;
    }

    if (!currentModel?.providerID || !currentModel?.modelID) {
      console.log('No model selected');
      toast.showError('Select Model', 'Please select a provider and model before sending a message');
      return;
    }

    const imagesToSend = [...selectedImages];
    
    console.log('Sending message:', { messageText, imagesToSend });
    
    setInputText('');
    setSelectedImages([]);
    setIsSending(true);

    try {
       sendMessage(
         currentSession.id,
         messageText,
         currentModel.providerID,
         currentModel.modelID,
         imagesToSend
       );
       console.log('Message queued successfully');
       // Scroll to bottom after sending (will be handled by messages change effect)
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to send message';
      toast.showError('Failed to send message', errorMsg);
      // Restore the input text and images if sending failed
      setInputText(messageText);
      setSelectedImages(imagesToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleCommandExecution = useCallback(async (commandText: string) => {
    if (!currentSession || !client) {
      return;
    }

    // Extract command name and arguments
    const trimmedCommandText = commandText.trim();
    let commandName = '';
    let args = '';

    // Check if there's a space to separate command from arguments
    const spaceIndex = trimmedCommandText.indexOf(' ');
    if (spaceIndex === -1) {
      // No arguments provided
      commandName = trimmedCommandText.slice(1); // Remove leading /
    } else {
      // Arguments provided
      commandName = trimmedCommandText.slice(1, spaceIndex); // Remove leading / and get command name
      args = trimmedCommandText.slice(spaceIndex + 1); // Get everything after the space
    }

    console.log('Executing command:', { command: commandName, args });

    setInputText('');
    setIsSending(true);

    try {
      await sessionCommand({
        client,
        path: { id: currentSession.id },
        body: {
          command: commandName,
          arguments: args
        }
      });
      console.log('Command executed successfully');
    } catch (error) {
      console.error('Failed to execute command:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to execute command';
      toast.showError('Command Failed', errorMsg);
      // Restore the input text if command failed
      setInputText(commandText);
    } finally {
      setIsSending(false);
    }
  }, [client, currentSession]);

   const handleCommandSelect = useCallback((command: CommandSuggestion) => {
     console.log('Command selected:', command);
     // Check if the command template contains $ARGUMENTS
     if (command.template && command.template.includes('$ARGUMENTS')) {
       // For commands with $ARGUMENTS, we just insert the command name and let the user type arguments
       // The command will be sent when the user presses send
       console.log('Command requires arguments, inserting into input');
       setInputText(`/${command.name} `);
     } else {
       // For commands without $ARGUMENTS, send immediately
       const commandText = `/${command.name}`;
       handleCommandExecution(commandText);
     }
   }, [handleCommandExecution, setInputText]);

   const handleApiKeyProvided = useCallback(async (apiKey: string) => {
     console.log('[Chutes] API key provided, retrying quota fetch');
     setShowApiKeyInput(false);
     
       if (pendingApiKeyRequest && client) {
        try {
         // Retry the quota fetch with the provided API key
         const quota = await fetchChutesQuota(client, pendingApiKeyRequest.modelID, apiKey);
         console.log(`[Chutes] Quota updated with provided API key - Used: ${quota.used}, Quota: ${quota.quota}`);
         setChutesQuota(quota);
       } catch (error) {
         console.error('Failed to fetch Chutes quota with provided API key:', error);
         
         if (error instanceof ChutesApiKeyInvalidError) {
           Alert.alert(
             'Invalid API Key', 
             'The provided API key appears to be invalid or expired. Please check and try again.',
             [
               {
                 text: 'Try Again',
                 onPress: () => setShowApiKeyInput(true)
               },
               {
                 text: 'Cancel',
                 style: 'cancel'
               }
             ]
           );
         } else {
           Alert.alert(
             'Connection Error', 
             'Failed to fetch quota information. Please check your connection and try again.',
             [
               {
                 text: 'Try Again',
                 onPress: () => setShowApiKeyInput(true)
               },
               {
                 text: 'Cancel',
                 style: 'cancel'
               }
             ]
           );
         }
         
          setChutesQuota(null);
        }
     }
     
     setPendingApiKeyRequest(null);
   }, [pendingApiKeyRequest, client]);

   const handleApiKeyInputCancel = useCallback(() => {
     console.log('[Chutes] API key input cancelled');
     setShowApiKeyInput(false);
     setPendingApiKeyRequest(null);
   }, []);

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
    const isUser = item.info.role === 'user';
    const isStreaming = isAssistant && !hasContent && isStreamConnected;
    const hasError = isAssistant && 'error' in item.info && item.info.error;
    // const isLastMessage = index === messages.length - 1;
    
    // Handle error state
    if (hasError && 'error' in item.info) {
      const assistantInfo = item.info as AssistantMessage;
      const error = assistantInfo.error!;
      
      return (
        <View style={styles.messageContainer}>
          <View style={[styles.twoColumnLayout, isUser && styles.userMessageContainer]}>
            <MessageDecoration 
              role={item.info.role} 
              isFirstPart={true}
              isLastPart={true}
            />
            <View style={styles.contentColumn}>
              <View style={styles.errorContainer}>
                <View style={styles.errorHeader}>
                  <Ionicons name="warning-outline" size={20} color="#ef4444" />
                  <Text style={styles.errorTitle}>
                    {error.name === 'ProviderAuthError' ? 'Authentication Error' :
                     error.name === 'MessageOutputLengthError' ? 'Output Length Error' :
                     error.name === 'MessageAbortedError' ? 'Message Aborted' :
                     'Unknown Error'}
                  </Text>
                </View>
                <Text style={styles.errorMessage}>
                  {error.name === 'ProviderAuthError' && 'data' in error ? error.data.message :
                   error.name === 'UnknownError' && 'data' in error ? error.data.message :
                   error.name === 'MessageAbortedError' ? 'The message was aborted before completion.' :
                   error.name === 'MessageOutputLengthError' ? 'The response exceeded the maximum length limit.' :
                   'An unexpected error occurred.'}
                </Text>
              </View>
              <MessageTimestamp 
                timestamp={item.info.time.created}
                compact={true}
              />
            </View>
          </View>
        </View>
      );
    }

    // Handle queued state (messages waiting to be processed)
    const isQueued = isUser && isGenerating && index === messages.length - 1;
    
    if (isQueued) {
      return (
        <View style={styles.messageContainer}>
          <View style={[styles.twoColumnLayout, styles.userMessageContainer]}>
            <MessageDecoration 
              role={item.info.role} 
              isFirstPart={true}
              isLastPart={true}
            />
            <View style={[styles.contentColumn, styles.userContentColumn]}>
              <View style={styles.userMessageBubble}>
                <View style={styles.queuedMessageContainer}>
                  <ActivityIndicator size="small" color="#9ca3af" style={styles.queuedSpinner} />
                  <Text style={styles.queuedMessageText}>
                    Queued...
                  </Text>
                </View>
              </View>
              <MessageTimestamp 
                timestamp={item.info.time.created}
                compact={true}
              />
            </View>
          </View>
        </View>
      );
    }

    // Handle streaming state
    if (isStreaming) {
      return (
        <View style={styles.messageContainer}>
          <View style={[styles.twoColumnLayout, isUser && styles.userMessageContainer]}>
            <MessageDecoration 
              role={item.info.role} 
              isFirstPart={true}
              isLastPart={true}
            />
            <View style={styles.contentColumn}>
              <View style={styles.streamingContainer}>
                <ActivityIndicator size="small" color="#9ca3af" />
                <Text style={[styles.messageText, styles.assistantText, styles.streamingText]}>
                  Generating...
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
          <View style={[styles.twoColumnLayout, styles.userMessageContainer]}>
            <MessageDecoration 
              role={item.info.role} 
              isFirstPart={true}
              isLastPart={true}
            />
            <View style={[styles.contentColumn, styles.userContentColumn]}>
              <View style={styles.userMessageBubble}>
                <Text style={styles.userMessageText}>
                  User message
                </Text>
              </View>
              <MessageTimestamp 
                timestamp={item.info.time.created}
                compact={true}
              />
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
          const isLastMessage = index === messages.length - 1;
          
          return (
            <View key={`${item.info.id}-${index}-part-${partIndex}`} style={getMessageRowStyle(isUser)}>
              {!isUser && (
                <MessageDecoration 
                  role={item.info.role}
                  part={part}
                  isFirstPart={isFirstPart}
                  isLastPart={isLastPart}
                  providerID={item.info.role === 'assistant' ? (item.info as AssistantMessage).providerID : undefined}
                  modelID={item.info.role === 'assistant' ? (item.info as AssistantMessage).modelID : undefined}
                />
              )}
              <View style={getContentColumnStyle(isUser)}>
                <MessageContent 
                  role={item.info.role}
                  part={part}
                  isLast={isLastMessage}
                  partIndex={partIndex}
                  totalParts={filteredParts.length}
                  messageId={item.info.id}
                  renderMode={isUser ? 'bubble' : 'expanded'}
                />
                {isLastPart && (
                  <MessageTimestamp 
                    timestamp={item.info.time.created}
                    compact={true}
                  />
                )}
              </View>
            </View>
          );
        })}
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
            <Text style={styles.connectButtonText}>Go to Sessions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Calculate tokens and cost following official OpenCode TUI implementation
  let totalTokens = 0;
  let totalCost = 0;
  
  // Iterate forward through messages (like official implementation)
  for (const msg of messages) {
    if (msg.info.role === 'assistant' && 'tokens' in msg.info && msg.info.tokens) {
      const assistant = msg.info as AssistantMessage;
      const usage = assistant.tokens;
      
      // Sum cost from all assistant messages
      totalCost += assistant.cost || 0;
      
      // Overwrite tokens with each message that has output > 0 (like official implementation)
      if (usage && usage.output > 0) {
        if (assistant.summary) {
          totalTokens = usage.output || 0;
          continue; // Skip to next message for summary
        }
        totalTokens = (usage.input || 0) + 
                     (usage.cache?.write || 0) + 
                     (usage.cache?.read || 0) + 
                     (usage.output || 0) + 
                     (usage.reasoning || 0);
      }
    }
  }

  // Get the current model's context limit
  const currentModelInfo = currentModel && availableModels.length > 0 
    ? availableModels.find(m => m.providerID === currentModel.providerID && m.modelID === currentModel.modelID)
    : null;

  // Check if current model is a subscription model (cost is 0 for both input and output)
  const isSubscriptionModel = currentModelInfo && 
    availableModels.length > 0 &&
    // We'd need to check the model's cost structure, but for now assume non-subscription
    false;
  
  const contextInfo = currentModelInfo && totalTokens > 0 
    ? {
        currentTokens: totalTokens,
        maxTokens: currentModelInfo.contextLimit,
        percentage: Math.floor((totalTokens / currentModelInfo.contextLimit) * 100),
        sessionCost: totalCost,
        isSubscriptionModel,
      }
    : null;

  // Debug logging to help identify the discrepancy
  if (contextInfo && totalTokens > 99000 && totalTokens < 100000) {
    console.log('🔍 Token Debug:', {
      totalTokens,
      contextLimit: currentModelInfo?.contextLimit,
      percentage: contextInfo.percentage,
      modelID: currentModel?.modelID,
      providerID: currentModel?.providerID,
      formattedTokens: formatTokenCount(totalTokens)
    });
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <SafeAreaView style={styles.container}>
          <View style={styles.header}>
           <Text style={styles.title}>{currentSession.title}</Text>
           <View style={styles.headerBottom}>
             {connectionStatus === 'connected' && (
               <View style={[styles.streamStatus, !isStreamConnected && styles.streamStatusOffline]}>
                 <View style={[styles.streamIndicator, !isStreamConnected && styles.streamIndicatorOffline]} />
                 <Text style={[styles.streamText, !isStreamConnected && styles.streamTextOffline]}>
                   {isStreamConnected ? 'Live' : 'Offline'}
                 </Text>
               </View>
             )}
             <TouchableOpacity onPress={() => {
               if (availableProviders.length > 0) {
                 Alert.alert(
                   'Select Provider',
                   'Choose a provider for this conversation',
                   [
                     ...availableProviders.map(provider => ({
                       text: provider.name,
                       onPress: () => setCurrentProvider(provider.id)
                     })),
                     { text: 'Cancel', style: 'cancel' }
                   ]
                 );
               }
             }}>
               <View style={styles.providerSelector}>
                 <Text style={styles.providerSelectorText} numberOfLines={1}>
                   {currentProvider ? 
                     availableProviders.find(p => p.id === currentProvider)?.name || currentProvider : 
                     'Select Provider'}
                 </Text>
               </View>
             </TouchableOpacity>
             
             {currentProvider && (
               <TouchableOpacity onPress={() => {
                 if (currentProviderModels.length > 0) {
                   Alert.alert(
                     'Select Model',
                     'Choose a model for this conversation',
                     [
                       ...currentProviderModels.map(model => ({
                         text: model.name,
                         onPress: () => setCurrentModel({
                           providerID: currentProvider,
                           modelID: model.modelID
                         })
                       })),
                       { text: 'Cancel', style: 'cancel' }
                     ]
                   );
                 }
               }}>
                 <View style={styles.modelSelector}>
                   <Text style={styles.modelSelectorText} numberOfLines={1}>
                     {currentModel ? 
                       currentProviderModels.find(m => m.modelID === currentModel.modelID)?.name || currentModel.modelID : 
                       'Select Model'}
                   </Text>
                 </View>
               </TouchableOpacity>
             )}
             
             {/* Compact generating indicator */}
             {isGenerating && (
               <View style={styles.generatingContainer}>
                 <ActivityIndicator size="small" color="#f59e0b" style={styles.generatingSpinner} />
                 <Text style={styles.generatingText}>Generating...</Text>
               </View>
             )}
           </View>
           
           {/* Token/cost/quota info row */}
           {(contextInfo || chutesQuota) && !isGenerating && (
             <View style={styles.headerInfoRow}>
               {contextInfo && (
                 <Text style={styles.tokenInfoCompact}>
                   {contextInfo.isSubscriptionModel 
                     ? `${formatTokenCount(contextInfo.currentTokens)}/${contextInfo.percentage}%`
                     : `${formatTokenCount(contextInfo.currentTokens)}/${contextInfo.percentage}% ($${contextInfo.sessionCost.toFixed(2)})`
                   }
                 </Text>
               )}
               {chutesQuota && (
                 <Text style={styles.tokenInfoCompact}>
                   Chutes: {chutesQuota.used}/{chutesQuota.quota}
                 </Text>
               )}
             </View>
           )}
         </View>

        {lastError && !dismissedErrors.has(lastError) && (
          <View style={styles.sessionErrorBanner}>
            <Ionicons name="warning-outline" size={20} color="#ef4444" />
            <View style={styles.sessionErrorContent}>
              <Text style={styles.sessionErrorTitle}>Connection Error</Text>
              <Text style={styles.sessionErrorText}>{lastError}</Text>
            </View>
            <TouchableOpacity style={styles.sessionErrorDismiss} onPress={handleDismissError}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}

        {isLoadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
         ) : (
           <>
             <FlatList
               ref={flatListRef}
               data={messages}
               renderItem={renderMessage}
               keyExtractor={(item, index) => `${item.info.id}-${index}`}
               style={styles.messagesList}
               contentContainerStyle={styles.messagesContent}
               showsVerticalScrollIndicator={false}
               onScroll={handleScroll}
               scrollEventThrottle={16}
               onContentSizeChange={() => {
                 // Auto-scroll when content size changes (new messages)
                 if (shouldAutoScroll) {
                   scrollToBottom(true, false);
                 }
               }}
             />
             {/* New messages indicator */}
             {hasNewMessages && !isUserAtBottom && (
               <TouchableOpacity
                 style={styles.newMessagesIndicator}
                 onPress={scrollToBottomManual}
               >
                 <Ionicons name="chevron-down" size={16} color="#ffffff" />
                 <Text style={styles.newMessagesText}>New messages</Text>
               </TouchableOpacity>
             )}
           </>
         )}

         <ImagePreview 
           images={selectedImages}
           onRemoveImage={handleRemoveImage}
         />

         <CrutesApiKeyInput
           visible={showApiKeyInput}
           onApiKeyProvided={handleApiKeyProvided}
           onCancel={handleApiKeyInputCancel}
         />

         <View style={styles.inputContainer}>
          <ImageAwareTextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            onImageSelected={handleImageSelected}
            onCommandSelect={handleCommandSelect}
            placeholder="Type a message..."
            placeholderTextColor="#6b7280"
            multiline
            maxLength={4000}
          />
          {isGenerating && (
            <TouchableOpacity
              style={styles.interruptButton}
              onPress={handleInterrupt}
            >
              <Ionicons name="stop" size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.sendButton, ((!inputText.trim() && selectedImages.length === 0) || isSending) && styles.sendButtonDisabled]}
            onPress={() => {
              console.log('Send button pressed!', {
                hasText: !!inputText.trim(),
                imageCount: selectedImages.length,
                isSending,
                disabled: (!inputText.trim() && selectedImages.length === 0) || isSending
              });
              handleSendMessage();
            }}
            disabled={(!inputText.trim() && selectedImages.length === 0) || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#0a0a0a" />
            ) : (
              <Ionicons name="send" size={20} color="#0a0a0a" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// Helper functions for unified message rendering
const getMessageRowStyle = (isUser: boolean) => {
  return isUser ? styles.userMessageRow : styles.twoColumnLayout;
};

const getContentColumnStyle = (isUser: boolean) => {
  return isUser ? styles.userContentColumn : styles.contentColumn;
};

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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    maxWidth: 150,
  },
  headerButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  streamStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#1a2e1a',
    borderRadius: 8,
  },
  streamStatusOffline: {
    backgroundColor: '#2a1a1a',
  },
  streamIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  streamIndicatorOffline: {
    backgroundColor: '#ef4444',
  },
  streamText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '500',
  },
  streamTextOffline: {
    color: '#ef4444',
  },
  providerSelector: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginLeft: 12,
    maxWidth: 100,
  },
  providerSelectorText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '500',
  },
  modelSelector: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginLeft: 8,
    maxWidth: 120,
  },
  modelSelectorText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '500',
  },
title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  twoColumnLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  userMessageContainer: {
    backgroundColor: 'transparent',
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 8,
  },
  userContentColumn: {
    paddingLeft: 0,
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
  userMessageRow: {
    alignItems: 'flex-end',
    marginBottom: 2,
    minHeight: 0,
    flexShrink: 1,
  },
  userMessageBubble: {
    backgroundColor: '#2563eb',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '80%',
    alignSelf: 'flex-end',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexShrink: 1,
    minHeight: 0,
    maxHeight: 400,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#0a0a0a',
  },
  userMessageText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    flexShrink: 1,
    textAlign: 'left',
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    backgroundColor: '#0a0a0a',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#ffffff',
    width: 36,
    height: 36,
    borderRadius: 18,
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
  errorContainer: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorMessage: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 20,
  },
  sessionErrorBanner: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionErrorContent: {
    flex: 1,
    marginLeft: 8,
  },
  sessionErrorTitle: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionErrorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  sessionErrorDismiss: {
    marginLeft: 12,
    padding: 4,
  },
  tokenInfoContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  tokenInfoRow: {
    flexDirection: 'row',
    marginRight: 16,
    marginBottom: 4,
  },
  tokenInfoLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 4,
  },
  tokenInfoValue: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '400',
  },
  tokenInfoCompact: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '400',
  },
tokenInfoInline: {
     marginLeft: 'auto',
     paddingLeft: 8,
   },
   chutesQuotaContainer: {
     marginLeft: 8,
     paddingLeft: 8,
     borderLeftWidth: 1,
     borderLeftColor: '#2a2a2a',
   },
   chutesQuotaText: {
     fontSize: 12,
     color: '#9ca3af',
     fontWeight: '400',
   },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  generatingSpinner: {
    marginRight: 4,
  },
  generatingText: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '500',
  },
  interruptButton: {
    backgroundColor: '#dc2626',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  interruptButtonText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  queuedMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queuedSpinner: {
    marginRight: 8,
  },
   queuedMessageText: {
     color: '#9ca3af',
     fontSize: 16,
     lineHeight: 22,
     fontStyle: 'italic',
   },
   newMessagesIndicator: {
     position: 'absolute',
     bottom: 100,
     right: 20,
     backgroundColor: '#f59e0b',
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 20,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.25,
     shadowRadius: 4,
     elevation: 5,
   },
   newMessagesText: {
     color: '#ffffff',
     fontSize: 12,
     fontWeight: '600',
     marginLeft: 4,
   },
   // User file attachment styles
   userFileContainer: {
     backgroundColor: '#2563eb',
     borderRadius: 12,
     padding: 12,
     maxWidth: '80%',
     alignSelf: 'flex-end',
     shadowColor: '#2563eb',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 3,
   },
   userFileHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 8,
   },
   userFileIcon: {
     fontSize: 16,
     marginRight: 8,
   },
   userFileName: {
     color: '#ffffff',
     fontSize: 14,
     fontWeight: '500',
     flex: 1,
   },
   userImagePreview: {
     width: 200,
     height: 150,
     borderRadius: 8,
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
   },
 });
