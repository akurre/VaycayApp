import { useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useMemo } from 'react';
import { appColors } from '@/theme';

// Branded accents come from indexed palette shades (same in both modes);
// surface neutrals come from appColors because they swap by mode, not shade.
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
      backgroundColor: isDark ? appColors.dark.paper : appColors.light.paper,
    };
  }, [colorScheme, theme]);
};
