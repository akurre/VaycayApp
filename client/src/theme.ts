import {
  Button,
  createTheme,
  defaultVariantColorsResolver,
  Divider,
  parseThemeColor,
  Popover,
  Text,
} from '@mantine/core';
import type {
  MantineColorsTuple,
  MantineThemeOverride,
  VariantColorsResolver,
} from '@mantine/core';

// Mantine shade tuples — single source of truth for the palette.
// Each palette has a "brand" anchor shade; other shades are picked relative to it.
// Amber/sand/error anchor at 4 (brand pops); ocean anchors at 6 (brand recedes).
export const AMBER_BRAND_SHADE = 4;
const OCEAN_BRAND_SHADE = 6;
export const SAND_BRAND_SHADE = 4;
export const ERROR_BRAND_SHADE = 4;

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

const tertiarySandShades: MantineColorsTuple = [
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

const successShades: MantineColorsTuple = [
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

const errorShades: MantineColorsTuple = [
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

// Force dark text on filled primary-amber buttons (default would be white).
const variantColorResolver: VariantColorsResolver = (input) => {
  const defaultResolvedColors = defaultVariantColorsResolver(input);
  const parsedColor = parseThemeColor({
    color: input.color || input.theme.primaryColor,
    theme: input.theme,
  });

  if (
    parsedColor.isThemeColor &&
    parsedColor.color === 'primary-amber' &&
    input.variant === 'filled'
  ) {
    return {
      ...defaultResolvedColors,
      color: primaryAmberShades[9],
      hoverColor: primaryAmberShades[9],
    };
  }

  return defaultResolvedColors;
};

// Brand-palette tokens reference the shade tuples above so the tuples remain
// the single source of truth. light/dark mode tokens are designed neutrals
// kept as literals because they don't always map cleanly to a single shade.
export const appColors = {
  // primary · amber sunlight (warmth, the destination)
  primary: primaryAmberShades[AMBER_BRAND_SHADE],
  primaryLight: primaryAmberShades[AMBER_BRAND_SHADE - 1],
  primaryDark: primaryAmberShades[AMBER_BRAND_SHADE + 1],
  primaryHover: '#D9871F', // off-palette: between [4] and [5]

  // secondary · ocean blue (the action, the journey)
  secondary: secondaryOceanShades[OCEAN_BRAND_SHADE],
  secondaryLight: secondaryOceanShades[OCEAN_BRAND_SHADE - 2],
  secondaryDark: secondaryOceanShades[OCEAN_BRAND_SHADE + 1],
  secondaryHover: secondaryOceanShades[OCEAN_BRAND_SHADE - 1],

  // tertiary · warm sand (the room, the canvas)
  tertiary: tertiarySandShades[SAND_BRAND_SHADE],
  tertiaryLight: tertiarySandShades[SAND_BRAND_SHADE - 2],
  tertiaryDark: tertiarySandShades[SAND_BRAND_SHADE + 1],
  tertiaryHover: '#B8A077', // off-palette: between [4] and [5]

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

  success: successShades[5],
  warning: primaryAmberShades[AMBER_BRAND_SHADE], // amber doubles as warning
  error: errorShades[ERROR_BRAND_SHADE],
  info: secondaryOceanShades[OCEAN_BRAND_SHADE - 2],

  // Glassmorphism tokens for the floating top command bar.
  // Pick the active set with `useGlassTokens()` based on color scheme.
  glass: {
    dark: {
      bg: 'rgba(30, 36, 46, 0.25)', // lower alpha so the blurred map shows through
      bgStrong: 'rgba(30, 36, 46, 0.78)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderLight: 'rgba(255, 255, 255, 0.10)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.40)',
      blur: 'blur(14px) saturate(180%)', // saturate boosts blurred-map color richness
      blurStrong: 'blur(20px) saturate(180%)',
      triggerIdleBg: 'rgba(255, 255, 255, 0.08)',
      triggerOpenBg: 'rgba(232, 151, 60, 0.15)',
      triggerOpenBorder: 'rgba(232, 151, 60, 0.30)',
      divider: 'rgba(255, 255, 255, 0.10)',
      inputBg: 'rgba(0, 0, 0, 0.20)',
      text: '#E8DFD0',
    },
    light: {
      bg: 'rgba(252, 246, 230, 0.25)', // lower alpha so the blurred map shows through
      bgStrong: 'rgba(252, 246, 230, 0.80)',
      border: 'rgba(200, 179, 135, 0.50)', // sand @ 50%
      borderLight: 'rgba(200, 179, 135, 0.55)', // sand @ 55%
      shadow: '0 8px 32px rgba(31, 78, 102, 0.14)', // ocean shadow
      blur: 'blur(14px) saturate(180%)',
      blurStrong: 'blur(20px) saturate(180%)',
      triggerIdleBg: 'rgba(200, 179, 135, 0.18)', // warm sand wash
      triggerOpenBg: 'rgba(232, 151, 60, 0.20)',
      triggerOpenBorder: 'rgba(232, 151, 60, 0.40)',
      divider: 'rgba(31, 78, 102, 0.18)', // teal-tinted, visible on cream
      inputBg: 'rgba(31, 78, 102, 0.06)', // teal-tinted input wash
      text: '#1F4E66', // ocean (was warm gray, too low contrast)
    },
  },
} as const;

// Define the theme with proper Mantine color arrays
export const theme: MantineThemeOverride = createTheme({
  // Set primary color to your actual primary color
  primaryColor: 'primary-amber',
  variantColorResolver,

  // Shade 4 (#E8973C) is the canonical brand amber and matches appColors.primary.
  // Both modes resolve to the same shade so brand identity stays consistent.
  primaryShade: { light: 4, dark: 4 },

  // Default radius for components
  defaultRadius: 'md',

  // Font configurations
  fontFamily: '"Inter Variable", Inter, system-ui, sans-serif',
  fontFamilyMonospace:
    '"JetBrains Mono Variable", "JetBrains Mono", Monaco, Courier, monospace',
  headings: { fontFamily: '"Outfit Variable", Outfit, sans-serif' },

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
