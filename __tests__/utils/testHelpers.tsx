import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import type { 
  Part, 
  AssistantMessage, 
  UserMessage, 
  TextPart,
  ToolPart,
  ReasoningPart,
  FilePart,
  StepStartPart,
  AgentPart,
  ToolStateCompleted,
  ToolStateError
} from '../../src/api/types.gen';

// Mock providers and contexts
export const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

// Mock ConnectionContext provider with default values
export const createMockConnectionContext = (overrides = {}) => ({
  connectionStatus: 'connected' as const,
  sessions: [],
  currentSession: null,
  messages: [],
  isLoadingMessages: false,
  isStreamConnected: false,
  loadMessages: jest.fn(),
  sendMessage: jest.fn(),
  setCurrentSession: jest.fn(),
  client: {},
  ...overrides,
});

// Custom render with providers
export const renderWithProviders = (
  component: React.ReactElement,
  options: RenderOptions & { connectionContext?: Record<string, unknown> } = {}
) => {
  const { connectionContext, ...renderOptions } = options;
  
  // Mock useConnection hook
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  jest.spyOn(require('../../src/contexts/ConnectionContext'), 'useConnection')
    .mockReturnValue(createMockConnectionContext(connectionContext));

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MockThemeProvider>{children}</MockThemeProvider>
  );

  return render(component, { wrapper: Wrapper, ...renderOptions });
};

// Mock data factories
export const createMockTextPart = (overrides: Partial<TextPart> = {}): TextPart => ({
  id: 'text-part-1',
  sessionID: 'session-1',
  messageID: 'message-1',
  type: 'text',
  text: 'This is a test message content',
  ...overrides,
});

export const createMockToolPart = (overrides: Partial<ToolPart> = {}): ToolPart => ({
  id: 'tool-part-1',
  sessionID: 'session-1',
  messageID: 'message-1',
  type: 'tool',
  callID: 'call-1',
  tool: 'test_tool',
  state: {
    status: 'completed',
    input: { test: 'input' },
    output: 'Tool execution successful',
    title: 'Test Tool',
    metadata: {},
    time: {
      start: Date.now(),
      end: Date.now() + 1000,
    },
  } as ToolStateCompleted,
  ...overrides,
});

export const createMockToolPartWithError = (overrides: Partial<ToolPart> = {}): ToolPart => ({
  id: 'tool-part-error',
  sessionID: 'session-1',
  messageID: 'message-1',
  type: 'tool',
  callID: 'call-error',
  tool: 'failing_tool',
  state: {
    status: 'error',
    input: { test: 'input' },
    error: 'Tool execution failed',
    title: 'Failing Tool',
    metadata: {},
    time: {
      start: Date.now(),
      end: Date.now() + 1000,
    },
  } as ToolStateError,
  ...overrides,
});

export const createMockReasoningPart = (overrides: Partial<ReasoningPart> = {}): ReasoningPart => ({
  id: 'reasoning-part-1',
  sessionID: 'session-1',
  messageID: 'message-1',
  type: 'reasoning',
  text: 'Let me think about this problem...',
  time: {
    start: Date.now(),
    end: Date.now() + 1000,
  },
  ...overrides,
});

export const createMockFilePart = (overrides: Partial<FilePart> = {}): FilePart => ({
  id: 'file-part-1',
  sessionID: 'session-1',
  messageID: 'message-1',
  type: 'file',
  mime: 'text/plain',
  filename: 'test.txt',
  url: 'file://test.txt',
  ...overrides,
});

export const createMockStepPart = (overrides: Partial<StepStartPart> = {}): StepStartPart => ({
  id: 'step-part-1',
  sessionID: 'session-1',
  messageID: 'message-1',
  type: 'step-start',
  ...overrides,
});

export const createMockAgentPart = (overrides: Partial<AgentPart> = {}): AgentPart => ({
  id: 'agent-part-1',
  sessionID: 'session-1',
  messageID: 'message-1',
  type: 'agent',
  name: 'Test Agent',
  ...overrides,
});

// Mock API responses
export const createMockUserMessage = (overrides: Partial<UserMessage> = {}): UserMessage => ({
  id: 'user-msg-1',
  sessionID: 'session-1',
  role: 'user',
  time: {
    created: Date.now(),
  },
  ...overrides,
});

export const createMockAssistantMessage = (overrides: Partial<AssistantMessage> = {}): AssistantMessage => ({
  id: 'assistant-msg-1',
  sessionID: 'session-1',
  role: 'assistant',
  providerID: 'openai',
  modelID: 'gpt-4',
  system: [],
  mode: 'default',
  path: {
    cwd: '/test',
    root: '/test',
  },
  cost: 0.001,
  tokens: {
    input: 100,
    output: 50,
    reasoning: 0,
    cache: {
      read: 0,
      write: 0,
    },
  },
  time: {
    created: Date.now(),
    completed: Date.now() + 1000,
  },
  ...overrides,
});

export const createMockMessageWithParts = (
  messageOverrides: Partial<UserMessage> = {},
  parts: Part[] = [createMockTextPart()]
) => ({
  info: createMockUserMessage(messageOverrides),
  parts,
});

export const createMockAssistantMessageWithParts = (
  messageOverrides: Partial<AssistantMessage> = {},
  parts: Part[] = [createMockTextPart()]
) => ({
  info: createMockAssistantMessage(messageOverrides),
  parts,
});

export const createMockSession = (overrides = {}) => ({
  id: 'session-1',
  title: 'Test Session',
  time: {
    created: Date.now() - 3600000, // 1 hour ago
    updated: Date.now() - 1800000, // 30 minutes ago
  },
  ...overrides,
});

export const createMockProvider = (overrides = {}) => ({
  id: 'openai',
  name: 'OpenAI',
  models: {
    'gpt-4': {
      id: 'gpt-4',
      name: 'GPT-4',
    },
    'gpt-3.5-turbo': {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
    },
  },
  ...overrides,
});

// Test utilities
export const waitForAnimation = () => new Promise(resolve => setTimeout(resolve, 100));