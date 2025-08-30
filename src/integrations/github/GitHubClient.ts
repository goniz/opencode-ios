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
        updatedAt: data.updated_at
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
        updatedAt: data.updated_at
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
}