import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export interface ExpandButtonProps {
  isExpanded: boolean;
  onPress: () => void;
  expandText?: string;
  collapseText?: string;
  style?: object;
  textStyle?: object;
  variant?: 'default' | 'tool' | 'reasoning';
}

export const ExpandButton: React.FC<ExpandButtonProps> = ({
  isExpanded,
  onPress,
  expandText = 'Show more',
  collapseText = 'Show less',
  style,
  textStyle,
  variant = 'default'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'tool':
        return {
          button: styles.toolButton,
          text: styles.toolText,
        };
      case 'reasoning':
        return {
          button: styles.reasoningButton,
          text: styles.reasoningText,
        };
      default:
        return {
          button: styles.defaultButton,
          text: styles.defaultText,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[variantStyles.button, style]}
      activeOpacity={0.7}
    >
      <Text style={[variantStyles.text, textStyle]}>
        {isExpanded ? collapseText : expandText}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  defaultButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  defaultText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '500',
  },
  toolButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  toolText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '500',
  },
  reasoningButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  reasoningText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '500',
  },
});