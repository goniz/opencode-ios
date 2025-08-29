# GitHub Quick-Reference Integration (Issue #53)

**Owner:** @goniz  
**Status:** Draft  
**Targets:** iOS + Android (Expo RN)  
**Related:** "Add GitHub integration for quick referencing"  
**Repo context:** Expo/React Native with Expo Router, TypeScript-first, chat in `app/(tabs)/chat.tsx`

---

## 1. Goal & Non-Goals

### Goal
Enable users to quickly reference GitHub issues, PRs, and PR comments within chat by fetching selected content and inserting it into the message as a file-like part (same behavior as images/@file today). This feature should be gated by a configurable GitHub token in Settings, and surfaced via a "+" attachment menu replacing the current image-only button.

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
1. Modal with tabs: Issues, PRs, Comments
2. Search bar for repo and text query; default listing of recent activity when repo is unset
3. Results list with title, number, state, repo name, updated time; tap to preview
4. Preview display: metadata + body (markdown)
5. On confirmation → Insert a structured "FilePart" into the message composing pipeline

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
    GitHubPreview.tsx        // Preview renderer (markdown)
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

---

## 4. Data Model

### Internal Types

```typescript
type GitHubRefKind = 'issue' | 'pull' | 'comment';

interface GHRefBase {
  repo: string;
  url: string;
  apiUrl: string;
  number?: number;
  id: string | number;
  updatedAt: string;
  title?: string;
}

interface GHIssue extends GHRefBase {
  kind: 'issue';
  state: 'open' | 'closed';
  body?: string;
}

interface GHPull extends GHRefBase {
  kind: 'pull';
  state: 'open' | 'closed' | 'merged';
  body?: string;
}

interface GHComment extends GHRefBase {
  kind: 'comment';
  body: string;
  parentNumber: number;
  parentKind: 'issue' | 'pull';
}
```

### Message Part Output

```typescript
interface FilePartLike {
  type: 'file';
  mimeType: 'text/markdown';
  name: string;
  content: string;
  metadata?: Record<string, any>;
}
```

---

## 5. Content Strategy

Generate a concise markdown snippet optimized for context and API payload:

### For Issues/PRs
```markdown
# {title} ({repo} #{number})
State: {state} • Updated: {isoDate}
Source: {html_url}

{body_markdown_truncated_10k_chars}
```

### For Comments
```markdown
# {repo} #{parentNumber} — Comment {id}
Source: {html_url}

{body_markdown_truncated_10k_chars}
```

---

## 6. API Surface (via Octokit)

- **Search:** `octokit.rest.search.issuesAndPullRequests({ ... })`
- **Get Issue:** `octokit.rest.issues.get({ ... })`
- **Get Pull Request:** `octokit.rest.pulls.get({ ... })`
- **Get Comment:** `octokit.rest.issues.getComment({ ... })`

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

---

## 8. Error Handling & Edge Cases

- **No token:** Hide "Attach from GitHub" option; prompt user in Settings
- **Insufficient scope / private repo:** Display actionable error messaging
- **Truncate overly long content** with "… truncated" footer and link to original source
- **Network or rate-limit errors:** Gracefully surface via toast + "Try again". Octokit provides error codes
- **Non-existent resources (404):** Notify "Item not found (possibly deleted or renamed)"

---

## 9. Testing Strategy

### Unit Tests
- `githubToMessagePart`: Validate markdown formatting and truncation
- `GitHubClient`: Validate Octokit wrapper abstraction and error outputs
- Settings reducer: Token store and retrieval logic

### Integration Tests (Jest + React Testing Library)
- Token gating in the Attach menu
- Full "Attach from GitHub" flow: Search → Preview → Attach → Message part injection
- Chat composer handling of the injected part

### Manual Tests
- Public issue/PR/comment flow
- Private repo with correct read-only token
- Simulate network error or rate-limit scenarios

---

## 10. Incremental Delivery Plan

