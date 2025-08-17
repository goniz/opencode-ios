import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Part } from '../../api/types.gen';
import { getPartIcon, getRoleIcon } from '../../utils/iconMapping';

interface MessageDecorationProps {
  role: string;
  part?: Part;
  isFirstPart: boolean;
  isLastPart: boolean;
}

export function MessageDecoration({ role, part, isFirstPart, isLastPart }: MessageDecorationProps) {
  // Use role icon for first part, part icon for subsequent parts
  const iconInfo = isFirstPart ? getRoleIcon(role) : (part ? getPartIcon(part) : getRoleIcon(role));
  
  return (
    <View style={styles.decorationColumn}>
      <View style={[
        styles.iconContainer,
        iconInfo.backgroundColor && { backgroundColor: iconInfo.backgroundColor }
      ]}>
        <Ionicons 
          name={iconInfo.name as keyof typeof Ionicons.glyphMap} 
          size={16} 
          color={iconInfo.color} 
        />
      </View>
      {!isLastPart && (
        <View style={styles.verticalLine} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  decorationColumn: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  verticalLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#2a2a2a',
    marginTop: 4,
    minHeight: 16,
  },
});