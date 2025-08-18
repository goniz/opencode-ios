# Component Testing Plan

## Overview
Comprehensive testing strategy for opencode-ios React Native mobile application components using Jest and React Native Testing Library.

## Testing Priorities

### Phase 1: Core Chat Components (High Priority)
- [ ] ConnectionStatus component tests
- [ ] MessageContent component tests  
- [ ] ExpandButton component tests
- [ ] MessageDecoration component tests

### Phase 2: Message Part Components (High Priority)
- [ ] TextPart component tests
- [ ] ToolPart component tests
- [ ] ReasoningPart component tests
- [ ] PartComponentSelector routing tests

### Phase 3: Content Components (Medium Priority)
- [ ] TextContent component tests
- [ ] CodeContent component tests

### Phase 4: Custom Hooks (Medium Priority)
- [ ] useExpandable hook tests

### Phase 5: Icon Components (Low Priority)
- [ ] ProviderIcons component tests
- [ ] ToolIcons component tests

### Phase 6: Integration & Accessibility (Low Priority)
- [ ] Message flow integration tests
- [ ] Accessibility compliance tests
- [ ] Performance validation tests
- [ ] Snapshot tests for visual regression

## Detailed Test Specifications

### 1. ConnectionStatus Component Tests

**File**: `__tests__/components/chat/ConnectionStatus.test.tsx`

```typescript
describe('ConnectionStatus Component', () => {
  // Status rendering tests
  test('renders connected status with correct styling')
  test('renders connecting status with correct styling')
  test('renders error status with correct styling')
  test('renders idle status with correct styling')
  
  // Custom message tests
  test('shows custom message when provided')
  test('falls back to default messages when no custom message')
  
  // Style and prop tests
  test('applies custom styles correctly')
  test('handles undefined status gracefully')
  test('renders status dot with correct color for each state')
})
```

