import { useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useMemo } from 'react';
import { appColors } from '@/theme';

/**
 * Theme-aware chart colors built on the amber / ocean / sand palette.
 * Returned values automatically swap for light vs dark mode.
 *
 * Source-of-truth split: branded accents pull a specific shade from the
 * Mantine palette arrays (theme.colors[token][n]); mode-specific surface
 * neutrals pull from appColors.{light,dark}, which buckets surfaces by mode
 * rather than by shade index.
 */
export const useChartColors = () => {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  return useMemo(() => {
    const isDark = colorScheme === 'dark';

    return {
      lineColor: theme.colors['primary-amber'][4],
      maxLineColor: theme.colors.error[4],
      minLineColor: isDark
        ? theme.colors['tertiary-sand'][4]
        : theme.colors['tertiary-sand'][6],
      axisColor: isDark
        ? theme.colors['tertiary-sand'][5]
        : theme.colors['tertiary-sand'][6],

      gridColor: isDark ? appColors.dark.border : appColors.light.border,
      textColor: isDark ? appColors.dark.text : appColors.light.text,
      backgroundColor: isDark ? appColors.dark.paper : appColors.light.surface,
    };
  }, [colorScheme, theme]);
};
