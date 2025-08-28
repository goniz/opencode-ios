# iOS Live Activity Implementation Plan for React Native (Expo) - Issue #58

## Overview

This document outlines the implementation plan for adding iOS Live Activity support to the opencode-ios React Native project using Expo. Live Activities will provide users with real-time updates on the Lock Screen and Dynamic Island during active sessions and content generation processes.

## Background

iOS Live Activities, introduced in iOS 16.1, allow apps to display real-time information on the Lock Screen and in the Dynamic Island. Since this is a React Native project using Expo, we'll need to create a native module or use an Expo config plugin to implement this iOS-specific feature.

## Technical Approach

Since Expo doesn't have built-in support for Live Activities, we have several options:

1. **Expo Config Plugin** (Recommended) - Create a custom Expo config plugin that adds native iOS code during the prebuild process
2. **Expo Development Build** - Use a development build with custom native modules
3. **Bare Workflow** - Eject to bare workflow (not recommended as it loses Expo managed workflow benefits)

We'll proceed with Option 1: Creating an Expo Config Plugin.

## Requirements

### System Requirements
- Expo SDK 49 or later
- iOS 16.1 or later (for Live Activities)
- Xcode 14.1 or later
- EAS Build for creating custom development builds

### Project Dependencies
```json
{
  "expo": "~49.0.0",
  "react-native": "0.72.x",
  "expo-dev-client": "~2.4.0"
}
```

## Implementation Steps

### 1. Create Expo Config Plugin Structure

#### 1.1 Plugin Directory Structure
```
plugins/
├── withLiveActivities/
│   ├── index.js
│   ├── ios/
│   │   ├── LiveActivityManager.swift
│   │   ├── SessionActivityAttributes.swift
│   │   ├── SessionActivityWidget.swift
│   │   └── LiveActivityBridge.m
│   └── src/
│       └── withLiveActivities.ts
```

#### 1.2 Main Plugin File
```typescript
// plugins/withLiveActivities/src/withLiveActivities.ts
import {
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withInfoPlist,
  withXcodeProject,
  withDangerousMod,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const withLiveActivities: ConfigPlugin<{
  widgetKitExtensionBundleIdentifier?: string;
}> = (config, props = {}) => {
  // Add NSSupportsLiveActivities to Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    return config;
  });

  // Add ActivityKit framework
  config = withXcodeProject(config, async (config) => {
    const project = config.modResults;
    
    // Add ActivityKit framework
    IOSConfig.XcodeUtils.addFramework(
      project,
      'ActivityKit.framework',
      { weak: false }
    );
    
    return config;
  });

  // Copy native files
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, 'ios');
      
      // Copy Swift files
      const sourceFiles = [
        'LiveActivityManager.swift',
        'SessionActivityAttributes.swift',
        'SessionActivityWidget.swift',
        'LiveActivityBridge.m',
      ];
      
      for (const file of sourceFiles) {
        const sourcePath = path.join(__dirname, '..', 'ios', file);
        const destPath = path.join(iosPath, config.modRequest.projectName, file);
        
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
      
      return config;
    },
  ]);

  return config;
};

export default createRunOncePlugin(withLiveActivities, 'withLiveActivities');
```

### 2. Native iOS Implementation

#### 2.1 Activity Attributes Definition
```swift
// plugins/withLiveActivities/ios/SessionActivityAttributes.swift
import ActivityKit
import Foundation

struct SessionActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var status: String
        var progress: Double
        var currentFile: String?
        var operationCount: Int
        var statusEmoji: String
    }
    
    var sessionID: String
    var sessionType: String
    var startTime: Date
}
```

