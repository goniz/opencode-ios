# FlashList Chat Implementation

This document describes the high-performance chat implementation using @shopify/flash-list v2.

## Overview

The chat UI has been refactored to use FlashList v2 for optimal performance with large message histories and real-time streaming content.

### Key Components

- **ChatFlashList**: Main FlashList implementation with scrolling logic
- **MessageRow**: Memoized message component for optimal performance
- **ConnectionContext**: Handles streaming updates from SSE

## Performance Optimizations

### FlashList Configuration

```typescript
const PERFORMANCE_CONFIG = {
  // Average message height - tune based on your content
  estimatedItemSize: 96,
  
  // How close to end before triggering pagination  
  onEndReachedThreshold: 0.2,
  
  // px tolerance for "at bottom" detection
  bottomThreshold: 80,
  
  // ms between scroll events (60fps)
  scrollEventThrottle: 16,
  
  // Batch streaming updates every 40ms for smooth 60fps
  streamingThrottleMs: 40,
  
  // Delay before auto-scroll to ensure content is rendered
  autoScrollDelay: 50,
};
```

### Tuning Guidelines

#### estimatedItemSize
- Start with 96px for mixed text/code messages
- For text-only chats, try 60-80px
- For code-heavy chats, try 120-150px
- Monitor FlashList warnings and adjust accordingly

#### bottomThreshold
- 80px works well for most devices
- Increase for larger screens (tablets): 120-150px
- Decrease for smaller screens: 60px

#### Streaming Performance
- `streamingThrottleMs: 40` provides smooth 60fps
- Reduce to 16ms for very fast connections
- Increase to 60ms for slower devices

## Features

### Inverted Timeline
- Messages are displayed with newest at the bottom
- Data is reversed at render time for FlashList optimization
- Maintains familiar chat UX

### Sticky Bottom Behavior
- Auto-scrolls only when user is near the latest message
- Stops auto-scrolling when user reads older messages
- Preserves user's reading position during streaming

### Jump to Latest Button
- Appears when user scrolls up from the bottom
- Shows count of new messages since scrolling up
- Tapping returns to latest messages and resumes auto-scroll

### Memoization
- MessageRow components are memoized with custom comparison
- Prevents unnecessary re-renders during streaming
- Optimizes performance for large message lists

### Scroll Position Preservation
- Maintains scroll position during streaming (when not at bottom)
- Preserves position when prepending older messages (pagination)
- No jarring jumps during content updates

## Architecture

### Data Flow

1. **Messages** → ConnectionContext via SSE
2. **ConnectionContext** → State updates
3. **ChatScreen** → Passes messages to ChatFlashList
4. **ChatFlashList** → Reverses data and manages scroll state
5. **MessageRow** → Renders individual messages with memoization

### Scroll State Management

```typescript
interface ScrollState {
  atBottom: boolean;           // User is near the latest message
  userScrolledUp: boolean;     // User manually scrolled up
  newMessagesSinceScroll: number; // Count for jump button
}
```

### Memory Management

- FlashList automatically virtualizes off-screen items
- Memoized components prevent render storms
- Efficient key extraction for stable performance
- removeClippedSubviews enabled for memory optimization

## Future Enhancements

### Pagination Support
Currently prepared for pagination when the API supports it:

```typescript
// In ChatFlashList
onLoadOlder={loadOlderMessages} // Will trigger when scrolling up
hasMoreOlder={hasMoreHistory}   // Show/hide loading indicator
isLoadingOlder={isLoading}      // Loading state
```

The API needs to support cursor-based pagination:
- `?before=messageId` parameter
- `?limit=50` for page size
- Response includes `hasMore` flag

### Advanced Features
- Message search with jump-to-message
- Message reactions and threading
- Image/file attachment previews
- Voice message playback

## Performance Monitoring

### Key Metrics
- **FPS**: Should maintain 60fps during scrolling
- **Memory**: Monitor via React DevTools
- **Render count**: Check MessageRow re-renders
- **Scroll responsiveness**: Time from message to auto-scroll

### Debug Tools
- FlashList provides built-in performance warnings
- Enable React DevTools Profiler for render analysis
- Monitor ConnectionContext message batching

## Troubleshooting

### Common Issues

1. **Choppy scrolling**
   - Increase `estimatedItemSize`
   - Reduce `streamingThrottleMs`
   - Check MessageRow memoization

2. **Auto-scroll not working**
   - Verify `bottomThreshold` setting
   - Check scroll state updates
   - Ensure content size changes are detected

3. **Memory leaks**
   - Verify cleanup in useEffect hooks
   - Check MessageRow comparison function
   - Monitor FlashList item recycling

4. **Message order issues**
   - Verify data reversal logic
   - Check key extraction stability
   - Validate SSE message ordering

### Performance Debugging

```javascript
// Enable FlashList debug mode
<FlashList
  debug={__DEV__}
  // ... other props
/>

// Monitor message updates
useEffect(() => {
  console.log('Messages updated:', messages.length);
}, [messages.length]);
```

## Testing

### Unit Tests
- MessageRow memoization behavior
- Scroll state management
- Auto-scroll triggering conditions

### Integration Tests  
- End-to-end streaming scenarios
- Scroll position preservation
- Jump button functionality

### Performance Tests
- Large message history (5k+ messages)
- Rapid streaming updates
- Memory usage over time