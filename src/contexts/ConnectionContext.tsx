import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import EventSource from 'react-native-sse';
import { createClient } from '../api/client';
import type { Client } from '../api/client/types.gen';
import type { Session, Message, Part } from '../api/types.gen';
import { sessionList, sessionMessages, sessionChat, sessionAbort } from '../api/sdk.gen';
import { saveServer, type SavedServer } from '../utils/serverStorage';
import { cacheAppPaths } from '../utils/pathUtils';
import { processImageUris } from '../utils/imageProcessing';

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
  isGenerating: boolean;
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
  sendMessage: (sessionId: string, message: string, providerID?: string, modelID?: string, images?: string[]) => void;
  abortSession: (sessionId: string) => Promise<boolean>;
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
  | { type: 'REMOVE_MESSAGE'; payload: { sessionId: string; messageId: string } }
  | { type: 'REMOVE_MESSAGE_PART'; payload: { sessionId: string; messageId: string; partId: string } }
  | { type: 'UPDATE_SESSION'; payload: { session: Session } }
  | { type: 'SET_STREAM_CONNECTED'; payload: { connected: boolean } }
  | { type: 'SET_GENERATING'; payload: { generating: boolean } }
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
  isGenerating: false,
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
      // Only process messages for the current session
      if (!state.currentSession || action.payload.info.sessionID !== state.currentSession.id) {
        console.log('Ignoring message update for different session:', action.payload.info.sessionID, 'current:', state.currentSession?.id);
        return state;
      }
      
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
      // Only process message parts for the current session
      if (!state.currentSession || action.payload.part.sessionID !== state.currentSession.id) {
        console.log('Ignoring message part update for different session:', action.payload.part.sessionID, 'current:', state.currentSession?.id);
        return state;
      }
      
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
    case 'REMOVE_MESSAGE':
      // Only process message removal for the current session
      if (!state.currentSession || action.payload.sessionId !== state.currentSession.id) {
        console.log('Ignoring message removal for different session:', action.payload.sessionId, 'current:', state.currentSession?.id);
        return state;
      }
      
      return {
        ...state,
        messages: state.messages.filter(msg => msg.info.id !== action.payload.messageId),
      };

    case 'REMOVE_MESSAGE_PART':
      // Only process message part removal for the current session
      if (!state.currentSession || action.payload.sessionId !== state.currentSession.id) {
        console.log('Ignoring message part removal for different session:', action.payload.sessionId, 'current:', state.currentSession?.id);
        return state;
      }
      
      const messageIndexForRemoval = state.messages.findIndex(msg => msg.info.id === action.payload.messageId);
      if (messageIndexForRemoval >= 0) {
        return {
          ...state,
          messages: state.messages.map(msg => 
            msg.info.id === action.payload.messageId 
              ? {
                  ...msg,
                  parts: msg.parts.filter(part => part.id !== action.payload.partId)
                }
              : msg
          ),
        };
      }
      return state;

    case 'UPDATE_SESSION':
      const updatedSessions = state.sessions.map(s =>
        s.id === action.payload.session.id ? action.payload.session : s
      );
      const updatedCurrentSession = state.currentSession?.id === action.payload.session.id
        ? action.payload.session
        : state.currentSession;

      return {
        ...state,
        sessions: updatedSessions,
        currentSession: updatedCurrentSession,
      };
    case 'SET_STREAM_CONNECTED':
      return {
        ...state,
        isStreamConnected: action.payload.connected,
      };
    case 'SET_GENERATING':
      console.log('🔧 SET_GENERATING action:', action.payload.generating, 'previous state:', state.isGenerating);
      return {
        ...state,
        isGenerating: action.payload.generating,
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
  const appStateRef = useRef<AppStateStatus>('active');
  const reconnectAttemptRef = useRef<number>(0);

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

      // Cache app paths from OpenCode SDK
      await cacheAppPaths(client);
      
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

  const sendMessage = useCallback((sessionId: string, message: string, providerID?: string, modelID?: string, images?: string[]): void => {
    if (!state.client || state.connectionStatus !== 'connected') {
      console.error('Cannot send message: not connected to server');
      return;
    }

    if (!providerID || !modelID) {
      console.error('Cannot send message: provider and model must be selected');
      return;
    }

    console.log('Sending message to session:', sessionId, 'message:', message, 'images:', images?.length || 0);

    // Send message asynchronously without blocking the UI
    const sendAsync = async () => {
      try {
        console.log('🚀 Starting message send - waiting for step-start event');
        console.log('   Current isGenerating state before send:', state.isGenerating);
        
        // Build the parts array
        const parts: ({type: 'text', text: string} | {type: 'file', mime: string, url: string, filename?: string})[] = [];
        
        // Add text part if there's a message
        if (message.trim()) {
          parts.push({
            type: 'text',
            text: message
          });
        }
        
        // Add image parts if there are images
        if (images && images.length > 0) {
          const processedImages = await processImageUris(images);
          
          for (const processedImage of processedImages) {
            parts.push({
              type: 'file',
              mime: processedImage.mime,
              url: processedImage.base64Data,
              filename: processedImage.filename
            });
          }
        }

        console.log('Built parts array:', parts);

        // Send the message - the response will come through the event stream
        await sessionChat({
          client: state.client!,
          path: { id: sessionId },
          body: {
            providerID,
            modelID,
            parts
          }
        });

        console.log('✅ Message sent successfully - waiting for step-start event');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    };

    // Execute without waiting
    sendAsync();
  }, [state.client, state.connectionStatus]);

  const abortSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!state.client || state.connectionStatus !== 'connected') {
      return false;
    }

    try {
      await sessionAbort({
        client: state.client,
        path: { id: sessionId }
      });
      console.log('Session aborted successfully:', sessionId);
      return true;
    } catch (error) {
      console.error('Failed to abort session:', sessionId, error);
      return false;
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
          info?: Message | Session;
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
              const messageInfo = eventData.properties.info as Message;
              console.log('Updating message:', messageInfo.id, 'for session:', messageInfo.sessionID);
              dispatch({ 
                type: 'UPDATE_MESSAGE', 
                payload: { 
                  messageId: messageInfo.id,
                  info: messageInfo
                }
              });
            }
            break;

          case 'message.removed':
            if (eventData.properties?.sessionID && eventData.properties?.messageID) {
              const sessionID = eventData.properties.sessionID as string;
              const messageID = eventData.properties.messageID as string;
              console.log('Removing message:', messageID, 'from session:', sessionID);
              dispatch({ 
                type: 'REMOVE_MESSAGE', 
                payload: { 
                  sessionId: sessionID,
                  messageId: messageID
                }
              });
            }
            break;

          case 'session.updated':
            if (eventData.properties?.info) {
              const sessionInfo = eventData.properties.info as Session;
              console.log('Updating session:', sessionInfo.id);
              dispatch({
                type: 'UPDATE_SESSION',
                payload: {
                  session: sessionInfo
                } 
              });
            }
            break;

          case 'session.error':
            if (eventData.properties?.sessionID) {
              const sessionID = eventData.properties.sessionID;
              const error = eventData.properties.error;
              console.log('Session error for session:', sessionID, 'error:', error);
              // For session errors, we could dispatch a specific error action
              // or handle it differently than regular session updates
              // For now, we'll log the error - the UI can handle session error states
            }
            break;
            
          

          case 'message.part.removed':
            if (eventData.properties?.sessionID && eventData.properties?.messageID && eventData.properties?.partID) {
              const sessionID = eventData.properties.sessionID as string;
              const messageID = eventData.properties.messageID as string;
              const partID = eventData.properties.partID as string;
              console.log('Removing message part:', partID, 'from message:', messageID, 'in session:', sessionID);
              dispatch({ 
                type: 'REMOVE_MESSAGE_PART', 
                payload: { 
                  sessionId: sessionID,
                  messageId: messageID,
                  partId: partID
                }
              });
            }
            break;

          case 'message.part.updated':
            // Handle step-start and step-finish parts
            if (eventData.properties?.part) {
              const part = eventData.properties.part;
              console.log('Updating message part:', part.messageID, part.id, 'for session:', part.sessionID, 'type:', part.type);
              
              // Check if this is a step-start or step-finish part
              if (part.type === 'step-start') {
                console.log('🟢 Generation step started - setting isGenerating = true');
                console.log('   Current isGenerating state:', state.isGenerating);
                dispatch({ type: 'SET_GENERATING', payload: { generating: true } });
              } else if (part.type === 'step-finish') {
                console.log('🔴 Generation step finished - setting isGenerating = false');
                console.log('   Current isGenerating state:', state.isGenerating);
                dispatch({ type: 'SET_GENERATING', payload: { generating: false } });
              }
              
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

          case 'session.idle':
            if (eventData.properties?.sessionID) {
              const sessionID = eventData.properties.sessionID;
              console.log('Session became idle:', sessionID);
              // Use session.idle as backup to ensure generation state is cleared
              // This provides redundancy in case step-end events are missed
              // However, we should be careful not to interfere with normal flow
              console.log('🟡 Session idle event - setting isGenerating = false as backup');
              dispatch({ type: 'SET_GENERATING', payload: { generating: false } });
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
          reconnectAttemptRef.current = retryCount + 1;
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
        reconnectAttemptRef.current = retryCount + 1;
        setTimeout(() => {
          startEventStream(client, retryCount + 1);
        }, delay);
      } else {
        console.log('Max retry attempts reached for event stream');
      }
    }
}, [stopEventStream]);

  // Handle app state changes to manage connection gracefully
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const currentState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (currentState === 'background' && nextAppState === 'active') {
        // App came to foreground - reconnect stream if needed
        if (state.connectionStatus === 'connected' && state.client && !state.isStreamConnected) {
          console.log('App came to foreground, attempting to reconnect stream...');
          startEventStream(state.client).catch(error => {
            console.log('Failed to reconnect stream on foreground:', error);
          });
        }
      } else if (currentState === 'active' && nextAppState === 'background') {
        // App went to background - set expectations for potential disconnection
        console.log('App went to background, stream may disconnect');
        reconnectAttemptRef.current = 0;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    appStateRef.current = AppState.currentState;

    return () => {
      subscription?.remove();
    };
  }, [state.connectionStatus, state.client, state.isStreamConnected, startEventStream]);

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
    abortSession,
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
    abortSession,
  ]);

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
}