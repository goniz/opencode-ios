import AsyncStorage from '@react-native-async-storage/async-storage';

const CHUTES_API_KEY = 'chutes_api_key';

export interface LocalStorageService {
  getChutesApiKey(): Promise<string | null>;
  setChutesApiKey(apiKey: string): Promise<void>;
  removeChutesApiKey(): Promise<void>;
}

export const localStorage: LocalStorageService = {
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