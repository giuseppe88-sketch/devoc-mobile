// src/theme.ts
import 'styled-components/native';

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textSecondary: string;
    subtle: string;
    card: string;
    border: string;
    placeholder: string;
    shadow: string;
    star: string;
    error: string;
    success: string;
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

export const colors = {
  light: {
    primary: '#2C3E50', 
    secondary: '#999', 
    accent: '#FF6B6B', 
    background: '#F7F9FC', 
    text: '#2E3A59', 
    textSecondary: '#555', 
    subtle: '#EDF1F7', 
    card: '#FFFFFF', 
    border: '#E0E0E0', 
    placeholder: '#999', 
    shadow: '#000000', 
    star: '#FFD700', 
    error: '#FF6B6B', 
    success: '#00C853', 
  },
  dark: {
    primary: '#2C3E50', 
    secondary: '#6E8EFF', 
    accent: '#FF6B6B', 
    background: '#121212', 
    text: '#E0E0E0', 
    textSecondary: '#AAAAAA', 
    subtle: '#2E3A59', 
    card: '#1E1E1E', 
    border: '#333333', 
    placeholder: '#777777', 
    shadow: '#000000', 
    star: '#FFD700', 
    error: '#FF6B6B', 
    success: '#00C853', 
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
