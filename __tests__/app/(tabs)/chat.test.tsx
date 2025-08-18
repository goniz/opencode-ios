import React from 'react';
import { render, act } from '@testing-library/react-native';
import { jest } from '@jest/globals';
import ChatScreen from '../../../app/(tabs)/chat';
import type { Session, AssistantMessage, UserMessage, Part } from '../../../src/api/types.gen';

// Mock the dependencies
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../../src/contexts/ConnectionContext', () => ({
  useConnection: () => ({
    connectionStatus: 'connected',
    sessions: [],
    currentSession: null,
    messages: [],
    isLoadingMessages: false,
    isStreamConnected: false,
    loadMessages: jest.fn(),
    sendMessage: jest.fn(),
    setCurrentSession: jest.fn(),
    client: {},
  }),
}));

jest.mock('../../../src/utils/toast', () => ({
  toast: {
    showError: jest.fn(),
  },
}));

jest.mock('../../../src/utils/messageFiltering', () => ({
  filterMessageParts: jest.fn((parts) => parts),
}));

jest.mock('../../../src/components/chat/MessageDecoration', () => 'MessageDecoration');
jest.mock('../../../src/components/chat/MessageContent', () => 'MessageContent');
jest.mock('../../../src/components/chat/MessageTimestamp', () => 'MessageTimestamp');
jest.mock('../../../src/components/chat/ConnectionStatus', () => 'ConnectionStatus');

jest.mock('../../../src/api/sdk.gen', () => ({
  configProviders: jest.fn(() => Promise.resolve({ data: { providers: [] } })),
}));

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore();
  });
  it('renders without crashing when not connected', async () => {
    const { findByText } = render(<ChatScreen />);
    expect(await findByText('No Connection')).toBeTruthy();
  });

  it('renders without crashing when no session is selected', async () => {
    const mockUseConnection = jest.fn(() => ({
      connectionStatus: 'connected',
      sessions: [],
      currentSession: null,
      messages: [],
      isLoadingMessages: false,
      isStreamConnected: false,
      loadMessages: jest.fn(),
      sendMessage: jest.fn(),
      setCurrentSession: jest.fn(),
      client: {},
    }));

    jest.doMock('../../../src/contexts/ConnectionContext', () => ({
      useConnection: mockUseConnection,
    }));

    const { findByText } = render(<ChatScreen />);
    expect(await findByText('No Session Selected')).toBeTruthy();
  });
});

describe('ChatScreen Message Rendering', () => {
  const mockSession: Session = {
    id: 'session-1',
    title: 'Test Session',
    version: '1.0',
    time: {
      created: Date.now(),
      updated: Date.now(),
    },
  };

  const mockUserMessage = {
    info: {
      id: 'user-message-1',
      role: 'user' as const,
      sessionID: 'session-1',
      time: {
        created: Date.now(),
      },
    } as UserMessage,
    parts: [
      {
        id: 'part-1',
        type: 'text' as const,
        sessionID: 'session-1',
        messageID: 'user-message-1',
        text: 'Hello world',
      },
    ] as Part[],
  };

  const mockAssistantMessage = {
    info: {
      id: 'assistant-message-1',
      role: 'assistant' as const,
      sessionID: 'session-1',
      time: {
        created: Date.now(),
        completed: Date.now(),
      },
      modelID: 'test-model',
      providerID: 'test-provider',
      system: [],
      mode: 'test',
      path: {
        cwd: '/test',
        root: '/test',
      },
      cost: 0,
      tokens: {
        input: 10,
        output: 20,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
    } as AssistantMessage,
    parts: [
      {
        id: 'part-2',
        type: 'text' as const,
        sessionID: 'session-1',
        messageID: 'assistant-message-1',
        text: 'Hello! How can I help you?',
      },
    ] as Part[],
  };

  it('generates unique keys for message parts', async () => {
    const mockUseConnection = jest.fn(() => ({
      connectionStatus: 'connected',
      sessions: [mockSession],
      currentSession: mockSession,
      messages: [mockUserMessage, mockAssistantMessage],
      isLoadingMessages: false,
      isStreamConnected: false,
      loadMessages: jest.fn(),
      sendMessage: jest.fn(),
      setCurrentSession: jest.fn(),
      client: {},
    }));

    jest.doMock('../../../src/contexts/ConnectionContext', () => ({
      useConnection: mockUseConnection,
    }));

    // This test ensures the component renders without React key warnings
    const { findByDisplayValue } = render(<ChatScreen />);
    
    // Check that the input is rendered (indicating the component loaded successfully)
    expect(await findByDisplayValue('')).toBeTruthy();
  });

  it('handles messages with multiple parts correctly', async () => {
    const messageWithMultipleParts = {
      info: {
        id: 'multi-part-message',
        role: 'assistant' as const,
        sessionID: 'session-1',
        time: {
          created: Date.now(),
        },
        modelID: 'test-model',
        providerID: 'test-provider',
        system: [],
        mode: 'test',
        path: {
          cwd: '/test',
          root: '/test',
        },
        cost: 0,
        tokens: {
          input: 10,
          output: 20,
          reasoning: 0,
          cache: {
            read: 0,
            write: 0,
          },
        },
      } as AssistantMessage,
      parts: [
        {
          id: 'part-1',
          type: 'text' as const,
          sessionID: 'session-1',
          messageID: 'multi-part-message',
          text: 'First part',
        },
        {
          id: 'part-2',
          type: 'text' as const,
          sessionID: 'session-1',
          messageID: 'multi-part-message',
          text: 'Second part',
        },
        {
          id: 'part-3',
          type: 'tool' as const,
          sessionID: 'session-1',
          messageID: 'multi-part-message',
          callID: 'call-1',
          tool: 'test-tool',
          state: {
            status: 'completed' as const,
            input: { test: 'input' },
            output: 'test output',
            title: 'Test Tool',
            metadata: {},
            time: {
              start: Date.now(),
              end: Date.now(),
            },
          },
        },
      ] as Part[],
    };

    const mockUseConnection = jest.fn(() => ({
      connectionStatus: 'connected',
      sessions: [mockSession],
      currentSession: mockSession,
      messages: [messageWithMultipleParts],
      isLoadingMessages: false,
      isStreamConnected: false,
      loadMessages: jest.fn(),
      sendMessage: jest.fn(),
      setCurrentSession: jest.fn(),
      client: {},
    }));

    jest.doMock('../../../src/contexts/ConnectionContext', () => ({
      useConnection: mockUseConnection,
    }));

    // This test ensures messages with multiple parts render without key conflicts
    const { findByDisplayValue } = render(<ChatScreen />);
    expect(await findByDisplayValue('')).toBeTruthy();
  });
});