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

export function githubIssueToMessagePart(issue: GHIssue): FilePartLike {
  const content = `# ${issue.title} (${issue.repo} #${issue.number})
State: ${issue.state} • Updated: ${formatDate(issue.updatedAt)}
Source: ${issue.url}

${truncateContent(issue.body || 'No description provided.')}`;

  return {
    type: 'file',
    mimeType: 'text/markdown',
    name: `${issue.repo.replace('/', '-')}-issue-${issue.number}.md`,
    content,
    metadata: {
      github: {
        kind: 'issue',
        repo: issue.repo,
        number: issue.number,
        url: issue.url,
        state: issue.state
      }
    }
  };
}

export function githubPullToMessagePart(pull: GHPull): FilePartLike {
  const content = `# ${pull.title} (${pull.repo} #${pull.number})
State: ${pull.state} • Updated: ${formatDate(pull.updatedAt)}
Source: ${pull.url}

${truncateContent(pull.body || 'No description provided.')}`;

  return {
    type: 'file',
    mimeType: 'text/markdown',
    name: `${pull.repo.replace('/', '-')}-pr-${pull.number}.md`,
    content,
    metadata: {
      github: {
        kind: 'pull',
        repo: pull.repo,
        number: pull.number,
        url: pull.url,
        state: pull.state
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
    mimeType: 'text/markdown',
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