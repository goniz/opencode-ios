import { githubIssueToMessagePart, githubPullToMessagePart } from '../../../../src/components/chat/adapters/githubToMessagePart';
import { GHIssue, GHPull } from '../../../../src/integrations/github/GitHubTypes';

describe('githubToMessagePart', () => {
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

  const mockPR: GHPull = {
    kind: 'pull',
    id: 456,
    number: 24,
    title: 'Test Pull Request',
    state: 'open',
    body: 'This is a test PR body',
    repo: 'owner/repo',
    url: 'https://github.com/owner/repo/pull/24',
    apiUrl: 'https://api.github.com/repos/owner/repo/pulls/24',
    updatedAt: '2024-01-02T00:00:00Z',
    commentCount: 1,
    reviewCount: 2,
    comments: [
      {
        id: 3,
        body: 'PR comment',
        createdAt: '2024-01-02T01:00:00Z',
        author: 'reviewer1',
        url: 'https://github.com/owner/repo/pull/24#issuecomment-3'
      }
    ],
    reviews: [
      {
        id: 101,
        state: 'APPROVED',
        body: 'Looks good to me!',
        author: 'reviewer1',
        submittedAt: '2024-01-02T03:00:00Z',
        url: 'https://github.com/owner/repo/pull/24#pullrequestreview-101',
        comments: [
          {
            id: 201,
            body: 'Minor suggestion here',
            path: 'src/file.js',
            line: 10,
            author: 'reviewer1',
            url: 'https://github.com/owner/repo/pull/24#discussion_r201'
          }
        ]
      }
    ]
  };

  describe('githubIssueToMessagePart', () => {
    it('should generate markdown without comments', () => {
      const result = githubIssueToMessagePart(mockIssue, false);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('file');
      expect(result[0].mimeType).toBe('text/plain');
      expect(result[0].name).toBe('owner-repo-issue-42.md');
      expect(result[0].content).toContain('# Test Issue (owner/repo #42)');
      expect(result[0].content).toContain('State: open');
      expect(result[0].content).toContain('This is a test issue body');
      expect(result[0].content).not.toContain('## Comments');
    });

    it('should generate markdown with comments when requested', () => {
      const result = githubIssueToMessagePart(mockIssue, true);
      
      expect(result).toHaveLength(2);
      // Main issue part
      expect(result[0].content).toContain('# Test Issue (owner/repo #42)');
      expect(result[0].metadata?.github?.includesComments).toBe(false);
      // Comments part
      expect(result[1].content).toContain('# Comments for Test Issue');
      expect(result[1].content).toContain('## Comment by user1');
      expect(result[1].content).toContain('First comment');
      expect(result[1].content).toContain('## Comment by user2');
      expect(result[1].content).toContain('Second comment');
      expect(result[1].metadata?.github?.includesComments).toBe(true);
    });
  });

  describe('githubPullToMessagePart', () => {
    it('should generate markdown without comments or reviews', () => {
      const result = githubPullToMessagePart(mockPR, false, false);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('file');
      expect(result[0].mimeType).toBe('text/plain');
      expect(result[0].name).toBe('owner-repo-pr-24.md');
      expect(result[0].content).toContain('# Test Pull Request (owner/repo #24)');
      expect(result[0].content).toContain('State: open');
      expect(result[0].content).toContain('This is a test PR body');
      expect(result[0].content).not.toContain('## Comments');
      expect(result[0].content).not.toContain('## Reviews');
    });

    it('should generate markdown with comments when requested', () => {
      const result = githubPullToMessagePart(mockPR, true, false);
      
      expect(result).toHaveLength(2);
      // Main PR part
      expect(result[0].content).toContain('# Test Pull Request (owner/repo #24)');
      expect(result[0].metadata?.github?.includesComments).toBe(false);
      // Comments part
      expect(result[1].content).toContain('# Comments for Test Pull Request');
      expect(result[1].content).toContain('## Comment by reviewer1');
      expect(result[1].content).toContain('PR comment');
      expect(result[1].metadata?.github?.includesComments).toBe(true);
    });

    it('should generate markdown with reviews when requested', () => {
      const result = githubPullToMessagePart(mockPR, false, true);
      
      expect(result).toHaveLength(2);
      // Main PR part
      expect(result[0].content).toContain('# Test Pull Request (owner/repo #24)');
      expect(result[0].metadata?.github?.includesReviews).toBe(false);
      // Reviews part
      expect(result[1].content).toContain('# Reviews for Test Pull Request');
      expect(result[1].content).toContain('## Review: APPROVED by reviewer1');
      expect(result[1].content).toContain('Looks good to me!');
      expect(result[1].content).toContain('### Review Comments:');
      expect(result[1].content).toContain('**src/file.js:10**');
      expect(result[1].content).toContain('Minor suggestion here');
      expect(result[1].metadata?.github?.includesReviews).toBe(true);
    });

    it('should generate markdown with both comments and reviews when requested', () => {
      const result = githubPullToMessagePart(mockPR, true, true);
      
      expect(result).toHaveLength(3);
      // Main PR part
      expect(result[0].content).toContain('# Test Pull Request (owner/repo #24)');
      // Reviews part
      expect(result[1].content).toContain('# Reviews for Test Pull Request');
      expect(result[1].metadata?.github?.includesReviews).toBe(true);
      // Comments part
      expect(result[2].content).toContain('# Comments for Test Pull Request');
      expect(result[2].metadata?.github?.includesComments).toBe(true);
    });
  });

  describe('content truncation', () => {
    it('should truncate very long content', () => {
      const longIssue: GHIssue = {
        ...mockIssue,
        body: 'x'.repeat(15000) // Exceed MAX_CONTENT_LENGTH
      };
      
      const result = githubIssueToMessagePart(longIssue, false);
      expect(result[0].content).toContain('… (truncated)');
      expect(result[0].content.length).toBeLessThan(15000);
    });
  });
});