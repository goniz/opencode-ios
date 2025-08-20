# opencode-ios

A native iOS/Android mobile application for OpenCode built with Expo and React Native. Features a modern chat interface for interacting with Claude AI, complete with syntax highlighting, tool execution visualization, and real-time messaging.

## Features

- 🤖 **AI Chat Interface** - Native chat experience with Claude AI
- 💬 **Real-time Messaging** - WebSocket-based communication
- 🎨 **Syntax Highlighting** - Code blocks with proper language detection
- 🔧 **Tool Visualization** - See AI tool executions in real-time  
- 📱 **Cross-Platform** - iOS, Android, and Web support
- 🌙 **Theme Support** - Light and dark mode
- ⚡ **Expo Router** - File-based navigation with typed routes
- 🔄 **Session Management** - Manage multiple chat sessions

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

```bash
# Clone and install dependencies
npm install

# Generate API client
npm run generate-api
```

### Development

```bash
# Start development server
npm start

# Run on specific platforms
npm run ios     # iOS simulator/device
npm run android # Android emulator/device  
npm run web     # Web browser

# Development with type checking
npm run typecheck
```

### Testing on Physical Device
1. Install Expo Go from App Store (iOS) or Google Play (Android)
2. Run `npm start` to start the development server
3. Scan QR code with your device camera or Expo Go app
4. The app will load and hot-reload as you make changes

## Available Scripts

```bash
npm start              # Start Expo development server
npm run ios            # Run on iOS simulator/device
npm run android        # Run on Android emulator/device
npm run web            # Run on web browser
npm run lint           # Run ESLint
npm run typecheck      # TypeScript type checking
npm run test           # Run tests in watch mode
npm run test:ci        # Run tests for CI with coverage
npm run generate-api   # Generate TypeScript API client from OpenAPI schema
npm run ota-host       # Start OTA hosting server for IPA distribution
npm run ota-host:dev   # Start OTA hosting server in development mode
```

## Technology Stack

- **Framework**: Expo ~53.0.20 with React Native 0.79.5 (New Architecture enabled)
- **Navigation**: Expo Router ~5.1.4 with typed routes
- **Language**: TypeScript ~5.8.3 with strict mode
- **UI Components**: React 19.0.0 with React Native components
- **Styling**: React Native StyleSheet with theme system
- **State Management**: React Context + hooks
- **API Client**: Auto-generated from OpenAPI with @hey-api/openapi-ts
- **Real-time**: WebSocket for live chat communication
- **Syntax Highlighting**: react-native-syntax-highlighter
- **Markdown**: react-native-markdown-display
- **Icons**: @expo/vector-icons, expo-symbols
- **Animations**: react-native-reanimated
- **Storage**: @react-native-async-storage/async-storage
- **Testing**: Jest with React Native Testing Library
- **Linting**: ESLint with Expo TypeScript config

## Testing

The project uses Jest with React Native Testing Library for unit testing:

```bash
npm run test           # Watch mode for development
npm run test:ci        # Single run with coverage for CI
```

Test files are organized in `__tests__/` directories. See `__tests__/README.md` for detailed testing guidelines.

## CI/CD

GitHub Actions workflows are configured for:
- **CI**: Runs linter and tests on Node.js 18.x and 20.x
- **PR Checks**: TypeScript compilation, linting, and testing
- **Dependabot**: Automated dependency updates

## Project Structure

```
app/                          # Expo Router screens (file-based routing)
├── (tabs)/                   # Tab navigation group
│   ├── _layout.tsx          # Tab navigator layout
│   ├── index.tsx            # Home/Welcome screen
│   ├── chat.tsx             # Main chat interface
│   └── sessions.tsx         # Session management
├── _layout.tsx              # Root app layout
assets/                      # Static assets
├── images/                  # App icons and images
└── fonts/                   # Custom fonts
src/
├── api/                     # Generated TypeScript API client
│   ├── client/             # HTTP client implementation  
│   ├── core/               # Core API utilities
│   ├── sdk.gen.ts          # Generated SDK functions
│   └── types.gen.ts        # Generated TypeScript types
├── components/             # Reusable UI components
│   ├── chat/              # Chat-specific components
│   │   ├── content/       # Message content renderers
│   │   └── parts/         # Message part components
│   └── icons/             # Custom icon components
├── contexts/              # React Context providers
│   ├── ConnectionContext.tsx  # WebSocket connection state
│   └── ThemeContext.tsx      # Theme management
├── hooks/                 # Custom React hooks
├── styles/                # Global styles and theme
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
__tests__/                 # Test files and setup
├── example.test.tsx       # Example tests
└── README.md             # Testing guidelines
.github/                   # GitHub Actions CI/CD
├── workflows/            # Automated workflows
└── dependabot.yml        # Dependency updates
components/                # Legacy component exports
docs/                     # Project documentation
```

## App Configuration

The app is configured for cross-platform deployment:

