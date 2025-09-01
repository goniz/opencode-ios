import { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  PanResponder
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';
import { useConnection, type ConnectionStatus } from '../../src/contexts/ConnectionContext';
import { semanticColors } from '../../src/styles/colors';
import { spacing } from '../../src/styles/spacing';
import { layout } from '../../src/styles/layout';
import { typography } from '../../src/styles/typography';

// Message components are now handled by ChatFlashList and MessageRow
import { ChatFlashList } from '../../src/components/chat/ChatFlashList';

import { ImageAwareTextInput } from '../../src/components/chat/ImageAwareTextInput';
import { ImagePreview } from '../../src/components/chat/ImagePreview';
import { FilePreview } from '../../src/components/chat/FilePreview';
import { CrutesApiKeyInput } from '../../src/components/chat/CrutesApiKeyInput';
import { GitStatus } from '../../src/components/GitStatus';
import type { AssistantMessage, Command } from '../../src/api/types.gen';
import type { FilePartLike } from '../../src/integrations/github/GitHubTypes';
import { convertGitHubFilePartsToInputs } from '../../src/utils/githubFileParts';
import {
  configProviders,
  sessionCommand,
  sessionCreate,
  sessionInit,
  sessionShare,
  sessionUnshare,
  sessionSummarize,
  sessionRevert,
  sessionUnrevert
} from '../../src/api/sdk.gen';

import type { CommandSuggestion } from '../../src/utils/commandMentions';
import { ChutesApiKeyInvalidError, fetchChutesQuota } from '../../src/utils/chutes';
import { secureSettings } from '../../src/utils/secureSettings';
import { getGitStatus, type GitStatusInfo } from '../../src/utils/gitStatus';
import type { BuiltInCommand } from '../../src/types/commands';

// MessageWithParts type is now exported from MessageRow component

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
      refreshSessions,
      addSessionOptimistically,
      client,
      latestProviderModel,
      commands,
      onSessionIdle
    } = useConnection();
  
   const [inputText, setInputText] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<FilePartLike[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<{providerID: string, modelID: string} | null>(null);
  const [availableProviders, setAvailableProviders] = useState<{id: string, name: string}[]>([]);
  const [availableModels, setAvailableModels] = useState<{providerID: string, modelID: string, displayName: string, contextLimit: number}[]>([]);
  const [currentProviderModels, setCurrentProviderModels] = useState<{modelID: string, name: string}[]>([]);
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);
  const [previousConnectionStatus, setPreviousConnectionStatus] = useState<ConnectionStatus>('idle');
  // Note: Scroll state is now managed by ChatFlashList component
   const [chutesQuota, setChutesQuota] = useState<{used: number, quota: number} | null>(null);
   const [showApiKeyInput, setShowApiKeyInput] = useState(false);
   const [pendingApiKeyRequest, setPendingApiKeyRequest] = useState<{providerID: string, modelID: string} | null>(null);
   const [commandStatus, setCommandStatus] = useState<string | null>(null);
   const [sessionUrl, setSessionUrl] = useState<string | null>(null);

   const [gitBranch, setGitBranch] = useState<string | null>(null); // Legacy compatibility
   const [gitStatus, setGitStatus] = useState<GitStatusInfo | null>(null);
   // FlashList ref will be handled inside ChatFlashList component
   // Swipe gesture for navigation (simplified without coordination)
   
   // Alternative PanResponder for Expo Go compatibility
   const panResponder = PanResponder.create({
     onStartShouldSetPanResponder: () => false,
     onMoveShouldSetPanResponder: (_, gestureState) => {
       // Only activate for horizontal swipes
       return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
     },
     onPanResponderGrant: () => {
       // Gesture has started
     },
     onPanResponderMove: () => {
       // Handle move if needed
     },
     onPanResponderRelease: (_, gestureState) => {
       // Check for left swipe (negative dx)
       if (gestureState.dx < -50 && Math.abs(gestureState.vx) > 0.5) {
         try {
           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
           router.replace('/(tabs)/sessions');
         } catch (error) {
           console.warn('Navigation failed:', error);
         }
       }
     },
     onPanResponderTerminationRequest: () => true,
   });





  // Handle session ID from navigation parameters
  useEffect(() => {
    if (sessionId) {
      console.log('Chat screen - sessionId from params:', sessionId);

      // Try to find session in current sessions
      const targetSession = sessions.find(s => s.id === sessionId);

      if (targetSession && (!currentSession || currentSession.id !== sessionId)) {
        console.log('Chat screen - Setting session from params:', targetSession.id, targetSession.title);
        setCurrentSession(targetSession);
      } else if (!targetSession && sessions.length > 0) {
        // If session not found but we have sessions, it might be a new session
        // Wait a short time for sessions to refresh, then try again
        console.warn('Session not found in current list, requesting refresh');
        refreshSessions().then(() => {
          const refreshedSession = sessions.find(s => s.id === sessionId);
          if (refreshedSession) {
            setCurrentSession(refreshedSession);
          } else {
            console.error('Session still not found after refresh:', sessionId);
          }
        });
      }
    }
  }, [sessionId, sessions, currentSession, setCurrentSession, refreshSessions]);

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
            const storedKey = await secureSettings.getChutesApiKey();
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
    
    // Also subscribe to session.idle events to refresh quota and git branch
    const unsubscribe = onSessionIdle((sessionId: string) => {
      console.log(`[Chutes] Session ${sessionId} became idle, refreshing quota`);
      loadChutesQuota();
      
      // Update git branch when session becomes idle
      console.log('Git branch update triggered by session.idle event');
      fetchGitBranch();
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
       });
    } else if (!currentSession) {
      console.log('No current session set');
      setLoadedSessionId(null);
    }
   }, [currentSession, currentSession?.id, loadMessages, loadedSessionId]);

  // Reload messages when transitioning from offline to online
  useEffect(() => {
    const isNowOnline = previousConnectionStatus === 'error' && connectionStatus === 'connected';

    if (isNowOnline && currentSession) {
      console.log('🔄 Connection restored - reloading messages for session:', currentSession.id);
      loadMessages(currentSession.id).catch(error => {
        console.error('Failed to reload messages after reconnection:', error);
      });
    }

    setPreviousConnectionStatus(connectionStatus);
  }, [connectionStatus, previousConnectionStatus, currentSession, loadMessages]);

  // Also reload messages when stream reconnects (additional safety net)
  const [previousStreamConnected, setPreviousStreamConnected] = useState(isStreamConnected);

  useEffect(() => {
    const streamJustReconnected = !previousStreamConnected && isStreamConnected;

    if (streamJustReconnected && currentSession && connectionStatus === 'connected') {
      console.log('🔄 Stream reconnected - reloading messages for session:', currentSession.id);
      loadMessages(currentSession.id).catch(error => {
        console.error('Failed to reload messages after stream reconnection:', error);
      });
    }

    setPreviousStreamConnected(isStreamConnected);
  }, [isStreamConnected, previousStreamConnected, currentSession, connectionStatus, loadMessages]);

   // Note: Scrolling logic is now handled inside ChatFlashList component

   // Note: Scroll handling is now managed by ChatFlashList component

  // Generation state is now tracked by step-start/step-end SSE events in ConnectionContext

   // Note: Initial scroll behavior is handled by ChatFlashList component

   // Debug logging for selected images
   useEffect(() => {
     console.log('Selected images changed:', selectedImages);
   }, [selectedImages]);

