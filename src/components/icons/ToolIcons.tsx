import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconInfo } from '../../utils/iconMapping';

interface ToolIconProps {
  iconInfo: IconInfo;
  size?: number;
  style?: object;
}

export const ToolIcon: React.FC<ToolIconProps> = ({ 
  iconInfo, 
  size = 16, 
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      {iconInfo.backgroundColor ? (
        <View 
          style={[
            styles.background, 
            { 
              backgroundColor: iconInfo.backgroundColor,
              width: size + 8,
              height: size + 8,
              borderRadius: (size + 8) / 2,
            }
          ]}
        >
<Ionicons 
  name={iconInfo.name as any} /* eslint-disable-line @typescript-eslint/no-explicit-any */
  size={size} 
  color={iconInfo.color} 
/>
        </View>
      ) : (
<Ionicons 
  name={iconInfo.name as any} /* eslint-disable-line @typescript-eslint/no-explicit-any */
  size={size} 
  color={iconInfo.color} 
/>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});