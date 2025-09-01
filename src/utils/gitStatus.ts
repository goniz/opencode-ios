import { runShellCommandInSession } from './sessionUtils';
import { Client } from '../api/client';

export interface GitStatusInfo {
  branch: string;
  ahead: number;
  behind: number;
  hasChanges: boolean;
  error?: string;
}

/**
 * Get comprehensive git status information including branch, ahead/behind counts, and changes
 */
export async function getGitStatus(client: Client): Promise<GitStatusInfo | null> {
  try {
    console.log('[GitStatus] Starting git status fetch...');
    
    // Get current branch
    const branch = await getCurrentBranch(client);
    if (!branch) {
      console.log('[GitStatus] No git branch found, not in a git repository');
      return null;
    }
    console.log(`[GitStatus] Current branch: ${branch}`);

    // Get ahead/behind counts
    const aheadBehind = await getAheadBehindCounts(client, branch);
    console.log(`[GitStatus] Ahead/behind counts: ${aheadBehind.ahead}/${aheadBehind.behind}`);
    
    // Check for uncommitted changes
    const hasChanges = await hasUncommittedChanges(client);
    console.log(`[GitStatus] Has changes: ${hasChanges}`);

    const result = {
      branch,
      ahead: aheadBehind.ahead,
      behind: aheadBehind.behind,
      hasChanges,
    };
    
    console.log('[GitStatus] Final result:', result);
    return result;
  } catch (error) {
    console.warn('[GitStatus] Failed to get git status:', error);
    return {
      branch: 'unknown',
      ahead: 0,
      behind: 0,
      hasChanges: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the current git branch name
 */
export async function getCurrentBranch(client: Client): Promise<string | null> {
  try {
    const result = await runShellCommandInSession(client, 'git branch --show-current');
    const branch = result.trim();
    return branch || null;
  } catch (error) {
    console.warn('Failed to get current branch:', error);
    return null;
  }
}

/**
 * Get the number of commits ahead and behind the remote branch
 */
export async function getAheadBehindCounts(client: Client, branch: string): Promise<{ ahead: number; behind: number }> {
  try {
    console.log(`[GitStatus] Getting ahead/behind counts for branch: ${branch}`);
    
    // First, try to fetch the latest from remote (non-blocking)
    try {
      console.log('[GitStatus] Attempting git fetch...');
      await runShellCommandInSession(client, 'git fetch --quiet');
      console.log('[GitStatus] Git fetch completed successfully');
    } catch (fetchError) {
      // Ignore fetch errors, continue with local info
      console.warn('[GitStatus] Could not fetch from remote:', fetchError);
    }

    // Check if remote branch exists
    const remoteExists = await checkRemoteBranchExists(client, branch);
    console.log(`[GitStatus] Remote branch origin/${branch} exists: ${remoteExists}`);
    if (!remoteExists) {
      // No remote branch, so we can't determine ahead/behind
      console.log('[GitStatus] No remote branch found, returning 0/0');
      return { ahead: 0, behind: 0 };
    }

    // Get ahead/behind counts using git rev-list
    const command = `git rev-list --left-right --count HEAD...origin/${branch}`;
    console.log(`[GitStatus] Running command: ${command}`);
    const result = await runShellCommandInSession(client, command);
    console.log(`[GitStatus] Git rev-list result: "${result}"`);
    
    const match = result.trim().match(/^(\d+)\s+(\d+)$/);
    if (match) {
      const ahead = parseInt(match[1], 10);
      const behind = parseInt(match[2], 10);
      console.log(`[GitStatus] Parsed ahead/behind: ${ahead}/${behind}`);
      return { ahead, behind };
    }

    console.warn(`[GitStatus] Could not parse git rev-list result: "${result}"`);
    return { ahead: 0, behind: 0 };
  } catch (error) {
    console.warn('[GitStatus] Failed to get ahead/behind counts:', error);
    return { ahead: 0, behind: 0 };
  }
}

/**
 * Check if the remote branch exists
 */
async function checkRemoteBranchExists(client: Client, branch: string): Promise<boolean> {
  try {
    await runShellCommandInSession(client, `git show-ref --verify --quiet refs/remotes/origin/${branch}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if there are uncommitted changes in the working directory
 */
export async function hasUncommittedChanges(client: Client): Promise<boolean> {
  try {
    const result = await runShellCommandInSession(client, 'git status --porcelain');
    return result.trim().length > 0;
  } catch (error) {
    console.warn('Failed to check for uncommitted changes:', error);
    return false;
  }
}

/**
 * Format git status for display
 */
export function formatGitStatus(gitStatus: GitStatusInfo): string {
  const { branch, ahead, behind, hasChanges } = gitStatus;
  
  let status = `${branch}`;
  
  // Add ahead/behind indicators
  if (ahead > 0 && behind > 0) {
    status += ` ↕️${ahead}↓${behind}`;
  } else if (ahead > 0) {
    status += ` ↑${ahead}`;
  } else if (behind > 0) {
    status += ` ↓${behind}`;
  }
  
  // Add changes indicator
  if (hasChanges) {
    status += ' •';
  }
  
  return status;
}

/**
 * Get a simplified git status string for display
 */
export async function getFormattedGitStatus(client: Client): Promise<string | null> {
  const gitStatus = await getGitStatus(client);
  if (!gitStatus) {
    return null;
  }
  
  return formatGitStatus(gitStatus);
}