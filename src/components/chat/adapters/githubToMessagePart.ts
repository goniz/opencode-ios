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

export function githubIssueToMessagePart(issue: GHIssue, includeComments: boolean = false): FilePartLike[] {
  const parts: FilePartLike[] = [];

  // Main issue content
  const mainContent = `# ${issue.title} (${issue.repo} #${issue.number})
State: ${issue.state} • Updated: ${formatDate(issue.updatedAt)}
Source: ${issue.url}

${truncateContent(issue.body || 'No description provided.')}`;

  parts.push({
    type: 'file',
    mimeType: 'text/plain',
    name: `${issue.repo.replace('/', '-')}-issue-${issue.number}.md`,
    content: mainContent,
    metadata: {
      github: {
        kind: 'issue',
        repo: issue.repo,
        number: issue.number,
        url: issue.url,
        state: issue.state,
        commentCount: issue.commentCount,
        includesComments: false
      }
    }
  });

  // Comments as separate part
  if (includeComments && issue.comments && issue.comments.length > 0) {
    console.log('🔍 [githubIssueToMessagePart] Adding comments part for issue:', issue.number);
    console.log('🔍 [githubIssueToMessagePart] Comments count:', issue.comments.length);
    
    // Filter out any empty comments
    const validComments = issue.comments.filter(comment => 
      comment && comment.body && comment.body.trim().length > 0
    );
    
    if (validComments.length > 0) {
      let commentsContent = `# Comments for ${issue.title} (${issue.repo} #${issue.number})

`;
      validComments.slice(0, 20).forEach(comment => {
        commentsContent += `## Comment by ${comment.author} • ${formatDate(comment.createdAt)}\n${truncateContent(comment.body, 1000)}\n\n`;
      });
      if (validComments.length > 20) {
        commentsContent += `... and ${validComments.length - 20} more comments\n`;
      }

      parts.push({
        type: 'file',
        mimeType: 'text/plain',
        name: `${issue.repo.replace('/', '-')}-issue-${issue.number}-comments.md`,
        content: commentsContent,
        metadata: {
          github: {
            kind: 'issue-comments',
            repo: issue.repo,
            number: issue.number,
            url: issue.url,
            state: issue.state,
            commentCount: issue.commentCount,
            includesComments: true
          }
        }
      });
      console.log('🔍 [githubIssueToMessagePart] Comments part added successfully');
    } else {
      console.log('🔍 [githubIssueToMessagePart] No valid comments found, skipping comments part');
    }
  } else {
    console.log('🔍 [githubIssueToMessagePart] Not adding comments for issue:', issue.number, 'includeComments:', includeComments, 'comments count:', issue.comments?.length || 0);
  }

  console.log('🔍 [githubIssueToMessagePart] Final parts array:', parts.map(p => ({ name: p.name, kind: p.metadata?.github?.kind })));
  console.log('🔍 [githubIssueToMessagePart] Returning', parts.length, 'parts for issue:', issue.number);
  return parts;
}

