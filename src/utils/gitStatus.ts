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
    // Get current branch
    const branch = await getCurrentBranch(client);
    if (!branch) {
      return null;
    }

    // Get ahead/behind counts
    const aheadBehind = await getAheadBehindCounts(client, branch);
    
    // Check for uncommitted changes
    const hasChanges = await hasUncommittedChanges(client);

    return {
      branch,
      ahead: aheadBehind.ahead,
      behind: aheadBehind.behind,
      hasChanges,
    };
  } catch (error) {
    console.warn('Failed to get git status:', error);
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
    // First, try to fetch the latest from remote (non-blocking)
    try {
      await runShellCommandInSession(client, 'git fetch --quiet');
    } catch (fetchError) {
      // Ignore fetch errors, continue with local info
      console.warn('Could not fetch from remote:', fetchError);
    }

    // Check if remote branch exists
    const remoteExists = await checkRemoteBranchExists(client, branch);
    if (!remoteExists) {
      // No remote branch, so we can't determine ahead/behind
      return { ahead: 0, behind: 0 };
    }

    // Get ahead/behind counts using git rev-list
    const result = await runShellCommandInSession(
      client, 
      `git rev-list --left-right --count HEAD...origin/${branch}`
    );
    
    const match = result.trim().match(/^(\d+)\s+(\d+)$/);
    if (match) {
      const ahead = parseInt(match[1], 10);
      const behind = parseInt(match[2], 10);
      return { ahead, behind };
    }

    return { ahead: 0, behind: 0 };
  } catch (error) {
    console.warn('Failed to get ahead/behind counts:', error);
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