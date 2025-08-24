import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CommandSuggestions } from '../../../src/components/chat/CommandSuggestions';

describe('CommandSuggestions', () => {
  const mockCommands = [
    { 
      name: 'help', 
      description: 'Show help information', 
      template: '/help' 
    },
    { 
      name: 'clear', 
      description: 'Clear the chat', 
      agent: 'general',
      template: '/clear' 
    },
    { 
      name: 'test', 
      description: 'Test command', 
      model: 'test-model',
      template: '/test $ARGUMENTS' 
    }
  ];

  const mockOnSelectCommand = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible with commands', () => {
    const { getByText } = render(
      <CommandSuggestions
        suggestions={mockCommands}
        visible={true}
        onSelectCommand={mockOnSelectCommand}
        onClose={mockOnClose}
      />
    );

    // Check header
    expect(getByText('Select a command')).toBeTruthy();
    
    // Check all commands are rendered
    expect(getByText('/help')).toBeTruthy();
    expect(getByText('Show help information')).toBeTruthy();
    
    expect(getByText('/clear')).toBeTruthy();
    expect(getByText('Clear the chat')).toBeTruthy();
    expect(getByText('Agent: general')).toBeTruthy();
    
    expect(getByText('/test')).toBeTruthy();
    expect(getByText('Test command')).toBeTruthy();
    expect(getByText('Model: test-model')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <CommandSuggestions
        suggestions={mockCommands}
        visible={false}
        onSelectCommand={mockOnSelectCommand}
        onClose={mockOnClose}
      />
    );

    expect(queryByText('Select a command')).toBeNull();
  });

  it('does not render when no suggestions', () => {
    const { queryByText } = render(
      <CommandSuggestions
        suggestions={[]}
        visible={true}
        onSelectCommand={mockOnSelectCommand}
        onClose={mockOnClose}
      />
    );

    expect(queryByText('Select a command')).toBeNull();
  });

  it('calls onSelectCommand when a command is pressed', () => {
    const { getByText } = render(
      <CommandSuggestions
        suggestions={mockCommands}
        visible={true}
        onSelectCommand={mockOnSelectCommand}
        onClose={mockOnClose}
      />
    );

    const helpCommand = getByText('/help');
    fireEvent.press(helpCommand);

    expect(mockOnSelectCommand).toHaveBeenCalledWith('help');
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = render(
      <CommandSuggestions
        suggestions={mockCommands}
        visible={true}
        onSelectCommand={mockOnSelectCommand}
        onClose={mockOnClose}
      />
    );

    const closeButton = getByTestId('command-suggestions-close-button');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders command metadata correctly', () => {
    const commandsWithMetadata = [
      { 
        name: 'deploy', 
        description: 'Deploy application', 
        agent: 'deploy-agent',
        model: 'gpt-4',
        template: '/deploy $ARGUMENTS' 
      }
    ];

    const { getByText } = render(
      <CommandSuggestions
        suggestions={commandsWithMetadata}
        visible={true}
        onSelectCommand={mockOnSelectCommand}
        onClose={mockOnClose}
      />
    );

    expect(getByText('/deploy')).toBeTruthy();
    expect(getByText('Deploy application')).toBeTruthy();
    expect(getByText('Agent: deploy-agent')).toBeTruthy();
    expect(getByText('Model: gpt-4')).toBeTruthy();
  });
});