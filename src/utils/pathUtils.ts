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
    if (response.data?.path) {
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
 * Get user home directory by deriving it from app root path
 * This assumes the app root is somewhere under the user's home directory
 */
export function getCachedHomeDir(): string | null {
  if (!cachedAppRoot) return null;
  
  // Try to find the home directory by looking for common patterns
  // Typically app root might be something like: /home/username/... or /Users/username/...
  const pathParts = cachedAppRoot.split('/');
  
  // Look for common home directory patterns
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    const nextPart = pathParts[i + 1];
    
    // Check for /home/username or /Users/username patterns
    if ((part === 'home' || part === 'Users') && nextPart) {
      return '/' + pathParts.slice(1, i + 2).join('/');
    }
  }
  
  // Fallback: if we can't determine home directory, use app root
  return cachedAppRoot;
}

