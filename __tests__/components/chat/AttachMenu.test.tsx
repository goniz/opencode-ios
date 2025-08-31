// This file tests the handleGithubAttachFile function in AttachMenu

// Mock the GitHubPicker component
jest.mock('../../../src/integrations/github/GitHubPicker', () => {
  return {
    GitHubPicker: jest.fn(() => null)
  };
});

describe('AttachMenu GitHub attachment flow', () => {
  it('should handle multiple file parts from GitHub picker', async () => {
    // Import the component directly to access the internals
    const { AttachMenu } = require('../../../src/components/chat/AttachMenu');
    
    // Create mock for onFileAttached callback
    const mockOnFileAttached = jest.fn();
    
    // Create an instance
    const attachMenu = new AttachMenu({
      onFileAttached: mockOnFileAttached
    });
    
    // Set up test data - simulating file parts from GitHub
    const testParts = [
      { 
        type: 'file', 
        mimeType: 'text/plain', 
        name: 'test-repo-issue-123.md',
        content: 'Main issue content',
        metadata: { github: { kind: 'issue' } }
      },
      { 
        type: 'file', 
        mimeType: 'text/plain', 
        name: 'test-repo-issue-123-comments.md',
        content: 'Comments content',
        metadata: { github: { kind: 'issue-comments' } }
      }
    ];
    
    // Get handleGithubAttachFile directly from the prototype
    const handleGithubAttachFile = AttachMenu.prototype.handleGithubAttachFile;
    
    // Call the function directly with the test parts
    handleGithubAttachFile.call(attachMenu, testParts);
    
    // Verify onFileAttached was called twice with the correct parts
    expect(mockOnFileAttached).toHaveBeenCalledTimes(2);
    
    // Check first call (main part)
    expect(mockOnFileAttached.mock.calls[0][0]).toMatchObject({
      type: 'file',
      name: 'test-repo-issue-123.md',
      metadata: { github: { kind: 'issue' } }
    });
    
    // Check second call (comments part)
    expect(mockOnFileAttached.mock.calls[1][0]).toMatchObject({
      type: 'file',
      name: 'test-repo-issue-123-comments.md',
      metadata: { github: { kind: 'issue-comments' } }
    });
  });
});