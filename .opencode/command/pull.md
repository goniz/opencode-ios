---
description: Pull latest changes from origin/main and resolve conflicts interactively
agent: build
model: anthropic/claude-sonnet-4-20250514
---

Pull the latest changes from origin/main using --no-rebase and resolve any conflicts interactively:

**Current repository state:**
`!git status`

**Current branch:**
`!git branch --show-current`

**Remote configuration:**
`!git remote -v`

1. **Pre-flight checks:**
   - Verify we have a clean working directory or only committed changes
   - Check current branch status
   - Ensure origin remote exists

2. **Execute the pull:**
   - Run `git pull origin main --no-rebase` to merge latest main changes
   - If the pull succeeds without conflicts, proceed to step 5
   - If conflicts occur, continue to step 3

3. **Handle merge conflicts:**
   - Run `git status` to identify conflicted files
   - For each conflicted file:
     - Read the file content to examine the conflict markers
     - Analyze the conflicting sections (HEAD vs origin/main)
     - If the conflict resolution is clear and straightforward:
       - Automatically resolve by choosing the appropriate version or merging content
       - Stage the resolved file
     - If the conflict is complex or the resolution is unclear:
       - Show the conflicted sections to the user
       - Ask the user how they want to resolve the conflict
       - Options: keep current version, use incoming version, manual resolution required
       - Wait for user input before proceeding

4. **Complete the merge:**
   - After all conflicts are resolved and staged, run `git commit` to complete the merge
   - Use a descriptive merge commit message like "Merge latest changes from origin/main"

5. **Push changes back to remote:**
   - Run `git push origin HEAD` to update the remote branch
   - Confirm the push was successful

6. **Final confirmation:**
   - Run `git status` to verify clean state
   - Show a summary of what was merged and any conflicts that were resolved
   - Display current branch status

**Safety notes:**
- This command uses --no-rebase to preserve the exact commit history
- Complex conflicts will prompt the user for guidance
- All resolved conflicts are automatically committed and pushed
- The merge preserves both local changes and incoming changes from main