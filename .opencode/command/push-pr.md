---
description: Push branch to remote and create PR (creates new branch if on main)
agent: build
---

Push the current branch to remote and create a Pull Request:

**Current branch and status:**
`!git branch --show-current`
`!git status`

**Remote configuration:**
`!git remote -v`

**Changes since main:**
`!git log origin/main..HEAD --oneline`

1. **Analyze current branch status from above output:**

2. **Handle main branch scenario:**
   - If currently on `main` branch:
     - Generate a descriptive branch name based on recent changes or prompt for one
     - Run `git fetch origin` to get latest remote changes
     - Try `git checkout -b <new-branch-name> origin/main` to create branch from remote main
     - If origin/main doesn't exist, fallback to `git checkout -b <new-branch-name> main`
     - This preserves any uncommitted changes in the new branch

3. **Push branch to remote:**
   - Run `git remote -v` to verify remote exists
   - Check if branch exists on remote: `git ls-remote --heads origin <branch-name>`
   - If branch doesn't exist on remote: `git push -u origin <branch-name>`
   - If branch exists on remote: `git push origin <branch-name>`

4. **Create or check Pull Request:**
   - Run `gh pr view` to check if PR already exists for current branch
   - If PR doesn't exist:
     - Run `git log origin/main..HEAD --oneline` to see commits that will be included
     - Run `git diff origin/main...HEAD` to see all changes for PR analysis
     - Create PR with: `gh pr create --title "<descriptive-title>" --body "<summary>"`
     - Generate meaningful title and description based on the commits and changes
   - If PR already exists:
     - Show PR details with `gh pr view`
     - Confirm the branch was pushed and PR is updated

5. **Final confirmation:**
   - Display the PR URL
   - Show branch status and confirm push was successful
   - List any next steps (like requesting reviews)

**Note: This command preserves uncommitted changes when creating a new branch from main.**