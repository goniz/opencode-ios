import { githubIssueToMessagePart } from '../../../../src/components/chat/adapters/githubToMessagePart';
import { GHIssue } from '../../../../src/integrations/github/GitHubTypes';

describe('GitHub multi-part attachment flow', () => {
  const mockIssue: GHIssue = {
    kind: 'issue',
    id: 123,
    number: 42,
    title: 'Test Issue',
    state: 'open',
    body: 'This is a test issue body',
    repo: 'owner/repo',
    url: 'https://github.com/owner/repo/issues/42',
    apiUrl: 'https://api.github.com/repos/owner/repo/issues/42',
    updatedAt: '2024-01-01T00:00:00Z',
    commentCount: 2,
    comments: [
      {
        id: 1,
        body: 'First comment',
        createdAt: '2024-01-01T01:00:00Z',
        author: 'user1',
        url: 'https://github.com/owner/repo/issues/42#issuecomment-1'
      },
      {
        id: 2,
        body: 'Second comment',
        createdAt: '2024-01-01T02:00:00Z',
        author: 'user2',
        url: 'https://github.com/owner/repo/issues/42#issuecomment-2'
      }
    ]
  };

  it('should generate both main and comments parts when comments are included', () => {
    // Call with includeComments=true
    const parts = githubIssueToMessagePart(mockIssue, true);
    
    // Verify we get 2 parts
    expect(parts.length).toBe(2);
    
    // Verify first part is main content
    expect(parts[0].metadata?.github?.kind).toBe('issue');
    expect(parts[0].name).toBe('owner-repo-issue-42.md');
    expect(parts[0].content).toContain('# Test Issue (owner/repo #42)');
    
    // Verify second part is comments
    expect(parts[1].metadata?.github?.kind).toBe('issue-comments');
    expect(parts[1].name).toBe('owner-repo-issue-42-comments.md');
    expect(parts[1].content).toContain('# Comments for Test Issue');
    expect(parts[1].content).toContain('Comment by user1');
    expect(parts[1].content).toContain('First comment');
    expect(parts[1].content).toContain('Comment by user2');
    expect(parts[1].content).toContain('Second comment');
  });

  it('should generate only main part when comments are not included', () => {
    // Call with includeComments=false
    const parts = githubIssueToMessagePart(mockIssue, false);
    
    // Verify we get only 1 part
    expect(parts.length).toBe(1);
    
    // Verify it's the main content
    expect(parts[0].metadata?.github?.kind).toBe('issue');
    expect(parts[0].name).toBe('owner-repo-issue-42.md');
    expect(parts[0].content).toContain('# Test Issue (owner/repo #42)');
    expect(parts[0].content).not.toContain('Comments for Test Issue');
  });

  it('should handle empty comments array', () => {
    // Create a modified issue with empty comments array
    const issueWithEmptyComments = {
      ...mockIssue,
      comments: []
    };
    
    // Call with includeComments=true
    const parts = githubIssueToMessagePart(issueWithEmptyComments, true);
    
    // Verify we get only 1 part (no comments part)
    expect(parts.length).toBe(1);
    
    // Verify it's the main content
    expect(parts[0].metadata?.github?.kind).toBe('issue');
    expect(parts[0].name).toBe('owner-repo-issue-42.md');
  });
  
  it('should handle missing comments', () => {
    // Create a modified issue with null comments
    const issueWithNullComments = {
      ...mockIssue,
      comments: undefined
    };
    
    // Call with includeComments=true
    const parts = githubIssueToMessagePart(issueWithNullComments, true);
    
    // Verify we get only 1 part (no comments part)
    expect(parts.length).toBe(1);
    
    // Verify it's the main content
    expect(parts[0].metadata?.github?.kind).toBe('issue');
    expect(parts[0].name).toBe('owner-repo-issue-42.md');
  });
});