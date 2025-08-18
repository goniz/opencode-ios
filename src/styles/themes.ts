import { colors, semanticColors } from './colors';

// Theme interface
export interface Theme {
  colors: typeof semanticColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    fontSize: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
      '2xl': number;
      '3xl': number;
    };
    lineHeight: {
      tight: number;
      snug: number;
      normal: number;
      relaxed: number;
      loose: number;
    };
    fontWeight: {
      thin: string;
      extralight: string;
      light: string;
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
      extrabold: string;
      black: string;
    };
  };
}

// Dark theme (default)
export const darkTheme: Theme = {
  colors: semanticColors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
    },
    lineHeight: {
      tight: 12,
      snug: 14,
      normal: 20,
      relaxed: 24,
      loose: 32,
    },
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
  },
};

// Light theme
export const lightTheme: Theme = {
  colors: {
    ...semanticColors,
    background: colors.background.light,
    cardBackground: colors.gray[100],
    headerBackground: colors.gray[50],
    textPrimary: colors.gray[900],
    textSecondary: colors.gray[700],
    textMuted: colors.gray[500],
    textLink: colors.primary[600],
    border: colors.gray[200],
    divider: colors.gray[200],
    icon: colors.gray[500],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
    },
    lineHeight: {
      tight: 12,
      snug: 14,
      normal: 20,
      relaxed: 24,
      loose: 32,
    },
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
  },
};

export default darkTheme;