### Phase 1 — Settings & Visibility
- Add `githubToken` support via SecureStore
- Settings UI with PAT input, "Test Connection" button
- Pre-populated token creation link (`https://github.com/settings/tokens/new?scopes=repo,read:org&description=opencode-mobile`)
- Conditional display of "Attach from GitHub" in menu

### Phase 2 — Issues & PRs
- Implement search and detail fetch for issues/PRs
- Preview + attach pipelines → FilePart insertion
- Basic error handling

### Phase 3 — Comments
- Add Comments tab and handling of comment context
- Include parent reference in markdown snippet

### Phase 4 — Polish
- Remember recently used repos
- Implement ETag caching courtesy of Octokit
- Apply markdown sanitization and syntax highlighting for preview

---

## 11. File-Level Changes (Proposed)

- `app/(tabs)/chat.tsx` – Integrate new `<AttachMenu />`
- `src/components/chat/AttachMenu.tsx` – With conditional menu item
- `src/integrations/github/` – New module housing GitHubClient.ts, types, picker, preview
- `src/components/chat/adapters/githubToMessagePart.ts` – Adapter function
- `src/state/settings.ts` – Token state management
- `src/types/message.ts` – Ensure FilePartLike aligns with existing infrastructure

---

## 12. Example Code Snippets

### AttachMenu.tsx
```typescript
const AttachMenu = () => {
  const { githubToken } = useSettings();
  const items = [
    { key: 'image', label: 'Attach Image', onPress: pickImage },
    { key: 'file', label: 'Attach Local File', onPress: pickLocalFile },
    ...(githubToken
      ? [{ key: 'gh', label: 'Attach from GitHub', onPress: openGitHubPicker }]
      : []),
  ];
  return <BottomSheet actions={items} />;
};
```

### GitHubClient.ts (simplified)
```typescript
import { Octokit } from '@octokit/rest';

export class GitHubClient {
  private octokit: Octokit;
  
  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }
  
  searchIssuesPRs(query: string) { /* ... */ }
  getIssue(owner: string, repo: string, number: number) { /* ... */ }
  getPR(owner: string, repo: string, number: number) { /* ... */ }
  getComment(owner: string, repo: string, id: number) { /* ... */ }
}
```

### settings.ts
```typescript
import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'githubToken';

export async function saveToken(token: string) {
  return SecureStore.setItemAsync(SETTINGS_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(SETTINGS_KEY);
}
```

---

## 13. Acceptance Criteria

- **Settings:** User can set, test, and store GitHub PAT securely; includes PAT creation link
- **Attach from GitHub:** Appears only when token is present
- **Search & Attach Flow:** Issues/PRs (and comments, in later phase) can be searched, previewed, and attached as markdown file parts
- **Chat Composition:** GitHub content is passed through message pipeline as expected
- **Robustness:** Handles errors gracefully; no token leaks
- **Coverage:** Unit and integration tests exist for all major components

5) Content Strategy

Generate a concise markdown snippet optimized for context and API payload:

For Issues/PRs

# {title} ({repo} #{number})
State: {state} • Updated: {isoDate}
Source: {html_url}

{body_markdown_truncated_10k_chars}

For Comments

# {repo} #{parentNumber} — Comment {id}
Source: {html_url}

{body_markdown_truncated_10k_chars}


⸻

6) API Surface (via Octokit)
    •   Search: octokit.rest.search.issuesAndPullRequests({ ... })
    •   Get Issue: octokit.rest.issues.get({ ... })
    •   Get Pull Request: octokit.rest.pulls.get({ ... })
    •   Get Comment: octokit.rest.issues.getComment({ ... })

Authentication

const octokit = new Octokit({ auth: githubToken });


⸻

7) Security & Privacy
    •   Use SecureStore for token storage (platform-specific secure enclave).
    •   Do not log or expose the token.
    •   Error messages for 401/403 indicate insufficient scopes or invalid token without leaking token details.
    •   Fetch only on-demand; avoid background data pulling.

⸻

