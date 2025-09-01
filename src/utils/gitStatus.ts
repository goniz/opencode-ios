import { runShellCommandInSession } from './sessionUtils';
import { Client } from '../api/client';

export interface GitStatusInfo {
  branch: string;
  ahead: number;
  behind: number;
  hasChanges: boolean;
  modified: number;
  deleted: number;
  untracked: number;
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
    
    // Get detailed change counts
    const changeCounts = await getChangeCounts(client);

    const result = {
      branch,
      ahead: aheadBehind.ahead,
      behind: aheadBehind.behind,
      hasChanges: changeCounts.modified > 0 || changeCounts.deleted > 0 || changeCounts.untracked > 0,
      modified: changeCounts.modified,
      deleted: changeCounts.deleted,
      untracked: changeCounts.untracked,
    };
    
    console.log(`[GitStatus] Updated: ${result.branch} ↑${result.ahead} ↓${result.behind} ±${result.modified + result.deleted} ?${result.untracked}`);
    return result;
  } catch (error) {
    console.warn('[GitStatus] Failed to get git status:', error);
    return {
      branch: 'unknown',
      ahead: 0,
      behind: 0,
      hasChanges: false,
      modified: 0,
      deleted: 0,
      untracked: 0,
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
      console.warn('[GitStatus] Could not fetch from remote:', fetchError);
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
 * Get detailed counts of modified, deleted, and untracked files
 */
export async function getChangeCounts(client: Client): Promise<{ modified: number; deleted: number; untracked: number }> {
  try {
    const result = await runShellCommandInSession(client, 'git status --porcelain');
    const lines = result.trim().split('\n').filter(line => line.length > 0);

    let modified = 0;
    let deleted = 0;
    let untracked = 0;

    for (const line of lines) {
      const status = line.substring(0, 2);
      if (status[0] === 'M' || status[1] === 'M') {
        modified++;
      }
      if (status[0] === 'D' || status[1] === 'D') {
        deleted++;
      }
      if (status === '??') {
        untracked++;
      }
    }

    return { modified, deleted, untracked };
  } catch (error) {
    console.warn('Failed to get change counts:', error);
    return { modified: 0, deleted: 0, untracked: 0 };
  }
}



