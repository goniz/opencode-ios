import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ToolPart } from '../../../../src/components/chat/parts/ToolPart';
import type { ToolPart as ToolPartType } from '../../../../src/api/types.gen';
import type { ExtendedPart } from '../../../../src/components/chat/parts/MessagePart';

describe('ToolPart', () => {
  it('renders tool state indicator when originalPart is provided with state', () => {
    // Simulated converted part (what MessageContent creates)
    const convertedPart: ExtendedPart = {
      type: 'tool',
      tool: 'bash',
      result: 'Command completed',
    };

    // Original API part with state (what we want to preserve)
    const originalPart: ToolPartType = {
      id: 'tool-1',
      sessionID: 'session-1',
      messageID: 'msg-1',
      type: 'tool',
      tool: 'bash',
      callID: 'call-1',
      state: {
        status: 'completed',
        input: { command: 'ls -la', description: 'List files' },
        output: 'file1.txt\nfile2.txt',
        title: 'List files',
        metadata: {},
        time: { start: 1000, end: 2000 },
      },
    };

    render(
      <ToolPart 
        part={convertedPart} 
        originalPart={originalPart}
        isLast={false}
        messageRole="assistant"
      />
    );

    // Should display the tool state (completed)
    expect(screen.getByText('List files')).toBeTruthy();
  });

  it('renders tool without state indicator when no originalPart provided', () => {
    const convertedPart: ExtendedPart = {
      type: 'tool',
      tool: 'bash',
      result: 'Command completed',
    };

    render(
      <ToolPart 
        part={convertedPart} 
        isLast={false}
        messageRole="assistant"
      />
    );

    // Should not crash and render the tool name
    expect(screen.getByText('bash')).toBeTruthy();
  });

  it('renders running state correctly', () => {
    const convertedPart: ExtendedPart = {
      type: 'tool',
      tool: 'read',
    };

    const originalPart: ToolPartType = {
      id: 'tool-2',
      sessionID: 'session-1',
      messageID: 'msg-1',
      type: 'tool',
      tool: 'read',
      callID: 'call-2',
      state: {
        status: 'running',
        input: { filePath: '/path/to/file.txt' },
        title: 'Reading file...',
        time: { start: Date.now() - 1000 },
      },
    };

    render(
      <ToolPart 
        part={convertedPart} 
        originalPart={originalPart}
        isLast={false}
        messageRole="assistant"
      />
    );

    expect(screen.getByText('Reading file...')).toBeTruthy();
  });
});