import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '../api/types.gen';
import type { ConnectionContextType } from '../contexts/ConnectionContext';

export interface ConnectionRecoveryHook {
  lastError: string | null;
  isDismissed: boolean;
  handleDismiss: () => void;
}

export function useConnectionRecovery(
  connection: ConnectionContextType,
  currentSession: Session | null
): ConnectionRecoveryHook {
  const {
    lastError: connectionLastError,
    clearError: connectionClearError,
    loadMessages,
    connectionStatus,
    isStreamConnected
  } = connection;
  
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const previousConnectionStatusRef = useRef(connectionStatus);
  const previousStreamConnectedRef = useRef(isStreamConnected);

  // Handle error dismissal
  const handleDismiss = useCallback(() => {
    if (lastError) {
      setIsDismissed(true);
      connectionClearError();
    }
  }, [lastError, connectionClearError]);

  // Reload messages when transitioning from offline to online
  useEffect(() => {
    const isNowOnline = previousConnectionStatusRef.current === 'error' && connectionStatus === 'connected';

    if (isNowOnline && currentSession) {
      console.log('🔄 Connection restored - reloading messages for session:', currentSession.id);
      loadMessages(currentSession.id).catch(error => {
        console.error('Failed to reload messages after reconnection:', error);
      });
    }

    previousConnectionStatusRef.current = connectionStatus;
  }, [connectionStatus, currentSession, loadMessages]);

  // Also reload messages when stream reconnects (additional safety net)
  useEffect(() => {
    const streamJustReconnected = !previousStreamConnectedRef.current && isStreamConnected;

    if (streamJustReconnected && currentSession && connectionStatus === 'connected') {
      console.log('🔄 Stream reconnected - reloading messages for session:', currentSession.id);
      loadMessages(currentSession.id).catch(error => {
        console.error('Failed to reload messages after stream reconnection:', error);
      });
    }

    previousStreamConnectedRef.current = isStreamConnected;
  }, [isStreamConnected, currentSession, connectionStatus, loadMessages]);

  // Update local error state when connection error changes
  useEffect(() => {
    if (connectionLastError) {
      setLastError(connectionLastError);
      setIsDismissed(false);
    }
  }, [connectionLastError]);

  return {
    lastError,
    isDismissed,
    handleDismiss
  };
}