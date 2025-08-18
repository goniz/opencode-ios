import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

export interface MessageTimestampProps {
  timestamp: number; // Unix timestamp in seconds
  style?: object;
}

export const MessageTimestamp: React.FC<MessageTimestampProps> = ({ 
  timestamp, 
  style 
}) => {
  // Convert Unix timestamp (seconds) to milliseconds
  const date = new Date(timestamp * 1000);
  
  // Format the date to a readable string
  const formattedTime = format(date, 'h:mm a');
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.timestampText}>
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
  timestampText: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});