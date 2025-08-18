import React from 'react';
import { render } from '@testing-library/react-native';
import { TextContent } from '../../../../src/components/chat/content/TextContent';

// Mock react-native-syntax-highlighter
jest.mock('react-native-syntax-highlighter', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => children,
}));

// Mock the markdown display
jest.mock('react-native-markdown-display', () => {
  return ({ children }: { children: string }) => children;
});

describe('TextContent', () => {
  it('renders without crashing with valid content', () => {
    expect(() => {
      render(<TextContent content="Hello world" />);
    }).not.toThrow();
  });

  it('handles undefined content gracefully', () => {
    expect(() => {
      render(<TextContent content={undefined as any} />);
    }).not.toThrow();
  });

  it('handles null content gracefully', () => {
    expect(() => {
      render(<TextContent content={null as any} />);
    }).not.toThrow();
  });

  it('handles empty string content', () => {
    expect(() => {
      render(<TextContent content="" />);
    }).not.toThrow();
  });

  it('renders with different variants', () => {
    expect(() => {
      render(<TextContent content="test" variant="user" />);
      render(<TextContent content="test" variant="assistant" />);
      render(<TextContent content="test" variant="default" />);
    }).not.toThrow();
  });

  it('renders with markdown enabled', () => {
    expect(() => {
      render(<TextContent content="**bold text**" isMarkdown={true} />);
    }).not.toThrow();
  });
});