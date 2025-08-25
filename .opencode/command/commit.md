---
description: Inspect git status and commit relevant changes
agent: build
---

Create a git commit by inspecting the current repository state and committing only relevant changes:

**Current repository status:**
`!git status`

**Current changes:**
`!git diff`

**Recent commit history for style reference:**
`!git log --oneline -10`

**Project gitignore patterns:**
@.gitignore

Analyze the changes and:
- Identify which files are relevant for the commit (exclude temporary files, build artifacts, logs, etc.)
- Ignore common temporary files like:
  - `.DS_Store`, `Thumbs.db`
  - `*.log`, `*.tmp`, `*.temp`
  - `node_modules/`, `.expo/`, `dist/`, `build/`
  - Any files matching patterns in `.gitignore`

4. Add only the relevant files to staging using `git add <specific-files>`
   - Never use `git add .` - be selective about which files to include
   - Focus on source code, configuration, and documentation changes

5. Run `git status` again to confirm the correct files are staged

6. Create a meaningful commit message that:
   - Follows the existing commit message style from the git log
   - Explains the purpose of the changes (the "why" not just the "what")
   - Is concise but descriptive
   - Uses conventional commit format if the project follows that pattern

7. Run `git commit -m "your commit message"`

8. Confirm the commit was successful with a final `git status`

Be careful to only commit files that are part of the actual changes and avoid committing sensitive information, temporary files, or build artifacts.
