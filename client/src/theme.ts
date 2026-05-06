import { createTheme, Button, Text, Popover, Divider } from '@mantine/core';
import type { MantineColorsTuple, MantineThemeOverride } from '@mantine/core';

// Mantine shade tuples — single source of truth for the palette.
// Index conventions used elsewhere: 4 = brand-light, 6 = brand-deep.
export const primaryAmberShades: MantineColorsTuple = [
  '#FCF6E6',
  '#F8E8C2',
  '#F4D592',
  '#F0BE5F',
  '#E8973C', // 4 — recommended primary shade (light)
  '#C97A24',
  '#9E5C18',
  '#724311',
  '#4D2D0B',
  '#2A1906',
];

export const secondaryOceanShades: MantineColorsTuple = [
  '#EAF2F7',
  '#CADDE8',
  '#9DBED1',
  '#6E9DB6',
  '#487D99',
  '#2E627F',
  '#1F4E66', // 6 — secondary brand
  '#163C50',
  '#0E2B3A',
  '#071821',
];

export const tertiarySandShades: MantineColorsTuple = [
  '#FBF7EF',
  '#F4ECDB',
  '#ECE0C2',
  '#DCCBA5',
  '#C8B387',
  '#A8946B',
  '#857250',
  '#615337',
  '#3F3623',
  '#211C12',
];

export const successShades: MantineColorsTuple = [
  '#F1F5EB',
  '#DDE7CC',
  '#BFD09E',
  '#A0B973',
  '#80A052',
  '#5C8C3F',
  '#476B30',
  '#344F23',
  '#223516',
  '#111B0A',
];

export const errorShades: MantineColorsTuple = [
  '#FBEEE9',
  '#F2D2C5',
  '#E5AC97',
  '#D6856A',
  '#C0533C',
  '#A33E29',
  '#7E2E1E',
  '#5A2014',
  '#3B140C',
  '#1F0905',
];

// custom color palette for the application
export const appColors = {
  // primary · amber sunlight (warmth, the destination)
  primary: '#E8973C',
  primaryLight: '#F0BE5F',
  primaryDark: '#C97A24',
  primaryHover: '#D9871F',

  // secondary · ocean blue (the action, the journey)
  secondary: '#1F4E66',
  secondaryLight: '#487D99',
  secondaryDark: '#163C50',
  secondaryHover: '#2E627F',

  // tertiary · warm sand (the room, the canvas)
  tertiary: '#C8B387',
  tertiaryLight: '#ECE0C2',
  tertiaryDark: '#A8946B',
  tertiaryHover: '#B8A077',

  light: {
    background: '#FBF7EF', // warm cream, not stark white
    surface: '#FCF6E6', // cards / panels
    paper: '#FFFCF5', // elevated cards, slightly above surface
    border: '#EAD6B3',
    text: '#1A1715',
    textSecondary: '#6B5D49', // warm gray, not cool
    toggleBackground: '#ECE0C2',
    textShadow: '0 0 8px rgba(255,247,231,0.85), 0 0 4px rgba(255,247,231,0.6)',
  },

  dark: {
    background: '#14181F', // deep ocean night
    surface: '#1E242E',
    paper: '#252C38', // elevated cards, slightly above surface
    border: '#2C3543',
    text: '#E8DFD0', // warm cream, easy on eyes
    textSecondary: '#9DB3C2', // muted ocean, not purple
    toggleBackground: '#252C38',
    textShadow: '0 0 8px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.6)',
  },

  success: '#5C8C3F', // olive — fits the warm palette
  warning: '#E8973C', // reuse primary amber
  error: '#C0533C', // terracotta, not burgundy
  info: '#487D99', // ocean light
} as const;

// Define the theme with proper Mantine color arrays
export const theme: MantineThemeOverride = createTheme({
  // Set primary color to your actual primary color
  primaryColor: 'primary-amber',

  // Shade 4 (#E8973C) is the canonical brand amber and matches appColors.primary.
  // Both modes resolve to the same shade so brand identity stays consistent.
  primaryShade: { light: 4, dark: 4 },

  // Default radius for components
  defaultRadius: 'md',

  // Font configurations
  fontFamily: 'Verdana, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: { fontFamily: 'Outfit, sans-serif' },

  // Define custom colors as proper Mantine color arrays
  colors: {
    'primary-amber': primaryAmberShades,
    'secondary-ocean': secondaryOceanShades,
    'tertiary-sand': tertiarySandShades,
    success: successShades,
    warning: primaryAmberShades, // amber doubles as warning
    error: errorShades,
    info: secondaryOceanShades, // ocean doubles as info
  },

  // Component-specific styles using the extend pattern
  components: {
    Button: Button.extend({
      defaultProps: {
        color: 'primary-amber',
        variant: 'filled',
      },
      styles: {
      root: {
        '&[data-variant="filled"]': {
          color: '#1A1106', // dark brown text on amber for contrast
        }
      }
    }
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
