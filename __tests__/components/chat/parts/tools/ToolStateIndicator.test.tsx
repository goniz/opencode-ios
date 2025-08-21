import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ToolStateIndicator } from '../../../../../src/components/chat/parts/tools/ToolStateIndicator';
import type { ToolState } from '../../../../../src/api/types.gen';

describe('ToolStateIndicator', () => {
  it('renders pending state correctly', () => {
    const pendingState: ToolState = {
      status: 'pending',
    };

    render(<ToolStateIndicator state={pendingState} />);
    expect(screen.getByText('QUEUED')).toBeTruthy();
  });

  it('renders running state correctly', () => {
    const runningState: ToolState = {
      status: 'running',
      time: { start: Date.now() - 1000 },
      title: 'Reading file...',
    };

    render(<ToolStateIndicator state={runningState} />);
    expect(screen.getByText('RUNNING')).toBeTruthy();
    expect(screen.getByText('Reading file...')).toBeTruthy();
  });

  it('renders completed state correctly', () => {
    const completedState: ToolState = {
      status: 'completed',
      input: { command: 'ls' },
      output: 'file1.txt\nfile2.txt',
      title: 'List files',
      metadata: {},
      time: { start: Date.now() - 2000, end: Date.now() - 1000 },
    };

    render(<ToolStateIndicator state={completedState} />);
    expect(screen.getByText('DONE')).toBeTruthy();
    expect(screen.getByText('List files')).toBeTruthy();
  });

  it('renders error state correctly', () => {
    const errorState: ToolState = {
      status: 'error',
      input: { command: 'invalid-command' },
      error: 'Command not found',
      time: { start: Date.now() - 2000, end: Date.now() - 1000 },
    };

    render(<ToolStateIndicator state={errorState} />);
    expect(screen.getByText('ERROR')).toBeTruthy();
  });

  it('renders running state without title', () => {
    const runningState: ToolState = {
      status: 'running',
      time: { start: Date.now() - 1000 },
    };

    render(<ToolStateIndicator state={runningState} />);
    expect(screen.getByText('RUNNING')).toBeTruthy();
  });
});