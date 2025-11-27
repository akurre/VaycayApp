import { createTheme, Button, Text, Popover, Divider } from '@mantine/core';
import type { MantineThemeOverride } from '@mantine/core';

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
    paper: '#282E33',
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

// Define the theme with proper Mantine color arrays
export const theme: MantineThemeOverride = createTheme({
  // Set primary color to your actual primary color
  primaryColor: 'primary-red',

  // Configure primary shade for light and dark modes
  primaryShade: { light: 6, dark: 8 },

  // Default radius for components
  defaultRadius: 'md',

  // Font configurations
  fontFamily: 'Verdana, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: { fontFamily: 'Outfit, sans-serif' },

  // Define custom colors as proper Mantine color arrays
  colors: {
    // Primary color (burgundy-red)
    'primary-red': [
      '#FFF0F3', // 0 - lightest
      '#FFD6DE',
      '#FFADB9',
      '#FF8396',
      '#FF5A73',
      '#E63E55',
      '#9F2042', // 6 - our primary color
      '#7A1933', // 7 - our primaryDark
      '#5A0F24',
      '#3B0615', // 9 - darkest
    ],

    // Secondary color (teal)
    'secondary-teal': [
      '#E6FFFD', // 0 - lightest
      '#C5F7F4',
      '#94EBE7',
      '#63DFDA',
      '#3DBDB8', // 4 - our secondaryLight
      '#20A39E', // 5 - our secondary color
      '#187A76', // 6 - our secondaryDark
      '#115C59',
      '#0A3E3C',
      '#05201F', // 9 - darkest
    ],

    // Tertiary color (purple)
    'tertiary-purple': [
      '#F5F0FA', // 0 - lightest
      '#E9E0F5',
      '#D4C4E9',
      '#C9B8DC', // 3 - our tertiaryLight
      '#B49FCC', // 4 - our tertiary color
      '#A38BBD',
      '#9580B3', // 6 - our tertiaryDark
      '#7A6A96',
      '#5F5275',
      '#453B54', // 9 - darkest
    ],

    success: [
      '#E6FFFD', // 0 - lightest
      '#C5F7F4',
      '#94EBE7',
      '#63DFDA',
      '#3DBDB8',
      '#20A39E', // 5 - our success color
      '#187A76',
      '#115C59',
      '#0A3E3C',
      '#05201F', // 9 - darkest
    ],

    warning: [
      '#FFFAEB',
      '#FFF3D0',
      '#FFEDB8',
      '#FFE7A0',
      '#FFE088',
      '#FFDA70',
      '#FFD43B', // 6 - our warning color
      '#E6BC30',
      '#CCA426',
      '#B38C1D', // 9 - darkest
    ],

    error: [
      '#FFF0F3',
      '#FFD6DE',
      '#FFADB9',
      '#FF8396',
      '#FF5A73',
      '#E63E55',
      '#BB4A52', // 6 - our error color
      '#9F3A42',
      '#832A32',
      '#671A22', // 9 - darkest
    ],

    info: [
      '#F5F0FA',
      '#E9E0F5',
      '#D4C4E9',
      '#C9B8DC',
      '#B49FCC', // 4 - our info color
      '#A38BBD',
      '#9580B3',
      '#7A6A96',
      '#5F5275',
      '#453B54', // 9 - darkest
    ],
  },

  // Component-specific styles using the extend pattern
  components: {
    Button: Button.extend({
      defaultProps: {
        color: 'primary-red',
        variant: 'filled',
      },
      // we can add variant-specific styles here if needed
      // For example, to customize the filled variant:
      // styles: {
      //   root: {
      //     '&[data-variant="filled"]': {
      //       // Custom styles for filled variant
      //     }
      //   }
      // }
    }),

    Text: Text.extend({
      defaultProps: {
        // Default props for Text component
      },
      styles: {
        root: {
          // Use CSS variables for text color
          color: 'var(--mantine-color-text)',
        },
      },
    }),

    Popover: Popover.extend({
      styles: {
        dropdown: {
          // Use CSS variables for background and border
          backgroundColor: 'var(--mantine-color-body)',
          border: '1px solid var(--mantine-color-default-border)',
        },
      },
    }),

    Divider: Divider.extend({
      styles: {
        root: {
          // Use CSS variables for border color
          borderTopColor: 'var(--mantine-primary-color-filled)',
        },
      },
    }),
  },

  // Other theme properties
  other: {
    // Custom properties that can be accessed via theme.other
    appColors: appColors,
  },
});
