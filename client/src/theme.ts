import { createTheme } from '@mantine/core';

// Custom color palette for the application
export const appColors = {
  primary: '#800040', // burgundy
  primaryLight: '#', // 
  primaryDark: '#', // 
} as const;

export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Arial, sans-serif',
  defaultRadius: 'md',
});