**Key Test Cases**:
- ✅ Status colors: connected (#10b981), connecting (#f59e0b), error (#ef4444), idle (#6b7280)
- ✅ Default messages vs custom messages
- ✅ Custom style application
- ✅ Status dot rendering and colors

### 2. MessageContent Component Tests

**File**: `__tests__/components/chat/MessageContent.test.tsx`

```typescript
describe('MessageContent Component', () => {
  // Part type conversion tests
  test('converts text part correctly')
  test('converts reasoning part correctly')
  test('converts tool part with completed state')
  test('converts tool part with error state')
  test('converts file part correctly')
  test('converts step-start part correctly')
  test('converts agent part correctly')
  test('handles unknown part type with fallback')
  
  // Props and state tests
  test('calculates isLastPart correctly')
  test('passes correct props to PartComponentSelector')
  test('handles missing part data gracefully')
})
```

**Key Test Cases**:
- ✅ API part format to component part format conversion
- ✅ Part type handling: text, reasoning, tool, file, step-start, agent
- ✅ Tool state handling: completed vs error states
- ✅ Last part detection logic

### 3. ExpandButton Component Tests

**File**: `__tests__/components/chat/ExpandButton.test.tsx`

```typescript
describe('ExpandButton Component', () => {
  // State and interaction tests
  test('shows expand text when not expanded')
  test('shows collapse text when expanded')
  test('calls onPress when touched')
  test('handles custom expand/collapse text')
  
  // Variant styling tests
  test('applies default variant styles')
  test('applies tool variant styles')
  test('applies reasoning variant styles')
  
  // Style and accessibility tests
  test('applies custom styles correctly')
  test('has correct activeOpacity')
  test('is accessible for screen readers')
})
```

**Key Test Cases**:
- ✅ Expand/collapse text toggling
- ✅ onPress callback execution
- ✅ Variant styling: default, tool, reasoning
- ✅ Custom style application

### 4. MessageDecoration Component Tests

**File**: `__tests__/components/chat/MessageDecoration.test.tsx`

```typescript
describe('MessageDecoration Component', () => {
  // Icon selection tests
  test('shows role icon for first part')
  test('shows part icon for subsequent parts')
  test('shows provider icon for assistant with provider info')
  
  // Layout and styling tests
  test('renders vertical line when not last part')
  test('hides vertical line when is last part')
  test('applies icon background colors correctly')
  
  // Edge case tests
  test('handles missing part gracefully')
  test('handles missing provider info')
})
```

**Key Test Cases**:
- ✅ Icon selection logic: role vs part vs provider icons
- ✅ Vertical line rendering based on isLastPart
- ✅ Provider icon display for assistant messages

### 5. TextPart Component Tests

**File**: `__tests__/components/chat/parts/TextPart.test.tsx`

```typescript
describe('TextPart Component', () => {
  // Content rendering tests
  test('renders TextContent with correct props')
  test('passes content from part.content')
  test('sets isMarkdown based on messageRole')
  
  // Role-based styling tests
  test('applies assistant variant for assistant role')
  test('applies user variant for user role')
  test('handles isLast prop correctly')
  
  // Edge case tests
  test('handles empty content')
  test('handles missing part.content')
})
```

### 6. ToolPart Component Tests

**File**: `__tests__/components/chat/parts/ToolPart.test.tsx`

```typescript
describe('ToolPart Component', () => {
  // Basic rendering tests
  test('displays tool name correctly')
  test('capitalizes tool name')
  test('renders tool results')
  
  // Error handling tests
  test('shows error badge when tool has error')
  test('applies error styling for failed tools')
  test('displays error message instead of results')
  
  // Expandable behavior tests
  test('uses expandable hook for long results')
  test('shows expand button when content is long')
  test('auto-expands on error')
  test('auto-expands when isLast=true')
  
  // Edge case tests
  test('handles missing tool name gracefully')
  test('handles missing results')
  test('handles both result and error states')
})
```

**Key Test Cases**:
- ✅ Tool name display and capitalization
- ✅ Error badge and styling
- ✅ Expandable behavior for long content
- ✅ Auto-expansion conditions

### 7. ReasoningPart Component Tests

**File**: `__tests__/components/chat/parts/ReasoningPart.test.tsx`

```typescript
describe('ReasoningPart Component', () => {
  // Header rendering tests
  test('shows thinking icon and "AI Reasoning" header')
  test('renders thinking emoji correctly')
  
  // Content rendering tests
  test('renders thinking content with italic styling')
  test('handles both thinking and content properties')
  
  // Expandable behavior tests
  test('uses expandable hook for long reasoning')
  test('shows expand button with reasoning variant')
  test('auto-expands when isLast=true')
  
  // Edge case tests
  test('handles empty thinking content')
  test('handles missing thinking and content')
})
```

### 8. PartComponentSelector Tests

**File**: `__tests__/components/chat/parts/PartComponentSelector.test.tsx`

```typescript
describe('PartComponentSelector Component', () => {
  // Routing tests
  test('routes to TextPart for text type')
  test('routes to ToolPart for tool type')
  test('routes to FilePart for file type')
  test('routes to ReasoningPart for reasoning type')
  test('routes to ReasoningPart for thinking type')
  test('routes to StepPart for step type')
  test('routes to StepPart for step-start type')
  test('falls back to TextPart for unknown types')
  
  // Props passing tests
  test('passes all props correctly to selected component')
})
```

### 9. TextContent Component Tests

**File**: `__tests__/components/chat/content/TextContent.test.tsx`

```typescript
describe('TextContent Component', () => {
  // Rendering mode tests
  test('renders plain text when isMarkdown=false')
  test('renders markdown when isMarkdown=true')
  
  // Markdown feature tests
  test('renders code blocks with syntax highlighting')
  test('detects programming language from code fences')
  test('renders markdown headers correctly')
  test('renders lists and links correctly')
  test('renders tables correctly')
  
  // Variant styling tests
  test('applies user variant styles')
  test('applies assistant variant styles')
  test('applies default variant styles')
  
  // Expandable behavior tests
  test('uses expandable hook for long content')
  test('shows expand button when content exceeds limits')
  test('auto-expands when isLast=true')
  
  // Edge case tests
  test('handles empty content gracefully')
  test('handles malformed markdown')
})
```

### 10. CodeContent Component Tests

**File**: `__tests__/components/chat/content/CodeContent.test.tsx`

```typescript
describe('CodeContent Component', () => {
  // Syntax highlighting tests
  test('renders syntax highlighted code')
  test('uses provided language')
  test('detects language from file extension')
  test('falls back to text for unknown languages')
  
  // File header tests
  test('shows file header when fileName provided')
  test('hides file header when no fileName')
  test('renders file info correctly')
  
  // Display features tests
  test('shows line numbers')
  test('applies dark theme styling')
  
  // Expandable behavior tests
  test('uses expandable hook for long code')
  test('auto-expands when isLast=true')
  
  // Edge case tests
  test('handles empty code')
  test('handles missing fileName gracefully')
})
```

### 11. useExpandable Hook Tests

**File**: `__tests__/hooks/useExpandable.test.tsx`

```typescript
describe('useExpandable Hook', () => {
  // Initial state tests
  test('returns correct initial state based on autoExpand')
  test('resets state when content changes')
  
  // Content type behavior tests
  test('handles text content type correctly')
  test('handles code content type (never shows expand)')
  test('handles terminal content type (7 line limit)')
  test('handles tool content type (200 char/5 line limit)')
  test('handles reasoning content type (400 char limit)')
  
  // Expansion logic tests
  test('calculates shouldShowExpandButton correctly')
  test('truncates content when not expanded')
  test('shows full content when expanded')
  test('toggles expansion state correctly')
  
  // Configuration tests
  test('respects maxLines parameter')
  test('respects estimatedCharsPerLine parameter')
  
  // Edge case tests
  test('handles empty content')
  test('handles null/undefined content')
})
```

### 12. ProviderIcons Component Tests

**File**: `__tests__/components/icons/ProviderIcons.test.tsx`

```typescript
describe('ProviderIcons Components', () => {
  describe('ProviderIcon', () => {
    test('shows correct icon for known providers')
    test('prioritizes providerID over modelID')
    test('falls back to help-circle for unknown providers')
    test('applies custom size correctly')
    test('applies custom styles')
  })
  
  describe('ProviderBadge', () => {
    test('shows icon with provider name')
    test('extracts provider from modelID format')
    test('handles different sizes (sm/md/lg)')
    test('applies correct styling for each size')
    test('falls back gracefully for unknown providers')
    test('capitalizes provider names correctly')
  })
})
```

### 13. ToolIcons Component Tests

**File**: `__tests__/components/icons/ToolIcons.test.tsx`

```typescript
describe('ToolIcons Component', () => {
  // Basic rendering tests
  test('renders icon with correct name and color')
  test('applies custom size correctly')
  test('applies custom styles')
  
  // Background handling tests
  test('shows background when iconInfo has backgroundColor')
  test('hides background when no backgroundColor')
  test('scales background size with icon size')
  
  // Edge case tests
  test('handles missing iconInfo gracefully')
  test('handles invalid icon names')
})
```

## Testing Utilities

### Test Helpers File

**File**: `__tests__/utils/testHelpers.tsx`

```typescript
// Mock providers and contexts
export const MockThemeProvider = ({ children }) => { /* ... */ }
export const MockConnectionProvider = ({ children }) => { /* ... */ }

// Custom render with providers
export const renderWithProviders = (component, options) => { /* ... */ }

// Mock data factories
export const createMockTextPart = (overrides) => { /* ... */ }
export const createMockToolPart = (overrides) => { /* ... */ }
export const createMockReasoningPart = (overrides) => { /* ... */ }

// Mock API responses
export const createMockMessage = (overrides) => { /* ... */ }

// Test utilities
export const waitForAnimation = () => new Promise(resolve => setTimeout(resolve, 100))
```

## Integration Tests

### Message Flow Integration

**File**: `__tests__/integration/MessageFlow.test.tsx`

```typescript
describe('Message Flow Integration', () => {
  test('renders complete user message correctly')
  test('renders complete assistant message with multiple parts')
  test('handles tool execution visualization')
  test('displays reasoning with proper styling')
  test('manages expand/collapse states across parts')
  test('handles error states in message flow')
})
```

## Accessibility Tests

**File**: `__tests__/accessibility/Components.test.tsx`

```typescript
describe('Accessibility Compliance', () => {
  test('all interactive elements have accessibility labels')
  test('screen reader compatibility for all components')
  test('color contrast meets WCAG guidelines')
  test('touch targets meet minimum size requirements')
  test('focus management for expandable content')
  test('semantic markup for screen readers')
})
```

## Performance Tests

**File**: `__tests__/performance/Components.test.tsx`

```typescript
describe('Performance Validation', () => {
  test('large message rendering performance')
  test('syntax highlighting performance with long code')
  test('expand/collapse animation smoothness')
  test('memory usage for component mounting/unmounting')
})
```

## Snapshot Tests

**File**: `__tests__/snapshots/Components.test.tsx`

```typescript
describe('Visual Regression', () => {
  test('ConnectionStatus snapshots for all states')
  test('Message part snapshots in different configurations')
  test('Icon component snapshots with different providers')
  test('Expanded vs collapsed content state snapshots')
  test('Error state snapshots')
})
```

## Implementation Guidelines

### Setup Requirements
- [ ] Configure Jest with React Native Testing Library
- [ ] Set up mock providers for testing
- [ ] Create test data factories
- [ ] Configure snapshot testing

### Best Practices
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Mock external dependencies appropriately
- Test edge cases and error states
- Maintain test data factories for consistency

### Coverage Goals
- Aim for 90%+ code coverage on components
- 100% coverage on critical user paths
- Edge case and error state coverage
- Accessibility compliance validation

## Task Breakdown

### Phase 1 Tasks (Week 1-2)
- [ ] Set up testing infrastructure and utilities
- [ ] Create test data factories and mock providers
- [ ] Write ConnectionStatus component tests (8 test cases)
- [ ] Write MessageContent component tests (11 test cases)
- [ ] Write ExpandButton component tests (9 test cases)
- [ ] Write MessageDecoration component tests (7 test cases)

### Phase 2 Tasks (Week 3-4)
- [ ] Write TextPart component tests (6 test cases)
- [ ] Write ToolPart component tests (11 test cases)
- [ ] Write ReasoningPart component tests (7 test cases)
- [ ] Write PartComponentSelector tests (9 test cases)

### Phase 3 Tasks (Week 5)
- [ ] Write TextContent component tests (12 test cases)
- [ ] Write CodeContent component tests (10 test cases)

### Phase 4 Tasks (Week 6)
- [ ] Write useExpandable hook tests (11 test cases)

### Phase 5 Tasks (Week 7)
- [ ] Write ProviderIcons component tests (11 test cases)
- [ ] Write ToolIcons component tests (6 test cases)

### Phase 6 Tasks (Week 8)
- [ ] Write integration tests (6 test cases)
- [ ] Write accessibility tests (6 test cases)
- [ ] Write performance tests (4 test cases)
- [ ] Write snapshot tests (5 test cases)

### Completion Criteria
- [ ] All component tests pass
- [ ] 90%+ code coverage achieved
- [ ] All accessibility requirements met
- [ ] Performance benchmarks satisfied
- [ ] CI/CD pipeline includes all tests

This comprehensive testing plan ensures robust coverage of all components while following React Native Testing Library best practices and maintaining focus on user-centric testing approaches.