- **Bundle ID**: `com.goniz.opencodemobile`
- **Scheme**: `opencodemobile://`
- **New Architecture**: Enabled for React Native
- **Edge-to-Edge**: Android edge-to-edge display
- **Network Security**: Configured for local development

## Development Guidelines

### Code Standards
1. **TypeScript First** - Always use proper TypeScript types, never `any`
2. **Expo Router** - Use file-based routing for navigation  
3. **Component Structure** - Follow established patterns in `src/components/`
4. **Theme System** - Use the centralized theme system in `src/styles/`
5. **Error Handling** - Use proper error boundaries and type guards

### Package Management  
- **Always use `expo install`** instead of `npm install` for Expo-compatible packages
- Use `npm install` only for pure JavaScript packages without native dependencies
- Check compatibility with current Expo SDK version before installing

### Testing
- Write unit tests for utilities and hooks
- Use React Native Testing Library for component tests
- Follow testing patterns in `__tests__/` directory
- Run tests before submitting PRs

### Platform Support
- Test on iOS, Android, and Web platforms
- Use platform-specific code when necessary (`Platform.OS`)
- Ensure responsive design across screen sizes
- Test on both physical devices and simulators

## Building for Production

### EAS Build (Recommended)
```bash
# Build for specific platform
npx eas build --platform ios
npx eas build --platform android

# Build for all platforms
npx eas build --platform all

# Local build (requires proper setup)
npx eas build --local
```

### Development Builds
```bash
# Create development build
npx eas build --profile development

# Install on device
npx eas build --profile development --platform ios --local
```

## OTA (Over-The-Air) Distribution

The project includes a TypeScript-based OTA hosting solution for distributing IPA files securely over HTTPS with Tailscale integration.

### Quick Start
```bash
# Production mode with Tailscale (requires Tailscale setup)
npm run ota-host

# Development mode with self-signed certificates
npm run ota-host:dev
```

### Features
- 🔍 **Automatic IPA Discovery** - Finds and serves the latest IPA file in the current directory
- 📱 **Apple Manifest Generation** - Creates valid `manifest.plist` files for iOS installation
- 🔐 **Tailscale Integration** - Secure hostname resolution and automatic TLS certificate management
- 🛡️ **Development Mode** - Self-signed certificates for local testing
- 🌐 **Mobile-Friendly Interface** - Responsive install page with clear instructions
- ⚙️ **CLI Options** - Flexible configuration via command-line arguments

### Usage Examples
```bash
# Production mode with Tailscale
npm run ota-host

# Development mode with self-signed certs
npm run ota-host:dev

# Custom port and IPA file
npm run ota-host -- --port 8443 --ipa custom-build.ipa

# Exit after serving first IPA file
npm run ota-host -- --once

# Show help
npm run ota-host -- --help
```

### Command Line Options
- `--dev` - Development mode (self-signed certificates, localhost)
- `--port <number>` - Server port (default: 443 prod, 8443 dev)
- `--ipa <path>` - Use specific IPA file instead of auto-detection
- `--once` - Exit after serving the first IPA file
- `--help, -h` - Show help message

### Installation Process
1. Place your `.ipa` file in the project root directory
2. Run the OTA hosting server
3. Open the provided URL on an iOS device using Safari
4. Tap "Install App" and follow the iOS prompts
5. **Trust the developer certificate**:
   - Go to **Settings > General > VPN & Device Management**
   - Under **Developer App**, tap your developer profile
   - Tap **"Trust [Developer Name]"** and confirm
6. Launch the app from your home screen



### Requirements
- **Production Mode**: Tailscale installed and running
- **Development Mode**: OpenSSL for self-signed certificates
- **iOS Device**: Must be configured to install developer apps
- **HTTPS**: Required for iOS app installation (automatically handled)

## Deployment

The project uses EAS (Expo Application Services) for building and deployment:
- **Project ID**: `98dafe4d-c4a9-4988-b49c-3c6a01228764` 
- **Owner**: `goniz`
- Configured for both App Store and Google Play distribution

## API Integration

The app communicates with OpenCode servers via:
- **REST API**: Auto-generated TypeScript client from OpenAPI schema
- **WebSocket**: Real-time chat messaging
- **Authentication**: Managed through connection context
- **Local Development**: Supports HTTP connections to localhost

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the development guidelines
4. Run tests and linting (`npm run test && npm run lint`)
5. Commit your changes with conventional commits
6. Push to your branch and create a Pull Request

## Troubleshooting

### Common Issues
- **Metro bundler issues**: Clear cache with `npx expo start --clear`
- **iOS build failures**: Clean build folder in Xcode
- **Android issues**: Clear Gradle cache and rebuild
- **Type errors**: Run `npm run typecheck` to identify issues
- **API client issues**: Regenerate with `npm run generate-api`

### Development Server
```bash
# Start with cache clearing
npx expo start --clear

# Start in production mode
npx expo start --no-dev --minify

# Start with specific port
npx expo start --port 8081
```
