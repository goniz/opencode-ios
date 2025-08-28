# iOS Live Activity Implementation Plan - Issue #58

## Overview

This document outlines the implementation plan for adding iOS Live Activity support to the opencode-ios project. Live Activities will provide users with real-time updates on the Lock Screen and Dynamic Island during active sessions and content generation processes.

## Background

iOS Live Activities, introduced in iOS 16.1, allow apps to display real-time information on the Lock Screen and in the Dynamic Island (on supported devices). This feature is perfect for showing progress during:
- Active coding sessions
- Code generation processes
- File synchronization
- Build/compile operations

## Requirements

### System Requirements
- iOS 16.1 or later
- Xcode 14.1 or later
- ActivityKit framework

### Functional Requirements
1. Display real-time session status on Lock Screen
2. Show progress indicators for ongoing operations
3. Update activity state as session progresses
4. Support for Dynamic Island on compatible devices
5. Graceful handling of background updates
6. Clean dismissal when sessions complete

## Implementation Steps

### 1. Project Configuration

#### 1.1 Update Deployment Target
```xml
<!-- Update Info.plist -->
<key>NSSupportsLiveActivities</key>
<true/>
```

#### 1.2 Add ActivityKit Framework
- Navigate to project settings
- Select the app target
- Add ActivityKit framework under "Frameworks, Libraries, and Embedded Content"

#### 1.3 Enable Background Modes
- Enable "Background fetch" capability
- Enable "Remote notifications" if push updates are needed

### 2. Data Model Definition

#### 2.1 Create Activity Attributes
```swift
// SessionActivityAttributes.swift
import ActivityKit
import Foundation

struct SessionActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic content that updates during the activity
        var status: SessionStatus
        var progress: Double
        var currentFile: String?
        var operationCount: Int
        var lastUpdateTime: Date
    }
    
    // Static content that doesn't change
    var sessionID: String
    var sessionType: SessionType
    var startTime: Date
}

enum SessionStatus: String, Codable {
    case initializing = "Initializing..."
    case active = "Active"
    case processing = "Processing"
    case syncing = "Syncing"
    case generating = "Generating Code"
    case building = "Building"
    case completing = "Completing"
    case completed = "Completed"
    case error = "Error"
}

enum SessionType: String, Codable {
    case coding = "Coding Session"
    case generation = "Code Generation"
    case sync = "File Sync"
    case build = "Build Process"
}
```

### 3. UI Implementation

#### 3.1 Lock Screen View
```swift
// SessionLockScreenView.swift
import SwiftUI
import WidgetKit
import ActivityKit

struct SessionLockScreenView: View {
    let context: ActivityViewContext<SessionActivityAttributes>
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Image(systemName: iconForSessionType(context.attributes.sessionType))
                    .foregroundColor(.blue)
                Text(context.attributes.sessionType.rawValue)
                    .font(.headline)
                Spacer()
                Text(timeElapsed)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Status
            Text(context.state.status.rawValue)
                .font(.subheadline)
                .foregroundColor(.primary)
            
            // Progress Bar
            if context.state.progress > 0 {
                ProgressView(value: context.state.progress)
                    .progressViewStyle(.linear)
                    .tint(.blue)
            }
            
            // Current Operation
            if let currentFile = context.state.currentFile {
                HStack {
                    Image(systemName: "doc.text")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(currentFile)
                        .font(.caption)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
            }
            
            // Operation Count
            if context.state.operationCount > 0 {
                Text("\(context.state.operationCount) operations completed")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    private var timeElapsed: String {
        let elapsed = Date().timeIntervalSince(context.attributes.startTime)
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = [.hour, .minute]
        formatter.unitsStyle = .abbreviated
        return formatter.string(from: elapsed) ?? ""
    }
    
    private func iconForSessionType(_ type: SessionType) -> String {
        switch type {
        case .coding: return "chevron.left.forwardslash.chevron.right"
        case .generation: return "wand.and.stars"
        case .sync: return "arrow.triangle.2.circlepath"
        case .build: return "hammer"
        }
    }
}
```

