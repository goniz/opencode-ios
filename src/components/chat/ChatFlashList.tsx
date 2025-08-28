import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { MessageRow, type MessageWithParts } from './MessageRow';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

interface ChatFlashListProps {
  messages: MessageWithParts[];
  currentSessionId?: string;
  isStreamConnected: boolean;
  isGenerating: boolean;
  onLoadOlder?: () => Promise<void>;
  hasMoreOlder?: boolean;
  isLoadingOlder?: boolean;
}

interface ScrollState {
  atBottom: boolean;
  userScrolledUp: boolean;
  newMessagesSinceScroll: number;
}

// Performance configuration - tuning knobs
const PERFORMANCE_CONFIG = {
  // FlashList configuration
  estimatedItemSize: 96, // Average message height - tune based on your content
  onEndReachedThreshold: 0.2, // How close to end before triggering pagination
  
  // Scroll behavior thresholds
  bottomThreshold: 80, // px tolerance for "at bottom" detection
  scrollEventThrottle: 16, // ms between scroll events (60fps)
  
  // Streaming throttling
  streamingThrottleMs: 40, // Batch streaming updates every 40ms for smooth 60fps
  autoScrollDelay: 50, // Delay before auto-scroll to ensure content is rendered
} as const;

/**
 * High-performance FlashList implementation for chat messages
 * 
 * Features:
 * - Inverted timeline (newest messages at bottom)
 * - Sticky bottom behavior during streaming
 * - Jump to latest button when user scrolls up
 * - Pagination for older messages
 * - Streaming content throttling
 * - Memoized components for optimal performance
 */
export const ChatFlashList: React.FC<ChatFlashListProps> = ({
  messages,
  currentSessionId,
  isStreamConnected,
  isGenerating,
  onLoadOlder,
  hasMoreOlder = false,
  isLoadingOlder = false,
}) => {
  const flashListRef = useRef<FlashList<MessageWithParts>>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    atBottom: true,
    userScrolledUp: false,
    newMessagesSinceScroll: 0,
  });
  
  // Note: Streaming throttling is handled at the connection/context level

  // Reverse messages for inverted display (newest at visual bottom)
  const reversedMessages = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  // Memoized render function
  const renderItem = useCallback(
    ({ item, index }: { item: MessageWithParts; index: number }) => (
      <MessageRow
        message={item}
        index={reversedMessages.length - 1 - index} // Convert back to original index
        currentSessionId={currentSessionId}
        isStreamConnected={isStreamConnected}
        isGenerating={isGenerating}
        totalMessages={messages.length}
      />
    ),
    [reversedMessages.length, currentSessionId, isStreamConnected, isGenerating, messages.length]
  );

  // Key extractor for stable list performance
  const keyExtractor = useCallback((item: MessageWithParts) => item.info.id, []);

  // Handle scroll events to track user position
  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const { contentOffset } = event.nativeEvent;
    
    // For inverted list: bottom is near contentOffset.y ~ 0
    const distanceFromBottom = Math.abs(contentOffset.y);
    const isAtBottom = distanceFromBottom < PERFORMANCE_CONFIG.bottomThreshold;
    const hasScrolledUp = !isAtBottom;

    // Throttled state update to avoid excessive re-renders
    setScrollState(prev => {
      if (prev.atBottom !== isAtBottom || prev.userScrolledUp !== hasScrolledUp) {
        return {
          ...prev,
          atBottom: isAtBottom,
          userScrolledUp: hasScrolledUp,
          newMessagesSinceScroll: hasScrolledUp ? prev.newMessagesSinceScroll : 0,
        };
      }
      return prev;
    });
  }, []);

  // Scroll to latest message
  const scrollToLatest = useCallback(() => {
    flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setScrollState(prev => ({
      ...prev,
      atBottom: true,
      userScrolledUp: false,
      newMessagesSinceScroll: 0,
    }));
  }, []);

  // Auto-scroll behavior during streaming and new messages
  useEffect(() => {
    if (scrollState.atBottom && messages.length > 0) {
      // Only auto-scroll if user is at bottom
      const timer = setTimeout(() => {
        flashListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, PERFORMANCE_CONFIG.autoScrollDelay);

      return () => clearTimeout(timer);
    } else if (scrollState.userScrolledUp) {
      // User scrolled up, increment new messages counter
      setScrollState(prev => ({
        ...prev,
        newMessagesSinceScroll: prev.newMessagesSinceScroll + 1,
      }));
    }
  }, [messages.length, scrollState.atBottom, scrollState.userScrolledUp]);

  // Handle pagination (load older messages)
  const handleEndReached = useCallback(async () => {
    if (!isLoadingOlder && hasMoreOlder && onLoadOlder) {
      // For inverted list, onEndReached triggers when scrolling to older messages
      await onLoadOlder();
    }
  }, [isLoadingOlder, hasMoreOlder, onLoadOlder]);

  // Loading indicator for older messages (appears at top visually)
  const ListFooterComponent = useCallback(() => {
    if (!isLoadingOlder || !hasMoreOlder) return null;
    
    return (
      <View style={styles.olderMessagesLoader}>
        <ActivityIndicator size="small" color={semanticColors.textMuted} />
        <Text style={styles.olderMessagesText}>Loading older messages...</Text>
      </View>
    );
  }, [isLoadingOlder, hasMoreOlder]);

  // Jump to latest button
  const JumpToLatestButton = useCallback(() => {
    if (!scrollState.userScrolledUp || scrollState.newMessagesSinceScroll === 0) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.jumpToLatestButton}
        onPress={scrollToLatest}
        accessibilityLabel={`Jump to latest. ${scrollState.newMessagesSinceScroll} new messages.`}
        accessibilityRole="button"
      >
        <Ionicons name="chevron-down" size={16} color="#ffffff" />
        <Text style={styles.jumpToLatestText}>
          {scrollState.newMessagesSinceScroll} new
        </Text>
      </TouchableOpacity>
    );
  }, [scrollState.userScrolledUp, scrollState.newMessagesSinceScroll, scrollToLatest]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <FlashList
        ref={flashListRef}
        data={reversedMessages}
        inverted
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={PERFORMANCE_CONFIG.estimatedItemSize}
        onEndReachedThreshold={PERFORMANCE_CONFIG.onEndReachedThreshold}
        onEndReached={handleEndReached}
        ListFooterComponent={ListFooterComponent}
        onScroll={handleScroll}
        scrollEventThrottle={PERFORMANCE_CONFIG.scrollEventThrottle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // Performance optimizations
        removeClippedSubviews={true}
        // Prevent nested ScrollView warnings
        nestedScrollEnabled={false}
        getItemType={(item) => {
          // Help FlashList optimize by providing item types
          if (item.info.role === 'user') return 'user';
          if (item.info.role === 'assistant') return 'assistant';
          return 'system';
        }}
      />
      <JumpToLatestButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Ensure FlashList has proper flex layout
    minHeight: 0,
  },

  olderMessagesLoader: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  olderMessagesText: {
    color: semanticColors.textMuted,
    fontSize: 12,
    marginLeft: spacing.xs,
  },
  jumpToLatestButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: semanticColors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  jumpToLatestText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

// Export performance configuration for documentation
export const CHAT_PERFORMANCE_CONFIG = PERFORMANCE_CONFIG;