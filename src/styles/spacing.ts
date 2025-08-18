// Spacing system based on 8-point grid
// Matches web implementation spacing values

export const spacing = {
  // Base spacing units
  '0': 0,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '11': 44,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
  '28': 112,
  '32': 128,
  '36': 144,
  '40': 160,
  '44': 176,
  '48': 192,
  '52': 208,
  '56': 224,
  '60': 240,
  '64': 256,
  '72': 288,
  '80': 320,
  '96': 384,
  
  // Semantic spacing names
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Directional spacing helpers
export const padding = {
  xs: { padding: spacing.xs },
  sm: { padding: spacing.sm },
  md: { padding: spacing.md },
  lg: { padding: spacing.lg },
  xl: { padding: spacing.xl },
  xxl: { padding: spacing.xxl },
  
  horizontal: {
    xs: { paddingHorizontal: spacing.xs },
    sm: { paddingHorizontal: spacing.sm },
    md: { paddingHorizontal: spacing.md },
    lg: { paddingHorizontal: spacing.lg },
    xl: { paddingHorizontal: spacing.xl },
    xxl: { paddingHorizontal: spacing.xxl },
  },
  
  vertical: {
    xs: { paddingVertical: spacing.xs },
    sm: { paddingVertical: spacing.sm },
    md: { paddingVertical: spacing.md },
    lg: { paddingVertical: spacing.lg },
    xl: { paddingVertical: spacing.xl },
    xxl: { paddingVertical: spacing.xxl },
  },
};

export const margin = {
  xs: { margin: spacing.xs },
  sm: { margin: spacing.sm },
  md: { margin: spacing.md },
  lg: { margin: spacing.lg },
  xl: { margin: spacing.xl },
  xxl: { margin: spacing.xxl },
  
  horizontal: {
    xs: { marginHorizontal: spacing.xs },
    sm: { marginHorizontal: spacing.sm },
    md: { marginHorizontal: spacing.md },
    lg: { marginHorizontal: spacing.lg },
    xl: { marginHorizontal: spacing.xl },
    xxl: { marginHorizontal: spacing.xxl },
  },
  
  vertical: {
    xs: { marginVertical: spacing.xs },
    sm: { marginVertical: spacing.sm },
    md: { marginVertical: spacing.md },
    lg: { marginVertical: spacing.lg },
    xl: { marginVertical: spacing.xl },
    xxl: { marginVertical: spacing.xxl },
  },
};

export default spacing;