// Update session URL when current session changes
   useEffect(() => {
     if (currentSession?.share?.url) {
       setSessionUrl(currentSession.share.url);
     } else {
       setSessionUrl(null);
     }
     // Clear any stale command status when session changes
     setCommandStatus(null);
   }, [currentSession]);

   // Fetch git status information
   const fetchGitStatus = useCallback(async () => {
     if (!client || connectionStatus !== 'connected') {
       setGitStatus(null);
       setGitBranch(null);
       return;
     }

     try {
       console.log('Fetching git status...');
       const status = await getGitStatus(client);
       console.log('Git status result:', status);
       
       if (status) {
         setGitStatus(status);
         setGitBranch(status.branch); // Keep compatibility with existing code
       } else {
         setGitStatus(null);
         setGitBranch(null);
       }
     } catch (error) {
       console.error('Failed to fetch git status:', error);
       setGitStatus(null);
       setGitBranch(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
   }, [client, connectionStatus]);

   // Fetch git status when connection status changes
   useEffect(() => {
     if (connectionStatus === 'connected') {
       fetchGitStatus();
     }
   }, [connectionStatus, fetchGitStatus]);

   // Fetch git status when component mounts and when session changes
   useEffect(() => {
     fetchGitStatus();
   }, [fetchGitStatus]);

    // Subscribe to session idle events to refresh git status
    useEffect(() => {
      if (connectionStatus !== 'connected' || !client) {
        return;
      }

      console.log('Subscribing to session idle events for git status refresh');
      const unsubscribe = onSessionIdle((sessionId: string) => {
        console.log(`[Git] Session ${sessionId} became idle, refreshing git status`);
        fetchGitStatus();
      });

      return unsubscribe;
    }, [connectionStatus, client, onSessionIdle, fetchGitStatus]);

    // Cleanup handled by ChatFlashList component

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

  const handleFileAttached = useCallback((filePart: FilePartLike) => {
    console.log('🔍 [handleFileAttached] File attached:', filePart.name);
    console.log('🔍 [handleFileAttached] File part details:', {
      type: filePart.type,
      mimeType: filePart.mimeType,
      contentLength: filePart.content.length,
      metadataKind: filePart.metadata?.github?.kind
    });
    
    setAttachedFiles(prev => {
      const newFiles = [...prev, filePart];
      console.log('🔍 [handleFileAttached] Updated attached files count:', newFiles.length);
      return newFiles;
    });
  }, []);

  const handleFilesAttached = useCallback((fileParts: FilePartLike[]) => {
    console.log('🔍 [handleFilesAttached] Batch attaching', fileParts.length, 'files');
    console.log('🔍 [handleFilesAttached] Files:', fileParts.map(part => ({
      name: part.name,
      metadataKind: part.metadata?.github?.kind
    })));
    
    setAttachedFiles(prev => {
      const newFiles = [...prev, ...fileParts];
      console.log('🔍 [handleFilesAttached] Updated attached files count:', newFiles.length);
      return newFiles;
    });
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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

    if (((!inputText || !inputText.trim()) && selectedImages.length === 0 && attachedFiles.length === 0) || !currentSession || isSending) {
      console.log('Early return due to validation');
      return;
    }

    const imagesToSend = [...selectedImages];
    const filesToSend = [...attachedFiles];
    
    let messageText = inputText?.trim() || '';
    
    // Convert GitHub file parts to API format
    console.log('🔍 [handleSendMessage] Preparing to convert attached files:', filesToSend.map(file => ({
      name: file.name,
      type: file.type,
      metadataKind: file.metadata?.github?.kind
    })));
    
    const githubFileParts = filesToSend.length > 0 ? convertGitHubFilePartsToInputs(filesToSend) : [];
    
    console.log('🔍 [handleSendMessage] Converted GitHub file parts:', githubFileParts.map(part => ({
      filename: part.filename,
      type: part.type
    })));
    
    // Check if this is a command
    if (inputText?.trim().startsWith('/')) {
      await handleCommandExecution(inputText.trim());
      return;
    }

     if (!currentModel?.providerID || !currentModel?.modelID) {
       console.log('No model selected');
       return;
     }
    
    console.log('Sending message:', { messageText: messageText.substring(0, 200) + '...', imagesToSend, githubFilePartsCount: githubFileParts.length });
    
    setInputText('');
    setSelectedImages([]);
    setAttachedFiles([]);
    setIsSending(true);

     try {
        sendMessage(
          currentSession.id,
          messageText,
          currentModel.providerID,
          currentModel.modelID,
          imagesToSend,
          githubFileParts
        );
        console.log('Message queued successfully');
        // Scroll to bottom after sending (will be handled by messages change effect)
      } catch (error) {
        console.error('Failed to send message:', error);
        // Restore the input text, images, and attached files if sending failed
        setInputText(messageText);
        setSelectedImages(imagesToSend);
        setAttachedFiles(filesToSend);
      } finally {
        // Always reset isSending state regardless of success or failure
        setIsSending(false);
      }
  };

  const handleCommandExecution = useCallback((commandText: string) => {
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

    console.log('Executing command:', { command: commandName, args, currentModel });

    // Clear input immediately like chat messages
    setInputText('');

    // Execute command asynchronously without blocking the UI
    const executeAsync = async () => {
      try {
const commandBody: {
            messageID?: string;
            agent?: string;
            model?: string;
            arguments: string;
            command: string;
          } = {
            command: commandName,
            arguments: args
          };

         // Include current model information if available
         if (currentModel?.providerID && currentModel?.modelID) {
           commandBody.model = `${currentModel.providerID}/${currentModel.modelID}`;
         }

         await sessionCommand({
           client,
           path: { id: currentSession.id },
           body: commandBody
         });
         console.log('Command executed successfully');
        } catch (error) {
          console.error('Failed to execute command:', error);
        }
    };

    // Start execution without awaiting - this makes it asynchronous
    executeAsync();
  }, [client, currentSession, currentModel]);

   const handleCommandSelect = useCallback((command: CommandSuggestion) => {
     console.log('Command selected:', command);
     // Check if the command template contains $ARGUMENTS
     if (command.template && command.template.includes('$ARGUMENTS')) {
       // For commands with $ARGUMENTS, we just insert the command name and let the user type arguments
       // The command will be sent when the user presses send
       console.log('Command requires arguments, inserting into input');
       setInputText(`/${command.name} `);
     } else {
       // For commands without $ARGUMENTS, execute immediately (asynchronously)
       const commandText = `/${command.name}`;
       handleCommandExecution(commandText);
     }
   }, [handleCommandExecution, setInputText]);

   const handleMenuCommandSelect = useCallback(async (command: BuiltInCommand | Command) => {
     console.log('Menu command selected:', command);
     
      if (!currentSession || !client) {
        return;
      }

      // Check if it's a built-in command
      if ('endpoint' in command) {
        const builtInCommand = command as BuiltInCommand;

        try {
          // Set initial status message
          setCommandStatus(`Running ${builtInCommand.name}...`);

          switch (builtInCommand.endpoint) {
             case 'init':
               if (!currentModel?.providerID || !currentModel?.modelID) {
                 setCommandStatus(null);
                 return;
               }
              await sessionInit({
                client,
                path: { id: currentSession.id },
                body: {
                  messageID: '', // Will be generated by the server
                  providerID: currentModel.providerID,
                  modelID: currentModel.modelID,
                }
              });
              setCommandStatus('AGENTS.md created successfully');
              // Clear status after 3 seconds
              setTimeout(() => setCommandStatus(null), 3000);
              break;
             
            case 'share':
              const shareResponse = await sessionShare({
                client,
                path: { id: currentSession.id }
              });
              // Extract session URL from response
              if (shareResponse.data?.share?.url) {
                setSessionUrl(shareResponse.data.share.url);
                setCommandStatus('Session shared successfully');
              } else {
                setCommandStatus('Session shared (URL not available)');
              }
              // Clear status after 5 seconds
              setTimeout(() => setCommandStatus(null), 5000);
              break;
             
            case 'unshare':
              await sessionUnshare({
                client,
                path: { id: currentSession.id }
              });
              setSessionUrl(null); // Clear the session URL
              setCommandStatus('Session unshared successfully');
              setTimeout(() => setCommandStatus(null), 3000);
              break;
             
             case 'summarize':
               if (!currentModel?.providerID || !currentModel?.modelID) {
                 setCommandStatus(null);
                 return;
               }
              await sessionSummarize({
                client,
                path: { id: currentSession.id },
                body: {
                  providerID: currentModel.providerID,
                  modelID: currentModel.modelID,
                }
              });
              setCommandStatus('Session summarized successfully');
              setTimeout(() => setCommandStatus(null), 3000);
              break;
             
             case 'revert':
                // For revert, we need the last message ID
                if (messages.length === 0) {
                  setCommandStatus(null);
                  return;
                }
               const lastMessage = messages[messages.length - 1];
               await sessionRevert({
                 client,
                 path: { id: currentSession.id },
                 body: {
                   messageID: lastMessage.info.id,
                 }
               });
               // Reload messages since undo rewrites history
               await loadMessages(currentSession.id);
               setCommandStatus('Last message undone successfully');
               setTimeout(() => setCommandStatus(null), 3000);
               break;
             
              case 'unrevert':
                await sessionUnrevert({
                  client,
                  path: { id: currentSession.id }
                });
                // Reload messages since redo rewrites history
                await loadMessages(currentSession.id);
                setCommandStatus('Message restored successfully');
                setTimeout(() => setCommandStatus(null), 3000);
                break;
              
              case 'new':
                // Create a new chat session
                if (connectionStatus !== 'connected' || !client) {
                  setCommandStatus('No connection available');
                  setTimeout(() => setCommandStatus(null), 3000);
                  return;
                }
                
                try {
                  console.log('Creating new session from command menu...');
                  const response = await sessionCreate({ client });

                  if (response.error) {
                    console.error('Session creation error:', response.error);
                    throw new Error(`Failed to create session: ${JSON.stringify(response.error)}`);
                  }

                  if (response.data) {
                    const newSession = response.data;
                    console.log('New session created:', newSession.id, newSession.title);

                    // Optimistically add the session to local state
                    addSessionOptimistically(newSession);

                    // Navigate to the new chat session
                    console.log('Navigating to new session:', newSession.id);
                    router.push(`/(tabs)/chat?sessionId=${newSession.id}`);
                    
                    setCommandStatus('New chat created successfully');
                    setTimeout(() => setCommandStatus(null), 3000);
                  }
                } catch (error) {
                  console.error('Error creating session:', error);
                  setCommandStatus('Failed to create new chat');
                  setTimeout(() => setCommandStatus(null), 3000);
                }
                break;
              
            default:
             console.warn('Unknown built-in command endpoint:', builtInCommand.endpoint);
             return;
         }
         
          console.log(`Built-in command ${builtInCommand.name} executed successfully`);
         
         } catch (error) {
           console.error(`Failed to execute built-in command ${builtInCommand.name}:`, error);
           setCommandStatus(`Failed to ${builtInCommand.name}`);
           setTimeout(() => setCommandStatus(null), 3000);
         }
     } else {
       // It's a user command, execute via the existing command system
       const userCommand = command as Command;
       const commandText = `/${userCommand.name}`;
       handleCommandExecution(commandText);
     }
    }, [currentSession, client, currentModel, messages, handleCommandExecution, loadMessages, connectionStatus, addSessionOptimistically]);

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



// Note: Message rendering is now handled by MessageRow component

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
    <View style={styles.container} {...panResponder.panHandlers}>
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{currentSession.title}</Text>
            </View>
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
              {(contextInfo || chutesQuota || commandStatus || sessionUrl || gitStatus) && (
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
                 {commandStatus && (
                   <Text style={styles.commandStatusText}>
                     {commandStatus}
                   </Text>
                 )}
                  {gitStatus && (
                    <GitStatus gitStatus={gitStatus} compact={true} />
                  )}
                 {sessionUrl && (
                   <TouchableOpacity onPress={async () => {
                     try {
                       await Clipboard.setStringAsync(sessionUrl);
                       setCommandStatus('Session URL copied to clipboard!');
                       setTimeout(() => setCommandStatus(null), 2000);
                     } catch (error) {
                       console.error('Failed to copy URL to clipboard:', error);
                       setCommandStatus('Failed to copy URL');
                       setTimeout(() => setCommandStatus(null), 2000);
                     }
                   }}>
                     <Text style={styles.sessionUrlText}>
                       🔗 Session Link
                     </Text>
                   </TouchableOpacity>
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
           <ChatFlashList
             messages={messages}
             currentSessionId={currentSession?.id}
             isStreamConnected={isStreamConnected}
             isGenerating={isGenerating}

             // TODO: Implement pagination when API supports it
             onLoadOlder={undefined}
             hasMoreOlder={false}
             isLoadingOlder={false}
           />
         )}

          <ImagePreview 
            images={selectedImages}
            onRemoveImage={handleRemoveImage}
          />

          <FilePreview 
            files={attachedFiles}
            onRemoveFile={handleRemoveFile}
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
              onFileAttached={handleFileAttached}
              onFilesAttached={handleFilesAttached}
              onCommandSelect={handleCommandSelect}
              onMenuCommandSelect={handleMenuCommandSelect}
              userCommands={commands}
              disabled={false}
              disableAttachments={false}
              client={client}
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
               <Ionicons name="stop" size={20} color={semanticColors.textPrimary} />
            </TouchableOpacity>
          )}
           <TouchableOpacity
            style={[styles.sendButton, ((!inputText.trim() && selectedImages.length === 0 && attachedFiles.length === 0) || isSending) && styles.sendButtonDisabled]}
            onPress={() => {
              console.log('Send button pressed!', {
                hasText: !!inputText.trim(),
                imageCount: selectedImages.length,
                fileCount: attachedFiles.length,
                isSending,
                disabled: (!inputText.trim() && selectedImages.length === 0 && attachedFiles.length === 0) || isSending
              });
              handleSendMessage();
            }}
            disabled={(!inputText.trim() && selectedImages.length === 0 && attachedFiles.length === 0) || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={semanticColors.background} />
            ) : (
              <Ionicons name="send" size={20} color={semanticColors.background} />
            )}
          </TouchableOpacity>
         </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </View>
  );
}

