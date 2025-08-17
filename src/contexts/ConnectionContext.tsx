import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { createClient } from '../api/client';
import type { Client } from '../api/client/types.gen';
import type { Session } from '../api/types.gen';
import { sessionList } from '../api/sdk.gen';
import { saveServer, type SavedServer } from '../utils/serverStorage';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface ConnectionState {
  serverUrl: string;
  client: Client | null;
  connectionStatus: ConnectionStatus;
  sessions: Session[];
  lastError: string | null;
}

export interface ConnectionContextType extends ConnectionState {
  connect: (url: string) => Promise<void>;
  disconnect: () => void;
  refreshSessions: () => Promise<void>;
  clearError: () => void;
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

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [state, dispatch] = useReducer(connectionReducer, initialState);

  const connect = async (url: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_CONNECTING', payload: { url } });

      // Create client with the provided URL
      const client = createClient({
        baseUrl: url,
      });

      // Test the connection by making a simple API call
      // Using sessionList as a connection test - it should be available on all servers
      await sessionList({ client });

      dispatch({ type: 'SET_CONNECTED', payload: { client } });

      // Save the successful connection
      const savedServer: SavedServer = {
        url,
        lastConnected: Date.now(),
      };
      await saveServer(savedServer);

      // Fetch initial sessions
      await refreshSessionsInternal(client);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      dispatch({ type: 'SET_ERROR', payload: { error: errorMessage } });
      throw error;
    }
  };

  const disconnect = (): void => {
    dispatch({ type: 'DISCONNECT' });
  };

  const refreshSessionsInternal = async (client: Client): Promise<void> => {
    try {
      const response = await sessionList({ client });
      if (response.data) {
        dispatch({ type: 'SET_SESSIONS', payload: { sessions: response.data } });
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      // Don't dispatch error here as this is a secondary operation
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
  };

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
}