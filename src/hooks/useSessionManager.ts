import { useState, useEffect, useCallback } from 'react';
import type { Session } from '../api/types.gen';
import type { ConnectionContextType } from '../contexts/ConnectionContext';

export interface SessionManagerHook {
  currentSession: Session | null;
  loadedSessionId: string | null;
  handleSessionChange: (sessionId: string | undefined) => void;
  resetModelSelection: () => void;
}

export function useSessionManager(
  connection: ConnectionContextType,
  sessionIdParam: string | undefined
): SessionManagerHook {
  const {
    sessions,
    currentSession,
    setCurrentSession,
    refreshSessions,
    loadMessages
  } = connection;
  
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);

  // Handle session ID from navigation parameters
  const handleSessionChange = useCallback(() => {
    if (sessionIdParam) {
      console.log('Chat screen - sessionId from params:', sessionIdParam);

      // Try to find session in current sessions
      const targetSession = sessions.find(s => s.id === sessionIdParam);

      if (targetSession && (!currentSession || currentSession.id !== sessionIdParam)) {
        console.log('Chat screen - Setting session from params:', targetSession.id, targetSession.title);
        setCurrentSession(targetSession);
      } else if (!targetSession && sessions.length > 0) {
        // If session not found but we have sessions, it might be a new session
        // Wait a short time for sessions to refresh, then try again
        console.warn('Session not found in current list, requesting refresh');
        refreshSessions().then(() => {
          const refreshedSession = sessions.find(s => s.id === sessionIdParam);
          if (refreshedSession) {
            setCurrentSession(refreshedSession);
          } else {
            console.error('Session still not found after refresh:', sessionIdParam);
          }
        });
      }
    }
  }, [sessionIdParam, sessions, currentSession, setCurrentSession, refreshSessions]);

  // Reset model selection when session changes to ensure session-scoped selection
  const resetModelSelection = useCallback(() => {
    if (currentSession && currentSession.id !== loadedSessionId) {
      console.log('🔄 Session changed, resetting model selection for session:', currentSession.id, currentSession.title);
      // Reset will be handled by the model selection hook
    }
  }, [currentSession, loadedSessionId]);

  // Handle session change when sessionIdParam changes
  useEffect(() => {
    handleSessionChange();
  }, [sessionIdParam, handleSessionChange]);

  // Load messages when session changes
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

  return {
    currentSession,
    loadedSessionId,
    handleSessionChange,
    resetModelSelection
  };
}