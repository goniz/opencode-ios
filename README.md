# opencode-mobile

Expo Go-based React Native mobile application for OpenCode using Expo Router for navigation.

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
npm install
```

### Development

```bash
# Start development server
npm start

# Run on specific platforms
npm run ios     # iOS simulator
npm run android # Android emulator
npm run web     # Web browser
```

### Testing on Device
1. Install Expo Go from App Store (iOS) or Google Play (Android)
2. Run `npm start`
3. Scan QR code with camera (iOS) or Expo Go app (Android)

## Scripts

```bash
npm start              # Start Expo development server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run on web browser
npm run lint           # Run ESLint
npm run test           # Run tests in watch mode
npm run test:ci        # Run tests for CI (no watch, with coverage)
npm run generate-api   # Generate API client from OpenAPI schema
```

## Technology Stack

- **Framework**: Expo ~53.0.20 with React Native 0.79.5
- **Navigation**: Expo Router ~5.1.4
- **Language**: TypeScript ~5.8.3
- **UI**: React 19.0.0 with React Native components
- **API Client**: Generated from OpenAPI with @hey-api/openapi-ts
- **Testing**: Jest with React Native Testing Library
- **Linting**: ESLint with Expo config

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
app/                   # Expo Router screens
├── (tabs)/           # Tab navigation group
├── _layout.tsx       # Root layout
src/
├── api/              # Generated API client
├── contexts/         # React contexts
└── utils/            # Utility functions
__tests__/            # Test files and setup
.github/              # GitHub Actions workflows
```

## Development Guidelines

1. Use Expo Router for navigation
2. Follow TypeScript best practices - avoid `any` type
3. Use `expo install` instead of `npm install` for packages
4. Test on multiple platforms (iOS, Android, Web)
5. Write tests for new components and utilities
6. Follow ESLint rules and fix warnings

## Building for Production

Use EAS Build for production builds:

```bash
npx eas build --platform ios
npx eas build --platform android
npx eas build --platform all
```