#### 3.2 Dynamic Island Views
```swift
// SessionDynamicIslandViews.swift
import SwiftUI
import WidgetKit
import ActivityKit

// Compact View
struct SessionCompactView: View {
    let context: ActivityViewContext<SessionActivityAttributes>
    
    var body: some View {
        HStack {
            Image(systemName: iconForSessionType(context.attributes.sessionType))
                .foregroundColor(.blue)
            if context.state.progress > 0 {
                ProgressView(value: context.state.progress)
                    .progressViewStyle(.circular)
                    .scaleEffect(0.7)
            } else {
                Text(context.state.status.rawValue)
                    .font(.caption2)
                    .lineLimit(1)
            }
        }
    }
}

// Expanded View
struct SessionExpandedView: View {
    let context: ActivityViewContext<SessionActivityAttributes>
    
    var body: some View {
        VStack(spacing: 4) {
            HStack {
                Label(context.attributes.sessionType.rawValue, 
                      systemImage: iconForSessionType(context.attributes.sessionType))
                    .font(.caption)
                    .foregroundColor(.blue)
                Spacer()
            }
            
            HStack {
                Text(context.state.status.rawValue)
                    .font(.caption2)
                Spacer()
                if context.state.progress > 0 {
                    Text("\(Int(context.state.progress * 100))%")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            if context.state.progress > 0 {
                ProgressView(value: context.state.progress)
                    .progressViewStyle(.linear)
                    .tint(.blue)
            }
        }
    }
}

// Minimal View
struct SessionMinimalView: View {
    let context: ActivityViewContext<SessionActivityAttributes>
    
    var body: some View {
        Image(systemName: iconForSessionType(context.attributes.sessionType))
            .foregroundColor(.blue)
    }
}
```

### 4. Activity Manager Implementation

#### 4.1 Create Activity Manager
```swift
// LiveActivityManager.swift
import ActivityKit
import Foundation

class LiveActivityManager: ObservableObject {
    static let shared = LiveActivityManager()
    
    @Published private(set) var currentActivities: [String: Activity<SessionActivityAttributes>] = [:]
    
    private init() {
        // Check for existing activities on app launch
        Task {
            await checkExistingActivities()
        }
    }
    
    // MARK: - Public Methods
    
    func startActivity(
        sessionID: String,
        sessionType: SessionType,
        initialStatus: SessionStatus = .initializing
    ) async throws {
        // Check if Live Activities are available
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            throw LiveActivityError.notAvailable
        }
        
        let attributes = SessionActivityAttributes(
            sessionID: sessionID,
            sessionType: sessionType,
            startTime: Date()
        )
        
        let initialState = SessionActivityAttributes.ContentState(
            status: initialStatus,
            progress: 0.0,
            currentFile: nil,
            operationCount: 0,
            lastUpdateTime: Date()
        )
        
        do {
            let activity = try Activity<SessionActivityAttributes>.request(
                attributes: attributes,
                contentState: initialState,
                pushType: .token // Enable push updates
            )
            
            await MainActor.run {
                currentActivities[sessionID] = activity
            }
            
            // Store push token if needed
            if let pushToken = activity.pushToken {
                await storePushToken(pushToken, for: sessionID)
            }
            
        } catch {
            throw LiveActivityError.failedToStart(error)
        }
    }
    
    func updateActivity(
        sessionID: String,
        status: SessionStatus? = nil,
        progress: Double? = nil,
        currentFile: String? = nil,
        incrementOperationCount: Bool = false
    ) async {
        guard let activity = currentActivities[sessionID] else { return }
        
        var updatedState = activity.contentState
        
        if let status = status {
            updatedState.status = status
        }
        
        if let progress = progress {
            updatedState.progress = max(0, min(1, progress))
        }
        
        if let currentFile = currentFile {
            updatedState.currentFile = currentFile
        }
        
        if incrementOperationCount {
            updatedState.operationCount += 1
        }
        
        updatedState.lastUpdateTime = Date()
        
        await activity.update(using: updatedState)
    }
    
    func endActivity(
        sessionID: String,
        dismissalPolicy: ActivityUIDismissalPolicy = .default
    ) async {
        guard let activity = currentActivities[sessionID] else { return }
        
        // Update to completed state
        let finalState = SessionActivityAttributes.ContentState(
            status: .completed,
            progress: 1.0,
            currentFile: activity.contentState.currentFile,
            operationCount: activity.contentState.operationCount,
            lastUpdateTime: Date()
        )
        
        await activity.end(using: finalState, dismissalPolicy: dismissalPolicy)
        
        await MainActor.run {
            currentActivities.removeValue(forKey: sessionID)
        }
    }
    
    func endAllActivities() async {
        for (sessionID, _) in currentActivities {
            await endActivity(sessionID: sessionID)
        }
    }
    
    // MARK: - Private Methods
    
    private func checkExistingActivities() async {
        for activity in Activity<SessionActivityAttributes>.activities {
            await MainActor.run {
                currentActivities[activity.attributes.sessionID] = activity
            }
        }
    }
    
    private func storePushToken(_ token: Data, for sessionID: String) async {
        // Implement push token storage for remote updates
        // This would typically be sent to your backend
    }
}

// MARK: - Error Types

enum LiveActivityError: LocalizedError {
    case notAvailable
    case failedToStart(Error)
    
    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "Live Activities are not available on this device"
        case .failedToStart(let error):
            return "Failed to start Live Activity: \(error.localizedDescription)"
        }
    }
}
```

### 5. Integration Points

