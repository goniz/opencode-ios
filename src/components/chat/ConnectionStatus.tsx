import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'error' | 'idle';
  message?: string;
  style?: object;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status, 
  message,
  style 
}) => {
  // Get status configuration
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: '#10b981', // green
          text: message || 'Connected',
          dotColor: '#10b981',
        };
      case 'connecting':
        return {
          color: '#f59e0b', // amber
          text: message || 'Connecting...',
          dotColor: '#f59e0b',
        };
      case 'error':
        return {
          color: '#ef4444', // red
          text: message || 'Connection error',
          dotColor: '#ef4444',
        };
      case 'idle':
      default:
        return {
          color: '#6b7280', // gray
          text: message || 'Not connected',
          dotColor: '#6b7280',
        };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusIndicator}>
        <View 
          style={[
            styles.statusDot, 
            { backgroundColor: config.dotColor }
          ]} 
        />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.text}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});