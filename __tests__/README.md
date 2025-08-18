# Test Directory Structure

This directory contains the test setup for the opencode-mobile application.

## Directory Structure

```
__tests__/              # Root test directory
├── README.md          # This file
└── example.test.tsx   # Example test to verify setup

app/__tests__/         # Tests for app screens/pages
src/__tests__/         # Tests for source code utilities
components/__tests__/  # Tests for reusable components
```

## Test Organization Patterns

You can organize tests using either pattern:

### Pattern 1: Centralized Tests
```
__tests__/
├── components/
│   └── ThemedText.test.tsx
├── screens/
│   └── HomeScreen.test.tsx
└── utils/
    └── serverStorage.test.tsx
```

### Pattern 2: Co-located Tests
```
app/
├── index.tsx
└── __tests__/
    └── index.test.tsx

src/
├── utils/
│   ├── toast.ts
│   └── __tests__/
│       └── toast.test.tsx
```

## Running Tests

```bash
npm run test           # Run tests in watch mode
npm test -- --no-watch # Run tests once
```

## Coverage Reports

Coverage reports are generated automatically and saved to `coverage/` directory.
View the HTML report at `coverage/lcov-report/index.html`.