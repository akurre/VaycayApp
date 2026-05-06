import { useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useMemo } from 'react';
import {
  AMBER_BRAND_SHADE,
  appColors,
  ERROR_BRAND_SHADE,
  SAND_BRAND_SHADE,
} from '@/theme';

// Branded accents come from indexed palette shades (same in both modes);
// surface neutrals come from appColors because they swap by mode, not shade.
export const useChartColors = () => {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  return useMemo(() => {
    const isDark = colorScheme === 'dark';

    return {
      lineColor: theme.colors['primary-amber'][AMBER_BRAND_SHADE],
      maxLineColor: theme.colors.error[ERROR_BRAND_SHADE],
      // Min line is a subtle reference; axis stays the most readable label.
      // Each mode uses two distinct sand shades so they don't visually collide.
      minLineColor: isDark
        ? theme.colors['tertiary-sand'][SAND_BRAND_SHADE]
        : theme.colors['tertiary-sand'][SAND_BRAND_SHADE + 1],
      axisColor: isDark
        ? theme.colors['tertiary-sand'][SAND_BRAND_SHADE + 1]
        : theme.colors['tertiary-sand'][SAND_BRAND_SHADE + 2],

      gridColor: isDark ? appColors.dark.border : appColors.light.border,
      textColor: isDark ? appColors.dark.text : appColors.light.text,
      backgroundColor: isDark ? appColors.dark.paper : appColors.light.paper,
    };
  }, [colorScheme, theme]);
};
