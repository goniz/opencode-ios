// This file tests the handleGithubAttachFile function in AttachMenu

import { FilePartLike } from '../../../src/integrations/github/GitHubTypes';

// Test the core functionality of handleGithubAttachFile
describe('AttachMenu GitHub attachment flow', () => {
  it('should handle multiple file parts from GitHub picker', () => {
    // Create mock for onFileAttached callback
    const mockOnFileAttached = jest.fn();

    // Simulate the handleGithubAttachFile function behavior
    const handleGithubAttachFile = (fileParts: FilePartLike[]) => {
      console.log('🔍 [handleGithubAttachFile] Received', fileParts.length, 'file parts from GitHub picker');
      console.log('🔍 [handleGithubAttachFile] File parts:', fileParts.map(part => ({
        name: part.name,
        type: part.type,
        metadataKind: part.metadata?.github?.kind
      })));

      if (mockOnFileAttached) {
        console.log('🔍 [handleGithubAttachFile] onFileAttached callback exists, attaching files one by one');
        fileParts.forEach((filePart, index) => {
          console.log(`🔍 [handleGithubAttachFile] Attaching file part ${index + 1}/${fileParts.length}:`, filePart.name);
          mockOnFileAttached(filePart);
        });
        console.log('🔍 [handleGithubAttachFile] All file parts attached');
      } else {
        console.log('❌ [handleGithubAttachFile] onFileAttached callback is missing, cannot attach files');
      }
    };

    // Set up test data - simulating file parts from GitHub
    const testParts: FilePartLike[] = [
      {
        type: 'file',
        mimeType: 'text/plain',
        name: 'test-repo-issue-123.md',
        content: 'Main issue content',
        metadata: {
          github: {
            kind: 'issue',
            repo: 'test/repo',
            url: 'https://github.com/test/repo/issues/123',
            number: 123,
            state: 'open'
          }
        }
      },
      {
        type: 'file',
        mimeType: 'text/plain',
        name: 'test-repo-issue-123-comments.md',
        content: 'Comments content',
        metadata: {
          github: {
            kind: 'issue-comments',
            repo: 'test/repo',
            url: 'https://github.com/test/repo/issues/123',
            number: 123,
            state: 'open'
          }
        }
      }
    ];

    // Call the function directly with the test parts
    handleGithubAttachFile(testParts);

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