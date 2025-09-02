import { projectCurrent } from '../api/sdk.gen';
import type { Client } from '../api/client/types.gen';

// Cache for project paths
let cachedProjectWorktree: string | null = null;

/**
 * Cache project paths from the OpenCode SDK
 */
export async function cacheAppPaths(client: Client): Promise<void> {
  try {
    const response = await projectCurrent({ client });
    if (response.data?.worktree) {
      cachedProjectWorktree = response.data.worktree;
      console.log('Cached project paths:', { worktree: cachedProjectWorktree });
    }
  } catch (error) {
    console.warn('Failed to cache project paths:', error);
  }
}

/**
 * Get cached project worktree path
 */
export function getCachedAppRoot(): string | null {
  return cachedProjectWorktree;
}

/**
 * Get cached project worktree path (alias for backward compatibility)
 */
export function getCachedAppCwd(): string | null {
  return cachedProjectWorktree;
}

/**
 * Make file path relative to the project worktree
 */
export function getRelativePath(filePath: string): string {
  if (!filePath) return '';
  
  // Use cached project worktree
  const projectRoot = cachedProjectWorktree;
  
  if (projectRoot && filePath.startsWith(projectRoot)) {
    const relativePath = filePath.substring(projectRoot.length);
    // Remove leading slash
    return relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  }
  
  // Remove leading slash for cleaner display
  if (filePath.startsWith('/')) {
    return filePath.substring(1);
  }
  
  return filePath;
}