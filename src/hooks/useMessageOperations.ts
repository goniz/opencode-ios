import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, Message, Part } from '../api/types.gen';
import type { ConnectionContextType } from '../contexts/ConnectionContext';

interface MessageWithParts {
  info: Message;
  parts: Part[];
}

export interface MessageOperationsHook {
  messages: MessageWithParts[];
  isGenerating: boolean;
  isSending: boolean;
  inputText: string;
  selectedImages: string[];
  isLoadingMessages: boolean;
  setInputText: (text: string) => void;
  setSelectedImages: (images: string[]) => void;
  handleImageSelected: (imageUri: string) => void;
  handleRemoveImage: (index: number) => void;
  handleSendMessage: () => void;
  handleInterrupt: () => void;
}

export function useMessageOperations(
  connection: ConnectionContextType,
  currentSession: Session | null
): MessageOperationsHook {
  const {
    messages,
    isGenerating,
    isLoadingMessages,
    sendMessage,
    abortSession,
    isStreamConnected,
    connectionStatus
  } = connection;
  
  const [inputText, setInputText] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const previousStreamConnectedRef = useRef(isStreamConnected);

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

  const handleSendMessage = useCallback(async () => {
    console.log('handleSendMessage called', {
      inputText: inputText.trim(),
      selectedImagesCount: selectedImages.length,
      currentSession: currentSession?.id,
      isSending,
    });

    if (((!inputText || !inputText.trim()) && selectedImages.length === 0) || !currentSession || isSending) {
      console.log('Early return due to validation');
      return;
    }

    const messageText = inputText?.trim() || '';
    
    // Check if this is a command
    if (messageText.startsWith('/')) {
      // Commands will be handled by the command execution hook
      return;
    }

    const imagesToSend = [...selectedImages];
    
    console.log('Sending message:', { messageText, imagesToSend });
    
    setInputText('');
    setSelectedImages([]);
    setIsSending(true);

    try {
      // Get current provider/model from connection context
      // Note: These should be passed from the model selection hook in the final implementation
      const providerID = connection.latestProviderModel?.providerID;
      const modelID = connection.latestProviderModel?.modelID;
      
      if (!providerID || !modelID) {
        console.log('No model selected');
        setIsSending(false);
        return;
      }
      
      sendMessage(
        currentSession.id,
        messageText,
        providerID,
        modelID,
        imagesToSend
      );
      console.log('Message queued successfully');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore the input text and images if sending failed
      setInputText(messageText);
      setSelectedImages(imagesToSend);
    } finally {
      // Always reset isSending state regardless of success or failure
      setIsSending(false);
    }
  }, [inputText, selectedImages, currentSession, isSending, sendMessage, connection.latestProviderModel]);

  // Reload messages when stream reconnects (additional safety net)
  useEffect(() => {
    const streamJustReconnected = !previousStreamConnectedRef.current && isStreamConnected;

    if (streamJustReconnected && currentSession && connectionStatus === 'connected') {
      console.log('🔄 Stream reconnected - reloading messages for session:', currentSession.id);
      // Note: loadMessages is not directly available here, it should be handled by the session manager hook
    }

    previousStreamConnectedRef.current = isStreamConnected;
  }, [isStreamConnected, currentSession, connectionStatus]);

  return {
    messages,
    isGenerating,
    isSending,
    inputText,
    selectedImages,
    isLoadingMessages,
    setInputText,
    setSelectedImages,
    handleImageSelected,
    handleRemoveImage,
    handleSendMessage,
    handleInterrupt
  };
}