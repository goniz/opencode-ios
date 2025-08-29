## Proposed Component Structure

### 1. **Custom Hooks Layer** (Extract business logic)

#### `hooks/useSessionManager.ts`
- Current session state
- Session loading/switching logic
- Session creation
- Session-specific operations (share, unshare, summarize, revert)
- Session URL management

#### `hooks/useModelSelection.ts`
- Provider/model selection state
- Available providers/models loading
- Session-scoped model tracking
- Model selection UI handlers

#### `hooks/useMessageOperations.ts`
- Message sending logic
- Image attachment handling
- Message loading
- Abort/interrupt functionality
- Scroll management coordination

#### `hooks/useCommandExecution.ts`
- Command parsing and execution
- Built-in command handlers
- Command status management
- Command menu actions

#### `hooks/useChutesIntegration.ts`
- Chutes quota fetching
- API key management
- Quota display logic
- API key dialog state

#### `hooks/useConnectionRecovery.ts`
- Connection status monitoring
- Stream reconnection handling
- Message reloading on recovery
- Error dismissal logic

### 2. **Component Layer** (UI Components)

#### `components/chat/ChatHeader.tsx`
```tsx
interface ChatHeaderProps {
  session: Session;
  connectionStatus: ConnectionStatus;
  isStreamConnected: boolean;
  isGenerating: boolean;
  currentProvider?: string;
  currentModel?: Model;
  onProviderSelect: () => void;
  onModelSelect: () => void;
  contextInfo?: ContextInfo;
  chutesQuota?: ChutesQuota;
  commandStatus?: string;
  sessionUrl?: string;
  onUrlCopy: () => void;
}
```

#### `components/chat/ChatEmptyState.tsx`
```tsx
interface ChatEmptyStateProps {
  connectionStatus: ConnectionStatus;
  currentSession: Session | null;
  sessionsCount: number;
}
```

#### `components/chat/ChatStatusBar.tsx`
```tsx
interface ChatStatusBarProps {
  contextInfo?: ContextInfo;
  chutesQuota?: ChutesQuota;
  commandStatus?: string;
  sessionUrl?: string;
  onUrlCopy: () => void;
}
```

#### `components/chat/ChatErrorBanner.tsx`
```tsx
interface ChatErrorBannerProps {
  error: string | null;
  isDismissed: boolean;
  onDismiss: () => void;
}
```

#### `components/chat/ChatInputBar.tsx`
```tsx
interface ChatInputBarProps {
  inputText: string;
  onTextChange: (text: string) => void;
  selectedImages: string[];
  onImageSelected: (uri: string) => void;
  onRemoveImage: (index: number) => void;
  onSend: () => void;
  onInterrupt: () => void;
  isGenerating: boolean;
  isSending: boolean;
  onCommandSelect: (command: CommandSuggestion) => void;
  onMenuCommandSelect: (command: BuiltInCommand | Command) => void;
  userCommands: Command[];
}
```

#### `components/chat/ModelSelectionDialogs.tsx`
```tsx
// Encapsulates Alert dialogs for provider/model selection
interface ModelSelectionDialogsProps {
  providers: Provider[];
  models: Model[];
  onProviderSelect: (id: string) => void;
  onModelSelect: (model: Model) => void;
}
```

### 3. **Main Container Component**