#### 2.2 Live Activity Manager
```swift
// plugins/withLiveActivities/ios/LiveActivityManager.swift
import ActivityKit
import Foundation

@objc(LiveActivityManager)
class LiveActivityManager: NSObject {
    static let shared = LiveActivityManager()
    private var currentActivities: [String: Activity<SessionActivityAttributes>] = [:]
    
    @objc
    func startActivity(
        _ sessionID: String,
        sessionType: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            rejecter("LIVE_ACTIVITY_ERROR", "Live Activities are not enabled", nil)
            return
        }
        
        let attributes = SessionActivityAttributes(
            sessionID: sessionID,
            sessionType: sessionType,
            startTime: Date()
        )
        
        let initialState = SessionActivityAttributes.ContentState(
            status: "Initializing",
            progress: 0.0,
            currentFile: nil,
            operationCount: 0,
            statusEmoji: "🚀"
        )
        
        do {
            let activity = try Activity<SessionActivityAttributes>.request(
                attributes: attributes,
                contentState: initialState,
                pushType: nil
            )
            
            currentActivities[sessionID] = activity
            resolver(["activityId": activity.id])
        } catch {
            rejecter("LIVE_ACTIVITY_ERROR", error.localizedDescription, error)
        }
    }
    
    @objc
    func updateActivity(
        _ sessionID: String,
        status: String,
        progress: NSNumber,
        currentFile: String?,
        operationCount: NSNumber,
        statusEmoji: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard let activity = currentActivities[sessionID] else {
            rejecter("LIVE_ACTIVITY_ERROR", "Activity not found", nil)
            return
        }
        
        Task {
            let updatedState = SessionActivityAttributes.ContentState(
                status: status,
                progress: progress.doubleValue,
                currentFile: currentFile,
                operationCount: operationCount.intValue,
                statusEmoji: statusEmoji
            )
            
            await activity.update(using: updatedState)
            resolver(true)
        }
    }
    
    @objc
    func endActivity(
        _ sessionID: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard let activity = currentActivities[sessionID] else {
            rejecter("LIVE_ACTIVITY_ERROR", "Activity not found", nil)
            return
        }
        
        Task {
            let finalState = SessionActivityAttributes.ContentState(
                status: "Completed",
                progress: 1.0,
                currentFile: nil,
                operationCount: activity.contentState.operationCount,
                statusEmoji: "✅"
            )
            
            await activity.end(using: finalState, dismissalPolicy: .default)
            currentActivities.removeValue(forKey: sessionID)
            resolver(true)
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
```

#### 2.3 Objective-C Bridge
```objc
// plugins/withLiveActivities/ios/LiveActivityBridge.m
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityManager, NSObject)

RCT_EXTERN_METHOD(startActivity:(NSString *)sessionID
                  sessionType:(NSString *)sessionType
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(updateActivity:(NSString *)sessionID
                  status:(NSString *)status
                  progress:(NSNumber *)progress
                  currentFile:(NSString *)currentFile
                  operationCount:(NSNumber *)operationCount
                  statusEmoji:(NSString *)statusEmoji
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(endActivity:(NSString *)sessionID
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

@end
```

### 3. React Native TypeScript Interface

#### 3.1 Native Module Interface
```typescript
// src/modules/LiveActivity/LiveActivity.ts
import { NativeModules, Platform } from 'react-native';

export interface LiveActivityState {
  status: string;
  progress: number;
  currentFile?: string;
  operationCount: number;
  statusEmoji: string;
}

export enum SessionType {
  CODING = 'Coding Session',
  GENERATION = 'Code Generation',
  SYNC = 'File Sync',
  BUILD = 'Build Process',
}

export enum SessionStatus {
  INITIALIZING = 'Initializing',
  ACTIVE = 'Active',
  PROCESSING = 'Processing',
  SYNCING = 'Syncing',
  GENERATING = 'Generating Code',
  BUILDING = 'Building',
  COMPLETING = 'Completing',
  COMPLETED = 'Completed',
  ERROR = 'Error',
}

const statusEmojis: Record<SessionStatus, string> = {
  [SessionStatus.INITIALIZING]: '🚀',
  [SessionStatus.ACTIVE]: '💻',
  [SessionStatus.PROCESSING]: '⚙️',
  [SessionStatus.SYNCING]: '🔄',
  [SessionStatus.GENERATING]: '🤖',
  [SessionStatus.BUILDING]: '🔨',
  [SessionStatus.COMPLETING]: '🏁',
  [SessionStatus.COMPLETED]: '✅',
  [SessionStatus.ERROR]: '❌',
};

class LiveActivityModule {
  private nativeModule: any;
  private isIOS: boolean;

  constructor() {
    this.isIOS = Platform.OS === 'ios';
    this.nativeModule = this.isIOS ? NativeModules.LiveActivityManager : null;
  }

  async startActivity(sessionId: string, sessionType: SessionType): Promise<void> {
    if (!this.isIOS || !this.nativeModule) {
      return;
    }

    try {
      await this.nativeModule.startActivity(sessionId, sessionType);
    } catch (error) {
      console.warn('Failed to start Live Activity:', error);
    }
  }

  async updateActivity(
    sessionId: string,
    state: Partial<LiveActivityState>
  ): Promise<void> {
    if (!this.isIOS || !this.nativeModule) {
      return;
    }

    const status = state.status || SessionStatus.ACTIVE;
    const statusEmoji = statusEmojis[status as SessionStatus] || '💻';

    try {
      await this.nativeModule.updateActivity(
        sessionId,
        status,
        state.progress || 0,
        state.currentFile || null,
        state.operationCount || 0,
        statusEmoji
      );
    } catch (error) {
      console.warn('Failed to update Live Activity:', error);
    }
  }

  async endActivity(sessionId: string): Promise<void> {
    if (!this.isIOS || !this.nativeModule) {
      return;
    }

    try {
      await this.nativeModule.endActivity(sessionId);
    } catch (error) {
      console.warn('Failed to end Live Activity:', error);
    }
  }

  isAvailable(): boolean {
    return this.isIOS && this.nativeModule !== null;
  }
}

export const LiveActivity = new LiveActivityModule();
```

