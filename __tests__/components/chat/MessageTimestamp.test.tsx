import React from 'react';
import { render } from '@testing-library/react-native';
import { MessageTimestamp } from '../../../src/components/chat/MessageTimestamp';

describe('MessageTimestamp', () => {
  const testTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds

  it('renders regular timestamp', () => {
    const { getByText } = render(
      <MessageTimestamp timestamp={testTimestamp} />
    );
    
    // Should render some time text (exact format depends on current time)
    expect(getByText(/\d{1,2}:\d{2}\s*(AM|PM)/i)).toBeTruthy();
  });

  it('renders compact timestamp', () => {
    const { getByText } = render(
      <MessageTimestamp timestamp={testTimestamp} compact={true} />
    );
    
    // Should render some time text (exact format depends on current time)
    expect(getByText(/\d{1,2}:\d{2}\s*(AM|PM)/i)).toBeTruthy();
  });

  it('handles old timestamps with compact format', () => {
    // Timestamp from several months ago
    const oldTimestamp = Math.floor(new Date('2024-01-01').getTime() / 1000);
    
    const { getByText } = render(
      <MessageTimestamp timestamp={oldTimestamp} compact={true} />
    );
    
    // Should render month and day for old dates
    expect(getByText(/Jan\s*1/i)).toBeTruthy();
  });

  it('handles millisecond timestamps correctly', () => {
    // Test with millisecond timestamp (current standard)
    const millisecondTimestamp = Date.now();
    
    const { getByText } = render(
      <MessageTimestamp timestamp={millisecondTimestamp} compact={true} />
    );
    
    // Should render time for recent timestamp
    expect(getByText(/\d{1,2}:\d{2}\s*(AM|PM)/i)).toBeTruthy();
  });
});