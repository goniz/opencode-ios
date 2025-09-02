import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { jest } from '@jest/globals';

import { ConnectionProvider, useConnection } from '../src/contexts/ConnectionContext';
import type { Session, Message, Part, TextPart } from '../src/api/types.gen';

// Mock functions to control event stream behavior
let mockEventHandlers: Record<string, (event: any) => void> = {};
let mockEventSource: any;

// Mock the dependencies
jest.mock('../src/api/client', () => ({
  createClient: jest.fn(() => ({
    getConfig: () => ({ baseUrl: 'http://localhost:8080' })
  }))
}));

jest.mock('../src/api/sdk.gen', () => ({
  sessionList: jest.fn(),
  sessionMessages: jest.fn(),
  sessionChat: jest.fn(),
  appGet: jest.fn(() => Promise.resolve({
    data: {
      path: {
        root: '/test/root',
        cwd: '/test/cwd'
      }
    }
  })),
  commandList: jest.fn(() => Promise.resolve({ data: [] }))
}));

jest.mock('../src/utils/serverStorage', () => ({
  saveServer: jest.fn(),
}));

jest.mock('react-native-sse', () => {
  return jest.fn().mockImplementation(() => {
    mockEventSource = {
      addEventListener: jest.fn((event: string, handler: (event: any) => void) => {
        mockEventHandlers[event] = handler;
      }),
      close: jest.fn(),
    };
    return mockEventSource;
  });
});

// Test data
const createMockSession = (id: string, title: string): Session => ({
  id,
  projectID: 'test-project',
  directory: '/test/directory',
  title,
  version: '1.0.0',
  time: {
    created: Date.now() - 3600000,
    updated: Date.now() - 1800000,
  },
});

const createMockMessage = (
  id: string, 
  sessionId: string, 
  role: 'user' | 'assistant',
  text: string
): { info: Message; parts: Part[] } => ({
  info: {
    id,
    role,
    sessionID: sessionId,
    time: { created: Date.now() },
    ...(role === 'assistant' ? { 
      providerID: 'test-provider', 
      modelID: 'test-model',
      system: [],
      mode: 'chat',
      path: { cwd: '/test', root: '/test' }
    } : {})
  } as Message,
  parts: [{
    id: `${id}-part-1`,
    sessionID: sessionId,
    messageID: id,
    type: 'text',
    text,
    time: { start: Date.now() }
  } as TextPart]
});

const simulateStreamEvent = (eventType: string, data: unknown) => {
  if (mockEventHandlers.message) {
    const event = {
      data: JSON.stringify({
        type: eventType,
        properties: data
      })
    };
    mockEventHandlers.message(event);
  }
};

