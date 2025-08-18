import React from 'react';
import { render } from '@testing-library/react-native';
import { MessageContent } from '../../../src/components/chat/MessageContent';
import type { Part } from '../../../src/api/types.gen';

// Mock the dependencies
jest.mock('../../../src/components/chat/parts', () => {
  const mockReact = require('react');
  return {
    PartComponentSelector: ({ part, messageId, partIndex }: any) => {
      // Mock component that uses the props to verify they're passed correctly
      return mockReact.createElement('Text', { 
        testID: `part-selector-${messageId}-${partIndex}`,
        children: `${part.type}: ${part.content || 'no content'}`
      });
    }
  };
});

describe('MessageContent', () => {
  const mockTextPart: Part = {
    id: 'part-1',
    sessionID: 'session-1',
    messageID: 'message-1',
    type: 'text',
    text: 'Hello world',
  };

  it('renders without crashing', () => {
    const { getByTestId } = render(
      <MessageContent
        role="assistant"
        part={mockTextPart}
        messageId="message-1"
        partIndex={0}
      />
    );

    expect(getByTestId('part-selector-message-1-0')).toBeTruthy();
  });

  it('passes messageId and partIndex to PartComponentSelector', () => {
    const { getByTestId } = render(
      <MessageContent
        role="assistant"
        part={mockTextPart}
        messageId="unique-message-id"
        partIndex={5}
      />
    );

    expect(getByTestId('part-selector-unique-message-id-5')).toBeTruthy();
  });

  it('handles different part types correctly', () => {
    const toolPart: Part = {
      id: 'tool-part-1',
      sessionID: 'session-1',
      messageID: 'message-1',
      type: 'tool',
      callID: 'call-1',
      tool: 'bash',
      state: {
        status: 'completed',
        input: { command: 'ls' },
        output: 'file1.txt\nfile2.txt',
        title: 'List Files',
        metadata: {},
        time: {
          start: Date.now(),
          end: Date.now(),
        },
      },
    };

    const { getByTestId } = render(
      <MessageContent
        role="assistant"
        part={toolPart}
        messageId="tool-message"
        partIndex={1}
      />
    );

    expect(getByTestId('part-selector-tool-message-1')).toBeTruthy();
  });

  it('generates unique keys for multiple parts', () => {
    const parts = [
      {
        id: 'part-1',
        sessionID: 'session-1',
        messageID: 'message-1',
        type: 'text',
        text: 'First part',
      },
      {
        id: 'part-2',
        sessionID: 'session-1',
        messageID: 'message-1',
        type: 'text',
        text: 'Second part',
      },
    ] as Part[];

    const { getByTestId } = render(
      <>
        {parts.map((part, index) => (
          <MessageContent
            key={`message-1-part-${index}`}
            role="assistant"
            part={part}
            messageId="message-1"
            partIndex={index}
          />
        ))}
      </>
    );

    expect(getByTestId('part-selector-message-1-0')).toBeTruthy();
    expect(getByTestId('part-selector-message-1-1')).toBeTruthy();
  });
});