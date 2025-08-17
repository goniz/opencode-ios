# OpenCode iOS Chat Implementation Plan

## Overview
This document outlines the detailed task-based plan to transform the current React Native chat screen (`app/(tabs)/chat.tsx`) to match the exact styling and behavior of the opencode web chat implementation.

## Current State Analysis

### Current Implementation
- Basic message rendering with simple text display
- Simple user/assistant message bubbles
- Basic part type handling (text, tool, file, etc.)
- Dark theme with basic styling
- No expand/collapse functionality
- No part filtering logic
- Simple two-column layout (missing decoration column)

### Target Implementation (Web)
- Sophisticated part filtering and processing
- Two-column layout with decoration (icons + vertical bar) and content
- Expand/collapse functionality for all content types
- Rich content rendering (markdown, code, terminal, diffs)
- Part-specific icons and styling
- Advanced message part types handling
- Exact color system and typography

## Implementation Tasks

### Phase 1: Core Architecture Updates

#### Task 1.1: Message Part Filtering System
**Priority**: Critical
**Estimated Time**: 4-6 hours

**Objective**: Implement the exact part filtering logic from the web implementation

**Requirements**:
- Filter out duplicate step-start parts (only show first)
- Hide internal system parts (snapshot, patch, step-finish)
- Hide synthetic text parts (system-generated)
- Hide todoread tool calls
- Hide empty text parts
- Hide pending/running tool calls
- Filter parts before rendering

**Implementation Steps**:
1. Create `useFilteredParts` hook
2. Add filtering logic based on web implementation
3. Update message rendering to use filtered parts
4. Add part visibility rules for each part type

**Files to Modify**:
- `app/(tabs)/chat.tsx` - Add filtering logic
- Create new utility: `src/utils/messageFiltering.ts`

#### Task 1.2: Two-Column Layout Structure
**Priority**: Critical
**Estimated Time**: 6-8 hours

**Objective**: Implement the exact two-column layout with decoration and content sections

**Requirements**:
- Left column: Icon + vertical separator bar
- Right column: Dynamic content based on part type
- Proper spacing and alignment matching web implementation
- Icon mapping for each tool/part type

**Implementation Steps**:
1. Restructure message layout to use two-column design
2. Create decoration column component
3. Add icon mapping system for all part types
4. Implement vertical separator bar styling
5. Update content column to be flexible width

**Files to Create**:
- `src/components/chat/MessageDecoration.tsx`
- `src/components/chat/MessageContent.tsx`
- `src/components/icons/` - Icon components for each tool type

**Files to Modify**:
- `app/(tabs)/chat.tsx` - Update layout structure

#### Task 1.3: Part Type Component System
**Priority**: Critical
**Estimated Time**: 8-10 hours

**Objective**: Create individual components for each part type with specific rendering logic

**Requirements**:
- Separate component for each part type (text, tool, file, reasoning, etc.)
- Dynamic component selection based on part type
- Consistent interface for expand/collapse functionality
- Proper typing for all part types

**Implementation Steps**:
1. Create base `MessagePart` component
2. Create specific components for each part type:
   - `TextPart` - Text content with expand/collapse
   - `ToolPart` - Tool execution results
   - `FilePart` - File attachments
   - `ReasoningPart` - AI thinking process
   - `StepPart` - AI model transitions
3. Implement dynamic component mapping
4. Add proper TypeScript interfaces

**Files to Create**:
- `src/components/chat/parts/TextPart.tsx`
- `src/components/chat/parts/ToolPart.tsx`
- `src/components/chat/parts/FilePart.tsx`
- `src/components/chat/parts/ReasoningPart.tsx`
- `src/components/chat/parts/StepPart.tsx`
- `src/components/chat/parts/MessagePart.tsx`

### Phase 2: Content Rendering Components

#### Task 2.1: Expandable Content System
**Priority**: High
**Estimated Time**: 6-8 hours

**Objective**: Implement expand/collapse functionality for all content types

**Requirements**:
- Auto-expand last message part
- Manual expand/collapse for other parts
- Different collapse rules for different content types
- Smooth animations for expand/collapse
- "Show more/less" button positioning

**Implementation Steps**:
1. Create `useExpandable` hook
2. Implement overflow detection for React Native
3. Add expand/collapse state management
4. Create reusable expand button component
5. Apply different line limits per content type

