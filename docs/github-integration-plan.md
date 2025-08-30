# GitHub Quick-Reference Integration (Issue #53)

**Owner:** @goniz  
**Status:** Draft  
**Targets:** iOS + Android (Expo RN)  
**Related:** "Add GitHub integration for quick referencing"  
**Repo context:** Expo/React Native with Expo Router, TypeScript-first, chat in `app/(tabs)/chat.tsx`

---

## 1. Goal & Non-Goals

### Goal
Enable users to quickly reference GitHub issues, PRs, and their associated comments/reviews within chat by fetching selected content and inserting it into the message as a file-like part (same behavior as images/@file today). This feature should be gated by a configurable GitHub token in Settings, and surfaced via a "+" attachment menu replacing the current image-only button.

### Non-Goals
- Building a full GitHub client (no issue/PR authoring)
- OAuth flow (version 1 uses manual PAT entry)
- Uploading non-text assets (v1 limited to lightweight markdown snippets)

---

## 2. UX & IA

### Entry Point
- Replace "Add image" button with a "+" toolbar action on the chat screen
- Tapping "+" opens a BottomSheet/ActionSheet with:
  1. "Attach Image" (existing logic)
  2. "Attach Local File" (future extension)
  3. "Attach from GitHub" (conditional, shown only when token exists)

### GitHub Picker Flow
1. Modal with tabs: Issues, Pull Requests
2. Search bar for repo and text query; default listing of recent activity when repo is unset
3. Results list with title, number, state, repo name, updated time; tap to preview
4. **Enhanced Preview display:**
   - Metadata + body (markdown)
   - **For Issues:** List of comments with toggle to include/exclude
   - **For PRs:** List of comments AND reviews (with review status, top-level comment, and nested review comments) with toggle to include/exclude
5. On confirmation → Insert a structured "FilePart" into the message composing pipeline with selected content

### Settings
- Field: GitHub Personal Access Token (classic), with masking
- Display required scopes: `repo` for repository access, and `read:org` for private organization repos
- "Test Connection" button to call GitHub `/user` endpoint

### Include PAT Creation Link
A "Create Classic Token" link launching GitHub's classic token generation page with scopes pre-selected for minimal permissions.

GitHub supports pre-filling fields via URL parameters when creating classic tokens. Use a link like:

```
https://github.com/settings/tokens/new?scopes=repo,read:org&description=opencode-mobile
```

This simplifies token setup for users by pre-selecting the required scopes (`repo` for repository access and `read:org` for private organization repositories) and setting a descriptive name.

---

## 3. Architecture & Modules

```
src/
  integrations/github/
    GitHubClient.ts          // Octokit-based REST client wrapper
    GitHubTypes.ts           // Narrowed-down types we need
    GitHubPicker.tsx         // Modal picker with tabs
    GitHubPreview.tsx        // Enhanced preview with comments/reviews toggle
    index.ts                 // Exports
  state/
    settings.ts              // Add githubToken, backed by SecureStore
  components/chat/
    AttachMenu.tsx           // New + menu component
    adapters/
      githubToMessagePart.ts // Converts GH entities → FilePartLike
```

**Key Components:**
- **Settings:** Persist token securely (AsyncStorage + expo-secure-store)
- **Networking:** Use React Native–compatible Octokit (simplifies API calls, handles pagination/rate-limits)
- **Cache:** Leverage ETag caching via Octokit's built-in support
- **Preview:** Enhanced component showing comments/reviews with inclusion toggles

---

## 4. Data Model

### Internal Types

```typescript
type GitHubRefKind = 'issue' | 'pull';

interface GHRefBase {
  repo: string;
  url: string;
  apiUrl: string;
  number?: number;
  id: string | number;
  updatedAt: string;
  title?: string;
}

interface GHComment {
  id: number;
  body: string;
  createdAt: string;
  author: string;
  url: string;
}

interface GHReviewComment {
  id: number;
  body: string;
  path?: string;
  line?: number;
  author: string;
}

interface GHReview {
  id: number;
  state: 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'DISMISSED';
  body?: string; // Top-level review comment
  author: string;
  submittedAt: string;
  comments: GHReviewComment[]; // Nested review comments
  url: string;
}

interface GHIssue extends GHRefBase {
  kind: 'issue';
  state: 'open' | 'closed';
  body?: string;
  comments?: GHComment[];
  commentCount: number;
}

interface GHPull extends GHRefBase {
  kind: 'pull';
  state: 'open' | 'closed' | 'merged';
  body?: string;
  comments?: GHComment[];
  reviews?: GHReview[];
  commentCount: number;
  reviewCount: number;
}

interface PreviewOptions {
  includeComments: boolean;
  includeReviews: boolean; // PR only
}
```

### Message Part Output

```typescript
interface FilePartLike {
  type: 'file';
  mimeType: 'text/markdown';
  name: string;
  content: string;
  metadata?: {
    includesComments?: boolean;
    includesReviews?: boolean;
    commentCount?: number;
    reviewCount?: number;
  };
}
```

