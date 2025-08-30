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

export interface GHIssue extends GHRefBase {
  kind: 'issue';
  state: 'open' | 'closed';
  body?: string;
}

export interface GHPull extends GHRefBase {
  kind: 'pull';
  state: 'open' | 'closed' | 'merged';
  body?: string;
}

export interface GHComment extends GHRefBase {
  kind: 'comment';
  body: string;
  parentNumber: number;
  parentKind: 'issue' | 'pull';
}

export type GitHubRef = GHIssue | GHPull | GHComment;

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