import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventSource from 'react-native-sse';
import { createClient } from '../api/client';
import type { Client } from '../api/client/types.gen';
import type { Session, Message, Part } from '../api/types.gen';
import { sessionList, sessionMessages, sessionChat } from '../api/sdk.gen';
import { saveServer, type SavedServer } from '../utils/serverStorage';

const CURRENT_CONNECTION_KEY = 'current_connection';
const CURRENT_SESSION_KEY = 'current_session';
const CONNECTION_TIMEOUT = 10000; // 10 seconds default timeout

interface PersistedConnection {
  serverUrl: string;
  timestamp: number;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface MessageWithParts {
  info: Message;
  parts: Part[];
}

export interface ConnectionState {
  serverUrl: string;
  client: Client | null;
  connectionStatus: ConnectionStatus;
  sessions: Session[];
  lastError: string | null;
  currentSession: Session | null;
  messages: MessageWithParts[];
  isLoadingMessages: boolean;
  isStreamConnected: boolean;
}

export interface ConnectionContextType extends ConnectionState {
  connect: (url: string, timeout?: number) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  clearError: () => void;
  autoReconnect: () => Promise<void>;
  retryConnection: () => Promise<void>;
  setCurrentSession: (session: Session | null) => void;
  loadMessages: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, message: string, providerID?: string, modelID?: string) => Promise<void>;
}

type ConnectionAction =
  | { type: 'SET_CONNECTING'; payload: { url: string } }
  | { type: 'SET_CONNECTED'; payload: { client: Client } }
  | { type: 'SET_ERROR'; payload: { error: string } }
  | { type: 'SET_SESSIONS'; payload: { sessions: Session[] } }
  | { type: 'SET_CURRENT_SESSION'; payload: { session: Session | null } }
  | { type: 'SET_MESSAGES'; payload: { messages: MessageWithParts[] } }
  | { type: 'SET_LOADING_MESSAGES'; payload: { isLoading: boolean } }
  | { type: 'ADD_MESSAGE'; payload: { message: MessageWithParts } }
  | { type: 'UPDATE_MESSAGE'; payload: { messageId: string; info: Message } }
  | { type: 'UPDATE_MESSAGE_PART'; payload: { messageId: string; partId: string; part: Part } }
  | { type: 'SET_STREAM_CONNECTED'; payload: { connected: boolean } }
  | { type: 'DISCONNECT' }
  | { type: 'CLEAR_ERROR' };

const initialState: ConnectionState = {
  serverUrl: '',
  client: null,
  connectionStatus: 'idle',
  sessions: [],
  lastError: null,
  currentSession: null,
  messages: [],
  isLoadingMessages: false,
  isStreamConnected: false,
};

function connectionReducer(state: ConnectionState, action: ConnectionAction): ConnectionState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return {
        ...state,
        serverUrl: action.payload.url,
        connectionStatus: 'connecting',
        lastError: null,
      };
    case 'SET_CONNECTED':
      return {
        ...state,
        client: action.payload.client,
        connectionStatus: 'connected',
        lastError: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        connectionStatus: 'error',
        lastError: action.payload.error,
        client: null,
      };
    case 'SET_SESSIONS':
      return {
        ...state,
        sessions: action.payload.sessions,
      };
    case 'SET_CURRENT_SESSION':
      return {
        ...state,
        currentSession: action.payload.session,
        messages: [], // Clear messages when switching sessions
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload.messages,
        isLoadingMessages: false,
      };
    case 'SET_LOADING_MESSAGES':
      return {
        ...state,
        isLoadingMessages: action.payload.isLoading,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload.message],
      };
    case 'UPDATE_MESSAGE':
      const existingMessageIndex = state.messages.findIndex(msg => msg.info.id === action.payload.messageId);
      if (existingMessageIndex >= 0) {
        // Update existing message
        return {
          ...state,
          messages: state.messages.map(msg => 
            msg.info.id === action.payload.messageId 
              ? { ...msg, info: action.payload.info }
              : msg
          ),
        };
      } else {
        // Add new message if it doesn't exist
        return {
          ...state,
          messages: [...state.messages, { info: action.payload.info, parts: [] }],
        };
      }
    case 'UPDATE_MESSAGE_PART':
      const messageIndex = state.messages.findIndex(msg => msg.info.id === action.payload.messageId);
      if (messageIndex >= 0) {
        // Update existing message's parts
        return {
          ...state,
          messages: state.messages.map(msg => 
            msg.info.id === action.payload.messageId 
              ? {
                  ...msg,
                  parts: msg.parts.some(p => p.id === action.payload.partId)
                    ? msg.parts.map(part => 
                        part.id === action.payload.partId 
                          ? action.payload.part
                          : part
                      )
                    : [...msg.parts, action.payload.part]
                }
              : msg
          ),
        };
      } else {
        // Create new message with this part if message doesn't exist
        console.warn('Received part for non-existent message:', action.payload.messageId);
        return state; // Could also create a placeholder message here
      }
    case 'SET_STREAM_CONNECTED':
      return {
        ...state,
        isStreamConnected: action.payload.connected,
      };
    case 'DISCONNECT':
      return {
        ...initialState,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        lastError: null,
      };
    default:
      return state;
  }
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function useConnection(): ConnectionContextType {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}

