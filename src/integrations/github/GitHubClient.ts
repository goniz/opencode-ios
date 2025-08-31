import { Octokit } from '@octokit/rest';
import { GHIssue, GHPull, GitHubSearchResult } from './GitHubTypes';

export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ 
      auth: token,
      userAgent: 'opencode-mobile/1.0.0'
    });
  }

  async testConnection(): Promise<{ success: boolean; user?: string; error?: string }> {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated();
      return { success: true, user: data.login };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async searchIssuesPRs(query: string, type: 'issue' | 'pr' | 'both' = 'both'): Promise<GitHubSearchResult> {
    try {
      let searchQuery = query;
      
      if (type === 'issue') {
        searchQuery += ' type:issue';
      } else if (type === 'pr') {
        searchQuery += ' type:pr';
      }

      const { data } = await this.octokit.rest.search.issuesAndPullRequests({
        q: searchQuery,
        sort: 'updated',
        order: 'desc',
        per_page: 30
      });

      return data;
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getIssue(owner: string, repo: string, number: number): Promise<GHIssue> {
    try {
      const { data } = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number: number
      });

      return {
        kind: 'issue',
        id: data.id,
        number: data.number,
        title: data.title,
        state: data.state as 'open' | 'closed',
        body: data.body || '',
        repo: `${owner}/${repo}`,
        url: data.html_url,
        apiUrl: data.url,
        updatedAt: data.updated_at,
        commentCount: data.comments
      };
    } catch (error) {
      throw new Error(`Failed to get issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPullRequest(owner: string, repo: string, number: number): Promise<GHPull> {
    try {
      const { data } = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: number
      });

      let state: 'open' | 'closed' | 'merged' = data.state as 'open' | 'closed';
      if (data.merged) {
        state = 'merged';
      }

      return {
        kind: 'pull',
        id: data.id,
        number: data.number,
        title: data.title,
        state,
        body: data.body || '',
        repo: `${owner}/${repo}`,
        url: data.html_url,
        apiUrl: data.url,
        updatedAt: data.updated_at,
        commentCount: data.comments,
        reviewCount: data.review_comments || 0
      };
    } catch (error) {
      throw new Error(`Failed to get pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static parseRepoFromUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    return null;
  }

  static parseRepoFromApiUrl(apiUrl: string): { owner: string; repo: string } | null {
    const match = apiUrl.match(/repos\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    return null;
  }

  async getIssueWithComments(owner: string, repo: string, number: number): Promise<GHIssue> {
    try {
      const [issue, comments] = await Promise.all([
        this.getIssue(owner, repo, number),
        this.octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: number,
          per_page: 20
        })
      ]);

      return {
        ...issue,
        comments: comments.data.map(comment => ({
          id: comment.id,
          body: comment.body || '',
          createdAt: comment.created_at,
          author: comment.user?.login || 'unknown',
          url: comment.html_url
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get issue with comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPRWithCommentsAndReviews(owner: string, repo: string, number: number): Promise<GHPull> {
    try {
      const [pr, comments, reviews] = await Promise.all([
        this.getPullRequest(owner, repo, number),
        this.octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: number,
          per_page: 20
        }),
        this.octokit.rest.pulls.listReviews({
          owner,
          repo,
          pull_number: number,
          per_page: 10
        })
      ]);

      // Fetch review comments for each review
      const reviewsWithComments = await Promise.all(
        reviews.data.map(async (review) => {
          const reviewComments = await this.octokit.rest.pulls.listReviewComments({
            owner,
            repo,
            pull_number: number,
            review_id: review.id
          });
          return {
            id: review.id,
            state: review.state as 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'DISMISSED',
            body: review.body || undefined,
            author: review.user?.login || 'unknown',
            submittedAt: (review as unknown as { submitted_at?: string; created_at?: string }).submitted_at || (review as unknown as { submitted_at?: string; created_at?: string }).created_at || new Date().toISOString(),
            url: review.html_url,
            comments: reviewComments.data.map(comment => ({
              id: comment.id,
              body: comment.body || '',
              path: comment.path,
              line: comment.line,
              author: comment.user?.login || 'unknown',
              url: comment.html_url
            }))
          };
        })
      );

      return {
        ...pr,
        comments: comments.data.map(comment => ({
          id: comment.id,
          body: comment.body || '',
          createdAt: comment.created_at,
          author: comment.user?.login || 'unknown',
          url: comment.html_url
        })),
        reviews: reviewsWithComments
      };
    } catch (error) {
      throw new Error(`Failed to get PR with comments and reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}