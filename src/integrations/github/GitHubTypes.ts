export type GitHubRefKind = 'issue' | 'pull' | 'comment';

export interface GHRefBase {
  repo: string;
  url: string;
  apiUrl: string;
  number?: number;
  id: string | number;
  updatedAt: string;
  title?: string;
}

export interface GHIssueComment {
  id: number;
  body: string;
  createdAt: string;
  author: string;
  url: string;
}

export interface GHReviewComment {
  id: number;
  body: string;
  path?: string;
  line?: number;
  author: string;
  url: string;
}

export interface GHReview {
  id: number;
  state: 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'DISMISSED';
  body?: string; // Top-level review comment
  author: string;
  submittedAt: string;
  comments: GHReviewComment[]; // Nested review comments
  url: string;
}

export interface GHIssue extends GHRefBase {
  kind: 'issue';
  state: 'open' | 'closed';
  body?: string;
  comments?: GHIssueComment[];
  commentCount: number;
}

export interface GHPull extends GHRefBase {
  kind: 'pull';
  state: 'open' | 'closed' | 'merged';
  body?: string;
  comments?: GHIssueComment[];
  reviews?: GHReview[];
  commentCount: number;
  reviewCount: number;
}

export interface GHComment extends GHRefBase {
  kind: 'comment';
  body: string;
  parentNumber: number;
  parentKind: 'issue' | 'pull';
}

export type GitHubRef = GHIssue | GHPull | GHComment;

export interface PreviewOptions {
  includeComments: boolean;
  includeReviews: boolean; // PR only
}

export interface GitHubMetadata {
  github: {
    kind: string;
    repo: string;
    number?: number;
    url: string;
    state?: string;
    id?: string | number;
    parentNumber?: number;
    parentKind?: string;
    commentCount?: number;
    reviewCount?: number;
    includesComments?: boolean;
    includesReviews?: boolean;
  };
}

export interface FilePartLike {
  type: 'file';
  mimeType: 'text/plain';
  name: string;
  content: string;
  metadata?: GitHubMetadata;
}

export interface GitHubSearchResult {
  items: {
    id: number;
    number: number;
    title: string;
    state: string;
    html_url: string;
    updated_at: string;
    body?: string;
    repository_url: string;
    pull_request?: unknown;
  }[];
  total_count: number;
}