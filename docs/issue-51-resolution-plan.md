# Resolution Plan for Issue #51: Add Setting to Toggle "Thinking" Blocks Display

## Issue Summary
**Issue #51**: Users have requested the ability to hide "thinking" blocks in the opencode-ios application. These blocks show the internal thought process of the AI, but some users find them distracting and would prefer to see only the final response.

## Objective
Implement a user-configurable setting that allows toggling the visibility of "thinking" blocks in the application, providing users with control over their interface experience.

## Implementation Plan

### 1. Add User Preference Storage
- **Location**: UserDefaults (iOS standard for app preferences)
- **Key**: `showThinkingBlocks`
- **Type**: Boolean
- **Default Value**: `true` (maintain current behavior)

```swift
// UserDefaults extension
extension UserDefaults {
    private enum Keys {
        static let showThinkingBlocks = "showThinkingBlocks"
    }
    
    var showThinkingBlocks: Bool {
        get { bool(forKey: Keys.showThinkingBlocks) }
        set { set(newValue, forKey: Keys.showThinkingBlocks) }
    }
}
```

### 2. Update Settings Interface

#### 2.1 Settings View Model
- Add a published property to track the setting state
- Implement methods to read/write the preference

```swift
class SettingsViewModel: ObservableObject {
    @Published var showThinkingBlocks: Bool {
        didSet {
            UserDefaults.standard.showThinkingBlocks = showThinkingBlocks
        }
    }
    
    init() {
        self.showThinkingBlocks = UserDefaults.standard.showThinkingBlocks
    }
}
```

#### 2.2 Settings UI
- Add a new toggle switch in the Settings view
- Group under "Display Preferences" or similar section

```swift
Section("Display Preferences") {
    Toggle("Show Thinking Blocks", isOn: $viewModel.showThinkingBlocks)
        .accessibilityHint("Toggle to show or hide AI thinking process blocks")
}
```

### 3. Modify Message Rendering Logic

#### 3.1 Message View Component
- Check the user preference before rendering thinking blocks
- Apply conditional rendering based on the setting

```swift
struct MessageView: View {
    let message: Message
    @AppStorage("showThinkingBlocks") private var showThinkingBlocks = true
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if message.isThinkingBlock && !showThinkingBlocks {
                // Skip rendering if thinking blocks are hidden
                EmptyView()
            } else {
                // Normal message rendering
                MessageContent(message: message)
            }
        }
    }
}
```

#### 3.2 Message Stream Handler
- Filter out thinking blocks from the message stream if the setting is disabled
- Ensure smooth transitions when toggling the setting

### 4. Testing Plan

#### 4.1 Unit Tests
- Test UserDefaults storage and retrieval
- Test ViewModel property updates
- Test message filtering logic

#### 4.2 UI Tests
- Verify toggle appears in settings
- Test toggle state persistence
- Verify thinking blocks show/hide correctly

#### 4.3 Manual Testing Scenarios
1. **Fresh Install**: Verify default behavior (thinking blocks shown)
2. **Toggle Off**: Hide thinking blocks, verify they disappear
3. **Toggle On**: Show thinking blocks, verify they reappear
4. **App Restart**: Verify setting persists after app restart
5. **Mid-Conversation**: Test toggling during active conversation

### 5. Implementation Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Add UserDefaults storage | 1 hour |
| 2 | Update Settings UI | 2 hours |
| 3 | Implement message filtering | 3 hours |
| 4 | Write unit tests | 2 hours |
| 5 | UI testing | 2 hours |
| 6 | Code review & refinements | 1 hour |
| **Total** | | **11 hours** |

### 6. Potential Edge Cases & Considerations

1. **Performance**: Ensure filtering doesn't impact message rendering performance
2. **Accessibility**: Provide clear labels and hints for screen readers
3. **Migration**: Handle cases where users update from older versions
4. **Sync**: Consider if setting should sync across devices (via iCloud)
5. **Animation**: Smooth transitions when toggling the setting mid-conversation

### 7. Future Enhancements

- **Granular Control**: Allow filtering specific types of thinking blocks
- **Quick Toggle**: Add a quick toggle button in the conversation view
- **Export Options**: Include/exclude thinking blocks in conversation exports
- **Analytics**: Track user preference to understand usage patterns

## Success Criteria

- [ ] Setting appears in Settings view with clear labeling
- [ ] Thinking blocks can be toggled on/off
- [ ] Setting persists across app launches
- [ ] No performance degradation when filtering messages
- [ ] All tests pass (unit and UI)
- [ ] Accessibility requirements met
- [ ] Documentation updated

## References

- [Apple Human Interface Guidelines - Settings](https://developer.apple.com/design/human-interface-guidelines/settings)
- [UserDefaults Documentation](https://developer.apple.com/documentation/foundation/userdefaults)
- [SwiftUI Toggle Documentation](https://developer.apple.com/documentation/swiftui/toggle)