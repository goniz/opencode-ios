import { useState, useEffect, useCallback } from 'react';
import type { Session, Provider } from '../api/types.gen';
import type { ConnectionContextType, MessageWithParts } from '../contexts/ConnectionContext';
import { findLastAssistantMessage, extractProviderModel } from '../utils/chat/messageHelpers';
import { configProviders } from '../api/sdk.gen';

export interface ModelSelectionHook {
  currentProvider: string | null;
  currentModel: { providerID: string; modelID: string } | null;
  availableProviders: { id: string; name: string }[];
  availableModels: { providerID: string; modelID: string; displayName: string; contextLimit: number }[];
  currentProviderModels: { modelID: string; name: string }[];
  setCurrentProvider: (providerId: string | null) => void;
  setCurrentModel: (model: { providerID: string; modelID: string } | null) => void;
  loadProvidersAndModels: () => Promise<void>;
}

export function useModelSelection(
  connection: ConnectionContextType,
  currentSession: Session | null,
  messages: MessageWithParts[]
): ModelSelectionHook {
  const {
    connectionStatus,
    client,
    latestProviderModel
  } = connection;
  
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<{providerID: string, modelID: string} | null>(null);
  const [availableProviders, setAvailableProviders] = useState<{id: string, name: string}[]>([]);
  const [availableModels, setAvailableModels] = useState<{providerID: string, modelID: string, displayName: string, contextLimit: number}[]>([]);
  const [currentProviderModels, setCurrentProviderModels] = useState<{modelID: string, name: string}[]>([]);

  // Load available providers and models when connected
  const loadProvidersAndModels = useCallback(async () => {
    if (connectionStatus === 'connected' && client) {
      try {
        const response = await configProviders({ client });
        if (response.data) {
          const providers: {id: string, name: string}[] = [];
          const models: {providerID: string, modelID: string, displayName: string, contextLimit: number}[] = [];
          
          // Extract providers and models
          response.data.providers.forEach((provider: Provider) => {
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
  }, [connectionStatus, client]);

  // Session-scoped provider and model selection - update when session or messages change
  useEffect(() => {
    // Only set model selection if we have providers and a current session
    if (availableProviders.length === 0 || !currentSession) {
      return;
    }

    // Find the last assistant message in the current session
    const lastAssistantMessage = findLastAssistantMessage(messages.map(m => m.info));
    
    if (lastAssistantMessage) {
      const providerModel = extractProviderModel(lastAssistantMessage);
      if (providerModel) {
        const providerExists = availableProviders.find(p => p.id === providerModel.providerID);
        if (providerExists) {
          console.log('🎯 Setting session-scoped model:', providerModel.providerID, providerModel.modelID, 'for session:', currentSession.id);
          setCurrentProvider(providerModel.providerID);
          setCurrentModel({
            providerID: providerModel.providerID,
            modelID: providerModel.modelID
          });
          return;
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

  return {
    currentProvider,
    currentModel,
    availableProviders,
    availableModels,
    currentProviderModels,
    setCurrentProvider,
    setCurrentModel,
    loadProvidersAndModels
  };
}