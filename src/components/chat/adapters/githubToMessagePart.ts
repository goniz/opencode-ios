import { GHIssue, GHPull, GHComment, FilePartLike } from '../../../integrations/github/GitHubTypes';

const MAX_CONTENT_LENGTH = 10000;

function truncateContent(content: string, maxLength: number = MAX_CONTENT_LENGTH): string {
  if (content.length <= maxLength) {
    return content;
  }
  
  return content.slice(0, maxLength) + '\n\n… (truncated)';
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString();
}

export function githubIssueToMessagePart(issue: GHIssue, includeComments: boolean = false): FilePartLike {
  let content = `# ${issue.title} (${issue.repo} #${issue.number})
State: ${issue.state} • Updated: ${formatDate(issue.updatedAt)}
Source: ${issue.url}

${truncateContent(issue.body || 'No description provided.')}`;

  if (includeComments && issue.comments && issue.comments.length > 0) {
    content += '\n\n---\n\n## Comments\n\n';
    issue.comments.slice(0, 20).forEach(comment => {
      content += `### Comment by ${comment.author} • ${formatDate(comment.createdAt)}\n${truncateContent(comment.body, 1000)}\n\n`;
    });
    if (issue.comments.length > 20) {
      content += `... and ${issue.comments.length - 20} more comments\n`;
    }
  }

  return {
    type: 'file',
    mimeType: 'text/plain',
    name: `${issue.repo.replace('/', '-')}-issue-${issue.number}.md`,
    content,
    metadata: {
      github: {
        kind: 'issue',
        repo: issue.repo,
        number: issue.number,
        url: issue.url,
        state: issue.state,
        commentCount: issue.commentCount,
        includesComments: includeComments
      }
    }
  };
}

export function githubPullToMessagePart(pull: GHPull, includeComments: boolean = false, includeReviews: boolean = false): FilePartLike {
  let content = `# ${pull.title} (${pull.repo} #${pull.number})
State: ${pull.state} • Updated: ${formatDate(pull.updatedAt)}
Source: ${pull.url}

${truncateContent(pull.body || 'No description provided.')}`;

  if (includeReviews && pull.reviews && pull.reviews.length > 0) {
    content += '\n\n---\n\n## Reviews\n\n';
    pull.reviews.slice(0, 10).forEach(review => {
      content += `### Review: ${review.state} by ${review.author} • ${formatDate(review.submittedAt)}\n`;
      if (review.body) {
        content += `${truncateContent(review.body, 500)}\n\n`;
      }
      if (review.comments && review.comments.length > 0) {
        content += '#### Review Comments:\n';
        review.comments.slice(0, 5).forEach(comment => {
          content += `**${comment.path}:${comment.line}**\n${truncateContent(comment.body, 500)}\n\n`;
        });
        if (review.comments.length > 5) {
          content += `... and ${review.comments.length - 5} more review comments\n\n`;
        }
      }
    });
    if (pull.reviews.length > 10) {
      content += `... and ${pull.reviews.length - 10} more reviews\n`;
    }
  }

  if (includeComments && pull.comments && pull.comments.length > 0) {
    content += '\n\n---\n\n## Comments\n\n';
    pull.comments.slice(0, 20).forEach(comment => {
      content += `### Comment by ${comment.author} • ${formatDate(comment.createdAt)}\n${truncateContent(comment.body, 1000)}\n\n`;
    });
    if (pull.comments.length > 20) {
      content += `... and ${pull.comments.length - 20} more comments\n`;
    }
  }

  return {
    type: 'file',
    mimeType: 'text/plain',
    name: `${pull.repo.replace('/', '-')}-pr-${pull.number}.md`,
    content,
    metadata: {
      github: {
        kind: 'pull',
        repo: pull.repo,
        number: pull.number,
        url: pull.url,
        state: pull.state,
        commentCount: pull.commentCount,
        reviewCount: pull.reviewCount,
        includesComments: includeComments,
        includesReviews: includeReviews
      }
    }
  };
}

export function githubCommentToMessagePart(comment: GHComment): FilePartLike {
  const content = `# ${comment.repo} #${comment.parentNumber} — Comment ${comment.id}
Source: ${comment.url}

${truncateContent(comment.body)}`;

  return {
    type: 'file',
    mimeType: 'text/plain',
    name: `${comment.repo.replace('/', '-')}-comment-${comment.id}.md`,
    content,
    metadata: {
      github: {
        kind: 'comment',
        repo: comment.repo,
        parentNumber: comment.parentNumber,
        parentKind: comment.parentKind,
        url: comment.url,
        id: comment.id
      }
    }
  };
}