**Files to Create**:
- `src/hooks/useExpandable.ts`
- `src/components/chat/ExpandButton.tsx`

#### Task 2.2: Text Content Component
**Priority**: High
**Estimated Time**: 4-5 hours

**Objective**: Create text content component with proper expand/collapse

**Requirements**:
- Plain text rendering for user messages
- Markdown rendering for assistant messages
- Line clamping at 3 lines when collapsed
- Auto-expand for last message part
- Proper typography matching web implementation

**Implementation Steps**:
1. Create `TextContent` component
2. Add markdown rendering capability using react-native-markdown-display
3. Implement line clamping logic
4. Add expand/collapse functionality
5. Style text according to message role

**Files to Create**:
- `src/components/chat/content/TextContent.tsx`

#### Task 2.3: Code Content Component
**Priority**: High
**Estimated Time**: 6-8 hours

**Objective**: Create code block component with syntax highlighting

**Requirements**:
- Syntax highlighting matching web implementation
- Copy-to-clipboard functionality
- Language detection
- Always fully visible (no line clamping)
- Dark/light theme support

**Implementation Steps**:
1. Research React Native syntax highlighting options
2. Create `CodeContent` component
3. Implement language detection
4. Add copy functionality using react-native-clipboard
5. Style code blocks to match web design

**Files to Create**:
- `src/components/chat/content/CodeContent.tsx`

#### Task 2.4: Terminal/Bash Content Component
**Priority**: High
**Estimated Time**: 5-6 hours

**Objective**: Create terminal output component

**Requirements**:
- Terminal-style styling with header
- Command display in header
- Stdout/stderr content
- Collapsed after 7 lines with expand
- Terminal window decoration (3 dots)

**Implementation Steps**:
1. Create `TerminalContent` component
2. Add terminal window styling with header
3. Implement command/output display
4. Add expand/collapse for long output
5. Style to match terminal appearance

**Files to Create**:
- `src/components/chat/content/TerminalContent.tsx`

#### Task 2.5: Tool Results Component
**Priority**: Medium
**Estimated Time**: 4-5 hours

**Objective**: Create collapsible tool results display

**Requirements**:
- Collapsed by default with "Show results" button
- Count indicators (e.g., "5 matches")
- Error states always expanded
- Different styling per tool type

**Implementation Steps**:
1. Create `ToolResults` component
2. Add collapsible results container
3. Implement result count display
4. Add error state handling
5. Style per tool type variations

**Files to Create**:
- `src/components/chat/content/ToolResults.tsx`

### Phase 3: Styling System

#### Task 3.1: Color System Implementation
**Priority**: Critical
**Estimated Time**: 3-4 hours

**Objective**: Implement exact color system from web implementation

**Requirements**:
- CSS custom properties equivalent for React Native
- Exact color values matching web implementation
- Dark/light theme support
- Consistent color usage across components

**Implementation Steps**:
1. Create color system constants
2. Map web CSS custom properties to React Native values
3. Implement theme context for color switching
4. Update all components to use design tokens

**Files to Create**:
- `src/styles/colors.ts`
- `src/styles/themes.ts`
- `src/contexts/ThemeContext.tsx`

#### Task 3.2: Typography System
**Priority**: High
**Estimated Time**: 2-3 hours

**Objective**: Match exact typography from web implementation

**Requirements**:
- Font sizes matching web (with React Native adjustments)
- Line heights and letter spacing
- Font weights and families
- Responsive text sizing

**Implementation Steps**:
1. Create typography constants
2. Map web font sizes to React Native equivalents
3. Add responsive font scaling
4. Update all text components

**Files to Create**:
- `src/styles/typography.ts`

#### Task 3.3: Layout and Spacing System
**Priority**: High
**Estimated Time**: 3-4 hours

**Objective**: Implement exact spacing and layout matching web

**Requirements**:
- Gap and padding values matching web
- Two-column layout proportions
- Responsive spacing adjustments
- Component spacing consistency

**Implementation Steps**:
1. Create spacing constants
2. Map web spacing to React Native values
3. Update all component layouts
4. Add responsive spacing logic

**Files to Create**:
- `src/styles/spacing.ts`
- `src/styles/layout.ts`

### Phase 4: Advanced Features

#### Task 4.1: Last Message Logic
**Priority**: Medium
**Estimated Time**: 2-3 hours

**Objective**: Implement "last message part" auto-expansion logic

