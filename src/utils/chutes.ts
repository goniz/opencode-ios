import type { Client } from '../api/client/types.gen';
import { localStorage } from './localStorage';

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
 * @param client - The API client from ConnectionContext (unused but kept for compatibility)
 * @param chuteId - The chute ID to check quota for
 * @param apiKey - API key to use (required - will be fetched from localStorage by caller if not provided)
 * @returns Promise resolving to quota information
 */
export async function fetchChutesQuota(
  client: Client,
  chuteId: string,
  apiKey: string
): Promise<ChutesQuota> {
  console.log(`[Chutes] Fetching quota for chute: ${chuteId}`);
  
  console.log('[Chutes] Using API key (first 10 chars):', apiKey.substring(0, 10) + '...');
  
  // Make direct HTTP request to Chutes API
  const url = new URL(`users/me/quota_usage/{chute_id}`, 'https://api.chutes.ai/');
  console.log(`[Chutes] Making request to: ${url.href}`);
  const response = await fetch(url.href, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey
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
        await localStorage.removeChutesApiKey();
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