describe('Chat Session Switching Bug', () => {
  let mockSessionList: any;
  let mockSessionMessages: any;
  let mockSessionChat: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventHandlers = {};
    
    // Setup API mocks
    const apiSdk = require('../src/api/sdk.gen');
    mockSessionList = apiSdk.sessionList;
    mockSessionMessages = apiSdk.sessionMessages;
    mockSessionChat = apiSdk.sessionChat;

    // Default successful responses
    mockSessionList.mockResolvedValue({
      data: [
        createMockSession('session-1', 'Session 1'),
        createMockSession('session-2', 'Session 2'),
      ]
    } as any);

    mockSessionMessages.mockImplementation((args: any) => {
      const sessionId = args?.path?.id;
      if (sessionId === 'session-1') {
        return Promise.resolve({
          data: [
            createMockMessage('msg-1', 'session-1', 'user', 'Hello in session 1'),
            createMockMessage('msg-2', 'session-1', 'assistant', 'Response in session 1'),
          ]
        } as any);
      } else if (sessionId === 'session-2') {
        return Promise.resolve({
          data: [
            createMockMessage('msg-3', 'session-2', 'user', 'Hello in session 2'),
          ]
        } as any);
      }
      return Promise.resolve({ data: [] } as any);
    });

    mockSessionChat.mockResolvedValue({} as any);
  });

  const renderConnectionProvider = () => {
    return renderHook(() => useConnection(), {
      wrapper: ({ children }) => (
        <ConnectionProvider>{children}</ConnectionProvider>
      ),
    });
  };

  describe('Session switching with ongoing messages', () => {
    it('should only show messages from current session when receiving stream updates', async () => {
      const { result } = renderConnectionProvider();

      // Step 1: Connect to server
      await act(async () => {
        await result.current.connect('http://localhost:8080');
      });

      // Simulate event stream connection
      act(() => {
        if (mockEventHandlers.open) {
          mockEventHandlers.open({});
        }
      });

      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.sessions).toHaveLength(2);

      // Step 2: Open session #1
      const session1 = result.current.sessions.find(s => s.id === 'session-1')!;
      await act(async () => {
        result.current.setCurrentSession(session1);
        await result.current.loadMessages(session1.id);
      });

      // Wait for session transition to complete and verify session is set
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Ensure currentSession is properly set before continuing
      expect(result.current.currentSession?.id).toBe('session-1');
      
      const initialMessageCount = result.current.messages.length;

      // Simulate events for different sessions
      await act(async () => {
        // Event for session 1 (should be processed since it's the current session)
        simulateStreamEvent('message.updated', {
          info: {
            id: 'msg-6',
            role: 'assistant',
            sessionID: 'session-1',
            time: { created: Date.now() },
            providerID: 'test-provider',
            modelID: 'test-model'
          }
        });

        // Event for session 2 (should be ignored since it's not the current session)
        simulateStreamEvent('message.updated', {
          info: {
            id: 'msg-7',
            role: 'assistant',
            sessionID: 'session-2',
            time: { created: Date.now() },
            providerID: 'test-provider',
            modelID: 'test-model'
          }
        });

        // Allow events to be processed
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Only the session 1 message should be added (since session-1 is current)
      expect(result.current.messages.length).toBe(initialMessageCount + 1);
      expect(result.current.messages.some(msg => msg.info.id === 'msg-6')).toBe(true);
      expect(result.current.messages.some(msg => msg.info.id === 'msg-7')).toBe(false);
    });

    it('should handle message parts filtering correctly', async () => {
      const { result } = renderConnectionProvider();

      await act(async () => {
        await result.current.connect('http://localhost:8080');
      });

      act(() => {
        if (mockEventHandlers.open) {
          mockEventHandlers.open({});
        }
      });

      const session1 = result.current.sessions.find(s => s.id === 'session-1')!;
      await act(async () => {
        result.current.setCurrentSession(session1);
      });

      // Wait for session to be set
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Ensure currentSession is properly set before continuing
      expect(result.current.currentSession?.id).toBe('session-1');

      // Now load messages after session is set
      await act(async () => {
        await result.current.loadMessages(session1.id);
      });

      // Verify messages were loaded
      expect(result.current.messages.length).toBeGreaterThan(0);

      // Simulate message parts for different sessions
      await act(async () => {
        // Part for session 2 (should be ignored)
        simulateStreamEvent('message.part.updated', {
          part: {
            id: 'part-wrong-session',
            sessionID: 'session-2',
            messageID: 'msg-session-2',
            type: 'text',
            text: 'This belongs to session 2',
            time: { start: Date.now() }
          }
        });

        // Part for existing message in session 1
        simulateStreamEvent('message.part.updated', {
          part: {
            id: 'part-correct-session',
            sessionID: 'session-1',
            messageID: 'msg-2', // Existing message in session 1
            type: 'text',
            text: 'Updated content for session 1',
            time: { start: Date.now() }
          }
        });

        // Allow events to be processed
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Verify the wrong session part was not added
      const wrongParts = result.current.messages.flatMap(msg => msg.parts).filter(
        part => part.id === 'part-wrong-session'
      );
      expect(wrongParts).toHaveLength(0);

      // Verify the correct session part was processed
      const correctMessage = result.current.messages.find(msg => msg.info.id === 'msg-2');
      expect(correctMessage).toBeDefined();
      const correctPart = correctMessage?.parts.find(part => part.id === 'part-correct-session');
      expect(correctPart).toBeDefined();
    });
  });
});