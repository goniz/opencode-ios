# OpenCode Web Chat - Exact Replication Guide

This document provides a comprehensive guide to **exactly replicating** the look, feel, and behavior of the opencode web chat interface from the [opencode web package](https://github.com/sst/opencode/tree/dev/packages/web).

## Tech Stack Requirements

To achieve identical behavior, you need:
- **SolidJS** 1.9.7 for reactive UI (exact version important for behavior consistency)
- **WebSocket** for real-time message streaming
- **Shiki** 3.4.2 for syntax highlighting (exact colors and themes)
- **Marked** 15.0.12 with marked-shiki for markdown rendering
- **Luxon** 3.6.1 for date/time formatting
- **CSS Modules** for scoped styling
- **@shikijs/transformers** for diff notation support

## Architecture

### Project Structure

```
packages/web/
├── src/
│   ├── components/
│   │   ├── Share.tsx              # Main chat component
│   │   ├── share.module.css       # Main styles
│   │   └── share/                 # Chat sub-components
│   │       ├── part.tsx           # Individual message parts
│   │       ├── content-text.tsx   # Text content rendering
│   │       ├── content-code.tsx   # Code block rendering
│   │       ├── content-bash.tsx   # Terminal output rendering
│   │       ├── content-diff.tsx   # Code diff rendering
│   │       ├── content-markdown.tsx # Markdown content
│   │       └── content-error.tsx  # Error display
│   ├── pages/
│   │   └── s/
│   │       └── [id].astro         # Dynamic route for shared chats
│   └── styles/
├── astro.config.mjs               # Astro configuration
└── package.json
```

## Core Components

### 1. Main Chat Component (`Share.tsx`)

The primary chat interface component that handles:

#### Features:
- **Real-time WebSocket connection** for live message streaming
- **Message state management** using SolidJS stores
- **Auto-scrolling** with scroll-to-bottom functionality
- **Connection status indicators** (connected, connecting, error, etc.)
- **Message filtering and sorting**
- **Cost and token tracking**

#### Key Implementation Details:

```typescript
// State management with SolidJS store
const [store, setStore] = createStore<{
  info?: Session.Info
  messages: Record<string, MessageWithParts>
}>({
  info: { /* session info */ },
  messages: {}
})

// WebSocket connection setup
const setupWebSocket = () => {
  const wsBaseUrl = apiUrl.replace(/^https?:\/\//, "wss://")
  const wsUrl = `${wsBaseUrl}/share_poll?id=${props.id}`
  socket = new WebSocket(wsUrl)
  
  socket.onmessage = (event) => {
    const d = JSON.parse(event.data)
    const [root, type, ...splits] = d.key.split("/")
    
    if (type === "message") {
      // Update message in store
      setStore("messages", messageID, reconcile(d.content))
    }
    if (type === "part") {
      // Update specific message part
      setStore("messages", d.content.messageID, "parts", /* update logic */)
    }
  }
}
```

#### Message Processing:
- Messages are received via WebSocket with keys like `session/message/123` or `session/part/123`
- Parts are dynamically added to messages as they stream in
- V1 to V2 message format conversion for backward compatibility

### 2. Message Parts System (`part.tsx`)

Each message is composed of multiple "parts" that represent different types of content:

#### Part Types:
- **Text parts**: User input, assistant responses
- **Tool parts**: File operations, bash commands, searches
- **File parts**: Attachments and file references
- **Step parts**: AI model transitions
- **Reasoning parts**: AI thinking process (collapsible)

#### Part Component Structure:

```typescript
export function Part(props: PartProps) {
  return (
    <div class={styles.root} data-component="part" data-type={props.part.type}>
      {/* Decoration column with icons and anchor links */}
      <div data-component="decoration">
        <div data-slot="anchor">
          <a href={`#${id()}`}>
            {/* Dynamic icon based on part type */}
            <Switch>
              <Match when={props.part.type === "tool" && props.part.tool === "bash"}>
                <IconCommandLine />
              </Match>
              {/* More icon mappings... */}
            </Switch>
          </a>
        </div>
        <div data-slot="bar"></div> {/* Vertical separator */}
      </div>
      
      {/* Content column */}
      <div data-component="content">
        {/* Dynamic content based on part type */}
      </div>
    </div>
  )
}
```

### 3. Message Part Filtering Logic (Critical)

**This is the core logic that determines what parts are shown and how:**

```tsx
// In Share.tsx - Filter parts before rendering
const filteredParts = createMemo(() =>
  msg.parts.filter((x, index) => {
    // Hide duplicate step-start parts (only show first)
    if (x.type === "step-start" && index > 0) return false
    
    // Hide internal system parts
    if (x.type === "snapshot") return false
    if (x.type === "patch") return false
    if (x.type === "step-finish") return false
    
    // Hide synthetic text parts (system-generated)
    if (x.type === "text" && x.synthetic === true) return false
    
    // Hide todoread tool calls (internal)
    if (x.type === "tool" && x.tool === "todoread") return false
    
    // Hide empty text parts
    if (x.type === "text" && !x.text) return false
    
    // Hide pending/running tool calls (incomplete)
    if (x.type === "tool" && 
        (x.state.status === "pending" || x.state.status === "running")) {
      return false
    }
    
    return true
  })
)
```

### 4. Expand/Collapse Behavior Logic

**Each content type has specific expand/collapse rules:**

#### Text Content Expansion Rules:
```tsx
export function ContentText(props: { 
  text: string; 
  expand?: boolean;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = createSignal(false)
  const shouldExpand = () => expanded() || props.expand === true
  
  // Auto-expand logic:
  // - Last message part is always expanded
  // - User can manually expand/collapse
  // - Compact mode shows first 3 lines only
  
  return (
    <div 
      class={styles.messageText}
      data-expanded={shouldExpand()}
      data-size={props.compact ? "sm" : undefined}
    >
      <pre>{props.text}</pre>
      {!props.expand && hasOverflow && (
        <button onClick={() => setExpanded(!expanded())}>
          {expanded() ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}
```

#### Markdown Content Expansion:
```tsx
export function ContentMarkdown(props: { 
  text: string; 
  expand?: boolean; 
  highlight?: boolean;
}) {
  const [expanded, setExpanded] = createSignal(false)
  const overflow = createOverflow() // Custom hook for overflow detection
  
  return (
    <div
      data-expanded={expanded() || props.expand === true}
      data-highlight={props.highlight}
    >
      <div data-slot="markdown" ref={overflow.ref} innerHTML={html()} />
      
      {/* Show expand button only if content overflows AND not force-expanded */}
      {!props.expand && overflow.status && (
        <button onClick={() => setExpanded(!expanded())}>
          {expanded() ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

// Overflow detection hook
function createOverflow() {
  const [ref, setRef] = createSignal<HTMLElement>()
  const [status, setStatus] = createSignal(false)
  
  createEffect(() => {
    const element = ref()
    if (!element) return
    
    // Check if content is line-clamped (overflowing)
    setStatus(element.scrollHeight > element.clientHeight)
  })
  
  return { ref: setRef, status }
}
```

#### Tool Results Expansion (Collapsible by Default):
```tsx
function ResultsButton(props: {
  showCopy?: string;
  hideCopy?: string;
  children: any;
}) {
  const [show, setShow] = createSignal(false) // Collapsed by default
  
  return (
    <>
      <button onClick={() => setShow(!show())}>
        <span>{show() ? (props.hideCopy || "Hide results") : (props.showCopy || "Show results")}</span>
        <span data-slot="icon">
          <Show when={show()} fallback={<IconChevronRight />}>
            <IconChevronDown />
          </Show>
        </span>
      </button>
      <Show when={show()}>{props.children}</Show>
    </>
  )
}
```

### 5. Last Message Part Logic

**The `last` prop determines auto-expansion behavior:**

```tsx
// In Share.tsx - Determine if part is the last one
<For each={data().messages}>
  {(msg, msgIndex) => (
    <For each={filteredParts()}>
      {(part, partIndex) => {
        const isLast = createMemo(() =>
          data().messages.length === msgIndex() + 1 && 
          filteredParts().length === partIndex() + 1
        )
        
        return <Part last={isLast()} part={part} message={msg} />
      }}
    </For>
  )}
</For>

// In Part.tsx - Pass last prop to content components
{props.message.role === "assistant" && props.part.type === "text" && (
  <div data-component="assistant-text">
    <ContentMarkdown expand={props.last} text={props.part.text} />
    
    {/* Show completion timestamp only on last assistant message */}
    {props.last && props.message.time.completed && (
      <Footer title={DateTime.fromMillis(props.message.time.completed)}>
        {DateTime.fromMillis(props.message.time.completed).toLocaleString()}
      </Footer>
    )}
  </div>
)}
```

### 6. Content Type-Specific Display Rules

#### Assistant Text (Markdown):
- **Always rendered as markdown** with syntax highlighting
- **Last message auto-expanded**, others collapsed after 3 lines
- **Shows completion timestamp** only on final message

#### User Text:
- **Plain text rendering** (no markdown processing)
- **Auto-expanded** if it's the last part
- **No syntax highlighting**

#### Tool Results:
- **Collapsed by default** with "Show results" button
- **Count indicators** (e.g., "5 matches", "12 results")
- **Error states** always expanded and highlighted in red

#### Code Blocks:
- **Always fully visible** (no line clamping)
- **Syntax highlighted** with Shiki
- **Copy button** in top-right corner

#### Terminal Output:
- **Collapsed after 7 lines** with expand button
- **Header shows command** or description
- **Stdout/stderr separated** with different styling

#### Reasoning (AI Thinking):
- **Always collapsed** with "Show details" button
- **Special brain icon** in decoration column
- **Formatted as markdown** when expanded

### 7. CSS for Expand/Collapse States

```css
/* Text content line clamping */
[data-expanded="false"] pre {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

[data-expanded="true"] pre {
  display: block;
}

/* Terminal output clamping */
.message-terminal[data-expanded="false"] pre {
  -webkit-line-clamp: 7;
}

/* Markdown content clamping */
.message-markdown[data-expanded="false"] [data-element-markdown] {
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

/* Error content clamping */
.message-error[data-expanded="false"] [data-section="content"] {
  -webkit-line-clamp: 7;
}
```

### 8. Content Rendering Components

#### Text Content (`content-text.tsx`)
- Plain text rendering with expand/collapse functionality
- Syntax: `<ContentText text={content} expand={boolean} />`

#### Code Content (`content-code.tsx`)
- Syntax highlighted code blocks using Shiki
- Language detection and theme support (light/dark)
- Syntax: `<ContentCode code={string} lang={string} />`

#### Markdown Content (`content-markdown.tsx`)
- Markdown parsing with `marked` library
- Integrated syntax highlighting for code blocks
- Support for diff notation highlighting
- Syntax: `<ContentMarkdown text={content} expand={boolean} />`

#### Bash/Terminal Content (`content-bash.tsx`)
- Terminal-style output with command display
- Separate sections for command, stdout, and stderr
- Syntax: `<ContentBash command={string} output={string} />`

#### Diff Content (`content-diff.tsx`)
- File diff visualization with line-by-line changes
- Color coding for additions/deletions
- Syntax: `<ContentDiff diff={string} lang={string} />`

### 4. Tool Implementations

Each tool type has its own rendering logic:

#### File Operations:
- **Read Tool**: Shows file path and optionally file contents
- **Write Tool**: Displays file path and written content
- **Edit Tool**: Shows file diffs with before/after

#### Search Tools:
- **Grep Tool**: Pattern search with match count
- **Glob Tool**: File pattern matching with result count
- **List Tool**: Directory listing

#### Other Tools:
- **Bash Tool**: Command execution with output
- **Task Tool**: Subtask delegation
- **TodoWrite Tool**: Task list management with status indicators

## Styling System

### CSS Architecture

The styling uses a combination of:
- **CSS Modules** for component-scoped styles
- **CSS Custom Properties** for theming
- **Data attributes** for state-based styling
- **Responsive design** with mobile-first approach

### Key Style Patterns

#### Component Structure:
```css
.root {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  
  [data-component="header"] {
    /* Header styles */
  }
  
  [data-component="part"] {
    display: flex;
    gap: 0.625rem;
    
    &[data-type="user-text"] {
      /* User message styles */
    }
    
    &[data-type="tool-bash"] {
      /* Bash tool styles */
    }
  }
}
```

#### Color System:
```css
/* Uses Starlight design tokens */
--sl-color-text
--sl-color-text-secondary
--sl-color-text-dimmed
--sl-color-bg-surface
--sl-color-divider
--sl-color-blue-high
--sl-color-green
--sl-color-red
```

#### Responsive Breakpoints:
```css
@media (max-width: 30rem) {
  /* Mobile styles */
  padding: 1rem;
  gap: 2rem;
}
```

### Visual Design Elements

#### Message Layout:
- **Two-column layout**: Icon/decoration column + content column
- **Vertical line separator** connecting related message parts
- **Expandable content blocks** with "Show more/less" buttons
- **Copy-to-clipboard** functionality on code blocks

#### Status Indicators:
- **Connection status**: Colored dots (green=connected, orange=connecting, red=error)
- **Tool status**: Icons for different operations
- **Progress indicators**: For todo lists and long-running operations

#### Interactive Elements:
- **Anchor links**: Each message part has a shareable anchor
- **Scroll to bottom**: Floating button that appears when scrolled up
- **Collapsible sections**: Tool outputs, reasoning, and long content

## Real-time Features

### WebSocket Message Flow

1. **Connection establishment**: WSS connection to `/share_poll?id=${sessionId}`
2. **Message streaming**: Real-time updates as AI generates responses
3. **Part-by-part updates**: Individual message components update independently
4. **Auto-reconnection**: Handles connection drops with exponential backoff

### State Synchronization

```typescript
// Message update pattern
socket.onmessage = (event) => {
  const d = JSON.parse(event.data)
  const [root, type, ...splits] = d.key.split("/")
  
  if (type === "message") {
    const [, messageID] = splits
    setStore("messages", messageID, reconcile(d.content))
  }
  
  if (type === "part") {
    setStore("messages", d.content.messageID, "parts", (arr) => {
      const index = arr.findIndex((x) => x.id === d.content.id)
      if (index === -1) arr.push(d.content)
      if (index > -1) arr[index] = d.content
      return [...arr]
    })
  }
}
```

## Usage Metrics and Analytics

The interface tracks and displays:
- **Cost tracking**: Total cost of AI operations
- **Token usage**: Input, output, and reasoning tokens
- **Model information**: Which AI models were used
- **Execution time**: Duration of individual operations
- **Session metadata**: Creation time, update time, version info

## Exact Replication Steps

### 1. Package Dependencies (Exact Versions)

```bash
npm install solid-js@1.9.7
npm install marked@15.0.12 marked-shiki@1.2.1
npm install shiki@3.4.2 @shikijs/transformers@3.4.2
npm install luxon@3.6.1 @types/luxon@3.6.2
npm install js-base64@3.7.7
npm install remeda@2.26.0
```

### 2. Core Styling System - CSS Custom Properties

The exact color system and spacing must match Starlight's design tokens:

```css
/* Required CSS Custom Properties */
:root {
  /* Text colors */
  --sl-color-text: #111827;
  --sl-color-text-secondary: #374151;
  --sl-color-text-dimmed: #6b7280;
  --sl-color-text-invert: #ffffff;
  
  /* Background colors */
  --sl-color-bg: #ffffff;
  --sl-color-bg-surface: #f9fafb;
  --sl-color-white: #ffffff;
  
  /* Accent colors */
  --sl-color-blue-high: #1e40af;
  --sl-color-blue-low: #eff6ff;
  --sl-color-green: #059669;
  --sl-color-green-high: #047857;
  --sl-color-green-low: #d1fae5;
  --sl-color-orange: #ea580c;
  --sl-color-orange-low: #fed7aa;
  --sl-color-red: #dc2626;
  
  /* Layout */
  --sl-color-divider: #e5e7eb;
  --sl-color-hairline: #f3f4f6;
  
  /* Tool widths (critical for layout) */
  --sm-tool-width: 28rem;
  --md-tool-width: 40rem;
  --lg-tool-width: 56rem;
}

/* Dark theme variants */
:root[data-theme="dark"] {
  --sl-color-text: #f9fafb;
  --sl-color-text-secondary: #d1d5db;
  --sl-color-text-dimmed: #9ca3af;
  --sl-color-bg: #0f172a;
  --sl-color-bg-surface: #1e293b;
  /* ... other dark theme values */
}
```

### 3. Message Layout Structure (Exact HTML)

The two-column layout is critical to the visual design:

```tsx
<div class={styles.root}>
  {/* Header Section */}
  <div data-component="header">
    <h1 data-component="header-title">{title}</h1>
    <div data-component="header-details">
      <ul data-component="header-stats">
        <li data-slot="item">
          <div data-slot="icon"><OpenCodeIcon /></div>
          <span>v{version}</span>
        </li>
        {/* Model indicators */}
      </ul>
      <div data-component="header-time">{formattedDate}</div>
    </div>
  </div>

  {/* Messages Section */}
  <div class={styles.parts}>
    {messages.map(message => (
      <div data-section="part" data-part-type={partType}>
        {/* Left column: Icon + vertical line */}
        <div data-section="decoration">
          <div data-element-anchor>
            <a href={`#${id}`}>
              {/* Tool-specific icon */}
              <IconComponent />
            </a>
          </div>
          <div /> {/* Vertical separator bar */}
        </div>
        
        {/* Right column: Content */}
        <div data-section="content">
          {/* Dynamic content based on message type */}
        </div>
      </div>
    ))}
  </div>
</div>
```

### 4. Exact CSS Implementation

#### Main Container Styles:
```css
.root {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  line-height: 1;
  padding: 1.5rem;
}

@media (max-width: 30rem) {
  .root {
    padding: 1rem;
    gap: 2rem;
  }
}
```

#### Header Styles:
```css
[data-component="header-title"] {
  font-size: 2.75rem;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

@media (max-width: 30rem) {
  [data-component="header-title"] {
    font-size: 1.75rem;
    line-height: 1.25;
  }
}
```

#### Parts Container:
```css
.parts {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

[data-section="part"] {
  display: flex;
  gap: 0.625rem;
}

[data-section="decoration"] {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  align-items: center;
  justify-content: flex-start;
}

[data-section="decoration"] div:last-child {
  width: 3px;
  height: 100%;
  border-radius: 1px;
  background-color: var(--sl-color-hairline);
}

[data-section="content"] {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 0 0.375rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
```

### 5. Content Component Implementation

#### Text Content with Expand/Collapse:
```tsx
export function ContentText(props: { text: string; expand?: boolean }) {
  const [expanded, setExpanded] = createSignal(false)
  
  return (
    <div 
      class={styles.messageText}
      data-expanded={expanded() || props.expand}
      data-background="none"
    >
      <pre>{props.text}</pre>
      {!props.expand && (
        <button onClick={() => setExpanded(!expanded())}>
          {expanded() ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}
```

#### Code Block Implementation:
```tsx
export function ContentCode(props: { code: string; lang?: string }) {
  const [html] = createResource(
    () => [props.code, props.lang],
    async ([code, lang]) => {
      return await codeToHtml(code, {
        lang: lang || "text",
        themes: {
          light: "github-light",
          dark: "github-dark",
        },
        transformers: [transformerNotationDiff()],
      })
    }
  )
  
  return <div innerHTML={html()} class={styles.codeBlock} />
}
```

### 6. WebSocket Integration (Exact Protocol)

```tsx
const setupWebSocket = () => {
  const wsBaseUrl = apiUrl.replace(/^https?:\/\//, "wss://")
  const wsUrl = `${wsBaseUrl}/share_poll?id=${props.id}`
  socket = new WebSocket(wsUrl)

  socket.onmessage = (event) => {
    const d = JSON.parse(event.data)
    const [root, type, ...splits] = d.key.split("/")
    
    if (root !== "session") return
    
    if (type === "info") {
      setStore("info", reconcile(d.content))
    }
    
    if (type === "message") {
      const [, messageID] = splits
      // Convert V1 to V2 format if needed
      if ("metadata" in d.content) {
        d.content = fromV1(d.content)
      }
      d.content.parts = d.content.parts ?? store.messages[messageID]?.parts ?? []
      setStore("messages", messageID, reconcile(d.content))
    }
    
    if (type === "part") {
      setStore("messages", d.content.messageID, "parts", (arr) => {
        const index = arr.findIndex((x) => x.id === d.content.id)
        if (index === -1) arr.push(d.content)
        if (index > -1) arr[index] = d.content
        return [...arr]
      })
    }
  }
}
```

### 7. Icon System (Exact Icons)

Each tool type has a specific icon mapping:

```tsx
const getIconForPartType = (part: MessagePart) => {
  switch (part.type) {
    case "tool":
      switch (part.tool) {
        case "bash": return <IconCommandLine width={18} height={18} />
        case "edit": return <IconPencilSquare width={18} height={18} />
        case "write": return <IconDocumentPlus width={18} height={18} />
        case "read": return <IconDocument width={18} height={18} />
        case "grep": return <IconDocumentMagnifyingGlass width={18} height={18} />
        case "list": return <IconRectangleStack width={18} height={18} />
        case "glob": return <IconMagnifyingGlass width={18} height={18} />
        case "webfetch": return <IconGlobeAlt width={18} height={18} />
        case "todowrite": return <IconQueueList width={18} height={18} />
        case "task": return <IconRobot width={18} height={18} />
        default: return <IconSparkles width={18} height={18} />
      }
    case "text":
      if (message.role === "user") return <IconUserCircle width={18} height={18} />
      if (message.role === "assistant") return <ProviderIcon model={message.modelID} />
    case "file": return <IconPaperClip width={18} height={18} />
    case "reasoning": return <IconBrain width={18} height={18} />
    default: return <IconSparkles width={18} height={18} />
  }
}
```

### 8. Status and Connection Indicators

```css
[data-part-type="summary"] [data-status] {
  display: block;
  margin: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: var(--sl-color-divider);
}

[data-status="connected"] { background-color: var(--sl-color-green); }
[data-status="connecting"] { background-color: var(--sl-color-orange); }
[data-status="error"] { background-color: var(--sl-color-red); }
[data-status="reconnecting"] { background-color: var(--sl-color-orange); }
```

### Key Configuration

```javascript
// astro.config.mjs
export default defineConfig({
  integrations: [
    solidJs(),
    starlight({
      expressiveCode: { themes: ["github-light", "github-dark"] }
    })
  ]
})
```

### Message Data Structure

```typescript
interface MessageWithParts {
  id: string
  sessionID: string
  role: "user" | "assistant"
  time: { created: number; completed?: number }
  parts: MessageV2.Part[]
  // Assistant-specific fields
  cost?: number
  tokens?: { input: number; output: number; reasoning: number }
  modelID?: string
  providerID?: string
}

interface MessagePart {
  id: string
  messageID: string
  type: "text" | "tool" | "file" | "reasoning" | "step-start"
  // Type-specific fields...
}
```

## Advanced Features

### Custom Tool Integration

To add a new tool type:

1. **Add icon mapping** in `part.tsx`
2. **Create tool component** following existing patterns
3. **Add to Switch statement** in Part component
4. **Implement specific rendering logic**

### Theme Customization

The interface supports light/dark themes through CSS custom properties and Shiki theme configuration.

### Performance Optimizations

- **Suspense for code highlighting**: Async syntax highlighting with loading states
- **Message virtualization**: Large chat sessions use SuspenseList for performance
- **Incremental updates**: Only re-render changed message parts
- **Efficient diffing**: SolidJS reconciliation for minimal DOM updates

### 9. Terminal/Bash Output Component

For terminal commands with exact styling:

```tsx
export function ContentBash(props: {
  command: string
  output?: string
  description?: string
}) {
  const [expanded, setExpanded] = createSignal(false)
  
  return (
    <div class={styles.messageTerminal} data-expanded={expanded()}>
      <div data-section="body">
        <div data-section="header">
          <span>{props.description || props.command}</span>
        </div>
        <div data-section="content">
          <pre>{props.output}</pre>
        </div>
      </div>
      <button onClick={() => setExpanded(!expanded())}>
        {expanded() ? "Show less" : "Show more"}
      </button>
    </div>
  )
}
```

```css
.message-terminal {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  width: 100%;
  max-width: var(--sm-tool-width);
}

.message-terminal [data-section="body"] {
  width: 100%;
  border: 1px solid var(--sl-color-divider);
  border-radius: 0.25rem;
}

.message-terminal [data-section="header"] {
  position: relative;
  border-bottom: 1px solid var(--sl-color-divider);
  width: 100%;
  height: 1.625rem;
  text-align: center;
  padding: 0 3.25rem;
}

.message-terminal [data-section="header"]::before {
  content: "";
  position: absolute;
  top: 8px;
  left: 10px;
  width: 2rem;
  height: 0.5rem;
  background-color: var(--sl-color-hairline);
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 16'%3E%3Ccircle cx='8' cy='8' r='8'/%3E%3Ccircle cx='30' cy='8' r='8'/%3E%3Ccircle cx='52' cy='8' r='8'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
}
```

### 10. Scroll-to-Bottom Button

Floating button that appears when scrolled away from bottom:

```tsx
const [showScrollButton, setShowScrollButton] = createSignal(false)
const [isNearBottom, setIsNearBottom] = createSignal(false)

// Intersection Observer for bottom detection
onMount(() => {
  const sentinel = document.createElement("div")
  sentinel.style.height = "1px"
  sentinel.style.position = "absolute"
  sentinel.style.bottom = "100px"
  document.body.appendChild(sentinel)

  const observer = new IntersectionObserver((entries) => {
    setIsNearBottom(entries[0].isIntersecting)
  })
  observer.observe(sentinel)
})

// Scroll detection logic
function checkScrollNeed() {
  const currentScrollY = window.scrollY
  const isScrollingDown = currentScrollY > lastScrollY
  const scrolled = currentScrollY > 200
  
  const shouldShow = isScrollingDown && scrolled && !isNearBottom()
  setShowScrollButton(shouldShow)
}

// Scroll button component
<Show when={showScrollButton()}>
  <button
    type="button"
    class={styles.scrollButton}
    onClick={() => document.body.scrollIntoView({ behavior: "smooth", block: "end" })}
  >
    <IconArrowDown width={20} height={20} />
  </button>
</Show>
```

```css
.scroll-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.25rem;
  border: 1px solid var(--sl-color-divider);
  background-color: var(--sl-color-bg-surface);
  color: var(--sl-color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease, opacity 0.5s ease;
  z-index: 100;
  appearance: none;
}

.scroll-button:active {
  transform: translateY(1px);
}
```

### 11. Todo List Component (Task Management)

For todo/task list visualization:

```tsx
export function TodoList(props: { todos: Todo[] }) {
  const priorityOrder = { in_progress: 0, pending: 1, completed: 2 }
  const sortedTodos = () => 
    props.todos.slice().sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status])

  return (
    <ul class={styles.todos}>
      <For each={sortedTodos()}>
        {(todo) => (
          <li data-slot="item" data-status={todo.status}>
            <span /> {/* Status indicator */}
            {todo.content}
          </li>
        )}
      </For>
    </ul>
  )
}
```

```css
.todos {
  list-style-type: none;
  padding: 0;
  margin: 0;
  width: 100%;
  max-width: var(--sm-tool-width);
  border: 1px solid var(--sl-color-divider);
  border-radius: 0.25rem;
}

.todos li {
  position: relative;
  padding: 0.375rem 0.625rem 0.375rem 1.75rem;
  border-bottom: 1px solid var(--sl-color-divider);
  font-size: 0.75rem;
  line-height: 1.5;
}

.todos li:last-child {
  border-bottom: none;
}

.todos li > span {
  position: absolute;
  left: 0.5rem;
  top: calc(0.5rem + 1px);
  width: 0.75rem;
  height: 0.75rem;
  border: 1px solid var(--sl-color-divider);
  border-radius: 0.15rem;
}

/* Status-specific styling */
.todos li[data-status="in_progress"] > span {
  border-color: var(--sl-color-orange);
}

.todos li[data-status="in_progress"] > span::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(0.75rem - 6px);
  height: calc(0.75rem - 6px);
  background-color: var(--sl-color-orange-low);
}

.todos li[data-status="completed"] {
  color: var(--sl-color-text-secondary);
}

.todos li[data-status="completed"] > span {
  border-color: var(--sl-color-green-low);
}

.todos li[data-status="completed"] > span::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(0.75rem - 6px);
  height: calc(0.75rem - 6px);
  background-color: var(--sl-color-green);
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
}
```

### 12. Provider Icon System

For AI model provider icons:

```tsx
export function ProviderIcon(props: { model: string; size?: number }) {
  const getProvider = (model: string) => {
    const lowerModel = model.toLowerCase()
    if (/claude|anthropic/.test(lowerModel)) return "anthropic"
    if (/gpt|o[1-4]|codex|openai/.test(lowerModel)) return "openai"
    if (/gemini|palm|bard|google/.test(lowerModel)) return "gemini"
    if (/llama|meta/.test(lowerModel)) return "meta"
    return "any"
  }

  const provider = getProvider(props.model)
  const size = props.size || 16

  return (
    <Switch fallback={<IconSparkles width={size} height={size} />}>
      <Match when={provider === "openai"}>
        <IconOpenAI width={size} height={size} />
      </Match>
      <Match when={provider === "anthropic"}>
        <IconAnthropic width={size} height={size} />
      </Match>
      <Match when={provider === "gemini"}>
        <IconGemini width={size} height={size} />
      </Match>
      <Match when={provider === "meta"}>
        <IconMeta width={size} height={size} />
      </Match>
    </Switch>
  )
}
```

### 13. Anchor Links and Deep Linking

Each message part has a unique anchor ID for deep linking:

```tsx
// Anchor link generation
const id = createMemo(() => props.message.id + "-" + props.index)

// Anchor component with copy-to-clipboard
export function AnchorIcon(props: { id: string }) {
  const [copied, setCopied] = createSignal(false)

  return (
    <div data-element-anchor data-status={copied() ? "copied" : ""}>
      <a
        href={`#${props.id}`}
        onClick={(e) => {
          e.preventDefault()
          const anchor = e.currentTarget
          const hash = anchor.getAttribute("href") || ""
          const { origin, pathname, search } = window.location

          navigator.clipboard
            .writeText(`${origin}${pathname}${search}${hash}`)
            .catch((err) => console.error("Copy failed", err))

          setCopied(true)
          setTimeout(() => setCopied(false), 3000)
        }}
      >
        {/* Icon shows different states */}
        <IconHashtag width={18} height={18} /> {/* Default */}
        <IconCheckCircle width={18} height={18} /> {/* Copied */}
      </a>
      <span data-element-tooltip>Copied!</span>
    </div>
  )
}
```

### 14. Auto-Scroll and Hash Navigation

Critical behavior for smooth navigation:

```tsx
// Auto-scroll to hash anchor on page load
let hasScrolledToAnchor = false

onMount(() => {
  const hash = window.location.hash.slice(1)
  // Wait till all parts are loaded before scrolling
  if (
    hash !== "" &&
    !hasScrolledToAnchor &&
    filteredParts().length === partIndex() + 1 &&
    data().messages.length === msgIndex() + 1
  ) {
    hasScrolledToAnchor = true
    scrollToAnchor(hash)
  }
})

function scrollToAnchor(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: "smooth" })
}
```

### 15. Overflow Detection Hook

Critical for expand/collapse functionality:

```tsx
export function createOverflow() {
  const [overflow, setOverflow] = createSignal(false)
  
  return {
    get status() {
      return overflow()
    },
    ref(el: HTMLElement) {
      const ro = new ResizeObserver(() => {
        // Check if content is taller than container (with 1px tolerance)
        if (el.scrollHeight > el.clientHeight + 1) {
          setOverflow(true)
        }
      })
      ro.observe(el)

      onCleanup(() => {
        ro.disconnect()
      })
    },
  }
}
```

### 16. Duration Formatting

For tool execution time display:

```tsx
export function formatDuration(ms: number): string {
  const ONE_SECOND = 1000
  const ONE_MINUTE = 60 * ONE_SECOND

  if (ms >= ONE_MINUTE) {
    const minutes = Math.floor(ms / ONE_MINUTE)
    return minutes === 1 ? `1min` : `${minutes}mins`
  }

  if (ms >= ONE_SECOND) {
    const seconds = Math.floor(ms / ONE_SECOND)
    return `${seconds}s`
  }

  return `${ms}ms`
}

// Only show duration if operation took more than 2 seconds
const MIN_DURATION = 2000
const shouldShowDuration = (time: number) => time > MIN_DURATION
```

### 17. Message Sorting and Processing

Messages must be sorted correctly for chronological display:

```tsx
// Sort messages by ID (which contains timestamp info)
const messages = createMemo(() => 
  Object.values(store.messages).toSorted((a, b) => a.id?.localeCompare(b.id))
)

// V1 to V2 message conversion for backward compatibility
export function fromV1(v1: Message.Info): MessageWithParts {
  if (v1.role === "assistant") {
    return {
      id: v1.id,
      sessionID: v1.metadata.sessionID,
      role: "assistant",
      time: {
        created: v1.metadata.time.created,
        completed: v1.metadata.time.completed,
      },
      cost: v1.metadata.assistant!.cost,
      path: v1.metadata.assistant!.path,
      tokens: v1.metadata.assistant!.tokens ?? {
        input: 0,
        output: 0,
        cache: { read: 0, write: 0 },
        reasoning: 0,
      },
      modelID: v1.metadata.assistant!.modelID,
      providerID: v1.metadata.assistant!.providerID,
      parts: v1.parts.flatMap((part, index) => {
        // Convert each V1 part to V2 format
        // ... conversion logic
      }),
    }
  }
  // ... user message conversion
}
```

### 18. File Path Display Logic

Show relative paths when possible:

```tsx
function stripWorkingDirectory(filePath?: string, workingDir?: string) {
  if (filePath === undefined || workingDir === undefined) return filePath

  const prefix = workingDir.endsWith("/") ? workingDir : workingDir + "/"

  // Special case: if path equals working directory, show empty
  if (filePath === workingDir) {
    return ""
  }

  // Strip working directory prefix to show relative path
  if (filePath.startsWith(prefix)) {
    return filePath.slice(prefix.length)
  }

  return filePath
}
```

### 19. Language Detection for Syntax Highlighting

```tsx
import map from "lang-map"

function getShikiLang(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  const langs = map.languages(ext)
  const type = langs?.[0]?.toLowerCase()

  // Custom overrides for specific file types
  const overrides: Record<string, string> = {
    conf: "shellscript",
  }

  return type ? (overrides[type] ?? type) : "plaintext"
}
```
```

## Critical Implementation Notes

### 1. Data Attribute Strategy
OpenCode uses `data-*` attributes extensively for CSS targeting and state management. Always use:
- `data-component` for main component identification
- `data-section` for layout sections
- `data-slot` for specific element roles
- `data-status` for state-based styling
- `data-type` for content type variations

### 2. Exact Color Matching
The visual identity depends on precise color usage. Use CSS custom properties exactly as shown, and ensure proper dark mode variants.

### 3. Typography Hierarchy
- Header title: `2.75rem` desktop, `1.75rem` mobile
- Tool names: `0.875rem`
- Content text: `0.875rem`
- Metadata: `0.75rem`
- Line heights and letter spacing must match exactly

### 4. Responsive Breakpoints
Single breakpoint at `30rem` (480px) with mobile-first approach.

### 5. Animation Timing
- Transitions: `0.15s ease` for interactions
- Opacity changes: `0.5s ease` for show/hide
- No bounce or elastic animations

This guide provides everything needed to create a pixel-perfect replica of the opencode web chat interface. The key is attention to detail in spacing, colors, typography, and interaction patterns.