#### 3.2 React Hook for Live Activities
```typescript
// src/hooks/useLiveActivity.ts
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { LiveActivity, SessionType, LiveActivityState } from '../modules/LiveActivity';

interface UseLiveActivityOptions {
  sessionId: string;
  sessionType: SessionType;
  autoEnd?: boolean;
}

export const useLiveActivity = ({
  sessionId,
  sessionType,
  autoEnd = true,
}: UseLiveActivityOptions) => {
  const isActiveRef = useRef(false);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && isActiveRef.current) {
        // Optionally update activity when app goes to background
        LiveActivity.updateActivity(sessionId, {
          status: 'Running in background',
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (autoEnd && isActiveRef.current) {
        LiveActivity.endActivity(sessionId);
      }
    };
  }, [sessionId, autoEnd]);

  const startActivity = useCallback(async () => {
    if (!isActiveRef.current) {
      await LiveActivity.startActivity(sessionId, sessionType);
      isActiveRef.current = true;
    }
  }, [sessionId, sessionType]);

  const updateActivity = useCallback(
    async (state: Partial<LiveActivityState>) => {
      if (isActiveRef.current) {
        await LiveActivity.updateActivity(sessionId, state);
      }
    },
    [sessionId]
  );

  const endActivity = useCallback(async () => {
    if (isActiveRef.current) {
      await LiveActivity.endActivity(sessionId);
      isActiveRef.current = false;
    }
  }, [sessionId]);

  return {
    startActivity,
    updateActivity,
    endActivity,
    isAvailable: LiveActivity.isAvailable(),
  };
};
```

### 4. Integration Examples

#### 4.1 Session Management Integration
```typescript
// src/features/session/SessionManager.tsx
import React, { useEffect } from 'react';
import { useLiveActivity } from '../../hooks/useLiveActivity';
import { SessionType, SessionStatus } from '../../modules/LiveActivity';

export const SessionManager: React.FC<{ session: Session }> = ({ session }) => {
  const { startActivity, updateActivity, endActivity } = useLiveActivity({
    sessionId: session.id,
    sessionType: SessionType.CODING,
  });

  useEffect(() => {
    // Start Live Activity when session begins
    startActivity();

    return () => {
      // Cleanup handled by hook if autoEnd is true
    };
  }, []);

  const handleFileChange = (file: string) => {
    updateActivity({
      status: SessionStatus.ACTIVE,
      currentFile: file,
      operationCount: session.operationCount,
    });
  };

  const handleProgress = (progress: number) => {
    updateActivity({
      progress,
      status: SessionStatus.PROCESSING,
    });
  };

  // Rest of component implementation...
};
```

