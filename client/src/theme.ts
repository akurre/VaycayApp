import { createTheme } from '@mantine/core';

// Custom color palette for the application
export const appColors = {
  primary: '#800040', // burgundy
  primaryLight: '#', // todo fill in
  primaryDark: '#', // todo fill in
} as const;

export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Arial, sans-serif',
  defaultRadius: 'md',
});
