---
description: Review PR comments and address feedback
agent: build
---
Review the GitHub PR comments for the current branch and address all feedback.

First, check if there's a PR for the current branch:
`!gh pr view --json number,title,url`

If there is a PR, fetch all review comments:
`gh api repos/:owner/:repo/pulls/{PR_NUMBER}/reviews \
  --jq '.[-1].id' | \
  xargs -I {} gh api repos/:owner/:repo/pulls/{PR_NUMBER}/reviews/{}/comments`

Analyze each comment and provide a plan for addressing the feedback:
1. List each comment with its ID and content
2. For each comment, suggest specific changes to address the feedback
3. Provide code snippets or file modifications needed to implement the changes

Focus on thorough and actionable feedback for each PR comment.
