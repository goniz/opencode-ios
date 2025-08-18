import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconInfo } from '../../utils/iconMapping';
import { getProviderIcon, getModelIcon } from '../../utils/providerMapping';

interface ProviderIconProps {
  providerID?: string;
  modelID?: string;
  size?: number;
  style?: object;
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({ 
  providerID, 
  modelID,
  size = 16, 
  style 
}) => {
  // Get icon info based on provider or model
  let iconInfo: IconInfo | null = null;
  
  if (providerID) {
    iconInfo = getProviderIcon(providerID);
  } else if (modelID) {
    iconInfo = getModelIcon(modelID);
  }
  
  // Fallback if no provider or model info
  if (!iconInfo) {
    iconInfo = {
      name: 'help-circle',
      color: '#64748b',
    };
  }
  
  return (
    <View style={[styles.container, style]}>
<Ionicons 
  name={iconInfo.name as any} /* eslint-disable-line @typescript-eslint/no-explicit-any */
  size={size} 
  color={iconInfo.color} 
/>
    </View>
  );
};

interface ProviderBadgeProps {
  providerID?: string;
  modelID?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: object;
}

export const ProviderBadge: React.FC<ProviderBadgeProps> = ({ 
  providerID, 
  modelID,
  size = 'md',
  style 
}) => {
  // Get icon info based on provider or model
  let iconInfo: IconInfo | null = null;
  let displayName = '';
  
  if (providerID) {
    iconInfo = getProviderIcon(providerID);
    displayName = providerID.charAt(0).toUpperCase() + providerID.slice(1);
  } else if (modelID) {
    iconInfo = getModelIcon(modelID);
    // Extract provider name from model ID if possible
    if (modelID.includes(':')) {
      displayName = modelID.split(':')[0];
      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    } else {
      displayName = modelID;
    }
  }
  
  // Fallback if no provider or model info
  if (!iconInfo) {
    iconInfo = {
      name: 'help-circle',
      color: '#64748b',
    };
    displayName = 'Unknown';
  }
  
  // Size configuration
  const sizeConfig = {
    sm: { icon: 12, text: 10, padding: 4 },
    md: { icon: 14, text: 11, padding: 6 },
    lg: { icon: 16, text: 12, padding: 8 },
  };
  
  const config = sizeConfig[size];
  
  return (
    <View style={[styles.badgeContainer, style]}>
      <View style={[styles.badge, { padding: config.padding }]}>
<Ionicons 
  name={iconInfo.name as any} /* eslint-disable-line @typescript-eslint/no-explicit-any */
  size={config.icon} 
  color={iconInfo.color} 
/>
        <Text style={[styles.badgeText, { fontSize: config.text, color: iconInfo.color }]}>
          {displayName}
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
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  badgeText: {
    marginLeft: 4,
    fontWeight: '500',
  },
});