**Requirements**:
- Detect last message in conversation
- Detect last part in message
- Auto-expand last part content
- Show completion timestamp on last assistant message

**Implementation Steps**:
1. Add last message detection logic
2. Update expand/collapse to respect last message state
3. Add completion timestamp display
4. Update message rendering logic

#### Task 4.2: Icon System
**Priority**: Medium
**Estimated Time**: 4-5 hours

**Objective**: Implement comprehensive icon system for all part types

**Requirements**:
- Icon for each tool type (bash, edit, write, read, grep, etc.)
- User/assistant role icons
- Provider icons for AI models
- Consistent icon sizing and styling

**Implementation Steps**:
1. Source or create icons for all tool types
2. Create icon mapping system
3. Add provider detection logic
4. Implement icon components
5. Update decoration column to use icons

**Files to Create**:
- `src/components/icons/ToolIcons.tsx`
- `src/components/icons/ProviderIcons.tsx`
- `src/utils/iconMapping.ts`

#### Task 4.3: Anchor Links and Deep Linking
**Priority**: Low
**Estimated Time**: 3-4 hours

**Objective**: Implement anchor links for message parts

**Requirements**:
- Unique ID generation for each part
- Scroll-to functionality
- Copy link to clipboard
- URL hash navigation

**Implementation Steps**:
1. Add unique ID generation for parts
2. Implement scroll-to functionality
3. Add anchor link components
4. Create copy-to-clipboard for links

#### Task 4.4: Connection Status Indicators
**Priority**: Medium
**Estimated Time**: 2-3 hours

**Objective**: Add visual connection status indicators

**Requirements**:
- Connected, connecting, error states
- Colored dot indicators
- Status text display
- Real-time status updates

**Implementation Steps**:
1. Create status indicator component
2. Add status dot with colors
3. Implement status text display
4. Connect to connection context

**Files to Create**:
- `src/components/chat/ConnectionStatus.tsx`

### Phase 5: Content Processing

#### Task 5.1: Markdown Rendering
**Priority**: High
**Estimated Time**: 4-5 hours

**Objective**: Implement markdown rendering for assistant messages

**Requirements**:
- Full markdown support
- Code block syntax highlighting within markdown
- Link handling
- Proper styling matching web implementation

**Implementation Steps**:
1. Install and configure react-native-markdown-display
2. Create custom markdown renderer
3. Add syntax highlighting for code blocks
4. Style markdown elements
5. Handle link interactions

#### Task 5.2: Message State Management
**Priority**: Medium
**Estimated Time**: 3-4 hours

**Objective**: Improve message state handling to match web implementation

**Requirements**:
- Real-time part updates
- Message sorting by timestamp
- Efficient re-rendering
- State synchronization

**Implementation Steps**:
1. Update connection context for part-level updates
2. Add message sorting logic
3. Optimize re-rendering performance
4. Add state reconciliation

### Phase 6: Testing and Polish

#### Task 6.1: Component Testing
**Priority**: Medium
**Estimated Time**: 4-6 hours

**Objective**: Add comprehensive testing for all new components

**Requirements**:
- Unit tests for all new components
- Integration tests for message rendering
- Snapshot tests for styling consistency
- Performance testing

**Implementation Steps**:
1. Set up testing framework if not present
2. Write unit tests for each component
3. Add integration tests
4. Create snapshot tests
5. Performance optimization testing

#### Task 6.2: Cross-Platform Testing
**Priority**: High
**Estimated Time**: 3-4 hours

**Objective**: Ensure consistent behavior across iOS, Android, and Web

**Requirements**:
- Test on iOS simulator/device
- Test on Android emulator/device
- Test web build if supported
- Fix platform-specific issues

**Implementation Steps**:
1. Test on iOS devices/simulators
2. Test on Android devices/emulators
3. Document platform differences
4. Fix platform-specific styling issues

#### Task 6.3: Performance Optimization
**Priority**: Medium
**Estimated Time**: 2-3 hours

**Objective**: Optimize performance for large chat sessions

**Requirements**:
- Efficient message rendering
- Memory usage optimization
- Smooth scrolling performance
- Lazy loading for long conversations

**Implementation Steps**:
1. Profile current performance
2. Implement virtualization if needed
3. Optimize re-rendering
4. Add lazy loading for media content

## Timeline and Priorities

