import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GitHubMarkdownPreview } from '../../../src/integrations/github/GitHubMarkdownPreview';

describe('GitHubMarkdownPreview', () => {
  const mockProps = {
    visible: true,
    parts: [
      {
        title: 'Main Issue Content',
        name: 'owner-repo-issue-42.md',
        content: '# Test Issue (owner/repo #42)\nState: open\n\nThis is a test issue body'
      }
    ],
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render markdown preview when visible', () => {
    render(<GitHubMarkdownPreview {...mockProps} />);
    
    expect(screen.getByText('Markdown Preview')).toBeTruthy();
    expect(screen.getByText('Main Issue Content')).toBeTruthy();
    expect(screen.getByText('# Test Issue (owner/repo #42)\nState: open\n\nThis is a test issue body')).toBeTruthy();
  });

  it('should call onClose when close button is pressed', () => {
    render(<GitHubMarkdownPreview {...mockProps} />);
    
    const closeButton = screen.getByText('close');
    fireEvent.press(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should not render when not visible', () => {
    render(<GitHubMarkdownPreview {...mockProps} visible={false} />);
    
    expect(screen.queryByText('Markdown Preview')).toBeNull();
  });

  it('should display info text about raw markdown', () => {
    render(<GitHubMarkdownPreview {...mockProps} />);
    
    expect(screen.getByText('These are the raw markdown files that will be attached to your message')).toBeTruthy();
  });
});