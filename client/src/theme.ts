import { createTheme } from '@mantine/core';

// custom color palette for the application
export const appColors = {
  // primary colors (burgundy)
  primary: '#800040',
  primaryLight: '#a6004d',
  primaryDark: '#5a002d',
  primaryHover: '#6b0036',
  
  // secondary colors (teal/blue-green)
  secondary: '#008080',
  secondaryLight: '#00a3a3',
  secondaryDark: '#005959',
  secondaryHover: '#006b6b',
  
  // tertiary colors (warm orange)
  tertiary: '#d97706',
  tertiaryLight: '#f59e0b',
  tertiaryDark: '#b45309',
  tertiaryHover: '#c2660a',
  
  // neutral colors for light mode
  light: {
    background: '#ffffff',
    surface: '#f8f9fa',
    border: '#dee2e6',
    text: '#212529',
    textSecondary: '#6c757d',
  },
  
  // neutral colors for dark mode
  dark: {
    background: '#1a1b1e',
    surface: '#25262b',
    border: '#373a40',
    text: '#c1c2c5',
    textSecondary: '#909296',
  },
  
  // accent colors
  success: '#51cf66',
  warning: '#ffd43b',
  error: '#ff6b6b',
  info: '#339af0',
} as const;

export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Arial, sans-serif',
  defaultRadius: 'md',
});
