import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVERS_KEY = 'saved_servers';

export interface SavedServer {
  url: string;
  name?: string;
  lastConnected: number;
  connectionDetails?: {
    appVersion?: string;
    rootPath?: string;
    sessionCount?: number;
  };
}

export const saveServer = async (server: SavedServer): Promise<void> => {
  try {
    const existingServers = await getSavedServers();
    const serverIndex = existingServers.findIndex(s => s.url === server.url);
    
    if (serverIndex >= 0) {
      existingServers[serverIndex] = { ...existingServers[serverIndex], ...server };
    } else {
      existingServers.push(server);
    }
    
    existingServers.sort((a, b) => b.lastConnected - a.lastConnected);
    
    await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(existingServers));
  } catch (error) {
    console.error('Failed to save server:', error);
  }
};

export const getSavedServers = async (): Promise<SavedServer[]> => {
  try {
    const storedServers = await AsyncStorage.getItem(SERVERS_KEY);
    return storedServers ? JSON.parse(storedServers) : [];
  } catch (error) {
    console.error('Failed to get saved servers:', error);
    return [];
  }
};

export const removeServer = async (url: string): Promise<void> => {
  try {
    const existingServers = await getSavedServers();
    const filteredServers = existingServers.filter(s => s.url !== url);
    await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(filteredServers));
  } catch (error) {
    console.error('Failed to remove server:', error);
  }
};

export const clearAllServers = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SERVERS_KEY);
  } catch (error) {
    console.error('Failed to clear all servers:', error);
  }
};