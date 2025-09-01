# Chat.tsx Refactoring Plan

## Overview
This document outlines a comprehensive plan to refactor the monolithic `app/(tabs)/chat.tsx` file (1,589 lines) into a clean composition of focused, reusable hooks and components.

## Current State Analysis
The `chat.tsx` file handles multiple concerns in a single component:
- Session management and navigation
- Provider/model selection with UI dialogs
- Message operations (sending, images, files)
- Command execution and built-in commands
- Chutes API integration and quota management
- Git status monitoring
- Token calculation and cost tracking
- UI state management (errors, URLs, status)
- Complex header rendering

## Existing Hooks & Components Available
Several hooks and components already exist that can replace parts of the current logic:

### Existing Hooks:
- `useModelSelection` - Provider/model management
- `useChutesIntegration` - Chutes quota and API key handling
- `useMessageOperations` - Message sending and image handling
- `useCommandExecution` - Command parsing and execution
- `useSessionManager` - Session lifecycle management
- `useConnectionRecovery` - Connection state management

### Existing Components:
- `ChatHeader` - Provider/model selectors, stream status, title
- `ChatInputBar` - Text input, send/interrupt buttons, image handling
- `ChatStatusBar` - Token info, Chutes quota, command status, session URL
- `ChatEmptyState` - No connection and no session states
- `ChatErrorBanner` - Error display with dismiss functionality
- `AttachMenu` - File/image attachment interface

## Proposed Refactoring Strategy

### Phase 1: High Impact Refactoring (~800+ lines reduction)

#### 1.1 Replace Inline Components with Existing Components (Lines 947-979, 1044-1169, 1171-1182, 1184-1202, 1219-1266)
**Current State**: Inline header, empty states, error banner, input bar rendering
**Target**: Use existing `ChatHeader`, `ChatEmptyState`, `ChatErrorBanner`, `ChatInputBar`, `ChatStatusBar`

**Status**: Components exist and are ready to use!

**Required Updates**:
- Fix TypeScript compatibility issues in `ChatHeader` (already identified)
- Integrate `ChatInputBar` with file attachment support
- Use `ChatStatusBar` for token/quota display
- Replace inline empty states with `ChatEmptyState`
- Replace inline error banner with `ChatErrorBanner`

**Expected Savings**: ~400 lines (massive reduction from component reuse)

#### 1.2 Model Selection Integration (Lines 185-360)
**Current State**: 150+ lines of inline provider/model management  
**Target**: Use enhanced `useModelSelection` hook + `ChatHeader` component

**Status**: Hook exists, `ChatHeader` has provider/model selection UI

**Required Updates**:
- Hook already has most functionality needed
- Fix TypeScript null/undefined compatibility
- Integrate with existing `ChatHeader` component

**Expected Savings**: ~150 lines

#### 1.3 Chutes Integration (Lines 225-292)
**Current State**: Inline Chutes quota and API key management
**Target**: Use existing `useChutesIntegration` hook + `ChatStatusBar`

**Status**: Both hook and component exist and are ready to use

**Expected Savings**: ~70 lines

#### 1.4 Message Operations Enhancement (Lines 499-641)  
**Current State**: Message sending, image handling, interrupt logic
**Target**: Use enhanced `useMessageOperations` hook + `ChatInputBar`

**Required Updates**:
- Add file attachment support to hook
- `ChatInputBar` already handles UI perfectly
- Add command detection logic

**Expected Savings**: ~140 lines

#### 1.5 Command Execution Integration (Lines 643-883)
**Current State**: Complex command handling and menu operations
**Target**: Use existing `useCommandExecution` hook

**Status**: Hook exists and handles most functionality

**Required Updates**:
- Add input text updating for commands with arguments
- Add session URL handling for share/unshare commands

**Expected Savings**: ~240 lines

### Phase 2: Medium Impact Refactoring (~270 lines reduction)

#### 2.1 Session Management Hook - `useSessionManagement`
**Extract**: Lines 147-415 (session loading, navigation, recovery)

```typescript
interface SessionManagementHook {
  loadedSessionId: string | null;
  previousConnectionStatus: ConnectionStatus;
  handleSessionChange: (sessionId: string) => void;
  handleConnectionRecovery: () => void;
  handleStreamReconnection: () => void;
}
```

**Features**:
- Session parameter handling from navigation
- Session loading with error recovery
- Connection status change handling
- Stream reconnection management

**Expected Savings**: ~100 lines

#### 2.2 File Attachments Hook - `useFileAttachments`
**Extract**: Lines 512-544 (file attachment logic)

