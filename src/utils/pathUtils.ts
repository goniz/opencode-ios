import { appGet } from '../api/sdk.gen';
import type { Client } from '../api/client/types.gen';

// Cache for app root path
let cachedAppRoot: string | null = null;
let cachedAppCwd: string | null = null;

/**
 * Cache app paths from the OpenCode SDK
 */
export async function cacheAppPaths(client: Client): Promise<void> {
  try {
    const response = await appGet({ client });
    if (response.data) {
      cachedAppRoot = response.data.path.root;
      cachedAppCwd = response.data.path.cwd;
      console.log('Cached app paths:', { root: cachedAppRoot, cwd: cachedAppCwd });
    }
  } catch (error) {
    console.warn('Failed to cache app paths:', error);
  }
}

/**
 * Get cached app root path
 */
export function getCachedAppRoot(): string | null {
  return cachedAppRoot;
}

/**
 * Get cached app current working directory
 */
export function getCachedAppCwd(): string | null {
  return cachedAppCwd;
}

/**
 * Make file path relative to the application root
 */
export function getRelativePath(filePath: string): string {
  if (!filePath) return '';
  
  // Use cached app root first, then fall back to cwd
  const appRoot = cachedAppRoot || cachedAppCwd;
  
  if (appRoot && filePath.startsWith(appRoot)) {
    const relativePath = filePath.substring(appRoot.length);
    // Remove leading slash
    return relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  }
  
  // Remove leading slash for cleaner display
  if (filePath.startsWith('/')) {
    return filePath.substring(1);
  }
  
  return filePath;
}