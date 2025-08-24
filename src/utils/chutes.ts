import type { Client } from '../api/client/types.gen';
import { fileRead } from '../api/sdk.gen';
import { getCachedHomeDir, getCachedAppCwd } from './pathUtils';
import { localStorage } from './localStorage';

// Simple path utilities for React Native (since 'path' module is not available)
function pathJoin(...segments: string[]): string {
  return segments
    .filter(segment => segment && segment !== '')
    .join('/')
    .replace(/\/+/g, '/'); // Replace multiple slashes with single slash
}

function pathRelative(from: string, to: string): string {
  // Normalize paths by removing trailing slashes and splitting
  const fromParts = from.replace(/\/+$/, '').split('/').filter(p => p);
  const toParts = to.replace(/\/+$/, '').split('/').filter(p => p);
  
  // Find common base
  let commonLength = 0;
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    if (fromParts[i] === toParts[i]) {
      commonLength++;
    } else {
      break;
    }
  }
  
  // Calculate how many levels to go up from 'from' directory
  const upLevels = fromParts.length - commonLength;
  const downPath = toParts.slice(commonLength);
  
  // Build relative path
  const upPath = '../'.repeat(upLevels);
  return upPath + downPath.join('/');
}

export interface ChutesQuota {
  quota: number;
  used: number;
}

export class ChutesApiKeyRequiredError extends Error {
  constructor(message: string = 'Chutes API key is required') {
    super(message);
    this.name = 'ChutesApiKeyRequiredError';
  }
}

export class ChutesApiKeyInvalidError extends Error {
  constructor(message: string = 'Chutes API key is invalid or expired') {
    super(message);
    this.name = 'ChutesApiKeyInvalidError';
  }
}

/**
 * Fetch Chutes account quota information
 * @param client - The API client from ConnectionContext
 * @param chuteId - The chute ID to check quota for
 * @param apiKey - Optional API key to use (if not provided, will check local storage and auth file)
 * @returns Promise resolving to quota information
 */
export async function fetchChutesQuota(
  client: Client,
  chuteId: string,
  apiKey?: string
): Promise<ChutesQuota> {
  console.log(`[Chutes] Fetching quota for chute: ${chuteId}`);
  
  let finalApiKey = apiKey;
  
  // If no API key provided, try to get from local storage first
  if (!finalApiKey) {
    console.log('[Chutes] No API key provided, checking local storage');
    const storedKey = await localStorage.getCrutesApiKey();
    if (storedKey) {
      finalApiKey = storedKey;
    }
  }
  
  // If still no API key, try to read from auth file as fallback
  if (!finalApiKey) {
    console.log('[Chutes] No API key in local storage, trying auth file');
    try {
      // Convert ~ path to full path using home directory, then make it relative to cwd
      const homeDir = getCachedHomeDir();
      const appCwd = getCachedAppCwd();
      
      // Build auth file path
      const authFullPath = homeDir 
        ? pathJoin(homeDir, '.local', 'share', 'opencode', 'auth.json')
        : '~/.local/share/opencode/auth.json';
      
      // Calculate relative path from cwd if available, otherwise use full path
      const relativePath = (homeDir && appCwd) 
        ? pathRelative(appCwd, authFullPath)
        : authFullPath;
      
      console.log(`[Chutes] Reading auth file from ${authFullPath} (relative: ${relativePath})`);
      const authResponse = await fileRead({
        client,
        query: {
          path: relativePath
        }
      });
      
      console.log(`[Chutes] fileRead response:`, authResponse);
      
      // Validate file read response
      if (authResponse.error) {
        console.error('[Chutes] Failed to read auth file:', authResponse.error);
        throw new ChutesApiKeyRequiredError('Chutes API key not found. Please provide your API key.');
      }
      
      if (authResponse.data?.type !== 'raw') {
        console.error('[Chutes] Auth file response type is not raw:', authResponse.data?.type);
        throw new ChutesApiKeyRequiredError('Chutes API key not found. Please provide your API key.');
      }
      
      console.log('[Chutes] Successfully read auth file, parsing API key');
      const authData = JSON.parse(authResponse.data.content);
      console.log('[Chutes] Auth data parsed:', authData);
      finalApiKey = authData.chutes?.key;
      
      if (!finalApiKey) {
        console.error('[Chutes] Chutes API key not found in auth data');
        throw new ChutesApiKeyRequiredError('Chutes API key not found. Please provide your API key.');
      }
    } catch (error) {
      if (error instanceof ChutesApiKeyRequiredError) {
        throw error;
      }
      console.error('[Chutes] Failed to read auth file:', error);
      throw new ChutesApiKeyRequiredError('Chutes API key not found. Please provide your API key.');
    }
  }
  
  if (!finalApiKey) {
    throw new ChutesApiKeyRequiredError('Chutes API key not found. Please provide your API key.');
  }
  
  console.log('[Chutes] Using API key (first 10 chars):', finalApiKey.substring(0, 10) + '...');
  
  // Make direct HTTP request to Chutes API
  const url = new URL(`users/me/quota_usage/{chute_id}`, 'https://api.chutes.ai/');
  console.log(`[Chutes] Making request to: ${url.href}`);
  const response = await fetch(url.href, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': finalApiKey
    }
  });
  
  console.log(`[Chutes] Quota API response status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Chutes] Failed to fetch quota - Status: ${response.status}, Body: ${errorText}`);
    
    // Handle authentication errors (invalid/expired API key)
    if (response.status === 401 || response.status === 403) {
      // Remove the invalid API key from storage
      try {
        await localStorage.removeCrutesApiKey();
        console.log('[Chutes] Removed invalid API key from storage');
      } catch (removeError) {
        console.error('[Chutes] Failed to remove invalid API key from storage:', removeError);
      }
      
      throw new ChutesApiKeyInvalidError(`Authentication failed: ${response.status} ${response.statusText}`);
    }
    
    throw new Error(`Failed to fetch Chutes quota: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`[Chutes] Quota data received:`, data);
  return data as ChutesQuota;
}