export function githubPullToMessagePart(pull: GHPull, includeComments: boolean = false, includeReviews: boolean = false): FilePartLike[] {
  const parts: FilePartLike[] = [];

  // Main PR content
  const mainContent = `# ${pull.title} (${pull.repo} #${pull.number})
State: ${pull.state} • Updated: ${formatDate(pull.updatedAt)}
Source: ${pull.url}

${truncateContent(pull.body || 'No description provided.')}`;

  parts.push({
    type: 'file',
    mimeType: 'text/plain',
    name: `${pull.repo.replace('/', '-')}-pr-${pull.number}.md`,
    content: mainContent,
    metadata: {
      github: {
        kind: 'pull',
        repo: pull.repo,
        number: pull.number,
        url: pull.url,
        state: pull.state,
        commentCount: pull.commentCount,
        reviewCount: pull.reviewCount,
        includesComments: false,
        includesReviews: false
      }
    }
  });

  // Reviews as separate part
  if (includeReviews && pull.reviews && pull.reviews.length > 0) {
    console.log('🔍 [githubPullToMessagePart] Adding reviews part for PR:', pull.number);
    console.log('🔍 [githubPullToMessagePart] Reviews count:', pull.reviews.length);
    
    // Filter out any empty reviews
    const validReviews = pull.reviews.filter(review => 
      review && (review.body || (review.comments && review.comments.length > 0))
    );
    
    if (validReviews.length > 0) {
      let reviewsContent = `# Reviews for ${pull.title} (${pull.repo} #${pull.number})

`;
      validReviews.slice(0, 10).forEach(review => {
        reviewsContent += `## Review: ${review.state} by ${review.author} • ${formatDate(review.submittedAt)}\n`;
        if (review.body) {
          reviewsContent += `${truncateContent(review.body, 500)}\n\n`;
        }
        if (review.comments && review.comments.length > 0) {
          reviewsContent += '### Review Comments:\n';
          review.comments.slice(0, 5).forEach(comment => {
            reviewsContent += `**${comment.path}:${comment.line}**\n${truncateContent(comment.body, 500)}\n\n`;
          });
          if (review.comments.length > 5) {
            reviewsContent += `... and ${review.comments.length - 5} more review comments\n\n`;
          }
        }
      });
      if (validReviews.length > 10) {
        reviewsContent += `... and ${validReviews.length - 10} more reviews\n`;
      }

      parts.push({
        type: 'file',
        mimeType: 'text/plain',
        name: `${pull.repo.replace('/', '-')}-pr-${pull.number}-reviews.md`,
        content: reviewsContent,
        metadata: {
          github: {
            kind: 'pull-reviews',
            repo: pull.repo,
            number: pull.number,
            url: pull.url,
            state: pull.state,
            commentCount: pull.commentCount,
            reviewCount: pull.reviewCount,
            includesComments: false,
            includesReviews: true
          }
        }
      });
      console.log('🔍 [githubPullToMessagePart] Reviews part added successfully');
    } else {
      console.log('🔍 [githubPullToMessagePart] No valid reviews found, skipping reviews part');
    }
  } else {
    console.log('🔍 [githubPullToMessagePart] Not adding reviews for PR:', pull.number, 'includeReviews:', includeReviews, 'reviews count:', pull.reviews?.length || 0);
  }

  // Comments as separate part
  if (includeComments && pull.comments && pull.comments.length > 0) {
    console.log('🔍 [githubPullToMessagePart] Adding comments part for PR:', pull.number);
    console.log('🔍 [githubPullToMessagePart] Comments count:', pull.comments.length);
    
    // Filter out any empty comments
    const validComments = pull.comments.filter(comment => 
      comment && comment.body && comment.body.trim().length > 0
    );
    
    if (validComments.length > 0) {
      let commentsContent = `# Comments for ${pull.title} (${pull.repo} #${pull.number})

`;
      validComments.slice(0, 20).forEach(comment => {
        commentsContent += `## Comment by ${comment.author} • ${formatDate(comment.createdAt)}\n${truncateContent(comment.body, 1000)}\n\n`;
      });
      if (validComments.length > 20) {
        commentsContent += `... and ${validComments.length - 20} more comments\n`;
      }

      parts.push({
        type: 'file',
        mimeType: 'text/plain',
        name: `${pull.repo.replace('/', '-')}-pr-${pull.number}-comments.md`,
        content: commentsContent,
        metadata: {
          github: {
            kind: 'pull-comments',
            repo: pull.repo,
            number: pull.number,
            url: pull.url,
            state: pull.state,
            commentCount: pull.commentCount,
            reviewCount: pull.reviewCount,
            includesComments: true,
            includesReviews: false
          }
        }
      });
      console.log('🔍 [githubPullToMessagePart] Comments part added successfully');
    } else {
      console.log('🔍 [githubPullToMessagePart] No valid comments found, skipping comments part');
    }
  } else {
    console.log('🔍 [githubPullToMessagePart] Not adding comments for PR:', pull.number, 'includeComments:', includeComments, 'comments count:', pull.comments?.length || 0);
  }

  console.log('🔍 [githubPullToMessagePart] Final parts array:', parts.map(p => ({ name: p.name, kind: p.metadata?.github?.kind })));
  console.log('🔍 [githubPullToMessagePart] Returning', parts.length, 'parts for PR:', pull.number);
  return parts;
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