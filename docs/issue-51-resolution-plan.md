# Resolution Plan for Issue #51: Add Setting to Toggle "Thinking" Blocks Display

## Issue Summary
**Issue #51**: Users have requested the ability to hide "thinking" blocks in the opencode-ios application. These blocks show the internal thought process of the AI, but some users find them distracting and would prefer to see only the final response.

## Objective
Implement a user-configurable setting that allows toggling the visibility of "thinking" blocks in the React Native application, providing users with control over their interface experience.

## Technology Stack
- **Framework**: React Native with TypeScript
- **Development Platform**: Expo
- **State Management**: React Context/Hooks
- **Storage**: AsyncStorage (Expo SecureStore for sensitive data)

## Implementation Plan

### 1. Add User Preference Storage
- **Location**: AsyncStorage (React Native standard for app preferences)
- **Key**: `@opencode/showThinkingBlocks`
- **Type**: Boolean
- **Default Value**: `true` (maintain current behavior)

```typescript
// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SHOW_THINKING_BLOCKS: '@opencode/showThinkingBlocks',
} as const;

export const StorageService = {
  async getShowThinkingBlocks(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.SHOW_THINKING_BLOCKS);
      return value === null ? true : JSON.parse(value);
    } catch (error) {
      console.error('Error reading thinking blocks preference:', error);
      return true; // Default to showing
    }
  },

  async setShowThinkingBlocks(show: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SHOW_THINKING_BLOCKS,
        JSON.stringify(show)
      );
    } catch (error) {
      console.error('Error saving thinking blocks preference:', error);
    }
  },
};
```

### 2. Create Settings Context

#### 2.1 Settings Context Provider
```typescript
// src/contexts/SettingsContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StorageService } from '../utils/storage';

interface SettingsContextType {
  showThinkingBlocks: boolean;
  toggleShowThinkingBlocks: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showThinkingBlocks, setShowThinkingBlocks] = useState(true);

  useEffect(() => {
    // Load saved preference on mount
    StorageService.getShowThinkingBlocks().then(setShowThinkingBlocks);
  }, []);

  const toggleShowThinkingBlocks = async () => {
    const newValue = !showThinkingBlocks;
    setShowThinkingBlocks(newValue);
    await StorageService.setShowThinkingBlocks(newValue);
  };

  return (
    <SettingsContext.Provider value={{ showThinkingBlocks, toggleShowThinkingBlocks }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
```

### 3. Update Settings Screen

#### 3.1 Settings Screen Component
```typescript
// src/screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

export const SettingsScreen: React.FC = () => {
  const { showThinkingBlocks, toggleShowThinkingBlocks } = useSettings();

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display Preferences</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Thinking Blocks</Text>
            <Text style={styles.settingDescription}>
              Display AI's thinking process during responses
            </Text>
          </View>
          <Switch
            value={showThinkingBlocks}
            onValueChange={toggleShowThinkingBlocks}
            accessibilityLabel="Toggle thinking blocks visibility"
            accessibilityHint="When enabled, shows the AI's thought process"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
});
```

### 4. Modify Message Rendering Logic

#### 4.1 Message Component
```typescript
// src/components/Message.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

interface MessageProps {
  message: {
    id: string;
    content: string;
    isThinkingBlock: boolean;
    role: 'user' | 'assistant';
  };
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const { showThinkingBlocks } = useSettings();

  // Don't render thinking blocks if they're hidden
  if (message.isThinkingBlock && !showThinkingBlocks) {
    return null;
  }

  return (
    <View style={[
      styles.messageContainer,
      message.isThinkingBlock && styles.thinkingBlock,
      message.role === 'user' && styles.userMessage,
    ]}>
      <Text style={styles.messageText}>{message.content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  thinkingBlock: {
    backgroundColor: '#e8f4f8',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
});
```

#### 4.2 Message List Component
```typescript
// src/components/MessageList.tsx
import React from 'react';
import { FlatList } from 'react-native';
import { Message } from './Message';
import { useSettings } from '../contexts/SettingsContext';

interface MessageListProps {
  messages: Array<{
    id: string;
    content: string;
    isThinkingBlock: boolean;
    role: 'user' | 'assistant';
  }>;
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const { showThinkingBlocks } = useSettings();

  // Filter messages if thinking blocks are hidden
  const visibleMessages = showThinkingBlocks
    ? messages
    : messages.filter(msg => !msg.isThinkingBlock);

  return (
    <FlatList
      data={visibleMessages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Message message={item} />}
      inverted
    />
  );
};
```

### 5. Testing Plan