#### 5.1 Session Management Integration
```swift
// Extension for existing session manager
extension SessionManager {
    func startSession() async {
        // Existing session start logic...
        
        // Start Live Activity
        do {
            try await LiveActivityManager.shared.startActivity(
                sessionID: currentSession.id,
                sessionType: .coding,
                initialStatus: .initializing
            )
        } catch {
            print("Failed to start Live Activity: \(error)")
        }
    }
    
    func updateSessionProgress(_ progress: Double, status: String) async {
        // Existing update logic...
        
        // Update Live Activity
        await LiveActivityManager.shared.updateActivity(
            sessionID: currentSession.id,
            status: .active,
            progress: progress,
            currentFile: currentFile
        )
    }
    
    func endSession() async {
        // Existing end logic...
        
        // End Live Activity
        await LiveActivityManager.shared.endActivity(
            sessionID: currentSession.id
        )
    }
}
```

#### 5.2 Code Generation Integration
```swift
// Extension for code generation manager
extension CodeGenerationManager {
    func generateCode(for request: GenerationRequest) async {
        let sessionID = UUID().uuidString
        
        // Start Live Activity
        try? await LiveActivityManager.shared.startActivity(
            sessionID: sessionID,
            sessionType: .generation,
            initialStatus: .generating
        )
        
        // Generation logic with progress updates
        for (index, file) in request.files.enumerated() {
            let progress = Double(index) / Double(request.files.count)
            
            await LiveActivityManager.shared.updateActivity(
                sessionID: sessionID,
                progress: progress,
                currentFile: file.name,
                incrementOperationCount: true
            )
            
            // Actual generation logic...
        }
        
        // Complete
        await LiveActivityManager.shared.endActivity(sessionID: sessionID)
    }
}
```

### 6. Background Update Support

#### 6.1 Background Task Handler
```swift
// BackgroundTaskHandler.swift
import BackgroundTasks
import ActivityKit

class BackgroundTaskHandler {
    static let backgroundTaskIdentifier = "com.opencode.liveactivity.refresh"
    
    static func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: backgroundTaskIdentifier,
            using: nil
        ) { task in
            handleBackgroundTask(task as! BGAppRefreshTask)
        }
    }
    
    static func scheduleBackgroundRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: backgroundTaskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 60) // 1 minute
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Failed to schedule background task: \(error)")
        }
    }
    
    private static func handleBackgroundTask(_ task: BGAppRefreshTask) {
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }
        
        Task {
            // Update all active Live Activities
            for activity in Activity<SessionActivityAttributes>.activities {
                // Fetch latest state from your data source
                // Update the activity if needed
            }
            
            task.setTaskCompleted(success: true)
            scheduleBackgroundRefresh() // Schedule next refresh
        }
    }
}
```

### 7. Testing Strategy

#### 7.1 Unit Tests
- Test Activity Attributes encoding/decoding
- Test state transitions
- Test error handling

#### 7.2 UI Tests
- Test Lock Screen appearance
- Test Dynamic Island views
- Test activity lifecycle

#### 7.3 Integration Tests
- Test with actual session workflows
- Test background updates
- Test push notification updates

#### 7.4 Device Testing
- Test on devices with Dynamic Island
- Test on devices without Dynamic Island
- Test with different iOS versions (16.1+)
- Test with Live Activities disabled

### 8. Implementation Timeline

#### Phase 1: Foundation (Week 1)
- [ ] Update project configuration
- [ ] Implement data models
- [ ] Create basic UI views

#### Phase 2: Core Implementation (Week 2)
- [ ] Implement LiveActivityManager
- [ ] Integrate with session management
- [ ] Add basic testing

#### Phase 3: Advanced Features (Week 3)
- [ ] Add background update support
- [ ] Implement push notification updates
- [ ] Enhanced UI with animations

#### Phase 4: Testing & Polish (Week 4)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Release preparation

## Considerations

### Performance
- Minimize update frequency to preserve battery
- Use background updates judiciously
- Implement proper throttling for rapid updates

### Privacy
- Don't expose sensitive code or file contents
- Use generic descriptions where appropriate
- Allow users to disable Live Activities

### Error Handling
- Gracefully handle when Live Activities are disabled
- Provide fallback UI for unsupported devices
- Handle activity limits (system allows up to 5 concurrent activities)

### Localization
- Prepare all status strings for localization
- Consider different text lengths in UI design
- Test with various locales

## References

- [Apple's ActivityKit Documentation](https://developer.apple.com/documentation/activitykit)
- [Human Interface Guidelines - Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities)
- [WWDC 2023 - Update Live Activities with Push Notifications](https://developer.apple.com/videos/play/wwdc2023/10185/)

## Conclusion

Implementing Live Activities will significantly enhance the user experience by providing real-time visibility into ongoing operations. This feature will be particularly valuable during long-running processes like code generation, builds, and file synchronization, keeping users informed even when the app is in the background.