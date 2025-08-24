---
description: Switch to main branch and sync with origin (SAFE MODE - checks for clean worktree first)
agent: build
model: anthropic/claude-sonnet-4-20250514
---

**DANGER: This command will erase uncommitted changes. Use with extreme caution.**

Switch to the main branch and reset to match origin/main exactly:

**Current repository state:**
`!git status --porcelain`

**Current branch:**
`!git branch --show-current`

1. **SAFETY CHECK FIRST** - Analyze the above output to check for any uncommitted changes
   - If ANY files are modified, added, deleted, or untracked (except for ignored files), **REFUSE** to proceed
   - Display the dirty files and instruct the user to either:
     - Commit their changes using the `/commit` command
     - Stash changes with `git stash` 
     - Or manually clean up the worktree
   - **DO NOT PROCEED** if the worktree is not completely clean

2. **ONLY IF WORKTREE IS CLEAN**, proceed with:
   - Run `git fetch origin` to get latest remote changes
   - Run `git checkout main` to switch to main branch
   - Run `git reset --hard origin/main` to reset local main to match remote exactly

3. Confirm successful completion:
   - Run `git status` to verify clean state on main branch
   - Run `git log --oneline -5` to show recent commits
   - Display confirmation message that local main now matches origin/main

**WARNING: This command will permanently delete any uncommitted changes. Always commit or stash your work first.**