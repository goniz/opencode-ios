# Session Switching Race Condition Fix - Implementation Plan

## Overview

This document outlines a comprehensive plan to fix race conditions that occur when switching between chat sessions, where messages from one session can incorrectly appear in another session's chat interface.

## Problem Analysis

### Root Causes Identified

1. **Session Creation and Navigation Race Condition** (`sessions.tsx:94-117`)
   - Sequence: create session → refresh sessions → navigate to chat
   - Navigation can occur before session list refresh completes
   - Chat screen may not find the new session in the sessions array

2. **Chat Screen Session Loading Race Condition** (`chat.tsx:90-101`)
   - Chat screen waits for both `sessionId` param AND `sessions.length > 0`
   - If navigation happens before sessions load, `setCurrentSession` is not called
   - Previous session remains active while messages load for new session

3. **Message Loading State Race Condition** (`chat.tsx:304-316`)
   - `loadMessages` uses `currentSession.id` but validates against `loadedSessionId`
   - Async operations can complete out of order
   - Messages can be loaded for wrong session

4. **Stream Event Processing Race Condition** (`ConnectionContext.tsx:174-176`)
   - Stream events filter by `currentSession.id`
   - Timing window exists where new session is created but old session is still current
   - Stream events for old session continue processing and appear in new session

5. **State Management Clear/Load Race Condition** (`ConnectionContext.tsx:124-130`)
   - `SET_CURRENT_SESSION` clears messages immediately
   - Pending `loadMessages` operations can populate messages after clear
   - Results in stale messages appearing in new session

## Implementation Plan

### Phase 1: Immediate Fixes (High Priority)

#### 1.1 Add Session Validation to Message Loading ✅ **COMPLETED**

**File**: `src/contexts/ConnectionContext.tsx`

**Status**: ✅ Implemented - Added early validation, post-async validation, and session validation in SET_MESSAGES action

**Changes**:
- Add session validation in `loadMessages` callback
- Abort loading if session changes during operation
- Add request cancellation for pending operations

```typescript
const loadMessages = useCallback(async (sessionId: string): Promise<void> => {
  if (!state.client || state.connectionStatus !== 'connected') {
    throw new Error('Not connected to server');
  }

  // Early validation
  if (state.currentSession?.id !== sessionId) {
    console.log('Session changed before load started, aborting');
    return;
  }

  try {
    dispatch({ type: 'SET_LOADING_MESSAGES', payload: { isLoading: true } });
    
    const response = await sessionMessages({ 
      client: state.client, 
      path: { id: sessionId } 
    });
    
    // Validate session hasn't changed during async operation
    if (state.currentSession?.id !== sessionId) {
      console.log('Session changed during load, aborting message set');
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: { isLoading: false } });
      return;
    }
    
    if (response.data) {
      dispatch({ type: 'SET_MESSAGES', payload: { messages: response.data, sessionId } });
    }
  } catch (error) {
    console.error('Failed to load messages:', error);
    dispatch({ type: 'SET_LOADING_MESSAGES', payload: { isLoading: false } });
    throw error;
  }
}, [state.client, state.connectionStatus, state.currentSession]);
```

#### 1.2 Update State Management Actions ✅ **COMPLETED**

**File**: `src/contexts/ConnectionContext.tsx`

**Status**: ✅ Implemented - Enhanced SET_MESSAGES reducer with session validation to prevent stale operations

**Changes**:
- Add session validation to state reducer actions
- Prevent stale operations from affecting current session

```typescript
// Update SET_MESSAGES action to include session validation
case 'SET_MESSAGES':
  // Only set messages if they're for the current session
  if (state.currentSession && action.payload.sessionId && 
      state.currentSession.id !== action.payload.sessionId) {
    console.log('Ignoring messages for wrong session:', action.payload.sessionId);
    return { ...state, isLoadingMessages: false };
  }
  return {
    ...state,
    messages: action.payload.messages,
    isLoadingMessages: false,
  };
```

#### 1.3 Fix Chat Screen Session Detection ✅ **COMPLETED**

**File**: `app/(tabs)/chat.tsx`

**Status**: ✅ Implemented - Removed sessions.length dependency, added refresh logic, improved validation

**Changes**:
- Remove dependency on `sessions.length > 0`
- Add timeout for session detection
- Improve session validation logic

