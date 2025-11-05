import { createTheme } from '@mantine/core';

// custom color palette for the application
export const appColors = {
  // primary colors (amaranth purple - deep burgundy-red)
  primary: '#9F2042',
  primaryLight: '#BB4A52',
  primaryDark: '#7A1933',
  primaryHover: '#B4365A',
  
  // secondary colors (light sea green - teal)
  secondary: '#20A39E',
  secondaryLight: '#3DBDB8',
  secondaryDark: '#187A76',
  secondaryHover: '#2BB5B0',
  
  // tertiary colors (wisteria - soft purple)
  tertiary: '#B49FCC',
  tertiaryLight: '#C9B8DC',
  tertiaryDark: '#9580B3',
  tertiaryHover: '#BFA9D4',
  
  // neutral colors for light mode
  light: {
    background: '#ffffff',
    surface: '#DBF9F4',
    border: '#C5E8E4',
    text: '#2c2c2c',
    textSecondary: '#6b6b6b',
    toggleBackground: '#f0f0f0',
    textShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 4px rgba(255, 255, 255, 0.6)',
  },
  
  // neutral colors for dark mode
  dark: {
    background: '#1a1b1e',
    surface: '#25262b',
    border: '#373a40',
    text: '#DBF9F4',
    textSecondary: '#B49FCC',
    toggleBackground: '#424242',
    textShadow: '0 0 8px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.6)',
  },
  
  // accent colors
  success: '#20A39E',
  warning: '#ffd43b',
  error: '#BB4A52',
  info: '#B49FCC',
} as const;

export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Arial, sans-serif',
  defaultRadius: 'md',
});