#### `ChatScreen.tsx` (Simplified)
```tsx
export default function ChatScreen() {
  // Router params
  const { sessionId } = useLocalSearchParams();
  
  // Connection context
  const connection = useConnection();
  
  // Custom hooks
  const sessionManager = useSessionManager(connection, sessionId);
  const modelSelection = useModelSelection(connection, sessionManager.currentSession);
  const messageOps = useMessageOperations(connection, sessionManager.currentSession);
  const commands = useCommandExecution(connection, sessionManager.currentSession);
  const chutes = useChutesIntegration(connection, modelSelection.currentModel);
  const recovery = useConnectionRecovery(connection, sessionManager.currentSession);
  
  // Simplified render
  if (!connection.connected) {
    return <ChatEmptyState connectionStatus="disconnected" ... />;
  }
  
  if (!sessionManager.currentSession) {
    return <ChatEmptyState currentSession={null} ... />;
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView ...>
        <ChatHeader
          session={sessionManager.currentSession}
          {...modelSelection}
          {...chutes}
          commandStatus={commands.status}
          sessionUrl={sessionManager.sessionUrl}
        />
        
        <ChatErrorBanner
          error={recovery.lastError}
          isDismissed={recovery.isDismissed}
          onDismiss={recovery.handleDismiss}
        />
        
        <ChatFlashList
          messages={messageOps.messages}
          isGenerating={messageOps.isGenerating}
          {...messageOps.scrollProps}
        />
        
        <ImagePreview
          images={messageOps.selectedImages}
          onRemoveImage={messageOps.handleRemoveImage}
        />
        
        <CrutesApiKeyInput
          visible={chutes.showApiKeyInput}
          onApiKeyProvided={chutes.handleApiKeyProvided}
          onCancel={chutes.handleCancel}
        />
        
        <ChatInputBar
          {...messageOps.inputProps}
          {...commands.inputProps}
          isGenerating={messageOps.isGenerating}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

### 4. **Utilities Layer**

#### `utils/chat/tokenCalculation.ts`
```tsx
export function calculateTokenInfo(messages: Message[], availableModels: Model[], currentModel?: Model) {
  // Extract token calculation logic
}

export function formatTokenCount(count: number): string {
  // Token formatting logic
}
```

#### `utils/chat/messageHelpers.ts`
```tsx
export function findLastAssistantMessage(messages: Message[]): AssistantMessage | null;
export function extractProviderModel(message: AssistantMessage): ProviderModel | null;
```

### 5. **Types & Interfaces**

#### `types/chat.ts`
```tsx
export interface ContextInfo {
  currentTokens: number;
  maxTokens: number;
  percentage: number;
  sessionCost: number;
  isSubscriptionModel: boolean;
}

export interface ChutesQuota {
  used: number;
  quota: number;
}

export interface ProviderModel {
  providerID: string;
  modelID: string;
}
```

## Migration Strategy

### Phase 1: Extract Utilities & Types
1. Create type definitions file
2. Extract token calculation utilities
3. Extract message helper functions

### Phase 2: Create Custom Hooks
1. Start with `useSessionManager` (core functionality)
2. Extract `useModelSelection`
3. Extract `useMessageOperations`
4. Continue with remaining hooks

### Phase 3: Create UI Components
1. Extract `ChatHeader` component
2. Extract `ChatEmptyState` component
3. Extract `ChatStatusBar` component
4. Extract remaining UI components

### Phase 4: Refactor Main Component
1. Integrate all custom hooks
2. Replace inline UI with components
3. Clean up remaining logic

### Phase 5: Testing & Optimization
1. Ensure all features work as before
2. Add unit tests for utilities and hooks
3. Optimize re-renders with React.memo where appropriate

## Benefits of This Structure

1. **Separation of Concerns**: Business logic in hooks, UI in components
2. **Testability**: Each hook and utility can be tested independently
3. **Reusability**: Components and hooks can be reused elsewhere
4. **Maintainability**: Smaller files are easier to understand and modify
5. **Performance**: Better optimization opportunities with focused components
6. **Type Safety**: Clear interfaces between components
7. **Debugging**: Easier to isolate issues in smaller components

## File Size Estimates

- Original: ~1500 lines
- New structure:
  - Main component: ~150 lines
  - Each hook: ~100-200 lines
  - Each UI component: ~50-100 lines
  - Utilities: ~50 lines each
  - Types: ~100 lines

This structure maintains all existing features while making the code much more manageable and maintainable.
