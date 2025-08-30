import { fileRead } from '../api/sdk.gen';
import type { Client } from '../api/client/types.gen';

export interface GitHubUser {
  login: string;
  name?: string;
}

export interface GitHubConnectionTest {
  success: boolean;
  error?: string;
  user?: GitHubUser;
}

export async function testGitHubConnection(token: string): Promise<GitHubConnectionTest> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'opencode-mobile'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Invalid token or insufficient permissions' };
      }
      if (response.status === 403) {
        return { success: false, error: 'Token does not have required permissions' };
      }
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const user = await response.json();
    return {
      success: true,
      user: {
        login: user.login,
        name: user.name
      }
    };
  } catch (error) {
    console.error('Failed to test GitHub connection:', error);
    return { success: false, error: 'Network error or invalid response' };
  }
}

// Git repository detection functionality

export interface GitHubRepository {
  owner: string;
  repo: string;
  fullName: string;
}

export interface GitRemote {
  name: string;
  url: string;
  githubRepo?: GitHubRepository;
}

export async function detectCurrentGitHubRepository(client: Client): Promise<GitHubRepository | null> {
  try {
    // Try to read .git/config file
    const response = await fileRead({
      client,
      query: { path: '.git/config' }
    });

    if (!response.data || typeof response.data !== 'object' || !('content' in response.data)) {
      console.log('Git config not found or invalid');
      return null;
    }

    const gitConfig = response.data.content;
    if (typeof gitConfig !== 'string') {
      console.log('Git config content is not a string');
      return null;
    }

    return parseGitHubRepositoryFromConfig(gitConfig);
  } catch (error) {
    console.log('Failed to read git config:', error);
    return null;
  }
}

export function parseGitHubRepositoryFromConfig(gitConfig: string): GitHubRepository | null {
  const remotes = parseGitRemotes(gitConfig);
  
  // Prioritize origin, then upstream, then any GitHub remote
  for (const remoteName of ['origin', 'upstream']) {
    const remote = remotes.find(r => r.name === remoteName);
    if (remote?.githubRepo) {
      return remote.githubRepo;
    }
  }

  // Fall back to first GitHub remote found
  const githubRemote = remotes.find(r => r.githubRepo);
  return githubRemote?.githubRepo || null;
}

export function parseGitRemotes(gitConfig: string): GitRemote[] {
  const remotes: GitRemote[] = [];
  const lines = gitConfig.split('\n');
  
  let currentRemote: Partial<GitRemote> | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Match remote section header: [remote "origin"]
    const remoteMatch = trimmedLine.match(/^\[remote\s+"([^"]+)"\]$/);
    if (remoteMatch) {
      // Save previous remote if complete
      if (currentRemote?.name && currentRemote?.url) {
        const githubRepo = parseGitHubUrlToRepository(currentRemote.url);
        remotes.push({
          name: currentRemote.name,
          url: currentRemote.url,
          githubRepo: githubRepo || undefined
        });
      }
      
      // Start new remote
      currentRemote = { name: remoteMatch[1] };
      continue;
    }
    
    // Match URL within a remote section
    if (currentRemote && trimmedLine.startsWith('url = ')) {
      currentRemote.url = trimmedLine.replace('url = ', '');
      continue;
    }
  }
  
  // Save final remote if complete
  if (currentRemote?.name && currentRemote?.url) {
    const githubRepo = parseGitHubUrlToRepository(currentRemote.url);
    remotes.push({
      name: currentRemote.name,
      url: currentRemote.url,
      githubRepo: githubRepo || undefined
    });
  }
  
  return remotes;
}

export function parseGitHubUrlToRepository(url: string): GitHubRepository | null {
  // Handle both HTTPS and SSH GitHub URLs
  const patterns = [
    // HTTPS: https://github.com/owner/repo.git
    /^https:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/,
    // SSH: git@github.com:owner/repo.git
    /^git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const owner = match[1];
      const repo = match[2];
      return {
        owner,
        repo,
        fullName: `${owner}/${repo}`
      };
    }
  }
  
  return null;
}

export function formatRepositoryQuery(
  repo: GitHubRepository, 
  type: 'issue' | 'pr' | 'both' = 'both',
  includeClosedItems: boolean = false
): string {
  let query = `repo:${repo.fullName}`;
  
  if (type === 'issue') {
    query += ' type:issue';
    // For issues: show open issues by default, exclude closed unless explicitly requested
    if (!includeClosedItems) {
      query += ' state:open';
    }
  } else if (type === 'pr') {
    query += ' type:pr';
    // For PRs: show only open PRs by default, exclude closed and merged unless explicitly requested
    if (!includeClosedItems) {
      query += ' state:open';
    }
  } else {
    // For both: apply appropriate state filters - only open items
    if (!includeClosedItems) {
      query += ' state:open';
    }
  }
  
  return query;
}