```typescript
// Handle session ID from navigation parameters
useEffect(() => {
  if (sessionId) {
    console.log('Chat screen - sessionId from params:', sessionId);
    
    // Try to find session in current sessions
    const targetSession = sessions.find(s => s.id === sessionId);
    
    if (targetSession && (!currentSession || currentSession.id !== sessionId)) {
      console.log('Chat screen - Setting session from params:', targetSession.id, targetSession.title);
      setCurrentSession(targetSession);
    } else if (!targetSession && sessions.length > 0) {
      // If session not found but we have sessions, it might be a new session
      // Wait a short time for sessions to refresh, then try again
      console.warn('Session not found in current list, requesting refresh');
      refreshSessions().then(() => {
        const refreshedSession = sessions.find(s => s.id === sessionId);
        if (refreshedSession) {
          setCurrentSession(refreshedSession);
        } else {
          console.error('Session still not found after refresh:', sessionId);
        }
      });
    }
  }
}, [sessionId, sessions, currentSession, setCurrentSession, refreshSessions]);
```

### Phase 2: Enhanced Stream Event Handling (Medium Priority) ✅ **COMPLETED**

#### 2.1 Add Stream Event Session Validation ✅ **COMPLETED**

**File**: `src/contexts/ConnectionContext.tsx`

**Status**: ✅ Implemented - Added session validation for message-related stream events and event queuing during transitions

**Changes**:
- Add explicit session validation to all stream event handlers
- Implement event queuing for session transitions

```typescript
// Enhanced stream event handler with session validation
const handleStreamEvent = (eventData: StreamEventData) => {
  console.log('Processing stream event:', eventData.type);
  
  // Extract session ID from event data
  const eventSessionId = eventData.properties?.info?.sessionID || 
                         eventData.properties?.part?.sessionID ||
                         eventData.properties?.sessionID;
  
  // Validate against current session for message-related events
  const messageEvents = ['message.updated', 'message.part.updated', 'message.removed', 'message.part.removed'];
  if (messageEvents.includes(eventData.type) && eventSessionId) {
    if (!state.currentSession || state.currentSession.id !== eventSessionId) {
      console.log(`Ignoring ${eventData.type} for different session:`, eventSessionId, 'current:', state.currentSession?.id);
      return;
    }
  }
  
  // Existing switch statement...
};
```

#### 2.2 Implement Session Transition State ✅ **COMPLETED**

**File**: `src/contexts/ConnectionContext.tsx`

**Status**: ✅ Implemented - Added sessionTransition state, transition actions, and event queuing during session switches

**Changes**:
- Add transition state to prevent race conditions
- Queue events during transitions

```typescript
interface ConnectionState {
  // ... existing fields
  sessionTransition: {
    inProgress: boolean;
    fromSessionId: string | null;
    toSessionId: string | null;
    queuedEvents: StreamEventData[];
  };
}

// Add transition management actions
type ConnectionAction =
  // ... existing actions
  | { type: 'START_SESSION_TRANSITION'; payload: { fromSessionId: string | null; toSessionId: string } }
  | { type: 'END_SESSION_TRANSITION' }
  | { type: 'QUEUE_EVENT'; payload: { event: StreamEventData } };
```

### Phase 3: Robust Session Creation (Medium Priority) ✅ **COMPLETED**

#### 3.1 Improve Session Creation Flow ✅ **COMPLETED**

**File**: `app/(tabs)/sessions.tsx`

**Status**: ✅ Implemented - Added optimistic session updates, session verification, and improved error handling

**Changes**:
- Add proper error handling and retry logic
- Ensure session is available before navigation

```typescript
const handleNewChat = async () => {
  if (connectionStatus !== 'connected' || !client) {
    Alert.alert('No Connection', 'Please connect to a server first');
    router.push('/(tabs)');
    return;
  }

  try {
    console.log('Creating new session...');
    const response = await sessionCreate({ client });
    
    if (response.error) {
      console.error('Session creation error:', response.error);
      throw new Error(`Failed to create session: ${JSON.stringify(response.error)}`);
    }

    if (response.data) {
      const newSession = response.data;
      console.log('New session created:', newSession.id, newSession.title);
      
      // Optimistically add the session to local state
      const updatedSessions = [...sessions, newSession];
      // This would require exposing a method from ConnectionContext
      
      // Refresh sessions list to ensure consistency
      await loadSessions();
      
      // Verify session exists before navigation
      const verifiedSession = sessions.find(s => s.id === newSession.id);
      if (verifiedSession) {
        console.log('Navigating to verified session:', verifiedSession.id);
        router.push(`/(tabs)/chat?sessionId=${verifiedSession.id}`);
      } else {
        // Fallback: navigate anyway and let chat screen handle the wait
        console.log('Session not yet in list, navigating anyway');
        router.push(`/(tabs)/chat?sessionId=${newSession.id}`);
      }
    }
  } catch (error) {
    console.error('Error creating session:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to create session';
    toast.showError('Failed to create chat', errorMsg);
  }
};
```

### Phase 4: Advanced State Management (Low Priority)

#### 4.1 Implement Per-Session Message Loading State

**File**: `src/contexts/ConnectionContext.tsx`

