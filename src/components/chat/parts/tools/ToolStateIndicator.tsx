import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { ToolState } from '../../../../api/types.gen';

interface ToolStateIndicatorProps {
  state: ToolState;
  title?: string;
}

export const ToolStateIndicator: React.FC<ToolStateIndicatorProps> = ({ state, title }) => {
  const spinAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  // Start spinning animation for running state
  useEffect(() => {
    if (state.status === 'running') {
      const spinLoop = Animated.loop(
        Animated.timing(spinAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      spinLoop.start();
      return () => spinLoop.stop();
    }
  }, [state.status, spinAnimation]);

  // Start pulse animation for pending state
  useEffect(() => {
    if (state.status === 'pending') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [state.status, pulseAnimation]);



  const renderStateIndicator = () => {
    switch (state.status) {
      case 'pending':
        return (
          <View style={styles.statusContainer}>
            <Animated.View 
              style={[
                styles.statusBadge,
                styles.pendingBadge,
                {
                  opacity: pulseAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }
              ]}
            >
              <Text style={styles.badgeText}>QUEUED</Text>
            </Animated.View>
          </View>
        );

      case 'running':
        return (
          <View style={styles.statusContainer}>
            <Animated.View 
              style={[
                styles.statusBadge,
                styles.runningBadge,
                {
                  opacity: spinAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.7, 1, 0.7],
                  }),
                }
              ]}
            >
              <Text style={styles.badgeText}>RUNNING</Text>
            </Animated.View>
            {state.title && (
              <Text style={styles.titleText}>
                {state.title}
              </Text>
            )}
            {!state.title && title && (
              <Text style={styles.titleText}>
                {title}
              </Text>
            )}
            {state.time && (
              <Text style={styles.timeText}>
                {formatDuration(Date.now() - state.time.start)}
              </Text>
            )}
          </View>
        );

      case 'completed':
        return (
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, styles.completedBadge]}>
              <Text style={styles.badgeText}>DONE</Text>
            </View>
            {state.title && (
              <Text style={styles.titleText}>
                {state.title}
              </Text>
            )}
            {state.time && (
              <Text style={styles.timeText}>
                {formatDuration(state.time.end - state.time.start)}
              </Text>
            )}
          </View>
        );

      case 'error':
        return (
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, styles.errorBadge]}>
              <Text style={styles.badgeText}>ERROR</Text>
            </View>
            {state.time && (
              <Text style={styles.timeText}>
                {formatDuration(state.time.end - state.time.start)}
              </Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderStateIndicator()}
    </View>
  );
};

// Helper function to format duration in milliseconds to human readable format
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  pendingBadge: {
    backgroundColor: '#1f2937',
    borderColor: '#6b7280',
  },
  runningBadge: {
    backgroundColor: '#1f2937',
    borderColor: '#6b7280',
  },
  completedBadge: {
    backgroundColor: '#1f2937',
    borderColor: '#6b7280',
  },
  errorBadge: {
    backgroundColor: '#1f2937',
    borderColor: '#6b7280',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#d1d5db',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  timeText: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
});