8) Error Handling & Edge Cases
    •   No token: Hide “Attach from GitHub” option; prompt user in Settings.
    •   Insufficient scope / private repo: Display actionable error messaging.
    •   Truncate overly long content with “… truncated” footer and link to original source.
    •   Network or rate-limit errors: Gracefully surface via toast + “Try again”. Octokit provides error codes.
    •   Non-existent resources (404): Notify “Item not found (possibly deleted or renamed)”.

⸻

9) Testing Strategy

Unit Tests
    •   githubToMessagePart: Validate markdown formatting and truncation.
    •   GitHubClient: Validate Octokit wrapper abstraction and error outputs.
    •   Settings reducer: Token store and retrieval logic.

Integration Tests (Jest + React Testing Library)
    •   Token gating in the Attach menu.
    •   Full “Attach from GitHub” flow: Search → Preview → Attach → Message part injection.
    •   Chat composer handling of the injected part.

Manual Tests
    •   Public issue/PR/comment flow.
    •   Private repo with correct read-only token.
    •   Simulate network error or rate-limit scenarios.

⸻

10) Incremental Delivery Plan

Phase 1 — Settings & Visibility
    •   Add githubToken support via SecureStore.
    •   Settings UI with PAT input, “Test Connection” button.
    •   Pre-populated token creation link (https://github.com/settings/personal-access-tokens/new?scopes=repo%3Aread,read%3Aorg).
    •   Conditional display of “Attach from GitHub” in menu.

Phase 2 — Issues & PRs
    •   Implement search and detail fetch for issues/PRs.
    •   Preview + attach pipelines -> FilePart insertion.
    •   Basic error handling.

Phase 3 — Comments
    •   Add Comments tab and handling of comment context.
    •   Include parent reference in markdown snippet.

Phase 4 — Polish
    •   Remember recently used repos.
    •   Implement ETag caching courtesy of Octokit.
    •   Apply markdown sanitization and syntax highlighting for preview.

⸻

11) File-Level Changes (Proposed)
    •   app/(tabs)/chat.tsx – Integrate new <AttachMenu />.
    •   src/components/chat/AttachMenu.tsx – With conditional menu item.
    •   src/integrations/github/ – New module housing GitHubClient.ts, types, picker, preview.
    •   src/components/chat/adapters/githubToMessagePart.ts – Adapter function.
    •   src/state/settings.ts – Token state management.
    •   src/types/message.ts – Ensure FilePartLike aligns with existing infrastructure.

⸻

12) Example Code Snippets

// AttachMenu.tsx
const AttachMenu = () => {
  const { githubToken } = useSettings();
  const items = [
    { key: 'image', label: 'Attach Image', onPress: pickImage },
    { key: 'file', label: 'Attach Local File', onPress: pickLocalFile },
    ...(githubToken
      ? [{ key: 'gh', label: 'Attach from GitHub', onPress: openGitHubPicker }]
      : []),
  ];
  return <BottomSheet actions={items} />;
};

// GitHubClient.ts (simplified)
import { Octokit } from '@octokit/rest';
export class GitHubClient {
  private octokit: Octokit;
  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }
  searchIssuesPRs(query: string) { /* ... */ }
  getIssue(owner: string, repo: string, number: number) { /* ... */ }
  getPR(owner: string, repo: string, number: number) { /* ... */ }
  getComment(owner: string, repo: string, id: number) { /* ... */ }
}

// settings.ts
import * as SecureStore from 'expo-secure-store';
const SETTINGS_KEY = 'githubToken';
export async function saveToken(token: string) {
  return SecureStore.setItemAsync(SETTINGS_KEY, token);
}
export async function getToken() {
  return SecureStore.getItemAsync(SETTINGS_KEY);
}


⸻

13) Acceptance Criteria
    •   Settings: User can set, test, and store GitHub PAT securely; includes PAT creation link.
    •   Attach from GitHub: Appears only when token is present.
    •   Search & Attach Flow: Issues/PRs (and comments, in later phase) can be searched, previewed, and attached as markdown file parts.
    •   Chat Composition: GitHub content is passed through message pipeline as expected.
    •   Robustness: Handles errors gracefully; no token leaks.
    •   Coverage: Unit and integration tests exist for all major components.

⸻