interface ConnectionProviderProps {
  children: ReactNode;
}

// Utility functions for connection persistence
const saveCurrentConnection = async (serverUrl: string): Promise<void> => {
  try {
    const connection: PersistedConnection = {
      serverUrl,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CURRENT_CONNECTION_KEY, JSON.stringify(connection));
  } catch (error) {
    console.error('Failed to save current connection:', error);
  }
};

const getCurrentConnection = async (): Promise<PersistedConnection | null> => {
  try {
    const stored = await AsyncStorage.getItem(CURRENT_CONNECTION_KEY);
    if (stored) {
      const connection: PersistedConnection = JSON.parse(stored);
      // Check if connection is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - connection.timestamp < maxAge) {
        return connection;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get current connection:', error);
    return null;
  }
};

const clearCurrentConnection = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CURRENT_CONNECTION_KEY);
  } catch (error) {
    console.error('Failed to clear current connection:', error);
  }
};

const saveCurrentSession = async (session: Session): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save current session:', error);
  }
};

const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const stored = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Failed to get current session:', error);
    return null;
  }
};

const clearCurrentSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear current session:', error);
  }
};

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [state, dispatch] = useReducer(connectionReducer, initialState);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connectWithTimeout = async (client: Client, timeoutMs: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeoutMs);

      sessionList({ client })
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  };

  const connect = useCallback(async (url: string, timeout: number = CONNECTION_TIMEOUT): Promise<void> => {
    try {
      dispatch({ type: 'SET_CONNECTING', payload: { url } });

      // Create client with the provided URL
      const client = createClient({
        baseUrl: url,
      });

      // Test the connection with timeout
      await connectWithTimeout(client, timeout);

      dispatch({ type: 'SET_CONNECTED', payload: { client } });

      // Save the successful connection to both server storage and current connection
      // Store only the host:port part, not the full URL with protocol
      const hostPort = url.replace(/^https?:\/\//, '');
      const savedServer: SavedServer = {
        url: hostPort,
        lastConnected: Date.now(),
      };
      await Promise.all([
        saveServer(savedServer),
        saveCurrentConnection(url) // Keep full URL for connection persistence
      ]);

      // Fetch initial sessions
      await refreshSessionsInternal(client);
      
      // Start event stream for real-time updates
      await startEventStream(client);
      
      // Try to restore the last active session
      const savedSession = await getCurrentSession();
      if (savedSession) {
        // We'll validate the session later when sessions are loaded
        dispatch({ type: 'SET_CURRENT_SESSION', payload: { session: savedSession } });
      }
} catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      dispatch({ type: 'SET_ERROR', payload: { error: errorMessage } });
      
      // Clear stale connection data on connection failure
      await clearCurrentConnection();
      throw error;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps  

  const disconnect = useCallback(async (): Promise<void> => {
    // Stop event stream first
    await stopEventStream();
    // Clear persisted connection when user explicitly disconnects
    clearCurrentConnection();
    dispatch({ type: 'DISCONNECT' });
}, []); // eslint-disable-line react-hooks/exhaustive-deps

  const autoReconnect = useCallback(async (): Promise<void> => {
    try {
      const persistedConnection = await getCurrentConnection();
      if (persistedConnection) {
        // Attempt to reconnect with a shorter timeout for auto-reconnect
        await connect(persistedConnection.serverUrl, 5000);
      }
    } catch (error) {
      // Auto-reconnect failure is not critical - just log it
      console.log('Auto-reconnect failed:', error);
      // Clear stale connection data
      await clearCurrentConnection();
    }
  }, [connect]);

  // Auto-reconnect on app launch
  useEffect(() => {
    autoReconnect();
  }, [autoReconnect]);

  // Validate current session when sessions change
  useEffect(() => {
    if (state.currentSession && state.sessions.length > 0) {
      const sessionExists = state.sessions.some(s => s.id === state.currentSession!.id);
      if (!sessionExists) {
        // Session no longer exists, clear it
        clearCurrentSession();
        dispatch({ type: 'SET_CURRENT_SESSION', payload: { session: null } });
      }
    }
  }, [state.sessions, state.currentSession]);

  const retryConnection = useCallback(async (): Promise<void> => {
    if (state.serverUrl) {
      await connect(state.serverUrl);
    } else {
      // Try to use persisted connection if no current server URL
      await autoReconnect();
    }
  }, [state.serverUrl, connect, autoReconnect]);

  const refreshSessionsInternal = async (client: Client): Promise<void> => {
    try {
      const response = await sessionList({ client });
      if (response.data) {
        dispatch({ type: 'SET_SESSIONS', payload: { sessions: response.data } });
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      // If session fetching fails consistently, it might indicate a stale connection
      // Clear the persisted connection if the error suggests authentication/connection issues
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden') || 
          errorMessage.includes('network') || errorMessage.includes('timeout')) {
        console.log('Clearing stale connection due to session fetch error');
        await clearCurrentConnection();
      }
    }
  };

  const refreshSessions = useCallback(async (): Promise<void> => {
    if (state.client && state.connectionStatus === 'connected') {
      await refreshSessionsInternal(state.client);
    }
  }, [state.client, state.connectionStatus]);

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const setCurrentSession = useCallback((session: Session | null): void => {
    console.log('ConnectionContext: setCurrentSession called with:', session ? `${session.id} (${session.title})` : 'null');
    dispatch({ type: 'SET_CURRENT_SESSION', payload: { session } });
    // Persist the current session
    if (session) {
      saveCurrentSession(session);
    } else {
      clearCurrentSession();
    }
  }, []);

  const loadMessages = useCallback(async (sessionId: string): Promise<void> => {
    if (!state.client || state.connectionStatus !== 'connected') {
      throw new Error('Not connected to server');
    }

    try {
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: { isLoading: true } });
      
      const response = await sessionMessages({ 
        client: state.client, 
        path: { id: sessionId } 
      });
      
      if (response.data) {
        // Store the full message objects with parts
        dispatch({ type: 'SET_MESSAGES', payload: { messages: response.data } });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: { isLoading: false } });
      throw error;
    }
  }, [state.client, state.connectionStatus]);

  const sendMessage = useCallback(async (sessionId: string, message: string, providerID?: string, modelID?: string): Promise<void> => {
    if (!state.client || state.connectionStatus !== 'connected') {
      throw new Error('Not connected to server');
    }

    if (!providerID || !modelID) {
      throw new Error('Provider and model must be selected');
    }

    console.log('Sending message to session:', sessionId, 'message:', message);

    try {
      // Send the message - the response will come through the event stream
      await sessionChat({
        client: state.client,
        path: { id: sessionId },
        body: {
          providerID,
          modelID,
          parts: [{
            type: 'text',
            text: message
          }]
        }
      });

      // Don't add empty assistant message - let the stream handle it
      // The stream events will create and update the assistant message properly
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [state.client, state.connectionStatus]);

  // Event stream management functions
  const stopEventStream = useCallback(async (): Promise<void> => {
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch (error) {
        console.error('Error closing event source:', error);
      } finally {
        eventSourceRef.current = null;
        dispatch({ type: 'SET_STREAM_CONNECTED', payload: { connected: false } });
      }
    }
  }, []);

const startEventStream = useCallback(async (client: Client, retryCount = 0): Promise<void> => {
    const maxRetries = 3;
    
    // First stop any existing stream
    await stopEventStream();

    try {
      console.log('Starting event stream...');
      
      // Get the base URL from the client
      const config = (client as { getConfig?: () => { baseUrl?: string } }).getConfig?.() || {};
      const baseUrl = config.baseUrl || '';
      const eventUrl = `${baseUrl}/event`;
      
      console.log('Event stream URL:', eventUrl);
      
      // Create EventSource for SSE
      const eventSource = new EventSource(eventUrl);
      eventSourceRef.current = eventSource;
      
      interface StreamEventData {
        type: string;
        properties?: {
          info?: Message;
          part?: Part;
          [key: string]: unknown;
        };
        [key: string]: unknown;
      }

      const handleStreamEvent = (eventData: StreamEventData) => {
        console.log('Processing stream event:', eventData.type);
        
        switch (eventData.type) {
          case 'message.updated':
            if (eventData.properties?.info) {
              console.log('Updating message:', eventData.properties.info.id);
              dispatch({ 
                type: 'UPDATE_MESSAGE', 
                payload: { 
                  messageId: eventData.properties.info.id, 
                  info: eventData.properties.info 
                } 
              });
            }
            break;
            
          case 'message.part.updated':
            if (eventData.properties?.part) {
              const part = eventData.properties.part;
              console.log('Updating message part:', part.messageID, part.id);
              dispatch({ 
                type: 'UPDATE_MESSAGE_PART', 
                payload: { 
                  messageId: part.messageID, 
                  partId: part.id, 
                  part: part 
                } 
              });
            }
            break;
            
          default:
            console.log('Unhandled event type:', eventData.type);
        }
      };

      eventSource.addEventListener('open', () => {
        console.log('Event stream connected');
        dispatch({ type: 'SET_STREAM_CONNECTED', payload: { connected: true } });
      });

      eventSource.addEventListener('message', (event: unknown) => {
        try {
          if (event && typeof event === 'object' && 'data' in event && typeof (event as { data: unknown }).data === 'string') {
            const eventData = JSON.parse((event as { data: string }).data);
            console.log('Received event:', eventData);
            handleStreamEvent(eventData);
          }
        } catch (parseError) {
          console.error('Failed to parse event data:', parseError);
        }
      });

      eventSource.addEventListener('error', (error: unknown) => {
        console.error('Event stream error:', error);
        dispatch({ type: 'SET_STREAM_CONNECTED', payload: { connected: false } });
        
        // Auto-reconnect with exponential backoff
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`Retrying event stream in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            startEventStream(client, retryCount + 1);
          }, delay);
        } else {
          console.log('Max retry attempts reached for event stream');
        }
      });

    } catch (error) {
      console.error('Failed to start event stream:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error ? error.cause : undefined
      });
      dispatch({ type: 'SET_STREAM_CONNECTED', payload: { connected: false } });
      
      // Auto-reconnect with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying event stream in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          startEventStream(client, retryCount + 1);
        }, delay);
      } else {
        console.log('Max retry attempts reached for event stream');
      }
    }
}, [stopEventStream]);

  const contextValue: ConnectionContextType = useMemo(() => ({
    ...state,
    connect,
    disconnect,
    refreshSessions,
    clearError,
    autoReconnect,
    retryConnection,
    setCurrentSession,
    loadMessages,
    sendMessage,
  }), [
    state,
    connect,
    disconnect,
    refreshSessions,
    clearError,
    autoReconnect,
    retryConnection,
    setCurrentSession,
    loadMessages,
    sendMessage,
  ]);

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
}