### 5. Widget Extension UI (SwiftUI)

Create a separate file for the widget UI that will be displayed in the Lock Screen and Dynamic Island:

```swift
// plugins/withLiveActivities/ios/SessionActivityWidget.swift
import WidgetKit
import SwiftUI
import ActivityKit

struct SessionActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: SessionActivityAttributes.self) { context in
            // Lock Screen View
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(context.state.statusEmoji)
                        .font(.title2)
                    Text(context.attributes.sessionType)
                        .font(.headline)
                    Spacer()
                    Text(timeElapsed(from: context.attributes.startTime))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Text(context.state.status)
                    .font(.subheadline)
                
                if context.state.progress > 0 {
                    ProgressView(value: context.state.progress)
                        .tint(.blue)
                }
                
                if let file = context.state.currentFile {
                    Label(file, systemImage: "doc.text")
                        .font(.caption)
                        .lineLimit(1)
                }
            }
            .padding()
            
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded Region
                DynamicIslandExpandedRegion(.center) {
                    VStack {
                        Text(context.attributes.sessionType)
                        Text(context.state.status)
                            .font(.caption)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if context.state.progress > 0 {
                        ProgressView(value: context.state.progress)
                    }
                }
            } compactLeading: {
                Text(context.state.statusEmoji)
            } compactTrailing: {
                if context.state.progress > 0 {
                    Text("\(Int(context.state.progress * 100))%")
                        .font(.caption)
                }
            } minimal: {
                Text(context.state.statusEmoji)
            }
        }
    }
}
```

### 6. Expo Configuration

#### 6.1 app.config.js
```javascript
// app.config.js
export default {
  expo: {
    name: "opencode-ios",
    slug: "opencode-ios",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.opencode.ios",
      infoPlist: {
        NSSupportsLiveActivities: true,
      },
    },
    plugins: [
      "./plugins/withLiveActivities",
      // Other plugins...
    ],
  },
};
```

#### 6.2 EAS Build Configuration
```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "image": "latest"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "autoIncrement": true
      }
    }
  }
}
```

### 7. Building and Testing

#### 7.1 Local Development
```bash
# Install dependencies
npm install

# Run prebuild to generate native code
npx expo prebuild -p ios --clean

# Build development client
eas build --platform ios --profile development

# Or build locally
npx expo run:ios
```

#### 7.2 Testing Checklist
- [ ] Test on physical device (iOS 16.1+)
- [ ] Verify Lock Screen appearance
- [ ] Test Dynamic Island on compatible devices
- [ ] Test activity lifecycle (start, update, end)
- [ ] Test background updates
- [ ] Test with app in different states
- [ ] Verify proper cleanup on app termination

### 8. Implementation Timeline

#### Phase 1: Foundation (Week 1)
- [ ] Create Expo config plugin structure
- [ ] Implement native iOS modules
- [ ] Set up TypeScript interfaces

#### Phase 2: Core Implementation (Week 2)
- [ ] Implement React Native bridge
- [ ] Create React hooks
- [ ] Basic integration with session management

#### Phase 3: UI Polish (Week 3)
- [ ] Design Lock Screen views
- [ ] Implement Dynamic Island views
- [ ] Add animations and transitions

#### Phase 4: Testing & Release (Week 4)
- [ ] Comprehensive testing on devices
- [ ] Performance optimization
- [ ] Documentation
- [ ] Release preparation

## Troubleshooting

### Common Issues

1. **Live Activity not appearing**
   - Check iOS version (16.1+)
   - Verify NSSupportsLiveActivities in Info.plist
   - Check Live Activity permissions in Settings

2. **Build errors**
   - Ensure Swift bridging header is properly configured
   - Verify ActivityKit framework is linked
   - Check that native files are copied correctly

3. **Runtime errors**
   - Wrap all Live Activity calls in try-catch
   - Check native module availability before use
   - Implement proper error handling

## Conclusion

This implementation plan provides a complete solution for adding iOS Live Activity support to the React Native Expo project. The approach uses an Expo config plugin to maintain the managed workflow benefits while adding native functionality. The TypeScript interface ensures type safety and the React hooks provide an easy-to-use API for developers.