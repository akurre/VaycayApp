import { useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useMemo } from 'react';
import { appColors } from '@/theme';

/**
 * Theme-aware chart colors built on the amber / ocean / sand palette.
 * Returned values automatically swap for light vs dark mode.
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

      gridColor: isDark ? appColors.dark.border : appColors.light.border,
      axisColor: isDark
        ? theme.colors['tertiary-sand'][5]
        : theme.colors['tertiary-sand'][6],

      textColor: isDark ? appColors.dark.text : appColors.light.text,

      backgroundColor: isDark ? appColors.dark.paper : appColors.light.surface,
    };
  }, [colorScheme, theme]);
};
