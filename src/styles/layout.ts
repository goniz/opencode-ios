import { spacing } from './spacing';

// Layout system for consistent component sizing and positioning

export const layout = {
  // Container widths
  container: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  
  // Breakpoints (approximate for mobile)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Border radius
  borderRadius: {
    none: 0,
    sm: 2,
    DEFAULT: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  },
  
  // Border width
  borderWidth: {
    DEFAULT: 1,
    0: 0,
    2: 2,
    4: 4,
    8: 8,
  },
  
  // Shadow (approximate for mobile)
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    DEFAULT: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 12,
    },
    '2xl': {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
      elevation: 20,
    },
    inner: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 0,
    },
  },
  
  // Opacity
  opacity: {
    0: 0,
    5: 0.05,
    10: 0.1,
    20: 0.2,
    25: 0.25,
    30: 0.3,
    40: 0.4,
    50: 0.5,
    60: 0.6,
    70: 0.7,
    75: 0.75,
    80: 0.8,
    90: 0.9,
    95: 0.95,
    100: 1,
  },
};

// Two-column layout constants (matching web implementation)
export const chatLayout = {
  // Decoration column (left)
  decorationColumn: {
    width: 40, // Icon + vertical bar
  },
  
  // Content column (right)
  contentColumn: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  
  // Vertical spacing between parts
  partSpacing: spacing.sm,
  
  // Message container spacing
  messageSpacing: spacing.lg,
  
  // Icon sizes
  icon: {
    small: 16,
    medium: 20,
    large: 24,
  },
};

export default layout;