**Changes**:
- Track loading state per session
- Prevent multiple concurrent loads for same session

```typescript
interface ConnectionState {
  // ... existing fields
  loadingMessagesBySession: { [sessionId: string]: boolean };
}

// Update actions to support per-session loading
case 'SET_LOADING_MESSAGES':
  return {
    ...state,
    loadingMessagesBySession: {
      ...state.loadingMessagesBySession,
      [action.payload.sessionId]: action.payload.isLoading
    }
  };
```

#### 4.2 Add Operation Cancellation

**File**: `src/contexts/ConnectionContext.tsx`

**Changes**:
- Implement AbortController for canceling operations
- Cancel pending operations when session changes

```typescript
const loadMessages = useCallback(async (sessionId: string, signal?: AbortSignal): Promise<void> => {
  // ... existing validation
  
  try {
    dispatch({ type: 'SET_LOADING_MESSAGES', payload: { isLoading: true, sessionId } });
    
    const response = await sessionMessages({ 
      client: state.client, 
      path: { id: sessionId },
      signal // Pass abort signal to API call
    });
    
    // Check if operation was cancelled
    if (signal?.aborted) {
      console.log('Load messages operation was cancelled');
      return;
    }
    
    // ... rest of implementation
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Load messages operation was aborted');
      return;
    }
    // ... existing error handling
  }
}, []);

// Track active operations for cancellation
const activeOperationsRef = useRef<{ [sessionId: string]: AbortController }>({});

const setCurrentSession = useCallback((session: Session | null): void => {
  // Cancel any pending operations for previous session
  if (state.currentSession && activeOperationsRef.current[state.currentSession.id]) {
    activeOperationsRef.current[state.currentSession.id].abort();
    delete activeOperationsRef.current[state.currentSession.id];
  }
  
  // ... existing implementation
}, []);
```

## Testing Strategy

### 4.1 Unit Tests

**File**: `__tests__/session-switching-race-conditions.test.tsx`

**Test Cases**:
- Rapid session switching doesn't leak messages
- Stream events during session transition are handled correctly
- Message loading cancellation works properly
- Session creation and navigation timing

### 4.2 Integration Tests

**Test Scenarios**:
- Create new session → immediate navigation → verify no message leakage
- Switch sessions rapidly → verify final state consistency
- Network delay simulation → verify race condition handling
- Stream reconnection during session switch

### 4.3 Manual Testing Protocol

1. **Basic Race Condition Test**:
   - Create new session
   - Immediately navigate to different session
   - Verify no messages leak between sessions

2. **Stream Event Test**:
   - Have active generation in session A
   - Switch to session B
   - Verify session A events don't appear in session B

3. **Network Delay Test**:
   - Simulate slow network conditions
   - Perform rapid session switches
   - Verify eventual consistency

## Implementation Timeline

### Week 1: Phase 1 (Critical Fixes)
- Day 1-2: Implement message loading validation
- Day 3-4: Update state management actions  
- Day 5: Fix chat screen session detection

### Week 2: Phase 2 (Stream Handling)
- Day 1-3: Implement stream event session validation
- Day 4-5: Add session transition state management

### Week 3: Phase 3 (Session Creation)
- Day 1-3: Improve session creation flow
- Day 4-5: Add error handling and retry logic

### Week 4: Phase 4 & Testing
- Day 1-2: Implement advanced state management
- Day 3-4: Write comprehensive tests
- Day 5: Manual testing and bug fixes

## Risk Assessment

### High Risk
- **State Management Changes**: Core reducer modifications could introduce new bugs
- **Stream Event Handling**: Complex async logic with multiple edge cases

### Medium Risk  
- **Navigation Timing**: Router behavior on different platforms may vary
- **API Call Cancellation**: AbortController support across all environments

### Low Risk
- **Session Creation Flow**: Mostly additive changes
- **Testing Implementation**: Low impact on existing functionality

## Success Criteria

1. **No Message Leakage**: Messages never appear in wrong session chat
2. **Consistent State**: Session switching results in predictable final state
3. **Performance**: No significant performance degradation
4. **Reliability**: Race conditions eliminated under normal and stress conditions
5. **Backwards Compatibility**: Existing functionality continues to work

## Monitoring and Rollback Plan

### Monitoring
- Add session validation logging to track race condition occurrences
- Monitor message loading success rates
- Track session switching performance metrics

### Rollback Strategy
- Feature flags for new session validation logic
- Ability to disable stream event queuing if issues arise
- Gradual rollout starting with internal testing

## Future Improvements

1. **State Machine**: Implement formal state machine for session lifecycle
2. **Optimistic Updates**: Add optimistic session creation for better UX
3. **Message Caching**: Cache messages per session to improve switching speed
4. **Background Sync**: Sync messages in background for inactive sessions