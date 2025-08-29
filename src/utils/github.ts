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