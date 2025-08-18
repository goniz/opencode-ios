import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

export interface MessageTimestampProps {
  timestamp: number; // Unix timestamp in seconds
  style?: object;
  compact?: boolean;
}

export const MessageTimestamp: React.FC<MessageTimestampProps> = ({ 
  timestamp, 
  style,
  compact = false
}) => {
  // Handle both seconds and milliseconds timestamps
  const date = timestamp > 1e10 ? new Date(timestamp) : new Date(timestamp * 1000);
  
  // Format the date to a readable string
  let formattedTime: string;
  
  if (compact) {
    // For compact mode, always show time for recent messages
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      // Less than 24 hours ago - show time
      formattedTime = format(date, 'h:mm a');
    } else if (diffHours < 48) {
      // Yesterday
      formattedTime = 'Yesterday';
    } else {
      // Older - show date
      formattedTime = format(date, 'MMM d');
    }
  } else {
    formattedTime = format(date, 'h:mm a');
  }
  
  return (
    <View style={[compact ? styles.compactContainer : styles.container, style]}>
      <Text style={compact ? styles.compactTimestampText : styles.timestampText}>
        {formattedTime}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
    marginBottom: 2,
    marginRight: 8,
  },
  timestampText: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  compactTimestampText: {
    fontSize: 9,
    color: '#6b7280',
    fontStyle: 'italic',
    opacity: 0.7,
  },
});