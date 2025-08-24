export interface ChutesQuota {
  quota: number;
  used: number;
}

/**
 * Fetch Chutes account quota information
 * @param chuteId - The chute ID to check quota for
 * @param apiKey - The Chutes API key
 * @returns Promise resolving to quota information
 */
export async function fetchChutesQuota(
  chuteId: string,
  apiKey: string
): Promise<ChutesQuota> {
  // Make direct HTTP request to Chutes API
  const response = await fetch(`https://api.chutes.ai/users/me/quota_usage/${chuteId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Chutes quota: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data as ChutesQuota;
}