---

## 5. Content Strategy

Generate a concise markdown snippet optimized for context and API payload:

### For Issues (without comments)
```markdown
# {title} ({repo} #{number})
State: {state} • Updated: {isoDate}
Source: {html_url}

{body_markdown_truncated_10k_chars}
```

### For Issues (with comments)
```markdown
# {title} ({repo} #{number})
State: {state} • Updated: {isoDate}
Source: {html_url}

{body_markdown_truncated_10k_chars}

---

## Comments ({commentCount})

### Comment by {author} • {timestamp}
{comment_body_truncated}

### Comment by {author} • {timestamp}
{comment_body_truncated}

[... additional comments ...]
```

### For PRs (without comments/reviews)
```markdown
# {title} ({repo} #{number})
State: {state} • Updated: {isoDate}
Source: {html_url}

{body_markdown_truncated_10k_chars}
```

### For PRs (with comments and/or reviews)
```markdown
# {title} ({repo} #{number})
State: {state} • Updated: {isoDate}
Source: {html_url}

{body_markdown_truncated_10k_chars}

---

## Reviews ({reviewCount})

### Review: {APPROVED|CHANGES_REQUESTED|COMMENTED} by {author} • {timestamp}
{review_top_level_comment_if_exists}

#### Review Comments:
**{path}:{line}**
{review_comment_body}

**{path}:{line}**
{review_comment_body}

---

## Comments ({commentCount})

### Comment by {author} • {timestamp}
{comment_body_truncated}

[... additional comments ...]
```

---

## 6. API Surface (via Octokit)

- **Search:** `octokit.rest.search.issuesAndPullRequests({ ... })`
- **Get Issue:** `octokit.rest.issues.get({ ... })`
- **Get Issue Comments:** `octokit.rest.issues.listComments({ ... })`
- **Get Pull Request:** `octokit.rest.pulls.get({ ... })`
- **Get PR Comments:** `octokit.rest.issues.listComments({ ... })` (issue comments on PR)
- **Get PR Reviews:** `octokit.rest.pulls.listReviews({ ... })`
- **Get PR Review Comments:** `octokit.rest.pulls.listReviewComments({ ... })` or included in review details

### Authentication
```typescript
const octokit = new Octokit({ auth: githubToken });
```

---

## 7. Security & Privacy

- Use SecureStore for token storage (platform-specific secure enclave)
- Do not log or expose the token
- Error messages for 401/403 indicate insufficient scopes or invalid token without leaking token details
- Fetch only on-demand; avoid background data pulling
- Lazy-load comments/reviews only when preview is opened

---

## 8. Error Handling & Edge Cases

- **No token:** Hide "Attach from GitHub" option; prompt user in Settings
- **Insufficient scope / private repo:** Display actionable error messaging
- **Truncate overly long content** with "… truncated" footer and link to original source
- **Large number of comments/reviews:** Limit to first N (e.g., 20) with indication of total count
- **Network or rate-limit errors:** Gracefully surface via toast + "Try again". Octokit provides error codes
- **Non-existent resources (404):** Notify "Item not found (possibly deleted or renamed)"
- **Failed comment/review fetch:** Show issue/PR without comments, indicate fetch failure

---

## 9. Testing Strategy

### Unit Tests
- `githubToMessagePart`: Validate markdown formatting with/without comments and reviews
- `GitHubClient`: Validate Octokit wrapper abstraction, comment/review fetching
- Settings reducer: Token store and retrieval logic
- Preview options state management

### Integration Tests (Jest + React Testing Library)
- Token gating in the Attach menu
- Full "Attach from GitHub" flow with comment/review inclusion options
- Preview component with toggles for comments/reviews
- Chat composer handling of the injected part with metadata

### Manual Tests
- Public issue/PR with comments flow
- PR with reviews (different statuses)
- Private repo with correct read-only token
- Large number of comments/reviews (pagination)
- Simulate network error or rate-limit scenarios

---

## 10. Incremental Delivery Plan

### Phase 1 — Settings & Visibility
- Add `githubToken` support via SecureStore
- Settings UI with PAT input, "Test Connection" button
- Pre-populated token creation link (`https://github.com/settings/tokens/new?scopes=repo,read:org&description=opencode-mobile`)
- Conditional display of "Attach from GitHub" in menu

### Phase 2 — Basic Issues & PRs
- Implement search and detail fetch for issues/PRs (without comments)
- Basic preview + attach pipelines → FilePart insertion
- Basic error handling

### Phase 3 — Enhanced Issues & PRs with Comments/Reviews
- Extend preview to fetch and display comments for issues
- Extend preview to fetch and display both comments AND reviews for PRs
- Add toggle controls in preview to include/exclude comments and reviews
- Update markdown generation to conditionally include selected content
- Handle review states and nested review comments structure

