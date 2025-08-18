import { Platform } from 'react-native';

// Typography system based on web implementation
// Adjusted for React Native scaling and platform differences

export const typography = {
  // Font families
  fontFamily: {
    sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  // Font sizes (adjusted for mobile)
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 36,
    '7xl': 40,
    '8xl': 44,
    '9xl': 48,
  },
  
  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

// Semantic typography styles
export const textStyles = {
  // Headings
  heading1: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  
  heading2: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
  
  heading3: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
  },
  
  // Body text
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },
  
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
  },
  
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },
  
  // Captions
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.tight,
  },
  
  // Code
  code: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    fontFamily: typography.fontFamily.mono,
  },
  
  // Links
  link: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline' as const,
  },
};

export default typography;