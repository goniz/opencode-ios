# AGENTS.md - opencode-mobile

## Project Overview
Expo Go-based React Native mobile application using Expo Router for navigation and TypeScript for type safety.

## Technology Stack
- **Framework**: Expo ~53.0.20 with React Native 0.79.5
- **Navigation**: Expo Router ~5.1.4 with typed routes
- **Language**: TypeScript ~5.8.3
- **UI**: React 19.0.0 with React Native components
- **Styling**: React Native StyleSheet
- **State Management**: React hooks (built-in)
- **Icons**: @expo/vector-icons, expo-symbols
- **API Client**: Generated TypeScript client from OpenAPI schema using @hey-api/openapi-ts
- **Development**: Expo CLI, ESLint

## Project Structure
```
app/                    # App screens using Expo Router
├── (tabs)/            # Tab-based navigation group
│   ├── _layout.tsx    # Tab navigator layout
│   ├── index.tsx      # Home tab
│   └── explore.tsx    # Explore tab
├── _layout.tsx        # Root layout
└── +not-found.tsx     # 404 page

components/            # Reusable UI components
├── ui/               # Platform-specific UI components
└── [Component].tsx   # Themed and utility components

constants/            # App constants and configuration
hooks/               # Custom React hooks
assets/              # Images, fonts, and static files
src/
├── api/             # Generated TypeScript API client
│   ├── client/      # HTTP client implementation
│   ├── core/        # Core API utilities
│   ├── sdk.gen.ts   # Generated SDK functions
│   └── types.gen.ts # Generated TypeScript types
```

## Development Commands
- `npm start` or `npx expo start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint
- `npm run generate-api` - Generate TypeScript client from OpenAPI schema
- `npm run reset-project` - Reset project to clean state

## Testing on Physical Device
Use the Expo Go app to test on your phone:
1. Install Expo Go from App Store (iOS) or Google Play (Android)
2. Run `npx expo start` to start the development server
3. Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)

## Build Commands
This project uses EAS Build for production builds:
- `npx eas build --platform ios` - Build for iOS
- `npx eas build --platform android` - Build for Android
- `npx eas build --platform all` - Build for both platforms
- `npx eas build --local` - Build locally (experimental)

Note: Traditional `npm run build` is not available for Expo projects. Use EAS Build for production builds.

### Non-blocking Development Server
To start the Expo development server without blocking the terminal:
```bash
npx expo start &
```
This runs the development server in the background, allowing you to continue using the terminal for other commands while the server remains active.

## Key Features
- Cross-platform mobile app (iOS, Android, Web)
- File-based routing with Expo Router
- TypeScript support with typed routes
- Tab-based navigation
- Themed components with dark/light mode support
- Haptic feedback integration
- Vector icons and custom symbols
- Safe area handling

## Development Guidelines
1. Use Expo Router for navigation and routing
2. Follow TypeScript best practices - **ALWAYS use proper TypeScript types, avoid `any` type**
3. Use themed components for consistent styling
4. Test on multiple platforms (iOS, Android, Web)
5. Follow React Native performance best practices
6. Use Expo modules for native functionality
7. Maintain cross-platform compatibility
8. **ALWAYS prefer `expo install` over `npm install`** for installing packages - Expo install ensures compatibility with the current Expo SDK version

## TypeScript Guidelines
- **NEVER use `any` type** - always specify proper types
- Use `unknown` for error handling and uncertain types
- Use type guards (e.g., `instanceof Error`) to narrow types
- Prefer interfaces over type aliases for object shapes
- Use proper generic types for API responses and functions

## Examples and Resources
- [Expo Examples Repository](https://github.com/expo/examples) - Official Expo examples and tutorials
## Package Installation
**IMPORTANT**: Always use `expo install` instead of `npm install` when adding new packages to ensure Expo SDK compatibility:
- ✅ `expo install package-name` - Preferred method
- ❌ `npm install package-name` - Avoid unless package is not available via Expo

Expo install automatically selects the correct version compatible with your Expo SDK version and prevents version conflicts.

## Common Tasks
- Adding new screens: Create files in `app/` directory
- Creating components: Add to `components/` directory
- Managing navigation: Use Expo Router patterns
- Styling: Use React Native StyleSheet with theme support
- Icons: Use @expo/vector-icons or expo-symbols
- Installing packages: Use `expo install package-name` for compatibility
- Testing: Run on Expo Go app or simulators