#### 5.1 Unit Tests
```typescript
// __tests__/storage.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../src/utils/storage';

jest.mock('@react-native-async-storage/async-storage');

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getShowThinkingBlocks returns true by default', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await StorageService.getShowThinkingBlocks();
    expect(result).toBe(true);
  });

  test('getShowThinkingBlocks returns stored value', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('false');
    const result = await StorageService.getShowThinkingBlocks();
    expect(result).toBe(false);
  });

  test('setShowThinkingBlocks saves value', async () => {
    await StorageService.setShowThinkingBlocks(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@opencode/showThinkingBlocks',
      'false'
    );
  });
});
```

#### 5.2 Component Tests
```typescript
// __tests__/Message.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Message } from '../src/components/Message';
import * as SettingsContext from '../src/contexts/SettingsContext';

jest.mock('../src/contexts/SettingsContext');

describe('Message Component', () => {
  test('renders thinking block when enabled', () => {
    jest.spyOn(SettingsContext, 'useSettings').mockReturnValue({
      showThinkingBlocks: true,
      toggleShowThinkingBlocks: jest.fn(),
    });

    const { queryByText } = render(
      <Message
        message={{
          id: '1',
          content: 'Thinking...',
          isThinkingBlock: true,
          role: 'assistant',
        }}
      />
    );

    expect(queryByText('Thinking...')).toBeTruthy();
  });

  test('hides thinking block when disabled', () => {
    jest.spyOn(SettingsContext, 'useSettings').mockReturnValue({
      showThinkingBlocks: false,
      toggleShowThinkingBlocks: jest.fn(),
    });

    const { queryByText } = render(
      <Message
        message={{
          id: '1',
          content: 'Thinking...',
          isThinkingBlock: true,
          role: 'assistant',
        }}
      />
    );

    expect(queryByText('Thinking...')).toBeNull();
  });
});
```

#### 5.3 Manual Testing Scenarios
1. **Fresh Install**: Verify default behavior (thinking blocks shown)
2. **Toggle Off**: Hide thinking blocks, verify they disappear immediately
3. **Toggle On**: Show thinking blocks, verify they reappear
4. **App Restart**: Kill app and restart, verify setting persists
5. **Mid-Conversation**: Test toggling during active conversation
6. **Platform Testing**: Test on both iOS and Android devices
7. **Performance**: Monitor FlatList performance with large message lists

### 6. Implementation Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Add AsyncStorage integration | 2 hours |
| 2 | Create Settings Context | 2 hours |
| 3 | Update Settings Screen UI | 3 hours |
| 4 | Implement message filtering | 3 hours |
| 5 | Write unit tests | 3 hours |
| 6 | Manual testing (iOS/Android) | 3 hours |
| 7 | Code review & refinements | 2 hours |
| **Total** | | **18 hours** |

### 7. App Integration

#### 7.1 App.tsx Setup
```typescript
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <SettingsProvider>
        <AppNavigator />
      </SettingsProvider>
    </NavigationContainer>
  );
}
```

#### 7.2 Dependencies to Add
```json
// package.json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "~1.17.0"
  }
}
```

### 8. Potential Edge Cases & Considerations

1. **Performance**: 
   - Use React.memo for Message component to prevent unnecessary re-renders
   - Consider virtualization for very long conversations

2. **Accessibility**: 
   - Ensure Switch component has proper labels
   - Test with screen readers (VoiceOver/TalkBack)

3. **Migration**: 
   - Handle AsyncStorage errors gracefully
   - Provide fallback for corrupted storage data

4. **Cross-Platform**: 
   - Test on both iOS and Android
   - Ensure consistent UI behavior across platforms

5. **State Management**: 
   - Consider moving to Redux/Zustand if app grows
   - Ensure context re-renders are optimized

### 9. Future Enhancements

- **Granular Control**: Allow filtering specific types of thinking blocks
- **Quick Toggle**: Add floating action button in conversation view
- **Export Options**: Include/exclude thinking blocks in conversation exports
- **Animations**: Add fade in/out transitions when toggling
- **Sync Settings**: Use Expo SecureStore for cloud sync capabilities

## Success Criteria

- [ ] Setting appears in Settings screen with Switch component
- [ ] Thinking blocks can be toggled on/off in real-time
- [ ] Setting persists across app launches via AsyncStorage
- [ ] No performance degradation when filtering messages
- [ ] All unit tests pass with >80% coverage
- [ ] Manual testing completed on iOS and Android
- [ ] Accessibility requirements met (VoiceOver/TalkBack)
- [ ] TypeScript types are properly defined
- [ ] No console errors or warnings

## References

- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [React Context Best Practices](https://react.dev/learn/passing-data-deeply-with-context)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)