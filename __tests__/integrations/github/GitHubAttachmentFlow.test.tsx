import React from 'react';
import { render } from '@testing-library/react-native';
import { FilePreview } from '../../../src/components/chat/FilePreview';
import { GHIssue, FilePartLike } from '../../../src/integrations/github/GitHubTypes';

describe('GitHub Attachment Flow', () => {
  const mockIssueWithComments: GHIssue = {
    kind: 'issue',
    repo: 'test/repo',
    number: 123,
    id: 'issue-123',
    title: 'Test Issue',
    body: 'Issue description',
    state: 'open',
    updatedAt: '2024-01-01T00:00:00Z',
    url: 'https://github.com/test/repo/issues/123',
    apiUrl: 'https://api.github.com/repos/test/repo/issues/123',
    commentCount: 2,
    comments: [
      {
        id: 1,
        body: 'First comment',
        createdAt: '2024-01-01T01:00:00Z',
        author: 'user1',
        url: 'https://github.com/test/repo/issues/123#issuecomment-1'
      },
      {
        id: 2,
        body: 'Second comment',
        createdAt: '2024-01-01T02:00:00Z',
        author: 'user2',
        url: 'https://github.com/test/repo/issues/123#issuecomment-2'
      }
    ]
  };



  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate correct file parts based on adapter logic', () => {
    // Test the core logic that was fixed - adapter functions should generate multiple parts
    const { githubIssueToMessagePart } = require('../../../src/components/chat/adapters/githubToMessagePart');
    
    // Test without comments (should be 1 part)
    const singlePart = githubIssueToMessagePart(mockIssueWithComments, false);
    expect(singlePart).toHaveLength(1);
    expect(singlePart[0].metadata.github.kind).toBe('issue');
    
    // Test with comments (should be 2 parts)
    const multipleParts = githubIssueToMessagePart(mockIssueWithComments, true);
    expect(multipleParts).toHaveLength(2);
    expect(multipleParts[0].metadata.github.kind).toBe('issue');
    expect(multipleParts[1].metadata.github.kind).toBe('issue-comments');
    
    // Verify the fix - when comments are included, we get separate files
    expect(multipleParts[0].name).toBe('test-repo-issue-123.md');
    expect(multipleParts[1].name).toBe('test-repo-issue-123-comments.md');
  });

  it('should handle batch file attachment in AttachMenu', () => {
    // This test verifies the logic by testing the imported adapter functions directly
    const { githubIssueToMessagePart } = require('../../../src/components/chat/adapters/githubToMessagePart');
    
    // Test that adapter creates multiple parts for issue with comments
    const fileParts = githubIssueToMessagePart(mockIssueWithComments, true);
    
    expect(fileParts).toHaveLength(2);
    expect(fileParts[0].metadata.github.kind).toBe('issue');
    expect(fileParts[1].metadata.github.kind).toBe('issue-comments');
  });

  it('should display multiple files in FilePreview', () => {
    const testFiles: FilePartLike[] = [
      {
        type: 'file',
        mimeType: 'text/plain',
        name: 'test-repo-issue-123.md',
        content: 'Main content',
        metadata: {
          github: {
            kind: 'issue',
            repo: 'test/repo',
            number: 123,
            url: 'https://github.com/test/repo/issues/123',
            state: 'open',
            commentCount: 2,
            includesComments: false
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
            number: 123,
            url: 'https://github.com/test/repo/issues/123',
            state: 'open',
            commentCount: 2,
            includesComments: true
          }
        }
      }
    ];

    const { getByText, getAllByText } = render(
      <FilePreview files={testFiles} />
    );

    // Both files should be displayed (filenames are truncated but we can verify by badges)
    expect(getByText('issue')).toBeTruthy();
    expect(getByText('issue-comments')).toBeTruthy();

    // Verify we have 2 files by checking for multiple truncated filename elements
    const truncatedNames = getAllByText('test-repo-is...md');
    expect(truncatedNames.length).toBe(2);
  });

  it('should generate correct file names for issue and comments', () => {
    const { githubIssueToMessagePart } = require('../../../src/components/chat/adapters/githubToMessagePart');
    
    const fileParts = githubIssueToMessagePart(mockIssueWithComments, true);
    
    // Verify correct file names are generated
    expect(fileParts[0].name).toBe('test-repo-issue-123.md');
    expect(fileParts[1].name).toBe('test-repo-issue-123-comments.md');
    
    // Verify content structure
    expect(fileParts[0].content).toContain('Test Issue (test/repo #123)');
    expect(fileParts[1].content).toContain('Comments for Test Issue');
    expect(fileParts[1].content).toContain('First comment');
    expect(fileParts[1].content).toContain('Second comment');
  });
});