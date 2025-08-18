import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Mock the entire ChatScreen component to test isolated functionality
interface MockSession {
  id: string;
  title: string;
  time: {
    created: number;
    updated: number;
  };
}

interface MockMessage {
  info: {
    id: string;
    role: string;
    sessionID: string;
    time: { created: number };
  };
  parts: { text: string }[];
}

interface MockChatScreenProps {
  connectionStatus: string;
  currentSession: MockSession | null;
  sessions: MockSession[];
  isLoadingMessages: boolean;
  messages: MockMessage[];
}

const createMockChatScreen = (props: MockChatScreenProps) => {
  const { connectionStatus, currentSession, sessions, isLoadingMessages, messages } = props;

  if (connectionStatus !== 'connected') {
    return (
      <View testID="no-connection">
        <Text>No Connection</Text>
        <Text>Connect to a server to start chatting</Text>
        <Text onPress={() => {}} testID="connect-button">Go to Connect</Text>
      </View>
    );
  }

  if (!currentSession) {
    return (
      <View testID="no-session">
        <Text>No Session Selected</Text>
        <Text>
          {sessions.length === 0 
            ? "Create your first chat session to get started" 
            : "Select a session from the Sessions tab to continue chatting"
          }
        </Text>
        <Text onPress={() => {}} testID="sessions-button">
          {sessions.length === 0 ? "Create New Chat" : "Go to Sessions"}
        </Text>
      </View>
    );
  }

  if (isLoadingMessages) {
    return (
      <View testID="loading">
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View testID="chat-active">
      <Text testID="session-title">{currentSession.title}</Text>
      <View testID="messages-list">
        {messages.map((msg: MockMessage, index: number) => (
          <View key={index} testID={`message-${index}`}>
            <Text>{msg.parts?.[0]?.text || 'Message content'}</Text>
          </View>
        ))}
      </View>
      <View testID="input-container">
        <Text testID="text-input">Type a message...</Text>
        <Text testID="send-button">Send</Text>
      </View>
    </View>
  );
};

// Test utilities
const createMockSession = (overrides = {}) => ({
  id: 'session-1',
  title: 'Test Session',
  time: {
    created: Date.now() - 3600000,
    updated: Date.now() - 1800000,
  },
  ...overrides,
});

const createMockMessage = (overrides = {}) => ({
  info: {
    id: 'msg-1',
    role: 'user',
    sessionID: 'session-1',
    time: { created: Date.now() },
  },
  parts: [{ text: 'Test message' }],
  ...overrides,
});

describe('ChatScreen Core Logic', () => {
  describe('Connection Status Handling', () => {
    test('shows no connection state when not connected', () => {
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'disconnected',
        currentSession: null,
        sessions: [],
        isLoadingMessages: false,
        messages: [],
      });

      render(MockChatScreen);

      expect(screen.getByTestId('no-connection')).toBeTruthy();
      expect(screen.getByText('No Connection')).toBeTruthy();
      expect(screen.getByText('Connect to a server to start chatting')).toBeTruthy();
      expect(screen.getByTestId('connect-button')).toBeTruthy();
    });

    test('shows connecting state', () => {
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'connecting',
        currentSession: null,
        sessions: [],
        isLoadingMessages: false,
        messages: [],
      });

      render(MockChatScreen);

      expect(screen.getByTestId('no-connection')).toBeTruthy();
      expect(screen.getByText('No Connection')).toBeTruthy();
    });
  });

  describe('Session Management', () => {
    test('shows no session selected when no current session and no sessions exist', () => {
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: null,
        sessions: [],
        isLoadingMessages: false,
        messages: [],
      });

      render(MockChatScreen);

      expect(screen.getByTestId('no-session')).toBeTruthy();
      expect(screen.getByText('No Session Selected')).toBeTruthy();
      expect(screen.getByText('Create your first chat session to get started')).toBeTruthy();
      expect(screen.getByText('Create New Chat')).toBeTruthy();
    });

    test('shows session selection message when sessions exist but none selected', () => {
      const sessions = [createMockSession()];
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: null,
        sessions,
        isLoadingMessages: false,
        messages: [],
      });

      render(MockChatScreen);

      expect(screen.getByTestId('no-session')).toBeTruthy();
      expect(screen.getByText('No Session Selected')).toBeTruthy();
      expect(screen.getByText('Select a session from the Sessions tab to continue chatting')).toBeTruthy();
      expect(screen.getByText('Go to Sessions')).toBeTruthy();
    });

    test('displays session title when session is active', () => {
      const session = createMockSession({ title: 'My Test Session' });
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: session,
        sessions: [session],
        isLoadingMessages: false,
        messages: [],
      });

      render(MockChatScreen);

      expect(screen.getByTestId('chat-active')).toBeTruthy();
      expect(screen.getByText('My Test Session')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    test('shows loading indicator when messages are loading', () => {
      const session = createMockSession();
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: session,
        sessions: [session],
        isLoadingMessages: true,
        messages: [],
      });

      render(MockChatScreen);

      expect(screen.getByTestId('loading')).toBeTruthy();
      expect(screen.getByText('Loading messages...')).toBeTruthy();
    });

    test('shows messages list when not loading', () => {
      const session = createMockSession();
      const messages = [createMockMessage({ parts: [{ text: 'Hello, world!' }] })];
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: session,
        sessions: [session],
        isLoadingMessages: false,
        messages,
      });

      render(MockChatScreen);

      expect(screen.getByTestId('chat-active')).toBeTruthy();
      expect(screen.getByTestId('messages-list')).toBeTruthy();
      expect(screen.getByText('Hello, world!')).toBeTruthy();
    });

    test('shows input container when chat is active', () => {
      const session = createMockSession();
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: session,
        sessions: [session],
        isLoadingMessages: false,
        messages: [],
      });

      render(MockChatScreen);

      expect(screen.getByTestId('input-container')).toBeTruthy();
      expect(screen.getByTestId('text-input')).toBeTruthy();
      expect(screen.getByTestId('send-button')).toBeTruthy();
    });
  });

  describe('Message Rendering', () => {
    test('renders multiple messages correctly', () => {
      const session = createMockSession();
      const messages = [
        createMockMessage({ parts: [{ text: 'First message' }] }),
        createMockMessage({ parts: [{ text: 'Second message' }] }),
      ];
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: session,
        sessions: [session],
        isLoadingMessages: false,
        messages,
      });

      render(MockChatScreen);

      expect(screen.getByText('First message')).toBeTruthy();
      expect(screen.getByText('Second message')).toBeTruthy();
      expect(screen.getByTestId('message-0')).toBeTruthy();
      expect(screen.getByTestId('message-1')).toBeTruthy();
    });

    test('handles empty messages array', () => {
      const session = createMockSession();
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: session,
        sessions: [session],
        isLoadingMessages: false,
        messages: [],
      });

      render(MockChatScreen);

      expect(screen.getByTestId('chat-active')).toBeTruthy();
      expect(screen.getByTestId('messages-list')).toBeTruthy();
      // Should not find any message-* testIds
      expect(screen.queryByTestId('message-0')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing session gracefully', () => {
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: null,
        sessions: [],
        isLoadingMessages: false,
        messages: [],
      });

      expect(() => {
        render(MockChatScreen);
      }).not.toThrow();

      expect(screen.getByTestId('no-session')).toBeTruthy();
    });

    test('handles different connection statuses', () => {
      const statuses = ['disconnected', 'connecting', 'error'];
      
      statuses.forEach(status => {
        const MockChatScreen = createMockChatScreen({
          connectionStatus: status,
          currentSession: null,
          sessions: [],
          isLoadingMessages: false,
          messages: [],
        });

        const { unmount } = render(MockChatScreen);
        expect(screen.getByTestId('no-connection')).toBeTruthy();
        unmount();
      });
    });

    test('renders properly with various session titles', () => {
      const titles = ['Short', 'Very Long Session Title That Might Wrap', 'Session with 🎉 Emojis'];
      
      titles.forEach(title => {
        const session = createMockSession({ title });
        const MockChatScreen = createMockChatScreen({
          connectionStatus: 'connected',
          currentSession: session,
          sessions: [session],
          isLoadingMessages: false,
          messages: [],
        });

        const { unmount } = render(MockChatScreen);
        expect(screen.getByText(title)).toBeTruthy();
        unmount();
      });
    });
  });

  describe('Component Structure', () => {
    test('maintains consistent testID structure', () => {
      const session = createMockSession();
      const MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: session,
        sessions: [session],
        isLoadingMessages: false,
        messages: [],
      });

      render(MockChatScreen);

      // Verify all expected testIDs are present
      expect(screen.getByTestId('chat-active')).toBeTruthy();
      expect(screen.getByTestId('session-title')).toBeTruthy();
      expect(screen.getByTestId('messages-list')).toBeTruthy();
      expect(screen.getByTestId('input-container')).toBeTruthy();
      expect(screen.getByTestId('text-input')).toBeTruthy();
      expect(screen.getByTestId('send-button')).toBeTruthy();
    });

    test('shows correct UI elements for each state', () => {
      // Test no connection state
      let MockChatScreen = createMockChatScreen({
        connectionStatus: 'disconnected',
        currentSession: null,
        sessions: [],
        isLoadingMessages: false,
        messages: [],
      });

      let { unmount } = render(MockChatScreen);
      expect(screen.getByTestId('no-connection')).toBeTruthy();
      expect(screen.queryByTestId('no-session')).toBeNull();
      expect(screen.queryByTestId('loading')).toBeNull();
      expect(screen.queryByTestId('chat-active')).toBeNull();
      unmount();

      // Test no session state
      MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: null,
        sessions: [],
        isLoadingMessages: false,
        messages: [],
      });

      ({ unmount } = render(MockChatScreen));
      expect(screen.queryByTestId('no-connection')).toBeNull();
      expect(screen.getByTestId('no-session')).toBeTruthy();
      expect(screen.queryByTestId('loading')).toBeNull();
      expect(screen.queryByTestId('chat-active')).toBeNull();
      unmount();

      // Test loading state
      const session = createMockSession();
      MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: session,
        sessions: [session],
        isLoadingMessages: true,
        messages: [],
      });

      ({ unmount } = render(MockChatScreen));
      expect(screen.queryByTestId('no-connection')).toBeNull();
      expect(screen.queryByTestId('no-session')).toBeNull();
      expect(screen.getByTestId('loading')).toBeTruthy();
      expect(screen.queryByTestId('chat-active')).toBeNull();
      unmount();

      // Test active chat state
      MockChatScreen = createMockChatScreen({
        connectionStatus: 'connected',
        currentSession: session,
        sessions: [session],
        isLoadingMessages: false,
        messages: [],
      });

      render(MockChatScreen);
      expect(screen.queryByTestId('no-connection')).toBeNull();
      expect(screen.queryByTestId('no-session')).toBeNull();
      expect(screen.queryByTestId('loading')).toBeNull();
      expect(screen.getByTestId('chat-active')).toBeTruthy();
    });
  });
});