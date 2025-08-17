import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '../api/client';
import type { Client } from '../api/client/types.gen';
import type { Session } from '../api/types.gen';
import { sessionList } from '../api/sdk.gen';
import { saveServer, type SavedServer } from '../utils/serverStorage';

const CURRENT_CONNECTION_KEY = 'current_connection';
const CONNECTION_TIMEOUT = 10000; // 10 seconds default timeout

interface PersistedConnection {
  serverUrl: string;
  timestamp: number;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface ConnectionState {
  serverUrl: string;
  client: Client | null;
  connectionStatus: ConnectionStatus;
  sessions: Session[];
  lastError: string | null;
}

export interface ConnectionContextType extends ConnectionState {
  connect: (url: string, timeout?: number) => Promise<void>;
  disconnect: () => void;
  refreshSessions: () => Promise<void>;
  clearError: () => void;
  autoReconnect: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

type ConnectionAction =
  | { type: 'SET_CONNECTING'; payload: { url: string } }
  | { type: 'SET_CONNECTED'; payload: { client: Client } }
  | { type: 'SET_ERROR'; payload: { error: string } }
  | { type: 'SET_SESSIONS'; payload: { sessions: Session[] } }
  | { type: 'DISCONNECT' }
  | { type: 'CLEAR_ERROR' };

const initialState: ConnectionState = {
  serverUrl: '',
  client: null,
  connectionStatus: 'idle',
  sessions: [],
  lastError: null,
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

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [state, dispatch] = useReducer(connectionReducer, initialState);

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
      const savedServer: SavedServer = {
        url,
        lastConnected: Date.now(),
      };
      await Promise.all([
        saveServer(savedServer),
        saveCurrentConnection(url)
      ]);

      // Fetch initial sessions
      await refreshSessionsInternal(client);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      dispatch({ type: 'SET_ERROR', payload: { error: errorMessage } });
      
      // Clear stale connection data on connection failure
      await clearCurrentConnection();
      throw error;
    }
  }, []);

  const disconnect = (): void => {
    // Clear persisted connection when user explicitly disconnects
    clearCurrentConnection();
    dispatch({ type: 'DISCONNECT' });
  };

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

  const retryConnection = async (): Promise<void> => {
    if (state.serverUrl) {
      await connect(state.serverUrl);
    } else {
      // Try to use persisted connection if no current server URL
      await autoReconnect();
    }
  };

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

  const refreshSessions = async (): Promise<void> => {
    if (state.client && state.connectionStatus === 'connected') {
      await refreshSessionsInternal(state.client);
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: ConnectionContextType = {
    ...state,
    connect,
    disconnect,
    refreshSessions,
    clearError,
    autoReconnect,
    retryConnection,
  };

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
}