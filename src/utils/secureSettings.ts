import * as SecureStore from 'expo-secure-store';

const GITHUB_TOKEN_KEY = 'github_token';

export interface SecureSettingsService {
  getGitHubToken(): Promise<string | null>;
  setGitHubToken(token: string): Promise<void>;
  removeGitHubToken(): Promise<void>;
  testGitHubConnection(token: string): Promise<{ success: boolean; error?: string; user?: { login: string; name?: string } }>;
}

export const secureSettings: SecureSettingsService = {
  async getGitHubToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(GITHUB_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get GitHub token from secure storage:', error);
      return null;
    }
  },

  async setGitHubToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(GITHUB_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save GitHub token to secure storage:', error);
      throw error;
    }
  },

  async removeGitHubToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(GITHUB_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove GitHub token from secure storage:', error);
      throw error;
    }
  },

  async testGitHubConnection(token: string): Promise<{ success: boolean; error?: string; user?: { login: string; name?: string } }> {
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
};