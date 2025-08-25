---
description: Reply to a specific PR comment
agent: build
---
Reply to a specific GitHub PR comment with an acknowledgment and explanation.

Use this command with the comment ID and your reply message:
!gh api repos/:owner/:repo/pulls/{PR_NUMBER}/comments/{COMMENT_ID}/replies -f body="$REPLY_MESSAGE"

Provide a professional and helpful response that addresses the specific feedback in the comment.