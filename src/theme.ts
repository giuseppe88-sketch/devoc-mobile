// src/theme.ts
import 'styled-components/native';

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    error: string;
    success: string;
    accent: string;
    subtle: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  // Add other theme properties like font sizes, families, border radius etc.
}

// Extend the DefaultTheme interface for type safety with styled-components
declare module 'styled-components/native' {
  export interface DefaultTheme extends Theme {}
}

const colors = {
  light: {
    primary: '#3366FF', // vibrant blue
    secondary: '#6E8EFF', // lighter blue
    accent: '#FF6B6B', // soft coral
    background: '#F7F9FC', // off-white
    text: '#2E3A59', // dark blue-gray
    subtle: '#EDF1F7', // very light gray
    error: '#FF6B6B', // soft coral (used for errors/alerts)
    success: '#00C853', // keeping previous success green
  },
  dark: {
    primary: '#2C3E50', // Updated Blue Charcoal
    secondary: '#6E8EFF', // Example: keeping lighter blue
    accent: '#FF6B6B', // Example: keeping soft coral
    background: '#121212', // Example: dark background
    text: '#E0E0E0', // Example: light text
    subtle: '#2E3A59', // Example: using dark blue-gray for subtle dark elements
    error: '#FF6B6B', // Example: keeping soft coral
    success: '#00C853', // Example: keeping success green
  },
};

export type ColorTheme = typeof colors.light;

export const useColors = (): ColorTheme => {
  // For now, let's force dark theme
  return colors.dark; 
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
