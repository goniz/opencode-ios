import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatErrorBanner } from '../../../src/components/chat/ChatErrorBanner';

describe('ChatErrorBanner', () => {
  it('should render null when no error', () => {
    const { queryByTestId } = render(
      <ChatErrorBanner error={null} isDismissed={false} onDismiss={jest.fn()} />
    );
    
    expect(queryByTestId('chat-error-banner')).toBeNull();
  });

  it('should render null when error is dismissed', () => {
    const { queryByTestId } = render(
      <ChatErrorBanner error="Test error" isDismissed={true} onDismiss={jest.fn()} />
    );
    
    expect(queryByTestId('chat-error-banner')).toBeNull();
  });

  it('should render error message when there is an error and not dismissed', () => {
    const mockOnDismiss = jest.fn();
    const { getByText, getByTestId } = render(
      <ChatErrorBanner error="Test error" isDismissed={false} onDismiss={mockOnDismiss} />
    );
    
    expect(getByText('Connection Error')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
    
    const dismissButton = getByTestId('dismiss-button');
    fireEvent.press(dismissButton);
    
    expect(mockOnDismiss).toHaveBeenCalled();
  });
});