### Week 1: Core Architecture (Critical Path)
- Task 1.1: Message Part Filtering System
- Task 1.2: Two-Column Layout Structure  
- Task 1.3: Part Type Component System

### Week 2: Content Rendering
- Task 2.1: Expandable Content System
- Task 2.2: Text Content Component
- Task 2.3: Code Content Component

### Week 3: Styling and Advanced Features
- Task 3.1: Color System Implementation
- Task 3.2: Typography System
- Task 3.3: Layout and Spacing System
- Task 2.4: Terminal/Bash Content Component

### Week 4: Polish and Testing
- Task 4.1: Last Message Logic
- Task 4.2: Icon System
- Task 4.4: Connection Status Indicators
- Task 6.1: Component Testing
- Task 6.2: Cross-Platform Testing

## Dependencies and Packages

### Required Package Installations
```bash
expo install react-native-markdown-display
expo install react-native-syntax-highlighter
expo install @react-native-clipboard/clipboard
expo install react-native-svg
```

### New File Structure
```
src/
├── components/
│   ├── chat/
│   │   ├── parts/
│   │   │   ├── TextPart.tsx
│   │   │   ├── ToolPart.tsx
│   │   │   ├── FilePart.tsx
│   │   │   ├── ReasoningPart.tsx
│   │   │   ├── StepPart.tsx
│   │   │   └── MessagePart.tsx
│   │   ├── content/
│   │   │   ├── TextContent.tsx
│   │   │   ├── CodeContent.tsx
│   │   │   ├── TerminalContent.tsx
│   │   │   └── ToolResults.tsx
│   │   ├── MessageDecoration.tsx
│   │   ├── MessageContent.tsx
│   │   ├── ExpandButton.tsx
│   │   └── ConnectionStatus.tsx
│   └── icons/
│       ├── ToolIcons.tsx
│       └── ProviderIcons.tsx
├── hooks/
│   └── useExpandable.ts
├── styles/
│   ├── colors.ts
│   ├── themes.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── layout.ts
├── utils/
│   ├── messageFiltering.ts
│   └── iconMapping.ts
└── contexts/
    └── ThemeContext.tsx
```

## Success Criteria

### Visual Consistency
- [ ] Two-column layout matches web implementation exactly
- [ ] Color system matches web design tokens
- [ ] Typography matches web font sizes and spacing
- [ ] Icons match web implementation for all tool types

### Functional Consistency  
- [ ] Part filtering logic matches web behavior exactly
- [ ] Expand/collapse works for all content types
- [ ] Last message auto-expansion works correctly
- [ ] Tool results display correctly with proper formatting

### Performance
- [ ] Smooth scrolling in large conversations
- [ ] Efficient re-rendering on message updates
- [ ] No memory leaks or performance degradation

### Cross-Platform
- [ ] Consistent behavior on iOS and Android
- [ ] Proper responsive design adaptation
- [ ] All features work on both platforms

## Risk Mitigation

### Technical Risks
1. **React Native Limitations**: Some web CSS features may not translate directly
   - **Mitigation**: Research React Native alternatives early and create fallback solutions

2. **Performance Issues**: Complex layouts may impact performance
   - **Mitigation**: Implement performance monitoring and optimization from the start

3. **Package Compatibility**: Required packages may not work with current Expo version
   - **Mitigation**: Test package compatibility early and find alternatives if needed

### Timeline Risks
1. **Scope Creep**: Additional features may be requested during implementation
   - **Mitigation**: Stick to documented requirements and track scope changes

2. **Technical Blockers**: Unexpected technical challenges may delay progress
   - **Mitigation**: Build buffer time into estimates and prioritize critical path items

## Notes for Implementation

### Key Principles
1. **Exact Replication**: Match web implementation as closely as possible
2. **Component Reusability**: Create reusable components for common patterns
3. **Performance First**: Optimize for smooth performance on mobile devices
4. **Accessibility**: Ensure proper accessibility support throughout
5. **Testing**: Comprehensive testing to prevent regressions

### Important Considerations
- React Native has different layout and styling paradigms than web CSS
- Touch interactions should be optimized for mobile devices
- Text rendering and line clamping work differently in React Native
- Animation and transition support may be limited compared to web
- File system access and clipboard functionality require native permissions

This plan provides a comprehensive roadmap for transforming the current chat implementation to match the sophisticated opencode web chat interface while adapting it appropriately for the React Native mobile environment.