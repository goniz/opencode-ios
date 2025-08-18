import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessagePartProps, MessagePartContainer } from './MessagePart';

export const StepPart: React.FC<MessagePartProps> = ({ part }) => {
  const stepInfo = part.step || part.content || '';
  
  // Extract model information if available
  const isModelTransition = stepInfo.includes('model:') || stepInfo.includes('provider:');
  
  // Parse step information
  const getStepDisplay = () => {
    if (isModelTransition) {
      // Try to extract model name
      const modelMatch = stepInfo.match(/model:\s*([^,\s]+)/);
      const providerMatch = stepInfo.match(/provider:\s*([^,\s]+)/);
      
      if (modelMatch || providerMatch) {
        const model = modelMatch ? modelMatch[1] : '';
        const provider = providerMatch ? providerMatch[1] : '';
        return `Switched to ${model}${provider ? ` (${provider})` : ''}`;
      }
    }
    
    return stepInfo || 'AI model transition';
  };

  const displayText = getStepDisplay();

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        <View style={styles.stepIndicator}>
          <View style={styles.stepDot} />
          <Text style={styles.stepText}>{displayText}</Text>
        </View>
      </View>
    </MessagePartContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  stepText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});