### Phase 4 — Polish
- Remember recently used repos
- Implement ETag caching courtesy of Octokit
- Apply markdown sanitization and syntax highlighting for preview
- Optimize comment/review fetching with pagination
- Add comment/review count badges in search results

---

## 11. File-Level Changes (Proposed)

- `app/(tabs)/chat.tsx` – Integrate new `<AttachMenu />`
- `src/components/chat/AttachMenu.tsx` – With conditional menu item
- `src/integrations/github/` – New module housing GitHubClient.ts, types, picker, enhanced preview
- `src/components/chat/adapters/githubToMessagePart.ts` – Adapter function with comment/review support
- `src/state/settings.ts` – Token state management
- `src/types/message.ts` – Ensure FilePartLike aligns with existing infrastructure

---

## 12. Example Code Snippets

### GitHubClient.ts (enhanced)
```typescript
import { Octokit } from '@octokit/rest';

export class GitHubClient {
  private octokit: Octokit;
  
  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }
  
  searchIssuesPRs(query: string) { /* ... */ }
  
  async getIssue(owner: string, repo: string, number: number) {
    const issue = await this.octokit.rest.issues.get({ owner, repo, issue_number: number });
    return { ...issue.data, commentCount: issue.data.comments };
  }
  
  async getIssueWithComments(owner: string, repo: string, number: number) {
    const [issue, comments] = await Promise.all([
      this.getIssue(owner, repo, number),
      this.octokit.rest.issues.listComments({ owner, repo, issue_number: number, per_page: 20 })
    ]);
    return { ...issue, comments: comments.data };
  }
  
  async getPR(owner: string, repo: string, number: number) {
    const pr = await this.octokit.rest.pulls.get({ owner, repo, pull_number: number });
    return pr.data;
  }
  
  async getPRWithCommentsAndReviews(owner: string, repo: string, number: number) {
    const [pr, comments, reviews] = await Promise.all([
      this.getPR(owner, repo, number),
      this.octokit.rest.issues.listComments({ owner, repo, issue_number: number, per_page: 20 }),
      this.octokit.rest.pulls.listReviews({ owner, repo, pull_number: number, per_page: 10 })
    ]);
    
    // Fetch review comments for each review
    const reviewsWithComments = await Promise.all(
      reviews.data.map(async (review) => {
        const reviewComments = await this.octokit.rest.pulls.listReviewComments({
          owner,
          repo,
          pull_number: number,
          review_id: review.id
        });
        return { ...review, comments: reviewComments.data };
      })
    );
    
    return { ...pr, comments: comments.data, reviews: reviewsWithComments };
  }
}
```

### GitHubPreview.tsx
```typescript
interface PreviewProps {
  item: GHIssue | GHPull;
  onConfirm: (options: PreviewOptions) => void;
}

const GitHubPreview = ({ item, onConfirm }: PreviewProps) => {
  const [includeComments, setIncludeComments] = useState(false);
  const [includeReviews, setIncludeReviews] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullItem, setFullItem] = useState(item);
  
  useEffect(() => {
    if (includeComments || (item.kind === 'pull' && includeReviews)) {
      setLoading(true);
      // Fetch comments/reviews when toggled
      fetchFullContent();
    }
  }, [includeComments, includeReviews]);
  
  return (
    <View>
      <Text>{item.title}</Text>
      <Markdown>{item.body}</Markdown>
      
      {item.commentCount > 0 && (
        <Switch
          label={`Include ${item.commentCount} comments`}
          value={includeComments}
          onValueChange={setIncludeComments}
        />
      )}
      
      {item.kind === 'pull' && item.reviewCount > 0 && (
        <Switch
          label={`Include ${item.reviewCount} reviews`}
          value={includeReviews}
          onValueChange={setIncludeReviews}
        />
      )}
      
      {loading && <ActivityIndicator />}
      
      {includeComments && fullItem.comments && (
        <CommentsList comments={fullItem.comments} />
      )}
      
      {includeReviews && fullItem.reviews && (
        <ReviewsList reviews={fullItem.reviews} />
      )}
      
      <Button
        title="Attach"
        onPress={() => onConfirm({ includeComments, includeReviews })}
      />
    </View>
  );
};
```

---

## 13. Acceptance Criteria

- **Settings:** User can set, test, and store GitHub PAT securely; includes PAT creation link
- **Attach from GitHub:** Appears only when token is present
- **Search & Attach Flow:** Issues/PRs can be searched and previewed
- **Enhanced Preview:** 
  - Issues show comments with toggle to include/exclude
  - PRs show both comments AND reviews with toggles to include/exclude
  - Reviews display status, top-level comment, and nested review comments
- **Chat Composition:** GitHub content with selected comments/reviews is passed through message pipeline as expected
- **Robustness:** Handles errors gracefully; no token leaks
- **Performance:** Lazy-loads comments/reviews only when needed
- **Coverage:** Unit and integration tests exist for all major components including comment/review handling