```typescript
interface FileAttachmentsHook {
  attachedFiles: FilePartLike[];
  handleFileAttached: (file: FilePartLike) => void;
  handleFilesAttached: (files: FilePartLike[]) => void;
  handleRemoveFile: (index: number) => void;
  clearAttachedFiles: () => void;
}
```

**Features**:
- Individual file attachment handling
- Batch file attachment support
- File removal and clearing
- GitHub file parts integration

**Expected Savings**: ~30 lines

#### 2.3 Git Status Hook - `useGitStatus`
**Extract**: Lines 441-496 (git status fetching and management)

```typescript
interface GitStatusHook {
  gitStatus: GitStatusInfo | null;
  fetchGitStatus: () => Promise<void>;
  isRefreshing: boolean;
}
```

**Features**:
- Automatic git status fetching on connection
- Session idle event subscription
- Error handling and retry logic
- Loading state management

**Expected Savings**: ~50 lines

#### 2.4 Token Calculation Hook - `useTokenCalculation`
**Extract**: Lines 982-1041 (token counting and cost calculation)

```typescript
interface TokenCalculationHook {
  contextInfo: {
    currentTokens: number;
    maxTokens: number;
    percentage: number;
    sessionCost: number;
    isSubscriptionModel: boolean;
  } | null;
  formatTokenCount: (count: number) => string;
}
```

**Features**:
- Real-time token calculation from messages
- Cost tracking and formatting
- Context limit percentage calculation
- Subscription model detection

**Expected Savings**: ~60 lines

#### 2.5 UI State Management Hook - `useChatUIState`
**Extract**: Lines 101-111 + error handling (UI state management)

```typescript
interface ChatUIStateHook {
  dismissedErrors: Set<string>;
  sessionUrl: string | null;
  commandStatus: string | null;
  handleDismissError: () => void;
  handleSessionUrlUpdate: (url: string | null) => void;
  setCommandStatus: (status: string | null) => void;
}
```

**Features**:
- Error dismissal tracking
- Session URL state management
- Command execution status
- Temporary status message handling

**Expected Savings**: ~30 lines

### Phase 3: Polish and Final Hooks (~100 lines reduction)

#### 3.1 Pan Gesture Hook - `usePanGesture`
**Extract**: Lines 116-141 (swipe navigation)

```typescript
interface PanGestureHook {
  panResponder: PanResponderInstance;
  handleSwipeNavigation: (direction: 'left' | 'right') => void;
}
```

**Features**:
- Swipe gesture recognition
- Haptic feedback integration
- Navigation integration
- Expo Go compatibility

**Expected Savings**: ~25 lines

#### 3.2 Loading State Hook - `useLoadingStates`
**Extract**: Lines 184-189 (loading message display)

```typescript
interface LoadingStatesHook {
  isLoadingMessages: boolean;
  LoadingComponent: React.ComponentType;
}
```

**Features**:
- Centralized loading state management
- Reusable loading UI component

**Expected Savings**: ~15 lines

#### 3.3 Final Cleanup
- Remove duplicate helper functions (formatTokenCount already in ChatStatusBar)
- Clean up unused imports and styles
- Consolidate remaining state management

**Expected Savings**: ~60 lines

## Implementation Priority

### Phase 1 Tasks (High Priority - 2-4 hours)
1. **Replace Inline Components (Immediate Win)**
   - Replace lines 947-979 with `<ChatEmptyState />`
   - Replace lines 1171-1182 with `<ChatErrorBanner />`  
   - Replace lines 1184-1202 with loading UI
   - Replace lines 1219-1266 with `<ChatInputBar />`
   - Fix `ChatHeader` TypeScript issues and integrate
   - Use `ChatStatusBar` for info display

2. **Integrate useChutesIntegration**
   - Hook is ready to use, no changes needed
   - `ChatStatusBar` already displays quota

3. **Fix useModelSelection integration**
   - Hook mostly ready, fix TypeScript compatibility
   - `ChatHeader` already has selection UI

4. **Enhance useMessageOperations**
   - Add file attachment support
   - `ChatInputBar` already handles UI

5. **Integrate useCommandExecution**
   - Hook is mostly ready
   - Add session URL handling

### Phase 2 Tasks (Medium Priority - 6-8 hours)
1. **Create useSessionManagement hook**
   - Extract session loading logic
   - Add navigation parameter handling
   - Test session switching

2. **Create useFileAttachments hook**
   - Extract file handling logic
   - Add batch attachment support
   - Test GitHub integration

3. **Create useGitStatus hook**
   - Extract git status fetching
   - Add session idle integration
   - Test status updates

4. **Create useTokenCalculation hook**
   - Extract token counting logic
   - Add cost calculation
   - Test with different models

5. **Create useChatUIState hook**
   - Extract UI state management
   - Add error handling
   - Test state persistence