// Helper functions moved to MessageRow component

const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: semanticColors.background,
   },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },

  header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: layout.borderWidth.DEFAULT,
      borderBottomColor: semanticColors.border,
    },
  headerTop: {
    marginBottom: spacing.xs,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
   headerButton: {
     backgroundColor: semanticColors.cardBackground,
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: semanticColors.border,
     maxWidth: 150,
   },
   headerButtonText: {
     fontSize: 12,
     color: semanticColors.textPrimary,
     fontWeight: '500',
   },
   streamStatus: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 6,
     paddingVertical: 2,
     backgroundColor: '#1a2e1a', // Keep custom for online status
     borderRadius: 8,
   },
   streamStatusOffline: {
     backgroundColor: '#2a1a1a', // Keep custom for offline status
   },
   streamIndicator: {
     width: 6,
     height: 6,
     borderRadius: 3,
     backgroundColor: semanticColors.success,
     marginRight: 4,
   },
   streamIndicatorOffline: {
     backgroundColor: semanticColors.error,
   },
   streamText: {
     fontSize: 10,
     color: semanticColors.success,
     fontWeight: '500',
   },
   streamTextOffline: {
     color: semanticColors.error,
   },
   providerSelector: {
     backgroundColor: semanticColors.cardBackground,
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 6,
     borderWidth: 1,
     borderColor: semanticColors.border,
     marginLeft: 12,
     maxWidth: 100,
   },
   providerSelectorText: {
     fontSize: 11,
     color: semanticColors.textPrimary,
     fontWeight: '500',
   },
   modelSelector: {
     backgroundColor: semanticColors.cardBackground,
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 6,
     borderWidth: 1,
     borderColor: semanticColors.border,
     marginLeft: 8,
     maxWidth: 120,
   },
   modelSelectorText: {
     fontSize: 11,
     color: semanticColors.textPrimary,
     fontWeight: '500',
   },
  title: {
      fontSize: 17,
      fontWeight: '600',
      color: semanticColors.textPrimary,
    },
   titleRow: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   subtitle: {
     fontSize: 16,
     color: semanticColors.textMuted,
     textAlign: 'center',
     marginBottom: 20,
   },
  icon: {
    marginBottom: 16,
  },
   connectButton: {
     backgroundColor: semanticColors.textPrimary,
     paddingHorizontal: 24,
     paddingVertical: 12,
     borderRadius: 8,
     marginTop: 20,
   },
   connectButtonText: {
     color: semanticColors.background,
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
     color: semanticColors.textMuted,
     marginTop: 12,
   },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },


    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
      borderTopWidth: layout.borderWidth.DEFAULT,
      borderTopColor: semanticColors.border,
      backgroundColor: semanticColors.background,
    },
    textInput: {
      flex: 1,
      backgroundColor: semanticColors.cardBackground,
      borderRadius: layout.borderRadius.xl,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginRight: spacing.xs,
      color: semanticColors.textPrimary,
      fontSize: typography.fontSize.base,
      maxHeight: 100,
    },
    sendButton: {
      backgroundColor: semanticColors.textPrimary,
      width: spacing.xl,
      height: spacing.xl,
      borderRadius: layout.borderRadius.xl,
      justifyContent: 'center',
      alignItems: 'center',
    },
   sendButtonDisabled: {
     backgroundColor: '#4a4a4a', // Keep custom disabled color
   },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
    marginRight: 8,
  },

   sessionErrorBanner: {
     backgroundColor: '#2a1a1a', // Keep custom error background
     borderWidth: 1,
     borderColor: semanticColors.error,
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
     color: semanticColors.error,
     fontSize: 14,
     fontWeight: '600',
     marginBottom: 2,
   },
   sessionErrorText: {
     color: '#fca5a5', // Keep custom error text color
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
     borderTopColor: semanticColors.border,
   },
   tokenInfoRow: {
     flexDirection: 'row',
     marginRight: 16,
     marginBottom: 4,
   },
   tokenInfoLabel: {
     fontSize: 12,
     color: semanticColors.textMuted,
     marginRight: 4,
   },
   tokenInfoValue: {
     fontSize: 12,
     color: semanticColors.textMuted,
     fontWeight: '400',
   },
    tokenInfoCompact: {
      fontSize: 11,
      color: semanticColors.textMuted,
      fontWeight: '400',
    },
    commandStatusText: {
      fontSize: 11,
      color: semanticColors.warning,
      fontWeight: '500',
      fontStyle: 'italic',
    },
    sessionUrlText: {
      fontSize: 11,
      color: semanticColors.textLink,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
tokenInfoInline: {
     marginLeft: 'auto',
     paddingLeft: 8,
   },
    chutesQuotaContainer: {
      marginLeft: 8,
      paddingLeft: 8,
      borderLeftWidth: 1,
      borderLeftColor: semanticColors.border,
    },
    chutesQuotaText: {
      fontSize: 12,
      color: semanticColors.textMuted,
      fontWeight: '400',
    },
   generatingContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(245, 158, 11, 0.1)', // Keep custom generating background
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
     color: semanticColors.warning,
     fontWeight: '500',
   },
    interruptButton: {
      backgroundColor: semanticColors.error,
      width: spacing.xl,
      height: spacing.xl,
      borderRadius: layout.borderRadius.xl,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.xs,
    },
   interruptButtonText: {
     fontSize: 11,
     color: semanticColors.textPrimary,
     fontWeight: '600',
   },

 });
