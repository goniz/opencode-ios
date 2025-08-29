import { useState, useEffect, useCallback } from 'react';
import type { ConnectionContextType } from '../contexts/ConnectionContext';
import { ChutesApiKeyInvalidError, fetchChutesQuota } from '../utils/chutes';
import { secureSettings } from '../utils/secureSettings';
import type { ChutesQuota } from '../types/chat';

export interface ChutesIntegrationHook {
  chutesQuota: ChutesQuota | null;
  showApiKeyInput: boolean;
  handleApiKeyProvided: (apiKey: string) => void;
  handleApiKeyInputCancel: () => void;
}

export function useChutesIntegration(
  connection: ConnectionContextType,
  currentModel: { providerID: string; modelID: string } | null
): ChutesIntegrationHook {
  const {
    connectionStatus,
    client,
    onSessionIdle
  } = connection;
  
  const [chutesQuota, setChutesQuota] = useState<ChutesQuota | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [pendingApiKeyRequest, setPendingApiKeyRequest] = useState<{providerID: string, modelID: string} | null>(null);

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
    
    // Also subscribe to session.idle events to refresh quota
    const unsubscribe = onSessionIdle((sessionId: string) => {
      console.log(`[Chutes] Session ${sessionId} became idle, refreshing quota`);
      loadChutesQuota();
    });
    
    return unsubscribe;
  }, [connectionStatus, client, currentModel, onSessionIdle]);

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
          // In a real implementation, we would show an alert here
          // For now, we'll just show the input dialog again
          setShowApiKeyInput(true);
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

  return {
    chutesQuota,
    showApiKeyInput,
    handleApiKeyProvided,
    handleApiKeyInputCancel
  };
}