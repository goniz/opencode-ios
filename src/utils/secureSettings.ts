import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GITHUB_TOKEN_KEY = 'github_token';
const CHUTES_API_KEY = 'chutes_api_key';

export interface SecureSettingsService {
  getGitHubToken(): Promise<string | null>;
  setGitHubToken(token: string): Promise<void>;
  removeGitHubToken(): Promise<void>;
  getChutesApiKey(): Promise<string | null>;
  setChutesApiKey(apiKey: string): Promise<void>;
  removeChutesApiKey(): Promise<void>;
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

  async getChutesApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CHUTES_API_KEY);
    } catch (error) {
      console.error('Failed to get Chutes API key from storage:', error);
      return null;
    }
  },

  async setChutesApiKey(apiKey: string): Promise<void> {
    try {
      await AsyncStorage.setItem(CHUTES_API_KEY, apiKey);
    } catch (error) {
      console.error('Failed to save Chutes API key to storage:', error);
      throw error;
    }
  },

  async removeChutesApiKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CHUTES_API_KEY);
    } catch (error) {
      console.error('Failed to remove Chutes API key from storage:', error);
      throw error;
    }
  }
};