### Phase 3 Tasks (Polish - 2-3 hours)
1. **Fix ChatHeader integration**
   - Remove duplicate header code
   - Fix TypeScript issues
   - Test header functionality

2. **Create usePanGesture hook**
   - Extract gesture handling
   - Test swipe navigation
   - Ensure Expo Go compatibility

## Expected Results

| Phase | Lines Before | Lines After | Reduction | Percentage |
|-------|-------------|-------------|-----------|------------|
| Current | 1,589 | 1,589 | 0 | 0% |
| Phase 1 | 1,589 | ~1,200 | ~390 | 25% |
| Phase 2 | ~1,200 | ~800 | ~400 | 50% total |
| Phase 3 | ~800 | ~500 | ~300 | 69% total |

**Final Target**: Reduce from 1,589 lines to ~500 lines (69% reduction)

**Note**: Revised estimates after thorough feature audit revealed existing components need significant fixes before integration.

## Benefits

### Maintainability
- Each concern isolated in dedicated hooks
- Clear separation of responsibilities
- Easier to debug and modify individual features
- Reduced cognitive load when working on specific functionality

### Reusability
- Hooks can be used in other chat implementations
- Logic can be shared across different screens
- Better code organization and DRY principles

### Testing
- Each hook can be unit tested independently
- Easier to mock dependencies for testing
- Better test coverage of individual features

### Type Safety
- Better TypeScript integration with proper interfaces
- Clearer API contracts between hooks
- Reduced any types and improved type inference

### Performance
- Potential for better memoization in focused hooks
- Reduced unnecessary re-renders
- Clearer dependency tracking

## File Structure After Refactoring

```
src/hooks/
├── index.ts                    # Export all hooks
├── useSessionManager.ts        # Existing
├── useModelSelection.ts        # Enhanced
├── useMessageOperations.ts     # Enhanced
├── useCommandExecution.ts      # Enhanced
├── useChutesIntegration.ts    # Existing
├── useConnectionRecovery.ts   # Existing
├── useSessionManagement.ts    # New
├── useFileAttachments.ts      # New
├── useGitStatus.ts            # New
├── useTokenCalculation.ts     # New
├── useChatUIState.ts         # New
└── usePanGesture.ts          # New

app/(tabs)/
└── chat.tsx                   # Refactored (~570 lines)
```

## Risk Assessment

### Low Risk
- Phases 1.1, 1.2: Using existing, tested hooks
- Phase 3.1: ChatHeader component already exists

### Medium Risk
- Phases 1.3, 1.4: Enhancing existing hooks (breaking changes possible)
- Phase 2.1-2.5: New hooks need thorough testing

### High Risk
- Integration testing across all phases
- Ensuring no functionality regression
- TypeScript compatibility across hook boundaries

## Success Metrics

1. **Code Reduction**: Achieve 60%+ line reduction
2. **Functionality**: All existing features work unchanged
3. **Performance**: No performance regression
4. **Type Safety**: Zero TypeScript errors
5. **Test Coverage**: All new hooks have unit tests
6. **Documentation**: All hooks have proper JSDoc comments

## Timeline Estimate
- **Phase 1**: 1-2 weeks
- **Phase 2**: 2-3 weeks  
- **Phase 3**: 1 week
- **Testing & Polish**: 1 week

**Total Estimated Time**: 5-7 weeks

## ⚠️ CRITICAL DISCOVERY: Existing Components Have Major Gaps

After **thorough feature audit** (documented in `docs/component-feature-audit.md`), the existing components and hooks have **significant missing functionality** and **cannot be used as drop-in replacements**.

### Key Issues Found:
- ❌ `ChatHeader` - Provider/model selection doesn't actually work (UI only, no state updates)
- ❌ `ChatInputBar` - Missing file attachment support and validation
- ❌ `ChatStatusBar` - Missing git status integration
- ❌ `useModelSelection` - No Alert.alert integration, incomplete selection logic
- ❌ `useMessageOperations` - Missing file attachments, command detection, GitHub integration
- ❌ `useCommandExecution` - Missing input text updates, session URL handling, revert support
- ❌ `useChutesIntegration` - Missing Alert.alert error handling

### Only Ready Components:
- ✅ `ChatEmptyState` - Complete and ready (~32 lines savings)
- ✅ `ChatErrorBanner` - Complete and ready (~11 lines savings)

### Revised Reality Check
- **Total immediate savings**: ~43 lines (not 1000+)  
- **Additional work required**: 335+ lines of missing features
- **Timeline**: 3-5 weeks (not 2-4 hours)

This refactoring will transform a monolithic component into a clean, maintainable, and reusable architecture while preserving all existing functionality. The discovery of existing components dramatically reduces implementation time and risk.